/**
 * @fileoverview Matched Hybrid-Fog Information Counterfactual Probe (G6 Task 11).
 *
 * Two source-faithful counterfactuals over one canonical decision state:
 *
 * - `scout_recon`: branch B spends one real recon charge through
 *   `REVEAL_EXPEDITION_NODE_INTEL`; branch A spends none.
 * - `reputation`: branch A sits below the G5 Region-familiarity threshold,
 *   branch B sits at or above it and consumes the one bounded level-1 read
 *   that entitlement grants.
 *
 * Both branches read the production Fog projection, so the only pre-decision
 * difference is legal information visibility.
 */

import { gameReducer } from '../src/context/gameReducer.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import { revealExpeditionNodeIntel } from '../src/context/expeditionActionCreators.ts'
import { getExpeditionNodeFogByNodeId } from '../src/domain/expedition/nodeFog.ts'
// The production threshold itself, not a copy: a probe that hardcoded 50 would
// keep reporting a "reputation counterfactual" after the real gate moved.
import { REGION_FAMILIARITY_REPUTATION } from '../src/domain/expedition/nodeIntel.ts'
import {
  evaluateCandidateNode,
  runExpeditionSimulation
} from './game-balance-expedition-runner.mjs'
import { buildProductionSimulationLoadout } from './game-balance-expedition-profiles.mjs'

export const FOG_CALIBRATION_NAMESPACE =
  '#roguelite-expedition-v1#fog#calibration'
export const FOG_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#fog#holdout'
export const FOG_REPUTATION_CALIBRATION_NAMESPACE =
  '#roguelite-expedition-v1#fog#reputation#calibration'
export const FOG_REPUTATION_HOLDOUT_NAMESPACE =
  '#roguelite-expedition-v1#fog#reputation#holdout'

/** The two intel sources Task 11 requires a separate cohort for. */
export const FOG_INTEL_SOURCES = Object.freeze(['scout_recon', 'reputation'])

/**
 * The projection fields a given intel level actually exposes.
 *
 * @remarks
 * Derived from the production projection rather than declared, so the report
 * cannot claim a field the Fog never surfaces. The previous list advertised
 * `exactDanger`, which `getExpeditionNodeFogByNodeId` does not produce at all.
 *
 * @param {Record<string, import('../src/types/expedition').ExpeditionNodeFog>} fog
 * @param {string[]} nodeIds
 * @returns {string[]}
 */
const inspectedFieldsFor = (fog, nodeIds) => {
  const fields = new Set()
  for (const nodeId of nodeIds) {
    const entry = Object.hasOwn(fog, nodeId) ? fog[nodeId] : null
    if (!entry) continue
    fields.add('nodeClass')
    fields.add('dangerTier')
    fields.add('rewardTier')
    if (entry.exactPayout !== null) fields.add('exactPayout')
    if (entry.exactWearCost !== null) fields.add('exactWearCost')
    if (entry.rareRewardId !== null) fields.add('rareRewardId')
    if (entry.revealedIdentity !== null) fields.add('revealedIdentity')
  }
  return [...fields].sort()
}

/**
 * Sets Region reputation for the committed Region.
 *
 * @param {import('../src/types').GameState} state
 * @param {number} value
 * @returns {import('../src/types').GameState}
 */
const withRegionReputation = (state, value) => ({
  ...state,
  reputationByRegion: {
    ...(state.reputationByRegion ?? {}),
    [state.expedition.loadout.regionId]: value
  }
})

/**
 * Spends exactly one legal recon charge on the best-scoring masked candidate.
 *
 * @param {import('../src/types').GameState} state
 * @param {string[]} candidateIds
 * @returns {{ state: import('../src/types').GameState, revealedNodeIds: string[] }}
 */
const spendOneRecon = (state, candidateIds) => {
  for (const nodeId of candidateIds) {
    const next = gameReducer(
      state,
      revealExpeditionNodeIntel(state, { nodeId, source: 'scout_recon' })
    )
    if (next !== state) return { state: next, revealedNodeIds: [nodeId] }
  }
  return { state, revealedNodeIds: [] }
}

/**
 * Picks the highest-scoring candidate under the profile's policy.
 *
 * @param {string[]} candidateIds
 * @param {import('../src/types').GameState} state
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {import('../src/types/expedition').ExpeditionMap} map
 * @returns {{ chosen: string, score: number }}
 */
const decide = (candidateIds, state, profile, map) => {
  const fog = getExpeditionNodeFogByNodeId(state) ?? {}
  let chosen = candidateIds[0]
  let best = -Infinity
  for (const candidateId of candidateIds) {
    const score = evaluateCandidateNode(candidateId, state, profile, map, fog)
    if (score > best) {
      best = score
      chosen = candidateId
    }
  }
  return { chosen, score: best }
}

/**
 * Runs one matched hybrid-fog counterfactual pair.
 *
 * @param {import('../src/types').GameState} fixtureState
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} seed
 * @param {'scout_recon'|'reputation'} [source='scout_recon']
 */
export const runFogCounterfactualPair = (
  fixtureState,
  profile,
  seed,
  source = 'scout_recon'
) => {
  // One canonical decision state. Both branches are derived from it, so map,
  // RNG, resources, build and policy are identical by construction.
  const canonical = buildProductionSimulationLoadout(
    fixtureState,
    profile,
    seed
  )
  const map = buildExpeditionMap(
    canonical.runSeed,
    canonical.expedition.loadout.tourTypeId,
    canonical.expedition.loadout.regionId
  )

  const outgoing = map.connections.filter(edge => edge.from === map.startNodeId)
  const candidateIds = outgoing.map(edge => edge.to)
  const empty = {
    source,
    matchedDecisionFound: false,
    decisionRouteStep: null,
    candidateCount: candidateIds.length,
    chosenNodeA: null,
    chosenNodeB: null,
    scoreA: null,
    scoreB: null,
    routeChanged: false,
    revealUsed: false,
    revealedNodeIds: [],
    revealedCandidateIds: [],
    intelLevelsA: {},
    intelLevelsB: {},
    inspectedFieldsA: [],
    inspectedFieldsB: [],
    branchA: null,
    branchB: null
  }
  if (candidateIds.length < 2) return empty

  // Branch A: masked. For the reputation cohort that means reputation below
  // the G5 threshold; for the Scout cohort it means no recon spent. In both
  // cases the automatic per-step reveal stays off, or branch A would consume
  // intel its forced choice was never scored against.
  const maskedState =
    source === 'reputation'
      ? withRegionReputation(canonical, REGION_FAMILIARITY_REPUTATION - 1)
      : canonical

  // Branch B: exactly one legal, source-specific reveal.
  let informedState
  /** @type {string[]} */
  let revealedNodeIds
  if (source === 'reputation') {
    informedState = withRegionReputation(
      canonical,
      REGION_FAMILIARITY_REPUTATION
    )
    // The entitlement draws its one free level-1 read from the whole forward
    // pool, not from the immediate candidates, so the reveal is counted across
    // the projection. Scoping it to the candidates reported `revealUsed:false`
    // for a reveal production had in fact granted, one branch deeper.
    const maskedFog = getExpeditionNodeFogByNodeId(maskedState) ?? {}
    const informedFog = getExpeditionNodeFogByNodeId(informedState) ?? {}
    revealedNodeIds = Object.keys(informedFog).filter(
      nodeId =>
        (informedFog[nodeId]?.intelLevel ?? 0) >
        (maskedFog[nodeId]?.intelLevel ?? 0)
    )
  } else {
    const spent = spendOneRecon(canonical, candidateIds)
    informedState = spent.state
    revealedNodeIds = spent.revealedNodeIds
  }

  const fogA = getExpeditionNodeFogByNodeId(maskedState) ?? {}
  const fogB = getExpeditionNodeFogByNodeId(informedState) ?? {}
  const levels = fog =>
    Object.fromEntries(
      candidateIds.map(nodeId => [nodeId, fog[nodeId]?.intelLevel ?? 0])
    )

  const decisionA = decide(candidateIds, maskedState, profile, map)
  const decisionB = decide(candidateIds, informedState, profile, map)

  // Downstream continuations. Auto-reveal is suppressed on both so the only
  // pre-decision difference stays the one this probe introduced.
  const simulate = (state, forcedFirstChoice) =>
    runExpeditionSimulation(state, profile, seed, {
      disableAutoIntelReveal: true,
      routeDecisionSpy: (current, candidates, liveState) => {
        if (liveState.expedition.routeStep === 0) return forcedFirstChoice
        return decide(candidates, liveState, profile, map).chosen
      }
    })

  const simA = simulate(maskedState, decisionA.chosen)
  const simB = simulate(informedState, decisionB.chosen)

  const terminal = sim => ({
    outcome: sim.outcome,
    retainedMoney: sim.telemetry.retainedMoney,
    retainedFame: sim.telemetry.retainedFame,
    securedRares: sim.telemetry.securedRares
  })

  return {
    source,
    matchedDecisionFound: true,
    decisionRouteStep: 0,
    candidateCount: candidateIds.length,
    chosenNodeA: decisionA.chosen,
    chosenNodeB: decisionB.chosen,
    scoreA: decisionA.score,
    scoreB: decisionB.score,
    routeChanged: decisionA.chosen !== decisionB.chosen,
    revealUsed: revealedNodeIds.length > 0,
    revealedNodeIds,
    // Whether the reveal actually landed where the decision was being made.
    // A reveal deeper in the route is real information the policy simply
    // could not price at this step, and the two cases must not be conflated.
    revealedCandidateIds: revealedNodeIds.filter(nodeId =>
      candidateIds.includes(nodeId)
    ),
    intelLevelsA: levels(fogA),
    intelLevelsB: levels(fogB),
    inspectedFieldsA: inspectedFieldsFor(fogA, candidateIds),
    inspectedFieldsB: inspectedFieldsFor(fogB, candidateIds),
    branchA: terminal(simA),
    branchB: terminal(simB)
  }
}

/**
 * Runs a cohort of fog counterfactual pairs for one intel source.
 *
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile[]} profiles
 * @param {number[]} seeds
 * @param {'scout_recon'|'reputation'} [source='scout_recon']
 */
export const runFogProbeCohort = (profiles, seeds, source = 'scout_recon') => {
  const pairs = []
  let routeChangedCount = 0
  let revealUsedCount = 0
  let revealAtDecisionCount = 0
  let revealUsedRouteUnchangedCount = 0
  let totalDeltaMoney = 0
  let totalDeltaFame = 0

  for (const profile of profiles) {
    for (const seed of seeds) {
      const pair = runFogCounterfactualPair(undefined, profile, seed, source)
      pairs.push({ profileId: profile.id, seed, ...pair })
      if (!pair.matchedDecisionFound) continue
      if (pair.routeChanged) routeChangedCount++
      if (pair.revealUsed) revealUsedCount++
      // The blocking-fidelity rate is only meaningful where the reveal was
      // reachable by the decision: elsewhere an unchanged route says nothing
      // about whether the policy can consume intel.
      if (pair.revealedCandidateIds.length > 0) {
        revealAtDecisionCount++
        if (!pair.routeChanged) revealUsedRouteUnchangedCount++
      }
      if (pair.branchA && pair.branchB) {
        totalDeltaMoney +=
          pair.branchB.retainedMoney - pair.branchA.retainedMoney
        totalDeltaFame += pair.branchB.retainedFame - pair.branchA.retainedFame
      }
    }
  }

  // Unmatched pairs (fewer than two candidates at the decision point) are
  // skipped by the `continue` above, so counting them in the denominator
  // reported a near-zero information effect that was purely an artifact of how
  // many seeds produced a branch at all.
  const matchedPairs = pairs.filter(pair => pair.matchedDecisionFound).length
  const n = matchedPairs || 1
  return {
    source,
    totalPairs: pairs.length,
    matchedPairs,
    routeChangedCount,
    routeChangedRate: matchedPairs === 0 ? null : routeChangedCount / n,
    revealUsedCount,
    revealAtDecisionCount,
    // Task 11's blocking fidelity signal: the reveal system produced
    // information at the decision point and the policy still could not act on
    // it. A rate of 1 across both cohorts is the blocking failure.
    revealUsedRouteUnchangedCount,
    revealUsedRouteUnchangedRate:
      revealAtDecisionCount === 0
        ? 0
        : revealUsedRouteUnchangedCount / revealAtDecisionCount,
    meanDeltaMoney: matchedPairs === 0 ? null : totalDeltaMoney / n,
    meanDeltaFame: matchedPairs === 0 ? null : totalDeltaFame / n,
    pairs
  }
}
