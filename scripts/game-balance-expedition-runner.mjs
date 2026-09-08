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
import { getVisibleExpeditionDefects } from '../src/domain/expedition/defects.ts'
import { derivePressureDirectorContext } from '../src/domain/expedition/pressure.ts'
import { EXPEDITION_PRESSURE_EVENTS_DB } from '../src/data/events/expeditionPressure.ts'
import { resolveEvent } from '../src/domain/eventResolver.ts'
import { POST_OPTIONS } from '../src/data/postOptions.ts'
import {
  EXPEDITION_SOCIAL_RESULTS,
  deriveExpeditionSocialResultId
} from '../src/domain/expedition/social.ts'
import { calculatePostGigStateUpdates } from '../src/utils/postGig/socialResolution.ts'
import {
  deriveExpeditionPendingFailure,
  EXPEDITION_TOW_COST
} from '../src/domain/expedition/failure.ts'
import {
  canExtractExpedition,
  getExplicitExtractionRareCarrySlots,
  settleExpedition
} from '../src/domain/expedition/extraction.ts'
import { canSpendExpeditionCash } from '../src/domain/expedition/loadout.ts'
import { getExpeditionCargoView } from '../src/domain/expedition/cargo.ts'
import { getExpeditionNodeFogByNodeId } from '../src/domain/expedition/nodeFog.ts'
import { isExpeditionSafeHarborWindow } from '../src/domain/expedition/legendaries.ts'
import { ALL_VENUES } from '../src/data/venues.ts'
import { SONGS_BY_ID } from '../src/data/songs.ts'
import {
  buildGigStatsSnapshot,
  calculateAccuracy
} from '../src/utils/gigStats.ts'
import {
  LANE_INDICES,
  calculateDynamicHitWindow,
  calculatePoints,
  calculateFinalScore,
  calculateMissImpact,
  calculateHitCorruption,
  calculateHitOverload,
  checkIsGameOver,
  isPerfectHit
} from '../src/utils/rhythmGameScoringUtils.ts'
import {
  extractExpedition,
  completeExpedition,
  acceptExpeditionFailure,
  prepareNextExpedition,
  resolveExpeditionCrisis,
  executeExpeditionRepair,
  revealExpeditionNodeIntel
} from '../src/context/expeditionActionCreators.ts'
import {
  createStartTravelMinigameAction,
  createCompleteTravelMinigameAction,
  createSetActiveEventAction
} from '../src/context/actionCreators.ts'
import { areBetweenTourDecisionsResolved } from '../src/domain/expedition/betweenTour.ts'
import { getActiveAssetModifiers } from '../src/utils/assetSelectors.ts'
import { deriveFinancials } from '../src/utils/postGig/derivations.ts'
import { calculateContinueStats } from '../src/utils/postGig/performanceLogic.ts'
import {
  BALANCE_CONSTANTS,
  calculateFameGain,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney
} from '../src/utils/gameState/index.ts'
import {
  calculateTravelExpenses,
  calculateTravelMinigameResult
} from '../src/utils/economy/index.ts'
import {
  buildProductionSimulationLoadout,
  toCanonicalRegionId,
  toCanonicalTourTypeId
} from './game-balance-expedition-profiles.mjs'
import {
  finiteNumberOr,
  isFiniteNumber
} from '../src/utils/finiteNumber.ts'
import { clampVanCondition } from '../src/utils/gameState/index.ts'

export const CALIBRATION_COHORT_NAMESPACE =
  '#roguelite-expedition-v1#calibration'
export const HOLDOUT_COHORT_NAMESPACE = '#roguelite-expedition-v1#holdout'
const MAX_ROUTE_STEPS = 30
/** Namespace for the per-leg deterministic RNG handed to the travel minigame. */
const TRAVEL_RNG_NAMESPACE = '#roguelite-expedition-v1#travel'
const SOCIAL_RNG_NAMESPACE = '#roguelite-expedition-v1#social'
/** Namespace for the per-note timing jitter of a simulated Gig. */
const SKILL_TIMING_NAMESPACE = '#roguelite-expedition-v1#skill-timing'

/**
 * Deterministic value in [0, 1) derived from a string key.
 *
 * @param {string} key
 * @returns {number}
 */
const deriveUnitInterval = key => deriveCohortSeed(key, 0) / 4294967296
/** Van condition is stored fractionally; wear comparisons tolerate float noise. */
const TRAVEL_WEAR_EPSILON = 1e-6

/**
 * The 0-100 bound every Condition group is stored under, mirroring the
 * production `clampCondition` used by `getExpeditionConditionSummary`.
 *
 * @param {number} value
 * @returns {number}
 */
const clampConditionValue = value => Math.max(0, Math.min(100, value))

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
 * Gates are stage-scoped: the cheap invariants run on every call, while the
 * ones that dispatch probe actions or walk the route graph run once at `init`
 * or `terminal` so a cohort of hundreds of runs stays affordable.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('../src/types/expedition').ExpeditionMap} map
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {string} stage
 * @param {{ isFreshCareer?: boolean, previousState?: import('../src/types').GameState }} [options={}]
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

  // Gate 4: preview map differs from active map.
  //
  // The route the Prep screen previews and the route START installs come from
  // the same pure builder keyed on (runSeed, tourTypeId, regionId). A build
  // that committed one loadout while the run walked a different graph would
  // make every previewed decision a lie, so the installed `gameMap` is
  // compared node-for-node against a freshly previewed rebuild.
  if (stage === 'init' && state.expedition.loadout) {
    const preview = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )
    const activeNodeIds = Object.keys(state.gameMap?.nodes ?? {}).sort()
    const previewNodeIds = Object.keys(preview.nodes).sort()
    if (
      preview.startNodeId !== map.startNodeId ||
      preview.finaleNodeId !== map.finaleNodeId ||
      previewNodeIds.length !== activeNodeIds.length ||
      previewNodeIds.some((id, index) => id !== activeNodeIds[index])
    ) {
      throw new Error(
        `[HardGate4] Preview map differs from the active map installed at START`
      )
    }
  }

  // Gate 5 used to assert `money >= protectedCareerCash` at every stage. It
  // now lives in `verifyProtectedCashNotSpent`, called after each guarded
  // spend, because the blanket form asserted something production does not
  // guarantee: `canSpendExpeditionCash` gates *discretionary spends* -
  // repairs, services, Authority exits, crisis recovery - and nothing gates a
  // Gig whose `deriveFinancials` net is negative, or a travel settlement. G2's
  // own exit criterion is narrower too: it names `ADVANCE_DAY`, not every
  // stage. The stage-wide check only ever passed because the mature fixture
  // carried 500,000 Cash and no run could spend far enough to reach its own
  // floor - so the gate was never exercised, and the first three attempts to
  // give a build a meaningful protected slice were all stopped by it rather
  // than by a defect.

  // Gate 6 is a per-leg invariant and lives in
  // `verifyTravelWearSingleSettlement`, called by the traversal loop where the
  // before/after pair for one travel settlement is in scope.

  // Gate 7: cargo consumer accesses omitted manifest
  const cargoView = getExpeditionCargoView(state)
  if (!cargoView || typeof cargoView !== 'object') {
    throw new Error(
      `[HardGate7] Cargo view failed to produce manifest at stage ${stage}`
    )
  }

  // Gate 8: terminal settlement / reward materializes twice.
  //
  // Both settlements are replayed against the settled state. They are keyed by
  // runId, so a second dispatch must be refused by reference - anything else
  // means a Tour could be cashed out twice by a repeated dispatch.
  if (stage === 'terminal') {
    const runId = state.expedition.outcome?.runId
    if (typeof runId === 'string') {
      const replayedCrew = gameReducer(state, {
        type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
        payload: { runId }
      })
      if (replayedCrew !== state) {
        throw new Error(
          `[HardGate8] Replayed SETTLE_EXPEDITION_CREW_CAREER mutated state for run ${runId}`
        )
      }
      const replayedCareer = gameReducer(state, {
        type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
        payload: { runId }
      })
      if (replayedCareer !== state) {
        throw new Error(
          `[HardGate8] Replayed SETTLE_EXPEDITION_CAREER_RESULT mutated state for run ${runId}`
        )
      }
    }
    const doubleMaterialized = state.expedition.rewardLedger.filter(
      entry => entry.materialized === true && entry.abandoned === true
    )
    if (doubleMaterialized.length > 0) {
      throw new Error(
        `[HardGate8] ${doubleMaterialized.length} reward entries are both materialized and abandoned`
      )
    }
  }

  // Gate 9: unknown / forged Contract, Intel, Rival or Crew source changes
  // state. Each probe is a raw action shaped like the real one but carrying a
  // source the run has no evidence for; the reducer must reject every one by
  // reference.
  if (stage === 'init') {
    const forgedProbes = [
      {
        label: 'Intel',
        action: {
          type: ActionTypes.REVEAL_EXPEDITION_NODE_INTEL,
          payload: {
            nodeId: '__forged_node__',
            source: 'scout',
            expectedLevel: 0,
            expectedRouteStep: state.expedition.routeStep
          }
        }
      },
      {
        label: 'Contract',
        action: {
          type: ActionTypes.RECORD_EXPEDITION_OBLIGATION_SIGNAL,
          payload: {
            signalType: '__forged_signal__',
            sourceId: '__forged_contract__',
            expectedRouteStep: state.expedition.routeStep
          }
        }
      },
      {
        label: 'Reward',
        action: {
          type: ActionTypes.ADD_EXPEDITION_REWARD,
          payload: {
            expectedRewardId: '__forged_reward__',
            sourceType: '__forged_source__',
            sourceId: '__forged_source_id__',
            expectedRouteStep: state.expedition.routeStep
          }
        }
      },
      {
        label: 'Crew',
        action: {
          type: ActionTypes.RECORD_EXPEDITION_CREW_STRESS_SOURCE,
          payload: {
            crewId: '__forged_crew__',
            sourceId: '__forged_crew_source__',
            expectedRouteStep: state.expedition.routeStep
          }
        }
      },
      {
        label: 'Rival relationship',
        action: {
          type: ActionTypes.RECORD_EXPEDITION_RELATIONSHIP_OUTCOME,
          payload: {
            sourceId: '__forged_event__:__forged_option__',
            sourceType: 'crew_event',
            first: { kind: 'crew', id: '__forged_crew__' },
            second: { kind: 'band', id: '__forged_member__' },
            expectedRouteStep: state.expedition.routeStep
          }
        }
      },
      {
        label: 'Rival relationship (malformed)',
        action: {
          type: ActionTypes.RECORD_EXPEDITION_RELATIONSHIP_OUTCOME,
          payload: {
            targetType: 'rival',
            targetId: '__forged_rival__',
            expectedRouteStep: state.expedition.routeStep
          }
        }
      }
    ]
    for (const probe of forgedProbes) {
      if (gameReducer(state, probe.action) !== state) {
        throw new Error(
          `[HardGate9] Forged ${probe.label} source mutated state at stage ${stage}`
        )
      }
    }
  }

  // Gate 10: PreGig zero-Condition / critical-incapacity softlock.
  //
  // A wiped technical Condition or a live crisis must always leave the run a
  // way out: either the crisis offers a recovery, or accepting failure is
  // available. A state with neither is a run the player cannot leave.
  if (state.expedition.status === 'active') {
    const conditionSummary = getExpeditionConditionSummary(state)
    const pending = deriveExpeditionPendingFailure(state)
    if (conditionSummary <= 0 || pending !== null) {
      const hasRecovery = (pending?.choices?.length ?? 0) > 0
      const canAcceptFailure = acceptExpeditionFailure(state) !== null
      if (!hasRecovery && !canAcceptFailure) {
        throw new Error(
          `[HardGate10] Softlock at stage ${stage}: condition ${conditionSummary} with no recovery and no acceptable failure`
        )
      }
    }
  }

  // Gate 11: the same eligible Rival replaced by a fresh id.
  //
  // A Rival that is still eligible must persist by identity across the leg.
  // Re-rolling one mid-run would silently reset every relationship the player
  // built with it.
  const previous = options.previousState
  if (previous) {
    const previousRivalId = previous.rivalBand?.id ?? null
    const currentRivalId = state.rivalBand?.id ?? null
    if (
      previousRivalId !== null &&
      currentRivalId !== null &&
      previousRivalId !== currentRivalId
    ) {
      throw new Error(
        `[HardGate11] Rival ${previousRivalId} was replaced by fresh id ${currentRivalId} at stage ${stage}`
      )
    }
  }

  // Gate 12: Between-Tour unresolved but Next Tour enabled.
  if (stage === 'terminal') {
    const runId = state.expedition.runId
    if (
      typeof runId === 'string' &&
      !areBetweenTourDecisionsResolved(state, runId)
    ) {
      const nextAction = prepareNextExpedition(state)
      if (nextAction && gameReducer(state, nextAction) !== state) {
        throw new Error(
          `[HardGate12] PREPARE_NEXT_EXPEDITION was accepted for run ${runId} with unresolved Between-Tour decisions`
        )
      }
    }
  }

  // Gate 13: a simulator formula diverges from the production helper.
  //
  // The simulator must never carry its own copy of a gameplay number. The
  // Condition summary it reads is recomposed here from the production group
  // helper using the documented mean-of-four rule; a production change that
  // moves the formula fails this gate rather than quietly re-scoring every
  // cohort against a stale simulator assumption.
  const summary = getExpeditionConditionSummary(state)
  const vehicleCondition = clampConditionValue(
    finiteNumberOr(state.player.van?.condition, 100)
  )
  const recomposed =
    state.expedition.status === 'active' && state.expedition.technicalCondition
      ? Math.round(
          (vehicleCondition +
            clampConditionValue(
              finiteNumberOr(state.expedition.technicalCondition.pa, 0)
            ) +
            clampConditionValue(
              finiteNumberOr(state.expedition.technicalCondition.instruments, 0)
            ) +
            clampConditionValue(
              finiteNumberOr(state.expedition.technicalCondition.stageGear, 0)
            )) /
            4
        )
      : vehicleCondition
  if (recomposed !== summary) {
    throw new Error(
      `[HardGate13] Condition summary ${summary} diverges from the production group composition (${recomposed}) at stage ${stage}`
    )
  }

  // Gate 14: a Sponsor payout occurs before START.
  //
  // The staging snapshot is the only surface a Sponsor deal can be accepted
  // from, and START consumes it. A run already underway while offers (or their
  // provenance) are still staged could pay one out mid-route, outside the
  // single START transaction that G4 makes authoritative.
  if (state.expedition.status !== 'idle') {
    if ((state.expedition.preparedSponsorOffers ?? []).length > 0) {
      throw new Error(
        `[HardGate14] Sponsor offers still staged on a ${state.expedition.status} run at stage ${stage}`
      )
    }
    if (state.expedition.preparedSponsorProvenance !== undefined) {
      throw new Error(
        `[HardGate14] Sponsor staging provenance survived START at stage ${stage}`
      )
    }
    const sponsorObligations = (
      state.expedition.activeObligations ?? []
    ).filter(obligation => obligation.sourceType === 'brandDeal')
    if (sponsorObligations.length > 1) {
      throw new Error(
        `[HardGate14] ${sponsorObligations.length} Sponsor obligations materialized for one run at stage ${stage}`
      )
    }
  }
}

/**
 * Gate 6: legacy daily wear double-applies Expedition travel wear.
 *
 * `handleCompleteTravelMinigame` is the single owner of a leg's fuel and
 * vehicle wear. This re-derives the leg's declared cost from the same
 * production helper the reducer used and asserts the observed van deltas match
 * it, so a second legacy deduction landing on the same leg is caught.
 *
 * @param {import('../src/types').GameState} before - State entering the leg.
 * @param {import('../src/types').GameState} after - State after the canonical travel pass.
 * @param {string} targetNodeId - The node the leg travelled to.
 * @param {number} minigameDamage - The damage the leg's completion dispatched.
 */
export const verifyTravelWearSingleSettlement = (
  before,
  after,
  targetNodeId,
  minigameDamage
) => {
  const beforeCondition = finiteNumberOr(before.player.van.condition, 0)
  const afterCondition = finiteNumberOr(after.player.van.condition, 0)
  const observedWear = beforeCondition - afterCondition
  if (observedWear < 0) return

  const targetNode = before.gameMap?.nodes?.[targetNodeId]
  const currentNode = before.gameMap?.nodes?.[before.player.currentNodeId]
  if (!targetNode || !currentNode) return

  const assetModifiers = getActiveAssetModifiers(before.assets ?? [])
  const { dist, fuelLiters } = calculateTravelExpenses(
    targetNode,
    currentNode,
    before.player,
    before.band,
    assetModifiers
  )
  const { conditionLoss, fuelBonus } = calculateTravelMinigameResult(
    minigameDamage,
    []
  )
  const declared = resolveExpeditionTravelCost(before, {
    targetNodeId,
    distance: dist,
    baseFuelLiters: fuelLiters,
    minigameFuelBonus: fuelBonus,
    minigameConditionLoss: conditionLoss
  })

  // Settled through the reducer's own clamp rather than the raw declared
  // figure: `clampVanCondition` is what rounds and floors the stored value, so
  // comparing against the unclamped number would report the clamp itself as a
  // double deduction.
  const expectedWear =
    beforeCondition - clampVanCondition(beforeCondition - declared.vehicleWear)
  if (Math.abs(observedWear - expectedWear) > TRAVEL_WEAR_EPSILON) {
    throw new Error(
      `[HardGate6] Travel wear to ${targetNodeId} settled ${observedWear} against a declared ${expectedWear} - a second deduction double-applied the leg`
    )
  }
}

/**
 * Raises node intel through the canonical reducer for every candidate it can.
 *
 * A Scout reads the route passively up to level 1, and a deliberate recon
 * raises one node per route step to level 2. Both go through
 * `REVEAL_EXPEDITION_NODE_INTEL`, so a request the run is not entitled to is
 * refused by the reducer rather than filtered here - callers learn exactly
 * what the run could legally reveal, and no more.
 *
 * @param {import('../src/types').GameState} state
 * @param {string[]} candidateNodeIds
 * @returns {{ state: import('../src/types').GameState, revealedNodeIds: string[] }}
 */
export const revealCandidateIntel = (state, candidateNodeIds) => {
  let next = state
  for (const nodeId of candidateNodeIds) {
    const passive = gameReducer(
      next,
      revealExpeditionNodeIntel(next, { nodeId, source: 'scout_passive' })
    )
    if (passive !== next) next = passive
  }
  // One recon charge per route step, so at most one candidate reaches level 2.
  for (const nodeId of candidateNodeIds) {
    const recon = gameReducer(
      next,
      revealExpeditionNodeIntel(next, { nodeId, source: 'scout_recon' })
    )
    if (recon !== next) {
      next = recon
      break
    }
  }
  return {
    state: next,
    revealedNodeIds: candidateNodeIds.filter(
      nodeId => (next.expedition.intelByNodeId[nodeId] ?? 0) > 0
    )
  }
}

/**
 * Fallback note count when a Gig has no resolvable setlist song.
 *
 * @remarks
 * The real count comes from the committed song's own chart. A fixed number
 * here would decide the miss total, and `MISS_TOLERANCE` is 8 against charts of
 * 180-375 notes, so the note count drives the production performance penalty
 * more than anything else the tier does.
 */
const FALLBACK_GIG_NOTE_COUNT = 200

/** Spacing between simulated notes, in ms. Only relative timing matters here. */
const SIMULATED_NOTE_SPACING_MS = 250

/** The three lanes the production scorer recognises, cycled deterministically. */
const SIMULATED_LANES = [
  LANE_INDICES.GUITAR,
  LANE_INDICES.DRUMS,
  LANE_INDICES.BASS
]

/**
 * Plays a Gig note-by-note through the production rhythm scorers.
 *
 * @param {number} gigAccuracy - Target hit accuracy, 0-100, standing in for the
 * player's timing skill.
 * @param {number} routeStep - Route step, mixed into the deterministic timing
 * jitter so two Gigs on one run are not identical.
 * @param {{ baseHitWindow?: number, guitarDifficulty?: number, crowdDecay?: number }} [rules={}]
 * @returns {{
 *   stats: import('../src/utils/gigStats.ts').GigStatsSnapshot,
 *   realizedHypeComboBonus: number,
 *   toxicModeTriggers: number,
 *   endHealth: number
 * }}
 *
 * @remarks
 * The harness owns one thing only: whether a given note is struck accurately,
 * which is what "player skill" means here. Everything downstream - the hit
 * window, whether the strike lands, whether it is perfect, the points, the
 * combo bonus, Overload/Hype gain and Toxic Mode, corruption, crowd-energy
 * decay and the fail condition - is computed by the production owners in
 * `rhythmGameScoringUtils`. Synthesising those counters locally meant a change
 * to combo, stamina or Hype behaviour could leave this probe's numbers
 * untouched while the report still claimed Task 10 evidence.
 *
 * `realizedHypeComboBonus` is measured rather than assumed: it is the score the
 * combo term actually contributed, taken as the difference between the
 * production score for the live combo and the same call at combo zero.
 */
export const resolveSimulatedGigPerformance = (
  gigAccuracy,
  routeStep,
  rules = {}
) => {
  const baseHitWindow = rules.baseHitWindow ?? 120
  const guitarDifficulty = rules.guitarDifficulty ?? 1
  const crowdDecay = rules.crowdDecay ?? 1
  // The chart the Gig actually plays decides the miss total, and the miss total
  // dominates the production performance penalty.
  const noteCount = Math.max(
    1,
    Math.round(finiteNumberOr(rules.noteCount, FALLBACK_GIG_NOTE_COUNT))
  )

  const clampedAccuracy = Math.max(0, Math.min(100, gigAccuracy))

  let score = 0
  let combo = 0
  let maxCombo = 0
  let perfectHits = 0
  let hits = 0
  let misses = 0
  let overload = 0
  let peakHype = 0
  let corruptionLevel = 0
  let isCorruptionBurstActive = false
  let toxicModeActive = false
  let toxicModeTriggers = 0
  let health = 100
  let failed = false
  let realizedHypeComboBonus = 0

  for (let index = 0; index < noteCount; index++) {
    const laneIndex = SIMULATED_LANES[index % SIMULATED_LANES.length]
    const noteTime = index * SIMULATED_NOTE_SPACING_MS
    const hitWindow = calculateDynamicHitWindow(
      baseHitWindow,
      0,
      laneIndex,
      guitarDifficulty
    )

    // Deterministic timing error, tightening as skill rises. A tier that hits
    // 90% accuracy strikes within the window on ~90% of notes, and its errors
    // cluster nearer the centre, which is what earns perfect hits.
    const jitter = deriveUnitInterval(
      `${SKILL_TIMING_NAMESPACE}:${clampedAccuracy}:${routeStep}:${index}`
    )
    const skillFactor = Math.max(0.01, clampedAccuracy / 100)
    // Errors are spread uniformly over +/-spread, so the share landing inside
    // the window is `hitWindow / spread`. Setting spread to `hitWindow /
    // skillFactor` makes that share the tier's accuracy: the harness decides
    // only how precisely the player strikes, and production decides what a
    // strike of that precision is worth.
    const spreadMs = hitWindow / skillFactor
    const timingErrorMs = (jitter * 2 - 1) * spreadMs
    const elapsed = noteTime + timingErrorMs

    const landed = Math.abs(elapsed - noteTime) < hitWindow
    if (!landed) {
      misses++
      combo = 0
      const impact = calculateMissImpact(1, false, overload, health, crowdDecay)
      overload = impact.nextOverload
      health = impact.nextHealth
      if (checkIsGameOver(health, failed)) failed = true
      continue
    }

    if (isPerfectHit(elapsed, noteTime, hitWindow)) perfectHits++
    else hits++

    const basePoints = calculatePoints(laneIndex)
    const currentAccuracy = calculateAccuracy(perfectHits + hits, misses)
    const withCombo = calculateFinalScore(
      basePoints,
      combo,
      toxicModeActive,
      false,
      currentAccuracy,
      isCorruptionBurstActive
    )
    const withoutCombo = calculateFinalScore(
      basePoints,
      0,
      toxicModeActive,
      false,
      currentAccuracy,
      isCorruptionBurstActive
    )
    realizedHypeComboBonus += withCombo - withoutCombo
    score += withCombo

    combo++
    maxCombo = Math.max(maxCombo, combo)

    // Crowd energy recovers on a clean hit. This is the one step of the hit
    // path that lives inline in `useHandleHit` rather than in a pure scorer,
    // so it is mirrored here rather than imported; without it the lower tiers
    // bled to zero and every low-skill Gig read as a failure.
    health = Math.max(0, Math.min(100, health + (toxicModeActive ? 1 : 2)))

    const corruption = calculateHitCorruption(
      corruptionLevel,
      isCorruptionBurstActive
    )
    corruptionLevel = corruption.nextCorruption
    if (corruption.didBurstTrigger) isCorruptionBurstActive = true

    const nextOverload = calculateHitOverload(overload, toxicModeActive)
    overload = nextOverload.nextOverload
    if (nextOverload.didToxicModeTrigger) {
      toxicModeActive = true
      toxicModeTriggers++
    }
    peakHype = Math.max(peakHype, overload)
  }

  const stats = buildGigStatsSnapshot(
    score,
    {
      perfectHits,
      hits,
      misses,
      maxCombo,
      peakHype,
      corruptionLevel
    },
    0,
    [],
    failed
  )

  return { stats, realizedHypeComboBonus, toxicModeTriggers, endHealth: health }
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
 * @param {Record<string, import('../src/types/expedition').ExpeditionNodeFog>} fogByNodeId
 * @returns {number}
 */
export const evaluateCandidateNode = (
  candidateNodeId,
  state,
  profile,
  map,
  fogByNodeId = {}
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
  // Read through the production Fog projection, never off `map.meta.hidden`.
  // The policy may only consume what the run's intel level actually entitles
  // it to; scoring against raw hidden map data made the informed branch a
  // foregone conclusion and measured nothing about the reveal system.
  const fog = Object.hasOwn(fogByNodeId, candidateNodeId)
    ? fogByNodeId[candidateNodeId]
    : null
  const intelLevel = fog?.intelLevel ?? 0
  const isRevealed = intelLevel >= 1
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
      // Level 1 exposes payout, wear and the rare; level 2 adds identity.
      // Those are the fields this policy is allowed to price.
      if (isRevealed) {
        score += 40
        if (fog?.rareRewardId) score += 60
        if (isFiniteNumber(fog?.exactPayout)) {
          score += Math.min(40, fog.exactPayout / 25)
        }
        if (isFiniteNumber(fog?.exactWearCost)) {
          score -= Math.min(30, fog.exactWearCost)
        }
      }
      if (intelLevel >= 2 && fog?.revealedIdentity) score += 15
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
 * The Expedition Social result each policy reaches for after a clean Gig.
 *
 * @remarks
 * The four results are genuinely different bets - `push` buys Exposure with
 * Heat, `monetize` buys cash with a little Exposure, `suppress` spends a post
 * to cool both and buy level-2 Intel, `weaponize` escalates a Rival - so the
 * pick is a persona decision. Falls back down the list when an option is not
 * legal right now (no Rival on state, an option whose own condition fails).
 */
export const SOCIAL_RESULT_PREFERENCE = {
  safe_value: ['monetize', 'suppress'],
  push_heat: ['push', 'weaponize'],
  repair_first: ['monetize', 'suppress'],
  intel_then_value: ['suppress', 'monetize'],
  performance_push: ['push', 'monetize'],
  rival_pressure: ['weaponize', 'push']
}

/**
 * Posts about the Gig that just resolved, if the run is standing on a
 * settlement window.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} seed
 * @param {Record<string, any>} telemetry
 * @returns {import('../src/types').GameState}
 *
 * @remarks
 * Exposure has exactly one writer on an active run, and it is this settlement.
 * A harness that never posted therefore measured `pressure.exposure` at zero
 * for every profile at every window - including `high_exposure_performance`,
 * a persona built entirely around the number. The post's own math comes from
 * `calculatePostGigStateUpdates`, and both writes go through their reducers,
 * so the harness chooses an option and nothing more.
 */
const playPendingSocialPost = (state, profile, seed, telemetry) => {
  const settlement = state.expedition?.pendingSocialSettlement
  if (!settlement || settlement.routeStep !== state.expedition.routeStep) {
    return state
  }
  if (!state.lastGigStats || state.lastGigStats.failed === true) return state

  const preferences = SOCIAL_RESULT_PREFERENCE[profile.decisionPolicy] ?? [
    'push'
  ]
  const legalOptions = POST_OPTIONS.filter(option => {
    if (typeof option.condition === 'function' && !option.condition(state)) {
      return false
    }
    const result = EXPEDITION_SOCIAL_RESULTS[deriveExpeditionSocialResultId(option)]
    return Boolean(result) && (!result.requiresRival || Boolean(state.rivalBand))
  })
  const option =
    preferences
      .map(resultId =>
        legalOptions.find(
          candidate => deriveExpeditionSocialResultId(candidate) === resultId
        )
      )
      .find(Boolean) ?? legalOptions[0]
  if (!option) return state

  // Three independent draws in the production signature, kept seed-derived so
  // the post is as replayable as the rest of the run.
  const draw = salt =>
    deriveCohortSeed(
      `${SOCIAL_RNG_NAMESPACE}:${seed}:${state.expedition.routeStep}:${salt}`,
      0
    ) / 4294967296

  const updates = calculatePostGigStateUpdates({
    option,
    player: state.player,
    band: state.band,
    social: state.social,
    lastGigStats: state.lastGigStats,
    currentGig: state.currentGig,
    perfScore: state.lastGigStats.accuracy ?? 0,
    secureRandomValue: draw('secure'),
    selectionRandomValue: draw('selection'),
    viralRandomValue: draw('viral')
  })

  let next = gameReducer(state, {
    type: ActionTypes.UPDATE_SOCIAL,
    payload: updates.updatedSocial
  })
  // The reducer proves the option against `social.pendingSocialOptionId`, which
  // the update above stamps. If that did not land, the settlement would be
  // refused anyway - bail rather than dispatch a doomed action.
  if (next.social.pendingSocialOptionId !== option.id) return state

  const resultId = deriveExpeditionSocialResultId(option)
  const exposureBefore = finiteNumberOr(next.expedition.pressure.exposure, 0)
  const heatBefore = finiteNumberOr(next.expedition.pressure.heat, 0)
  next = gameReducer(next, {
    type: ActionTypes.RESOLVE_EXPEDITION_SOCIAL_RESULT,
    payload: {
      resultId,
      postOptionId: option.id,
      expectedRouteStep: next.expedition.routeStep
    }
  })
  if (next.expedition.lastSocialResult?.resolvedAtRouteStep === undefined) {
    return next
  }

  telemetry.socialPosts.push({
    routeStep: state.expedition.routeStep,
    optionId: option.id,
    resultId,
    exposureDelta:
      finiteNumberOr(next.expedition.pressure.exposure, 0) - exposureBefore,
    heatDelta: finiteNumberOr(next.expedition.pressure.heat, 0) - heatBefore
  })
  return next
}

/**
 * Options a policy prefers when a Pressure Director event surfaces.
 *
 * @remarks
 * Ordered by preference; the first option the event actually offers wins. The
 * Director's events trade Heat against Condition, cargo and route access, so
 * the choice is a real persona decision rather than a coin flip: a Heat-averse
 * Sponsor tour takes the long way, an Underground run takes the address.
 */
export const PRESSURE_EVENT_OPTION_PREFERENCE = {
  safe_value: ['take_the_long_way', 'stay_clean'],
  push_heat: ['wave_through', 'take_the_address'],
  repair_first: ['take_the_address', 'take_the_long_way', 'stay_clean'],
  intel_then_value: ['take_the_address', 'take_the_long_way'],
  performance_push: ['wave_through', 'take_the_address'],
  rival_pressure: ['wave_through', 'take_the_address']
}

/**
 * Plays the Pressure Director event the route advance selected, if any.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {Record<string, any>} telemetry
 * @returns {import('../src/types').GameState}
 *
 * @remarks
 * The Director *selects* an event on arrival and stores its id; the Heat,
 * Exposure, Condition and cargo consequences only land when the player
 * resolves it. A harness that never resolved one left
 * `state.expedition.pressure.heat` and `.exposure` at zero for the whole run,
 * so every Heat- and Exposure-driven balance number measured a system the
 * simulation had staged and never played — the same parity gap the missing
 * `deriveFinancials` call was. Resolution goes through `resolveEvent`, the
 * production owner, so the harness picks an option and nothing else.
 */
const playPendingPressureEvent = (state, profile, telemetry) => {
  const pendingId = state.expedition?.pressure?.pendingDirectorEventId
  if (typeof pendingId !== 'string') return state

  const definition = EXPEDITION_PRESSURE_EVENTS_DB.find(
    event => event.id === pendingId
  )
  if (!definition) return state

  // The reducer proves the source against `state.activeEvent.id`, so the event
  // has to actually be on state before it can be resolved — exactly the guard
  // that stops a direct dispatch from minting Heat for an unseen encounter.
  let next = gameReducer(state, createSetActiveEventAction(definition))
  if (next.activeEvent?.id !== pendingId) return state

  const preferences =
    PRESSURE_EVENT_OPTION_PREFERENCE[profile.decisionPolicy] ?? []
  const option =
    definition.options.find(candidate =>
      preferences.includes(candidate.id)
    ) ?? definition.options[0]
  if (!option) return state

  const heatBefore = finiteNumberOr(next.expedition.pressure.heat, 0)
  const exposureBefore = finiteNumberOr(next.expedition.pressure.exposure, 0)

  for (const action of resolveEvent(option, next).actions) {
    next = gameReducer(next, action)
  }
  next = gameReducer(next, createSetActiveEventAction(null))

  telemetry.pressureEvents.push({
    routeStep: state.expedition.routeStep,
    eventId: pendingId,
    optionId: option.id,
    heatDelta:
      finiteNumberOr(next.expedition.pressure.heat, 0) - heatBefore,
    exposureDelta:
      finiteNumberOr(next.expedition.pressure.exposure, 0) - exposureBefore
  })
  return next
}

/**
 * Per-policy weights over the pressure dimensions, plus the tolerance the
 * weighted score has to clear before the policy bails out.
 *
 * @remarks
 * This table replaces a single-variable cascade. The previous policy compared
 * van condition against one per-persona constant and nothing else, so the
 * measured completion rate was `P(van condition stays above that constant)` and
 * Heat, Exposure, obligations and value-at-risk could not move it however far
 * the game's own numbers swung. The dimensions below come from
 * `derivePressureDirectorContext`, the production owner the pressure Director
 * itself weighs its event pool with, so the policy and the game read the run
 * through the same lens.
 */
export const EXTRACTION_POLICY_WEIGHTS = {
  safe_value: {
    survival: 1,
    vanWear: 0.7,
    heat: 1,
    exposure: 0.5,
    crewStress: 0.6,
    obligation: 1,
    rival: 0.3,
    depth: 0.4,
    value: 0.9,
    cash: 0.8,
    tolerance: 25.5
  },
  push_heat: {
    survival: 0.8,
    vanWear: 0.35,
    heat: 0.25,
    exposure: 0.4,
    crewStress: 0.3,
    obligation: 0.2,
    rival: 0.3,
    depth: 0.2,
    value: 0.4,
    cash: 0.5,
    tolerance: 35
  },
  repair_first: {
    survival: 1,
    vanWear: 0.8,
    heat: 0.4,
    exposure: 0.2,
    crewStress: 0.5,
    obligation: 0.3,
    rival: 0.2,
    depth: 0.4,
    value: 0.6,
    cash: 0.9,
    tolerance: 30
  },
  intel_then_value: {
    survival: 0.7,
    vanWear: 0.5,
    heat: 0.5,
    exposure: 0.4,
    crewStress: 0.4,
    obligation: 0.5,
    rival: 0.3,
    depth: 0.3,
    value: 1,
    cash: 0.6,
    tolerance: 16.5
  },
  performance_push: {
    survival: 0.8,
    vanWear: 0.4,
    heat: 0.6,
    exposure: 1,
    crewStress: 0.7,
    obligation: 0.5,
    rival: 0.3,
    depth: 0.3,
    value: 0.5,
    cash: 0.6,
    tolerance: 37
  },
  rival_pressure: {
    survival: 0.9,
    vanWear: 0.5,
    heat: 0.5,
    exposure: 0.3,
    crewStress: 0.4,
    obligation: 0.3,
    rival: 1,
    depth: 0.3,
    value: 0.5,
    cash: 0.6,
    tolerance: 33
  }
}

/**
 * The weights used when a profile names a policy the table does not cover.
 */
const DEFAULT_EXTRACTION_POLICY_WEIGHTS = {
  survival: 1,
  vanWear: 0.6,
  heat: 0.5,
  exposure: 0.4,
  crewStress: 0.4,
  obligation: 0.4,
  rival: 0.4,
  depth: 0.3,
  value: 0.6,
  cash: 0.7,
  tolerance: 42
}

/**
 * Evaluates whether a profile's policy decides to extract at the current extraction window,
 * and records which pressure the decision actually came from.
 *
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @returns {{
 *   extract: boolean,
 *   reason: string | null,
 *   score: number,
 *   tolerance: number,
 *   pressures: Record<string, number>,
 *   routeStep: number,
 *   vanCondition: number,
 *   technicalCondition: number,
 *   fuel: number,
 *   spendableCash: number,
 *   spareParts: number,
 *   heat: number,
 *   exposure: number,
 *   extractRetainedMoney: number,
 *   moneyAtRisk: number
 * }}
 */
export const explainExtractionDecision = (state, profile) => {
  const vanCond = finiteNumberOr(state.player.van.condition, 100)
  const vanFuel = finiteNumberOr(state.player.van.fuel, 100)
  const techCond = getExpeditionConditionSummary(state)
  const spareParts = finiteNumberOr(state.expedition.cargo?.spareParts, 0)
  const protectedCash = finiteNumberOr(
    state.expedition.loadout?.build?.protectedCareerCash,
    0
  )
  const spendableCash = finiteNumberOr(state.player.money, 0) - protectedCash

  // The production Director's own reading of the run. Using it rather than a
  // harness copy is what makes Heat and Exposure changes in `src/` show up in
  // this decision at all.
  const context = derivePressureDirectorContext(state)

  // What bailing out banks versus what failing here would leave. The gap is
  // the money the run is currently carrying unbanked, priced by the production
  // settlement rather than by an estimate.
  const extractRetainedMoney = settleExpedition(state, 'extracted').moneyRetained
  const failedRetainedMoney = settleExpedition(state, 'failed').moneyRetained
  const moneyAtRisk = Math.max(0, extractRetainedMoney - failedRetainedMoney)

  const bounded = value => Math.max(0, Math.min(100, finiteNumberOr(value, 0)))

  const pressures = {
    // Only the axes that can actually end a run.
    //
    // Production has exactly three lethal paths: `technical_shutdown` when a
    // technical group hits 0 with no legal recovery, `fuel_stranded` from the
    // mobility softlock, and `bankruptcy`. Van condition is on none of them -
    // spec 11.10 has condition zero disable an asset for the run rather than
    // end it. Folding `100 - vanCondition` in here made the policy bail on a
    // threat the game does not implement, and it dominated: all 129 regretted
    // windows were chosen by this dimension, `diy_repair` walked away from a
    // median 4,443 EUR at van condition 0, and 115 forced continuations across
    // every profile produced zero failures. Van condition is a cost, and it is
    // priced as one below.
    // Fuel is scaled so a half tank reads as no pressure and a quarter tank as
    // half: below that the run is choosing between a Supply Stop and a tow.
    survival: Math.max(
      context.technicalConditionPressure,
      bounded(100 - vanFuel * 2)
    ),
    // What a battered van actually costs: repairs, slower legs, worse travel
    // outcomes. Real, and worth weighing - just not fatal.
    vanWear: bounded(100 - vanCond),
    heat: context.heat,
    exposure: context.exposure,
    crewStress: context.crewStressPressure,
    obligation: context.activeObligationPressure,
    rival: context.rivalPressure,
    depth: context.routeDepthPressure,
    // The share of the band's post-run wealth that is still unbanked. Losing
    // 1,200 with 300 in the bank is a different decision from losing 1,200 with
    // 5,000 in the bank, and a flat currency threshold cannot tell them apart.
    value: bounded(
      (100 * moneyAtRisk) /
        Math.max(1, moneyAtRisk + Math.max(0, spendableCash))
    ),
    // Spare parts are a repair the run has already paid for, so an empty wallet
    // with parts aboard is not the same emergency as an empty wallet without.
    cash: Math.max(
      context.cashPressure,
      spendableCash < 150 && spareParts === 0 ? 100 : 0
    )
  }

  const weights =
    EXTRACTION_POLICY_WEIGHTS[profile.decisionPolicy] ??
    DEFAULT_EXTRACTION_POLICY_WEIGHTS
  let weightedTotal = 0
  let weightSum = 0
  /** @type {string | null} */
  let dominant = null
  let dominantContribution = -1
  for (const [dimension, pressure] of Object.entries(pressures)) {
    const weight = finiteNumberOr(weights[dimension], 0)
    if (weight <= 0) continue
    const contribution = weight * pressure
    weightedTotal += contribution
    weightSum += weight
    if (contribution > dominantContribution) {
      dominantContribution = contribution
      dominant = dimension
    }
  }
  const score = weightSum > 0 ? weightedTotal / weightSum : 0
  const tolerance = finiteNumberOr(
    weights.tolerance,
    DEFAULT_EXTRACTION_POLICY_WEIGHTS.tolerance
  )

  // Which pressure carried the decision, not just that one did. A profile that
  // always extracts and one that never does look identical in the outcome mix;
  // the dominant dimension is what separates "the run was in trouble" from
  // "the policy's tolerance sits where a healthy run already operates".
  const reason = score >= tolerance ? dominant : null

  return {
    extract: reason !== null,
    reason,
    score: Math.round(score * 10) / 10,
    tolerance,
    pressures,
    routeStep: state.expedition.routeStep,
    vanCondition: vanCond,
    technicalCondition: techCond,
    fuel: vanFuel,
    spendableCash,
    spareParts,
    heat: context.heat,
    exposure: context.exposure,
    // The production settlement, so "what extracting is worth right now" is the
    // game's own number rather than a harness estimate.
    extractRetainedMoney,
    moneyAtRisk
  }
}

/**
 * Gate 5: a guarded spend may never cross the protected Career Cash floor.
 *
 * @param {import('../src/types').GameState} before - State before the spend.
 * @param {import('../src/types').GameState} after - State the reducer returned.
 * @param {string} label - The spend, for the failure message.
 * @throws When a guarded spend took money below the build's protected slice.
 *
 * @remarks
 * This is the invariant production actually owns.
 * `getExpeditionSpendableCash` subtracts the protected slice and every
 * discretionary spender checks it through `canSpendExpeditionCash`, so a
 * guarded spend that crosses the floor means a call site bypassed the guard.
 * Money moving below the floor by other means - a Gig that lost money, a
 * travel settlement - is legal, and asserting otherwise made the simulation
 * describe a stricter game than the one in `src/`.
 */
const verifyProtectedCashNotSpent = (before, after, label) => {
  const protectedCash = finiteNumberOr(
    after.expedition?.loadout?.build?.protectedCareerCash,
    0
  )
  if (protectedCash <= 0) return
  const moneyBefore = finiteNumberOr(before.player.money, 0)
  const moneyAfter = finiteNumberOr(after.player.money, 0)
  if (moneyAfter >= moneyBefore) return
  if (moneyAfter >= protectedCash) return
  throw new Error(
    `[HardGate5] ${label} spent Career Cash below the protected floor: ${moneyBefore} -> ${moneyAfter}, floor ${protectedCash}`
  )
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
 * @param {boolean} [options.disableAutoIntelReveal] - Suppresses the Scout's
 * automatic per-step reveal. The Fog probe's masked branch needs it: with the
 * reveal still firing, branch A consumed intel it was supposed to lack.
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
    // What the profile asked for vs what the committed build actually holds.
    // Reporting the request as the purchase meant a profile whose insurance
    // never made it into the loadout still read as insured.
    insuranceOffered: Boolean(profile.insurancePolicyId),
    insuranceBought: Boolean(state.expedition.loadout?.insurancePolicyId),
    insuranceClaimed: false,
    authoritySafeExitsOffered: 0,
    authoritySafeExitsUsed: 0,
    crewStressMax: 0,
    crowdHypeMax: state.expedition.pressure?.crowdHype ?? 0,
    realizedHypeComboBonusTotal: 0,
    extractionDecisions: [],
    pressureEvents: [],
    socialPosts: [],
    gigNetTotal: 0,
    toxicModeTriggers: 0,
    gigMissesTotal: 0,
    maxComboBest: 0,
    sponsorAccepted: (state.expedition.activeObligations ?? []).some(
      obligation => obligation.sourceType === 'brandDeal'
    ),
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
          const beforeSpend = state
          state = gameReducer(state, refuelAction)
          verifyProtectedCashNotSpent(beforeSpend, state, 'refuel')
          resolved = true
        }
      } else if (
        pendingFailure.choices.includes('tow') &&
        canSpendExpeditionCash(state, EXPEDITION_TOW_COST)
      ) {
        const towAction = resolveExpeditionCrisis(state, 'tow')
        if (towAction) {
          const beforeSpend = state
          state = gameReducer(state, towAction)
          verifyProtectedCashNotSpent(beforeSpend, state, 'tow')
          resolved = true
        }
      } else if (pendingFailure.choices.includes('insurance_claim')) {
        const claimAction = resolveExpeditionCrisis(state, 'insurance_claim')
        if (claimAction) {
          const beforeSpend = state
          state = gameReducer(state, claimAction)
          verifyProtectedCashNotSpent(beforeSpend, state, 'insurance_claim')
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
            const beforeRepair = state
            state = gameReducer(state, action)
            verifyProtectedCashNotSpent(beforeRepair, state, `repair:${intent.mode}`)
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

      // 2. SET_LAST_GIG_STATS, from the production snapshot builder so the
      // downstream reducers see hits, misses, combo and Hype rather than a
      // bare accuracy number.
      // The song the build actually committed, so the miss count is a property
      // of the chart the Gig plays rather than of a harness constant.
      const playedSongId = state.setlist?.[0]?.id
      const playedSong = playedSongId
        ? SONGS_BY_ID.get(playedSongId)
        : undefined
      const performance = resolveSimulatedGigPerformance(
        gigAccuracy,
        state.expedition.routeStep,
        { noteCount: playedSong?.notes?.length }
      )
      const gigStats = performance.stats
      // Measured, not assumed: the score the combo term actually contributed
      // across the Gig, so the Hype amplification claim has a number behind it.
      telemetry.realizedHypeComboBonusTotal +=
        performance.realizedHypeComboBonus
      telemetry.toxicModeTriggers += performance.toxicModeTriggers
      telemetry.gigMissesTotal += gigStats.misses
      telemetry.maxComboBest = Math.max(
        telemetry.maxComboBest,
        gigStats.maxCombo
      )
      state = gameReducer(state, {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: gigStats
      })

      // 3. Settle the Gig through the production payout owners.
      //
      // This was missing entirely. The runner staged a Gig and then moved on,
      // so no Expedition run ever earned anything: `settlement` was 0 on every
      // Career run and each Tour was pure cost. The `cashEarned: 250` the
      // payload used to carry is read by nothing in `src/` - it simply
      // evaporated - which made a release metric (Career solvency) depend on a
      // formula the simulator never executed. `deriveFinancials` is the same
      // owner the v14 harness and `usePostGigDerivations` both use, and
      // `calculateContinueStats` is what turns it into money and Fame.
      const financials = deriveFinancials({
        currentGig: venue,
        lastGigStats: gigStats,
        perfScore: gigAccuracy,
        gigModifiers: state.gigModifiers,
        bandInventory: state.band.inventory,
        bandMerchPrices: state.band.merchPrices ?? {},
        bandGigModifier: state.band.gigModifier,
        player: state.player,
        social: state.social,
        reputationByRegion: state.reputationByRegion ?? {},
        activeStoryFlags: [],
        gigContext: {
          daysSinceLastGig:
            finiteNumberOr(state.player.day, 0) -
            finiteNumberOr(state.social.lastGigDay, state.player.day),
          lastGigDifficulty: state.social.lastGigDifficulty ?? null
        },
        cityTraits: [],
        assetModifiers: getActiveAssetModifiers(state.assets ?? []),
        repeatDemandContext: undefined
      })

      if (financials) {
        const continueStats = calculateContinueStats({
          player: state.player,
          perfScore: gigAccuracy,
          financials,
          misses: gigStats.misses,
          bandStyle: state.band.style,
          calculateFameGain,
          calculateFameLevel,
          clampPlayerFame,
          clampPlayerMoney,
          BALANCE_CONSTANTS
        })
        telemetry.gigNetTotal += finiteNumberOr(financials.net, 0)
        state = {
          ...state,
          player: {
            ...state.player,
            money: continueStats.newMoney,
            fame: continueStats.newFame,
            fameLevel: continueStats.fameLevel
          }
        }
      }

      // 3b. Post about the show. The Gig opened a Social settlement window at
      // this route step, and that settlement is the only writer of
      // `pressure.exposure` on an active run.
      state = playPendingSocialPost(state, profile, seed, telemetry)

      // 4. Obligations signal
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
      // Recorded at every legal window, taken or not: a profile that never
      // extracts and one that always does look identical in the outcome mix,
      // and only the reason code separates "the run was in trouble" from "the
      // policy's threshold sits where a healthy run already is".
      const decision = explainExtractionDecision(state, profile)
      telemetry.extractionDecisions.push(decision)
      shouldExtract = decision.extract
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

    // Intel revelation hook (Scout or recon). Only reveals the reducer
    // actually accepted are counted: marking a node revealed on dispatch
    // alone let the simulator's local map claim intel the run does not hold,
    // and the route policy then scored against knowledge production refused.
    if (
      options.disableAutoIntelReveal !== true &&
      (profile.decisionPolicy === 'intel_then_value' ||
        profile.crewRoleOrder.includes('scout'))
    ) {
      const revealed = revealCandidateIntel(state, candidateNodeIds)
      for (const nodeId of revealed.revealedNodeIds) {
        if (!revealedNodes[nodeId]) {
          revealedNodes[nodeId] = true
          telemetry.revealedIntelNodes.push(nodeId)
          telemetry.inspectedFieldsCount += 3
        }
      }
      state = revealed.state
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
          getExpeditionNodeFogByNodeId(state) ?? {}
        )
        if (score > bestScore) {
          bestScore = score
          chosenNextId = candidateId
        }
      }
    }

    // G: Travel Leg Settlement
    //
    // Driven through the canonical travel minigame actions rather than a
    // parallel cost model. `handleCompleteTravelMinigame` is the production
    // owner of the leg: it settles travel expenses, fuel consumption, van
    // wear, stamina regen, then calls `applyExpeditionRouteAdvance` and the
    // `post_travel` defect boundary in the same reducer pass. Duplicating any
    // of that here would let the simulator's numbers drift from the game's.
    const preTravelState = state
    // `calculateTravelMinigameResult` halves the reported damage, so the
    // skill-derived condition loss is doubled back into the payload.
    const minigameDamage =
      skillLevel === 'high' ? 2 : skillLevel === 'low' ? 10 : 6
    const travelRng =
      deriveCohortSeed(
        `${TRAVEL_RNG_NAMESPACE}:${seed}:${state.expedition.routeStep}`,
        0
      ) / 4294967296

    state = gameReducer(state, createStartTravelMinigameAction(chosenNextId))
    state = gameReducer(
      state,
      createCompleteTravelMinigameAction(minigameDamage, [], travelRng)
    )

    if (state.player.currentNodeId !== chosenNextId) {
      // A build that rings off Career Cash can reach a leg it cannot pay for:
      // `getExpeditionSpendableCash` subtracts the protected slice, so the
      // travel settlement is refused rather than allowed to spend the reserve.
      // That is the protection working, not a simulator bug - the run is
      // stranded and the Career keeps its next start. Accept the terminal the
      // production failure system already models instead of throwing.
      const stranded = acceptExpeditionFailure(state)
      if (stranded) {
        state = gameReducer(state, stranded)
        telemetry.terminalKind = 'failed'
        telemetry.terminalSource = 'travel_refused_protected_cash'
        break
      }
      throw new Error(
        `Route advance to ${chosenNextId} was refused at step ${preTravelState.expedition.routeStep}`
      )
    }

    // Gate 6: legacy daily wear must not double-apply Expedition travel wear.
    // One settlement owns the leg, so the van wear observed across the
    // canonical travel pass must equal what `resolveExpeditionTravelCost`
    // declared for it — not that figure plus a second legacy deduction.
    verifyTravelWearSingleSettlement(
      preTravelState,
      state,
      chosenNextId,
      minigameDamage
    )

    // Per-leg gates. `previousState` arms Gate 11, which can only see a Rival
    // swap by comparing the two sides of a single leg.
    verifyHardCorrectnessGates(state, map, profile, 'route_step', {
      ...options,
      previousState: preTravelState
    })

    const visibleDefects = getVisibleExpeditionDefects(state)
    telemetry.defectsRevealed = visibleDefects.filter(
      d => d.status === 'revealed'
    ).length
    telemetry.defectsTriggered = visibleDefects.filter(
      d => d.status === 'triggered'
    ).length

    // The Director selected an event for this arrival; playing it is what
    // turns that selection into Heat, Exposure, wear and cargo. Without this
    // the run reaches its Finale with pressure.heat still at its starting
    // value, and every Heat-driven number is measured against a system that
    // was staged and never played.
    state = playPendingPressureEvent(state, profile, telemetry)
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
/**
 * Separates soft balance corridors from a hard dominance block.
 *
 * @param {{ profileSummaries: Record<string, any> }} calibrationResults
 * @param {{ profileSummaries: Record<string, any> }} holdoutResults
 * @returns {{
 *   ok: boolean,
 *   violations: string[],
 *   corridorFindings: string[],
 *   dominanceViolations: string[]
 * }}
 *
 * @remarks
 * G6 Task 7 calls the corridors "tuneable hypotheses" and says dominance
 * blocks *only* when the same conclusion reproduces in disjoint calibration
 * and holdout. So a corridor miss is a reported finding, not a correctness
 * failure, and it is evaluated against both cohorts rather than calibration
 * alone - a hypothesis that only fails on the seeds it was fitted to says
 * nothing.
 *
 * `ok` and `violations` describe the blocking half only, so a caller that
 * gates a release on them gates on dominance.
 */
export const EXPEDITION_OUTCOME_RATE_CORRIDORS = Object.freeze({
  completedRate: Object.freeze([0.2, 0.9]),
  extractedRate: Object.freeze([0.05, 0.9]),
  failedRate: Object.freeze([0.02, 0.5])
})

export const checkStrategyDominance = (calibrationResults, holdoutResults) => {
  /** @type {string[]} */
  const corridorFindings = []
  /** @type {string[]} */
  const dominanceViolations = []

  const cohorts = [
    ['calibration', calibrationResults],
    ['holdout', holdoutResults]
  ]

  for (const [cohortName, cohort] of cohorts) {
    for (const [id, summary] of Object.entries(cohort.profileSummaries)) {
      // Corridor 1: meaningful node count stays in the Standard band.
      if (summary.meanNodes < 4 || summary.meanNodes > 15) {
        corridorFindings.push(
          `Profile ${id} mean nodes ${summary.meanNodes.toFixed(1)} outside expected corridor in ${cohortName}`
        )
      }
      // Corridor 2: every terminal outcome remains meaningfully represented.
      for (const [rateName, corridor] of Object.entries(
        EXPEDITION_OUTCOME_RATE_CORRIDORS
      )) {
        const rate = summary[rateName]
        if (rate < corridor[0] || rate > corridor[1])
          corridorFindings.push(
            `Profile ${id} ${rateName} ${(rate * 100).toFixed(1)}% outside ${(corridor[0] * 100).toFixed(0)}-${(corridor[1] * 100).toFixed(0)}% corridor in ${cohortName}`
          )
      }
    }
  }

  // Dominance: strictly better completion, money and failure than every other
  // profile, in BOTH cohorts. Reproduction across disjoint seeds is what makes
  // it a block rather than a corridor note.
  const profileIds = Object.keys(calibrationResults.profileSummaries)
  for (const candId of profileIds) {
    const cCal = calibrationResults.profileSummaries[candId]
    const cHol = holdoutResults.profileSummaries[candId]
    if (!cCal || !cHol) continue

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
      dominanceViolations.push(
        `Profile ${candId} strictly dominates all other strategies across calibration and holdout`
      )
    }
  }

  return {
    ok: dominanceViolations.length === 0,
    violations: dominanceViolations,
    corridorFindings,
    dominanceViolations
  }
}
