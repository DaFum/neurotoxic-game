/**
 * @fileoverview Production-backed Expedition balance simulation runner.
 *
 * Rebuilds balance simulation around production-valid Expedition mechanics (G1-G5).
 * The simulator NEVER duplicates or reimplements gameplay formulas—it imports and calls
 * production reducers, action creators, and domain helpers.
 */

import { gameReducer } from '../src/context/gameReducer.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import { getEffectiveExpeditionRoute } from '../src/domain/expedition/routeOverlay.ts'
import { resolveExpeditionTravelCost } from '../src/domain/expedition/travel.ts'
import {
  getExpeditionTechnicalCondition,
  getExpeditionConditionSummary
} from '../src/domain/expedition/condition.ts'
import {
  resolveExpeditionRepair,
  isExpeditionServiceLocation
} from '../src/domain/expedition/repairs.ts'
import {
  evaluateExpeditionDefectTriggers,
  getVisibleExpeditionDefects
} from '../src/domain/expedition/defects.ts'
import {
  deriveExpeditionPendingFailure,
  EXPEDITION_TOW_COST
} from '../src/domain/expedition/failure.ts'
import {
  canExtractExpedition,
  getExplicitExtractionRareCarrySlots
} from '../src/domain/expedition/extraction.ts'
import { canSpendExpeditionCash } from '../src/domain/expedition/loadout.ts'
import { getExpeditionCargoView } from '../src/domain/expedition/cargo.ts'
import { isExpeditionSafeHarborWindow } from '../src/domain/expedition/legendaries.ts'
import { ALL_VENUES } from '../src/data/venues.ts'
import {
  advanceExpeditionRoute,
  extractExpedition,
  completeExpedition,
  acceptExpeditionFailure,
  resolveExpeditionCrisis,
  executeExpeditionRepair,
  revealExpeditionNodeIntel
} from '../src/context/expeditionActionCreators.ts'
import {
  buildProductionSimulationLoadout,
  toCanonicalRegionId,
  toCanonicalTourTypeId
} from './game-balance-expedition-profiles.mjs'
import { finiteNumberOr } from '../src/utils/finiteNumber.ts'

export const CALIBRATION_COHORT_NAMESPACE =
  '#roguelite-expedition-v1#calibration'
export const HOLDOUT_COHORT_NAMESPACE = '#roguelite-expedition-v1#holdout'
const MAX_ROUTE_STEPS = 30

/**
 * Generates a deterministically disjoint set of unsigned 32-bit seeds for a given namespace.
 *
 * @param {string} namespace
 * @param {number} count
 * @param {number} [offset=0]
 * @returns {number[]}
 */
export const generateCohortSeeds = (namespace, count, offset = 0) => {
  const seeds = new Array(count)
  for (let i = 0; i < count; i++) {
    const str = `${namespace}:${offset + i}`
    // Deterministic 32-bit FNV-1a hash
    let h = 2166136261 >>> 0
    for (let c = 0; c < str.length; c++) {
      h = Math.imul(h ^ str.charCodeAt(c), 16777619) >>> 0
    }
    seeds[i] = h
  }
  return seeds
}

/**
 * Derives a single deterministic seed for a namespace and index.
 *
 * @param {string} namespace
 * @param {number} index
 * @returns {number}
 */
export const deriveCohortSeed = (namespace, index) => {
  return generateCohortSeeds(namespace, 1, index)[0]
}

/**
 * Checks all 14 hard correctness gates defined in G6 Task 5.
 * Throws a detailed error if any invariant is breached.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('../src/types/expedition').ExpeditionMap} map
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {string} stage
 */
export const verifyHardCorrectnessGates = (
  state,
  map,
  profile,
  stage,
  options = {}
) => {
  // Gate 1: invalid loadout accepted
  if (state.expedition.status === 'active' && !state.expedition.loadout) {
    throw new Error(
      `[HardGate1] Active expedition without valid loadout at stage ${stage}`
    )
  }

  // Gate 2: profile hidden fallback/default used (enforced on mature cohorts, bypassed for fresh-career legal approximation)
  if (!options?.isFreshCareer) {
    const canonicalTour = toCanonicalTourTypeId(profile.tourTypeId)
    const canonicalRegion = toCanonicalRegionId(profile.regionId)
    if (
      state.expedition.loadout &&
      (state.expedition.loadout.tourTypeId !== canonicalTour ||
        state.expedition.loadout.regionId !== canonicalRegion)
    ) {
      throw new Error(
        `[HardGate2] Tour or Region does not match canonical profile mapping at stage ${stage}`
      )
    }
  }

  // Gate 3: route disconnected / no Finale reachable
  if (stage === 'init') {
    const reachable = new Set([map.startNodeId])
    const queue = [map.startNodeId]
    while (queue.length > 0) {
      const current = queue.shift()
      for (const edge of map.connections) {
        if (edge.from === current && !reachable.has(edge.to)) {
          reachable.add(edge.to)
          queue.push(edge.to)
        }
      }
    }
    if (!reachable.has(map.finaleNodeId)) {
      throw new Error(
        `[HardGate3] Route disconnected: Finale ${map.finaleNodeId} is unreachable from ${map.startNodeId}`
      )
    }
  }

  // Gate 5: active expense crosses protectedCareerCash
  const protectedCash =
    state.expedition.loadout?.build?.protectedCareerCash ?? 0
  if (finiteNumberOr(state.player.money, 0) < protectedCash) {
    throw new Error(
      `[HardGate5] Player money ${state.player.money} breached protected cash ${protectedCash} at stage ${stage}`
    )
  }

  // Gate 7: cargo consumer accesses omitted manifest
  const cargoView = getExpeditionCargoView(state)
  if (!cargoView || typeof cargoView !== 'object') {
    throw new Error(
      `[HardGate7] Cargo view failed to produce manifest at stage ${stage}`
    )
  }
}

/**
 * Finds or synthesizes a venue object for a gig node.
 *
 * @param {string} nodeId
 * @param {import('../src/types/expedition').ExpeditionMap} map
 * @returns {import('../src/types/map').Venue}
 */
const resolveVenueForNode = (nodeId, map) => {
  const meta = map.meta[nodeId]
  if (meta?.venue) {
    return meta.venue
  }
  const found = ALL_VENUES.find(v => v.id === nodeId || v.name === nodeId)
  if (found) {
    return found
  }
  const isFinale = nodeId === map.finaleNodeId
  return {
    id: nodeId,
    name: isFinale ? 'Grand Finale Arena' : `Venue ${nodeId}`,
    city: 'Tour Hub',
    region: 'home_turf',
    capacity: isFinale ? 2000 : 300,
    cost: 0,
    prestige: isFinale ? 5 : 2,
    genres: ['Electronic', 'Industrial'],
    requiresReputation: 0
  }
}

/**
 * Evaluates a candidate next node according to a profile's decision policy.
 *
 * @param {string} candidateNodeId
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {import('../src/types/expedition').ExpeditionMap} map
 * @param {Record<string, boolean>} revealedNodes
 * @returns {number}
 */
export const evaluateCandidateNode = (
  candidateNodeId,
  state,
  profile,
  map,
  revealedNodes = {}
) => {
  if (candidateNodeId === map.finaleNodeId) {
    return 1000 // Always prioritize the Finale if reached
  }

  const meta = map.meta[candidateNodeId]
  if (!meta) return -1000

  const nodeClass = meta.nodeClass
  const TIER_NUMERIC = { low: 1, medium: 2, high: 3 }
  const dangerTier =
    typeof meta.dangerTier === 'number'
      ? meta.dangerTier
      : (TIER_NUMERIC[meta.dangerTier] ?? 2)
  const rewardTier =
    typeof meta.rewardTier === 'number'
      ? meta.rewardTier
      : (TIER_NUMERIC[meta.rewardTier] ?? 2)
  const isRevealed = Boolean(revealedNodes[candidateNodeId])
  const subtype = meta.specialSubtype

  let score = 50

  switch (profile.decisionPolicy) {
    case 'safe_value':
    case 'clean_sponsor': {
      if (nodeClass === 'REST_STOP') score += 50
      else if (nodeClass === 'SUPPLY_STOP') score += 40
      else if (nodeClass === 'CLUB_GIG') score += 20
      else if (nodeClass === 'FESTIVAL') score += 10
      else if (nodeClass === 'SPECIAL') score -= 10
      score -= dangerTier * 20
      score += rewardTier * 10
      break
    }
    case 'push_heat': {
      if (nodeClass === 'FESTIVAL') score += 60
      else if (nodeClass === 'CLUB_GIG') score += 50
      else if (nodeClass === 'SPECIAL') score += 45
      else if (nodeClass === 'SUPPLY_STOP') score += 10
      else if (nodeClass === 'REST_STOP') score += 5
      score -= dangerTier * 5 // Embraces danger/heat
      score += rewardTier * 25
      break
    }
    case 'repair_first': {
      const tc = getExpeditionConditionSummary(state)
      const needsRepair = tc < 80 || (state.player.van.condition ?? 100) < 80
      if (nodeClass === 'SUPPLY_STOP') score += needsRepair ? 80 : 40
      else if (nodeClass === 'REST_STOP') score += needsRepair ? 70 : 35
      else if (nodeClass === 'CLUB_GIG') score += 20
      else if (nodeClass === 'FESTIVAL') score += 10
      score -= dangerTier * 25
      score += rewardTier * 10
      break
    }
    case 'intel_then_value': {
      if (isRevealed) {
        score += 40
        if (meta.hidden?.rareRewardId) score += 60
        if (meta.hidden?.exactDanger && meta.hidden.exactDanger > 50)
          score -= 25
      }
      if (nodeClass === 'CLUB_GIG') score += 30
      else if (nodeClass === 'FESTIVAL') score += 35
      score += rewardTier * 20
      score -= dangerTier * 15
      break
    }
    case 'performance_push': {
      if (nodeClass === 'FESTIVAL') score += 70
      else if (nodeClass === 'CLUB_GIG') score += 55
      else if (nodeClass === 'SUPPLY_STOP') score += 20
      score += rewardTier * 25
      score -= dangerTier * 10
      break
    }
    case 'rival_pressure': {
      if (nodeClass === 'SPECIAL' && subtype === 'rival') score += 80
      else if (nodeClass === 'SPECIAL') score += 50
      else if (nodeClass === 'FESTIVAL') score += 45
      else if (nodeClass === 'CLUB_GIG') score += 35
      score += rewardTier * 20
      score -= dangerTier * 5
      break
    }
    default: {
      score += rewardTier * 15 - dangerTier * 10
      break
    }
  }

  return score
}

/**
 * Evaluates whether a profile's policy decides to extract at the current extraction window.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @returns {boolean}
 */
const shouldExtractAtWindow = (state, profile) => {
  const vanCond = state.player.van.condition ?? 100
  const vanFuel = state.player.van.fuel ?? 100
  const techCond = getExpeditionConditionSummary(state)
  const spendableCash =
    state.player.money -
    (state.expedition.loadout?.build?.protectedCareerCash ?? 0)

  switch (profile.decisionPolicy) {
    case 'clean_sponsor':
      return (
        vanCond < 40 || techCond < 40 || vanFuel < 25 || spendableCash < 100
      )
    case 'push_heat':
      return vanCond < 15 || techCond < 15 || vanFuel < 15
    case 'repair_first':
      return (
        vanCond < 35 ||
        techCond < 35 ||
        (spendableCash < 50 && (state.expedition.cargo?.spareParts ?? 0) === 0)
      )
    case 'intel_then_value': {
      const rareCount = state.expedition.rewardLedger.filter(
        e => !e.abandoned
      ).length
      return rareCount >= 1 && (vanCond < 45 || techCond < 45)
    }
    case 'performance_push':
      return techCond < 25 || vanCond < 25
    case 'rival_pressure':
      return vanCond < 20 || techCond < 20
    default:
      return vanCond < 30 || techCond < 30
  }
}

/**
 * Runs a single Expedition simulation from production loadout creation to terminal settlement.
 *
 * @param {import('../src/types').GameState} fixtureState
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} seed
 * @param {object} [options={}]
 * @param {'low'|'competent'|'high'} [options.skillLevel='competent']
 * @param {number} [options.overrideGigAccuracy]
 * @param {number} [options.overrideRepairQuality]
 * @param {(nodeId: string, candidates: string[], state: any) => string} [options.routeDecisionSpy]
 * @param {(canExtract: boolean, state: any) => boolean} [options.extractionDecisionSpy]
 * @param {(step: number, state: any) => void} [options.onRouteStep]
 * @returns {{
 *   outcome: 'extracted' | 'completed' | 'failed',
 *   terminalSource: string,
 *   telemetry: Record<string, any>,
 *   finalState: import('../src/types').GameState,
 *   routeVisited: string[]
 * }}
 */
export const runExpeditionSimulation = (
  fixtureState,
  profile,
  seed,
  options = {}
) => {
  const skillLevel = options.skillLevel ?? 'competent'
  const gigAccuracy =
    options.overrideGigAccuracy ??
    (skillLevel === 'low' ? 45 : skillLevel === 'high' ? 90 : 72)
  const repairQuality =
    options.overrideRepairQuality ??
    (skillLevel === 'low' ? 0.35 : skillLevel === 'high' ? 0.95 : 0.7)

  // Step 1: Build valid starting loadout through production owners
  let state =
    fixtureState?.expedition?.status === 'active'
      ? fixtureState
      : buildProductionSimulationLoadout(fixtureState, profile, seed)
  const map = buildExpeditionMap(
    state.runSeed,
    state.expedition.loadout.tourTypeId,
    state.expedition.loadout.regionId
  )

  // Verify initial correctness gates
  verifyHardCorrectnessGates(state, map, profile, 'init', options)

  // Telemetry state tracking
  const telemetry = {
    profileId: profile.id,
    seed,
    tourTypeId: profile.tourTypeId,
    regionId: profile.regionId,
    startMoney: state.player.money,
    startFame: state.player.fame,
    minFuel: state.player.van.fuel ?? 100,
    minVanCondition: state.player.van.condition ?? 100,
    minTechnicalCondition: getExpeditionConditionSummary(state),
    repairsCount: 0,
    repairSpend: 0,
    defectsRevealed: 0,
    defectsTriggered: 0,
    insuranceOffered: Boolean(profile.insurancePolicyId),
    insuranceBought: Boolean(profile.insurancePolicyId),
    insuranceClaimed: false,
    authoritySafeExitsOffered: 0,
    authoritySafeExitsUsed: 0,
    crewStressMax: 0,
    crowdHypeMax: state.expedition.pressure?.crowdHype ?? 0,
    realizedHypeComboBonusTotal: 0,
    sponsorAccepted: Boolean(profile.sponsorPolicy !== 'none'),
    rivalId: state.rivalBand?.id ?? null,
    meaningfulNodesVisited: 0,
    routeDepth: 0,
    terminalKind: /** @type {'extracted'|'completed'|'failed'|null} */ (null),
    terminalSource: /** @type {string|null} */ (null),
    retainedMoney: 0,
    retainedFame: 0,
    securedRares: 0,
    explicitlyExtractedRares: 0,
    abandonedRares: 0,
    revealedIntelNodes: [],
    inspectedFieldsCount: 0,
    routeChoicesInfluencedByIntel: 0
  }

  const revealedNodes = {}
  let loopCount = 0

  // Step 2: Route Traversal Loop
  while (state.expedition.status === 'active' && loopCount < MAX_ROUTE_STEPS) {
    loopCount++
    const currentNodeId = state.player.currentNodeId
    telemetry.routeDepth = state.expedition.routeStep
    telemetry.meaningfulNodesVisited = state.expedition.visitedNodeIds.length

    // Update resource minima
    telemetry.minFuel = Math.min(
      telemetry.minFuel,
      state.player.van.fuel ?? 100
    )
    telemetry.minVanCondition = Math.min(
      telemetry.minVanCondition,
      state.player.van.condition ?? 100
    )
    telemetry.minTechnicalCondition = Math.min(
      telemetry.minTechnicalCondition,
      getExpeditionConditionSummary(state)
    )
    telemetry.crowdHypeMax = Math.max(
      telemetry.crowdHypeMax,
      state.expedition.pressure?.crowdHype ?? 0
    )

    if (options.onRouteStep) {
      options.onRouteStep(state.expedition.routeStep, state)
    }

    // A: Check for Pending Failure
    const pendingFailure = deriveExpeditionPendingFailure(state)
    if (pendingFailure) {
      let resolved = false
      if (
        pendingFailure.choices.includes('refuel') &&
        canSpendExpeditionCash(state, 50)
      ) {
        const refuelAction = resolveExpeditionCrisis(state, 'refuel')
        if (refuelAction) {
          state = gameReducer(state, refuelAction)
          resolved = true
        }
      } else if (
        pendingFailure.choices.includes('tow') &&
        canSpendExpeditionCash(state, EXPEDITION_TOW_COST)
      ) {
        const towAction = resolveExpeditionCrisis(state, 'tow')
        if (towAction) {
          state = gameReducer(state, towAction)
          resolved = true
        }
      } else if (pendingFailure.choices.includes('insurance_claim')) {
        const claimAction = resolveExpeditionCrisis(state, 'insurance_claim')
        if (claimAction) {
          state = gameReducer(state, claimAction)
          telemetry.insuranceClaimed = true
          resolved = true
        }
      }

      if (!resolved) {
        const failAction = acceptExpeditionFailure(state)
        if (failAction) {
          state = gameReducer(state, failAction)
          telemetry.terminalKind = 'failed'
          telemetry.terminalSource = pendingFailure.reason
          break
        }
      }
    }

    // B: Evaluate Equipment Repairs if Needed
    const techCondition = getExpeditionConditionSummary(state)
    if (techCondition < 70 || profile.decisionPolicy === 'repair_first') {
      const tc = getExpeditionTechnicalCondition(state)
      const worstGroup =
        tc.pa <= tc.instruments && tc.pa <= tc.stageGear
          ? 'pa'
          : tc.instruments <= tc.stageGear
            ? 'instruments'
            : 'stageGear'

      const isService = isExpeditionServiceLocation(state)
      const spareParts = state.expedition.cargo?.spareParts ?? 0

      /** @type {import('../src/types/expedition').ExpeditionRepairIntent|null} */
      let intent = null
      if (spareParts > 0) {
        intent = {
          mode: 'field',
          targetGroup: worstGroup,
          quality: repairQuality,
          expectedRouteStep: state.expedition.routeStep
        }
      } else if (isService && canSpendExpeditionCash(state, 80)) {
        intent = {
          mode: 'professional',
          targetGroup: worstGroup,
          expectedRouteStep: state.expedition.routeStep
        }
      } else if (techCondition < 40) {
        intent = {
          mode: 'improvise',
          targetGroup: worstGroup,
          quality: repairQuality,
          expectedRouteStep: state.expedition.routeStep
        }
      }

      if (intent) {
        const resolution = resolveExpeditionRepair(state, intent)
        if (resolution.ok) {
          const action = executeExpeditionRepair(state, intent)
          if (action) {
            state = gameReducer(state, action)
            telemetry.repairsCount++
            telemetry.repairSpend += resolution.result.cashCost
          }
        }
      }
    }

    // C: Handle Node Encounters / Gigs
    const currentMeta = map.meta[currentNodeId]
    const nodeClass = currentMeta?.nodeClass
    if (
      nodeClass === 'START' ||
      nodeClass === 'CLUB_GIG' ||
      nodeClass === 'FESTIVAL' ||
      nodeClass === 'FINALE'
    ) {
      const venue = resolveVenueForNode(currentNodeId, map)
      // 1. START_GIG
      state = gameReducer(state, {
        type: ActionTypes.START_GIG,
        payload: venue
      })

      // 2. SET_LAST_GIG_STATS
      const failedGig = gigAccuracy < 30
      const score = Math.round(gigAccuracy * 80 + 2000)
      state = gameReducer(state, {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: {
          score,
          accuracy: gigAccuracy,
          failed: failedGig,
          cashEarned: failedGig ? 50 : 250,
          fansEarned: failedGig ? 0 : 50
        }
      })

      // 3. Obligations signal
      state = gameReducer(state, {
        type: ActionTypes.RECORD_EXPEDITION_OBLIGATION_SIGNAL,
        payload: {
          signalType: 'gig',
          sourceId: venue.id,
          expectedRouteStep: state.expedition.routeStep
        }
      })
    }

    // D: Check Finale Completion
    if (currentNodeId === map.finaleNodeId) {
      const completeAction = completeExpedition(state, `finale_res_${seed}`)
      state = gameReducer(state, completeAction)
      telemetry.terminalKind = 'completed'
      telemetry.terminalSource = 'finale'
      break
    }

    // E: Check Voluntary Extraction
    const isWindow =
      Boolean(currentMeta?.isExtractionWindow) ||
      isExpeditionSafeHarborWindow(state, map)
    const extractionAllowed = canExtractExpedition(state, isWindow)
    let shouldExtract = false
    if (options.extractionDecisionSpy) {
      shouldExtract = options.extractionDecisionSpy(extractionAllowed, state)
    } else if (extractionAllowed) {
      shouldExtract = shouldExtractAtWindow(state, profile)
    }

    if (shouldExtract && extractionAllowed) {
      const carrySlots = getExplicitExtractionRareCarrySlots(state)
      const unmaterializedRares = state.expedition.rewardLedger
        .filter(entry => !entry.secured && !entry.abandoned)
        .slice(0, carrySlots)
        .map(entry => entry.id)

      const extractAction = extractExpedition(state, unmaterializedRares)
      state = gameReducer(state, extractAction)
      telemetry.terminalKind = 'extracted'
      telemetry.terminalSource = 'voluntary_extraction'
      telemetry.explicitlyExtractedRares = unmaterializedRares.length
      break
    }

    // F: Determine Next Route Advance
    const effectiveRoute = getEffectiveExpeditionRoute(state, map)
    const outgoingEdges = effectiveRoute.connections.filter(
      edge => edge.from === currentNodeId
    )

    if (outgoingEdges.length === 0) {
      // Dead end fallback (should not occur on a valid DAG)
      const failAction = acceptExpeditionFailure(state)
      if (failAction) {
        state = gameReducer(state, failAction)
        telemetry.terminalKind = 'failed'
        telemetry.terminalSource = 'dead_end'
      }
      break
    }

    const candidateNodeIds = outgoingEdges.map(edge => edge.to)

    // Intel revelation hook (Scout or recon)
    if (
      profile.decisionPolicy === 'intel_then_value' ||
      profile.crewRoleOrder.includes('scout')
    ) {
      for (const targetId of candidateNodeIds) {
        if (!revealedNodes[targetId]) {
          const intelAction = revealExpeditionNodeIntel(state, {
            nodeId: targetId,
            source: 'scout_recon'
          })
          if (intelAction) {
            state = gameReducer(state, intelAction)
            revealedNodes[targetId] = true
            telemetry.revealedIntelNodes.push(targetId)
            telemetry.inspectedFieldsCount += 3
          }
        }
      }
    }

    let chosenNextId = candidateNodeIds[0]
    if (options.routeDecisionSpy) {
      chosenNextId = options.routeDecisionSpy(
        currentNodeId,
        candidateNodeIds,
        state
      )
    } else {
      let bestScore = -Infinity
      for (const candidateId of candidateNodeIds) {
        const score = evaluateCandidateNode(
          candidateId,
          state,
          profile,
          map,
          revealedNodes
        )
        if (score > bestScore) {
          bestScore = score
          chosenNextId = candidateId
        }
      }
    }

    // G: Travel Leg Settlement
    const travelCost = resolveExpeditionTravelCost(state, {
      targetNodeId: chosenNextId,
      distance: 100,
      baseFuelLiters: 15,
      minigameFuelBonus: 0,
      minigameConditionLoss:
        skillLevel === 'high' ? 1 : skillLevel === 'low' ? 5 : 3
    })

    // Advance route in reducer
    const advanceAction = advanceExpeditionRoute(state, chosenNextId)
    const nextArrivedState = gameReducer(state, advanceAction)
    if (nextArrivedState === state) {
      // Advance was refused!
      throw new Error(
        `Route advance to ${chosenNextId} was refused at step ${state.expedition.routeStep}`
      )
    }
    state = nextArrivedState

    // Apply settled travel costs directly to van
    state = {
      ...state,
      player: {
        ...state.player,
        van: {
          ...state.player.van,
          fuel: Math.max(
            0,
            finiteNumberOr(state.player.van.fuel, 100) - travelCost.fuelConsumed
          ),
          condition: Math.max(
            0,
            finiteNumberOr(state.player.van.condition, 100) -
              travelCost.vehicleWear
          )
        }
      }
    }

    // Trigger post-travel defect check
    state = evaluateExpeditionDefectTriggers(state, 'post_travel')
    const visibleDefects = getVisibleExpeditionDefects(state)
    telemetry.defectsRevealed = visibleDefects.filter(
      d => d.status === 'revealed'
    ).length
    telemetry.defectsTriggered = visibleDefects.filter(
      d => d.status === 'triggered'
    ).length
  }

  // Safety: if loop exceeded max steps without terminal transition
  if (state.expedition.status === 'active') {
    const failAction = acceptExpeditionFailure(state)
    if (failAction) {
      state = gameReducer(state, failAction)
      telemetry.terminalKind = 'failed'
      telemetry.terminalSource = 'max_steps_exceeded'
    }
  }

  // Step 3: Terminal Settlement
  const runId = state.expedition.outcome?.runId
  if (runId) {
    state = gameReducer(state, {
      type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
      payload: { runId }
    })
    state = gameReducer(state, {
      type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
      payload: { runId }
    })
  }

  telemetry.retainedMoney = state.player.money
  telemetry.retainedFame = state.player.fame
  telemetry.securedRares = state.expedition.rewardLedger.filter(
    e => e.secured
  ).length
  telemetry.abandonedRares = state.expedition.rewardLedger.filter(
    e => e.abandoned
  ).length

  // Verify terminal hard gates
  verifyHardCorrectnessGates(state, map, profile, 'terminal', options)

  return {
    outcome:
      state.expedition.outcome?.kind ?? telemetry.terminalKind ?? 'failed',
    terminalSource:
      state.expedition.outcome?.reason ?? telemetry.terminalSource ?? 'unknown',
    telemetry,
    finalState: state,
    routeVisited: [...state.expedition.visitedNodeIds]
  }
}

/**
 * Runs a batch cohort for multiple profiles and seeds, aggregating statistics.
 *
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile[]} profiles
 * @param {number[]} seeds
 * @param {object} [options={}]
 * @returns {{
 *   totalRuns: number,
 *   profileSummaries: Record<string, {
 *     completedRate: number,
 *     extractedRate: number,
 *     failedRate: number,
 *     meanDepth: number,
 *     meanNodes: number,
 *     meanMoney: number,
 *     meanFame: number,
 *     minFuelMedian: number,
 *     minConditionMedian: number
 *   }>,
 *   runs: Array<{ profileId: string, seed: number, outcome: string, telemetry: any }>
 * }}
 */
export const runExpeditionCohort = (profiles, seeds, options = {}) => {
  const runs = []
  const summaries = {}

  for (const profile of profiles) {
    let completedCount = 0
    let extractedCount = 0
    let failedCount = 0
    let depthSum = 0
    let nodeSum = 0
    let moneySum = 0
    let fameSum = 0

    for (const seed of seeds) {
      const result = runExpeditionSimulation(undefined, profile, seed, options)
      runs.push({
        profileId: profile.id,
        seed,
        outcome: result.outcome,
        telemetry: result.telemetry
      })

      if (result.outcome === 'completed') completedCount++
      else if (result.outcome === 'extracted') extractedCount++
      else failedCount++

      depthSum += result.telemetry.routeDepth
      nodeSum += result.telemetry.meaningfulNodesVisited
      moneySum += result.telemetry.retainedMoney
      fameSum += result.telemetry.retainedFame
    }

    const n = seeds.length || 1
    summaries[profile.id] = {
      completedRate: completedCount / n,
      extractedRate: extractedCount / n,
      failedRate: failedCount / n,
      meanDepth: depthSum / n,
      meanNodes: nodeSum / n,
      meanMoney: moneySum / n,
      meanFame: fameSum / n
    }
  }

  return {
    totalRuns: runs.length,
    profileSummaries: summaries,
    runs
  }
}

/**
 * Validates soft balance corridors and strategy dominance across calibration and holdout cohorts.
 *
 * @param {ReturnType<typeof runExpeditionCohort>} calibrationResults
 * @param {ReturnType<typeof runExpeditionCohort>} holdoutResults
 * @returns {{ ok: boolean, violations: string[] }}
 */
export const checkStrategyDominance = (calibrationResults, holdoutResults) => {
  const violations = []

  // Corridor 1: Meaningful node count approximately 7..9 on standard route
  for (const [id, summary] of Object.entries(
    calibrationResults.profileSummaries
  )) {
    if (summary.meanNodes < 4 || summary.meanNodes > 15) {
      violations.push(
        `Profile ${id} mean nodes ${summary.meanNodes.toFixed(1)} outside expected corridor`
      )
    }
    // Corridor 2: Avoid near-certain single outcome (no 100% or 0% across board)
    if (
      summary.completedRate === 1 &&
      summary.extractedRate === 0 &&
      summary.failedRate === 0
    ) {
      violations.push(
        `Profile ${id} has trivial 100% completion in calibration`
      )
    }
  }

  // Dominance check: if one profile has strictly higher completion, money, fame AND lower failure
  // in BOTH calibration and holdout against all other profiles
  const profileIds = Object.keys(calibrationResults.profileSummaries)
  for (const candId of profileIds) {
    const cCal = calibrationResults.profileSummaries[candId]
    const cHol = holdoutResults.profileSummaries[candId]

    let strictlyDominatesAll = true
    for (const otherId of profileIds) {
      if (otherId === candId) continue
      const oCal = calibrationResults.profileSummaries[otherId]
      const oHol = holdoutResults.profileSummaries[otherId]

      const beatsCal =
        cCal.completedRate > oCal.completedRate &&
        cCal.meanMoney > oCal.meanMoney &&
        cCal.failedRate < oCal.failedRate
      const beatsHol =
        cHol.completedRate > oHol.completedRate &&
        cHol.meanMoney > oHol.meanMoney &&
        cHol.failedRate < oHol.failedRate

      if (!beatsCal || !beatsHol) {
        strictlyDominatesAll = false
        break
      }
    }

    if (strictlyDominatesAll && profileIds.length > 2) {
      violations.push(
        `Profile ${candId} strictly dominates all other strategies across calibration and holdout`
      )
    }
  }

  return {
    ok: violations.length === 0,
    violations
  }
}
