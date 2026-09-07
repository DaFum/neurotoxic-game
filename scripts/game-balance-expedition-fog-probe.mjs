/**
 * @fileoverview Matched Hybrid-Fog Information Counterfactual Probe (G6 Task 11).
 *
 * Compares two identical branches at a multi-path route decision point:
 * Branch A (Masked): Decision made with Level-0 visible information only.
 * Branch B (Informed): Dispatches legal REVEAL_EXPEDITION_NODE_INTEL (Scout recon or reputation reveal)
 * and makes decision with revealed fields inspected by decision policy.
 */

import { gameReducer } from '../src/context/gameReducer.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import { revealExpeditionNodeIntel } from '../src/context/expeditionActionCreators.ts'
import {
  evaluateCandidateNode,
  runExpeditionSimulation
} from './game-balance-expedition-runner.mjs'
import { buildProductionSimulationLoadout } from './game-balance-expedition-profiles.mjs'

export const FOG_CALIBRATION_NAMESPACE =
  '#roguelite-expedition-v1#fog#calibration'
export const FOG_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#fog#holdout'

/**
 * Raises node intel through the canonical reducer for every candidate it can.
 *
 * A Scout reads the route passively up to level 1, and a deliberate recon
 * raises one node per route step to level 2. Both go through
 * `REVEAL_EXPEDITION_NODE_INTEL`, so a request the run is not entitled to is
 * refused by the reducer rather than filtered here - the probe reveals exactly
 * what the run could legally have revealed, and no more.
 *
 * @param {import('../src/types').GameState} state
 * @param {string[]} candidateIds
 * @returns {{ state: import('../src/types').GameState, revealedNodeIds: string[] }}
 */
const revealCandidateIntel = (state, candidateIds) => {
  let next = state
  for (const nodeId of candidateIds) {
    const passive = gameReducer(
      next,
      revealExpeditionNodeIntel(next, { nodeId, source: 'scout_passive' })
    )
    if (passive !== next) next = passive
  }
  // One recon charge per route step, so at most one candidate reaches level 2.
  for (const nodeId of candidateIds) {
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
    revealedNodeIds: candidateIds.filter(
      nodeId => (next.expedition.intelByNodeId[nodeId] ?? 0) > 0
    )
  }
}

/**
 * Runs a matched hybrid-fog information counterfactual pair for a profile and seed.
 *
 * @param {import('../src/types').GameState} fixtureState
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} seed
 * @returns {{
 *   matchedDecisionFound: boolean,
 *   decisionRouteStep: number | null,
 *   candidateCount: number,
 *   chosenNodeA: string | null,
 *   chosenNodeB: string | null,
 *   routeChanged: boolean,
 *   revealedNodeIds: string[],
 *   intelByNodeId: Record<string, number>,
 *   inspectedFields: string[],
 *   branchA: {
 *     outcome: string,
 *     retainedMoney: number,
 *     retainedFame: number,
 *     securedRares: number
 *   } | null,
 *   branchB: {
 *     outcome: string,
 *     retainedMoney: number,
 *     retainedFame: number,
 *     securedRares: number
 *   } | null
 * }}
 */
export const runFogCounterfactualPair = (fixtureState, profile, seed) => {
  // The masked and informed branches must differ only in what has been
  // revealed, so both read the same production-built starting state.
  const baseState = buildProductionSimulationLoadout(fixtureState, profile, seed)
  const map = buildExpeditionMap(
    baseState.runSeed,
    baseState.expedition.loadout.tourTypeId,
    baseState.expedition.loadout.regionId
  )

  // Find candidate edges from start node
  const outgoing = map.connections.filter(e => e.from === map.startNodeId)
  if (outgoing.length < 2) {
    return {
      matchedDecisionFound: false,
      decisionRouteStep: null,
      candidateCount: outgoing.length,
      chosenNodeA: null,
      chosenNodeB: null,
      routeChanged: false,
      revealedNodeIds: [],
      intelByNodeId: {},
      inspectedFields: [],
      branchA: null,
      branchB: null
    }
  }

  const candidateIds = outgoing.map(e => e.to)

  // Branch A: Masked decision (Level 0 visibility)
  let bestScoreA = -Infinity
  let chosenA = candidateIds[0]
  for (const cid of candidateIds) {
    const score = evaluateCandidateNode(cid, baseState, profile, map, {})
    if (score > bestScoreA) {
      bestScoreA = score
      chosenA = cid
    }
  }

  // Branch B: Informed decision. The intel is raised by the canonical reducer
  // and read back off `intelByNodeId`, so the policy consumes the run's real
  // knowledge rather than a flag the probe set on itself.
  const revealed = revealCandidateIntel(baseState, candidateIds)
  const informedState = revealed.state
  const intelByNodeId = { ...informedState.expedition.intelByNodeId }

  let bestScoreB = -Infinity
  let chosenB = candidateIds[0]
  for (const cid of candidateIds) {
    const score = evaluateCandidateNode(
      cid,
      informedState,
      profile,
      map,
      intelByNodeId
    )
    if (score > bestScoreB) {
      bestScoreB = score
      chosenB = cid
    }
  }

  // Run full simulation forced to branch choice at step 1
  const simA = runExpeditionSimulation(fixtureState, profile, seed, {
    routeDecisionSpy: (current, candidates, state) => {
      if (state.expedition.routeStep === 0) return chosenA
      // Downstream: default policy
      let best = candidates[0]
      let bScore = -Infinity
      for (const c of candidates) {
        const sc = evaluateCandidateNode(c, state, profile, map, {})
        if (sc > bScore) {
          bScore = sc
          best = c
        }
      }
      return best
    }
  })

  const simB = runExpeditionSimulation(fixtureState, profile, seed, {
    routeDecisionSpy: (current, candidates, state) => {
      if (state.expedition.routeStep === 0) return chosenB
      let best = candidates[0]
      let bScore = -Infinity
      for (const c of candidates) {
        const sc = evaluateCandidateNode(
          c,
          state,
          profile,
          map,
          state.expedition.intelByNodeId
        )
        if (sc > bScore) {
          bScore = sc
          best = c
        }
      }
      return best
    }
  })

  return {
    matchedDecisionFound: true,
    decisionRouteStep: 0,
    candidateCount: candidateIds.length,
    chosenNodeA: chosenA,
    chosenNodeB: chosenB,
    routeChanged: chosenA !== chosenB,
    revealedNodeIds: revealed.revealedNodeIds,
    intelByNodeId,
    inspectedFields: [
      'nodeClass',
      'dangerTier',
      'rewardTier',
      'exactDanger',
      'rareRewardId'
    ],
    branchA: {
      outcome: simA.outcome,
      retainedMoney: simA.telemetry.retainedMoney,
      retainedFame: simA.telemetry.retainedFame,
      securedRares: simA.telemetry.securedRares
    },
    branchB: {
      outcome: simB.outcome,
      retainedMoney: simB.telemetry.retainedMoney,
      retainedFame: simB.telemetry.retainedFame,
      securedRares: simB.telemetry.securedRares
    }
  }
}

/**
 * Runs a cohort of fog counterfactual pairs and proves revealed information changes decisions.
 *
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile[]} profiles
 * @param {number[]} seeds
 * @returns {{
 *   totalPairs: number,
 *   routeChangedCount: number,
 *   routeChangedRate: number,
 *   revealedNodeCount: number,
 *   meanDeltaMoney: number,
 *   meanDeltaFame: number,
 *   pairs: Array<any>
 * }}
 */
export const runFogProbeCohort = (profiles, seeds) => {
  const pairs = []
  let routeChangedCount = 0
  let revealedNodeCount = 0
  let totalDeltaMoney = 0
  let totalDeltaFame = 0

  for (const profile of profiles) {
    for (const seed of seeds) {
      const pair = runFogCounterfactualPair(undefined, profile, seed)
      pairs.push({
        profileId: profile.id,
        seed,
        ...pair
      })

      if (pair.matchedDecisionFound) {
        if (pair.routeChanged) routeChangedCount++
        revealedNodeCount += pair.revealedNodeIds.length
        if (pair.branchA && pair.branchB) {
          totalDeltaMoney +=
            pair.branchB.retainedMoney - pair.branchA.retainedMoney
          totalDeltaFame +=
            pair.branchB.retainedFame - pair.branchA.retainedFame
        }
      }
    }
  }

  const n = pairs.length || 1

  return {
    totalPairs: pairs.length,
    routeChangedCount,
    routeChangedRate: routeChangedCount / n,
    revealedNodeCount,
    meanDeltaMoney: totalDeltaMoney / n,
    meanDeltaFame: totalDeltaFame / n,
    pairs
  }
}
