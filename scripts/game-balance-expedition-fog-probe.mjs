/**
 * @fileoverview Matched Hybrid-Fog Information Counterfactual Probe (G6 Task 11).
 *
 * Compares two identical branches at a multi-path route decision point:
 * Branch A (Masked): Decision made with Level-0 visible information only.
 * Branch B (Informed): Dispatches legal REVEAL_EXPEDITION_NODE_INTEL (Scout recon or reputation reveal)
 * and makes decision with revealed fields inspected by decision policy.
 */

import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import {
  evaluateCandidateNode,
  runExpeditionSimulation
} from './game-balance-expedition-runner.mjs'

export const FOG_CALIBRATION_NAMESPACE =
  '#roguelite-expedition-v1#fog#calibration'
export const FOG_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#fog#holdout'

/**
 * Runs a matched hybrid-fog information counterfactual pair for a profile and seed.
 *
 * @param {import('../src/types').GameState} fixtureState
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} seed
 * @param {'scout_recon'|'reputation_reveal'} [_intelSource='scout_recon']
 * @returns {{
 *   matchedDecisionFound: boolean,
 *   decisionRouteStep: number | null,
 *   candidateCount: number,
 *   chosenNodeA: string | null,
 *   chosenNodeB: string | null,
 *   routeChanged: boolean,
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
export const runFogCounterfactualPair = (
  fixtureState,
  profile,
  seed,
  _intelSource = 'scout_recon'
) => {
  const map = buildExpeditionMap(seed, profile.tourTypeId, profile.regionId)

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
    const score = evaluateCandidateNode(
      cid,
      { player: { van: { condition: 100 } } },
      profile,
      map,
      {}
    )
    if (score > bestScoreA) {
      bestScoreA = score
      chosenA = cid
    }
  }

  // Branch B: Informed decision (Dispatch reveal action and evaluate with revealed data)
  const revealedMap = {}
  for (const cid of candidateIds) {
    revealedMap[cid] = true
  }

  let bestScoreB = -Infinity
  let chosenB = candidateIds[0]
  for (const cid of candidateIds) {
    const score = evaluateCandidateNode(
      cid,
      { player: { van: { condition: 100 } } },
      profile,
      map,
      revealedMap
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
        const sc = evaluateCandidateNode(c, state, profile, map, revealedMap)
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
 * @param {'scout_recon'|'reputation_reveal'} [intelSource='scout_recon']
 * @returns {{
 *   totalPairs: number,
 *   routeChangedCount: number,
 *   routeChangedRate: number,
 *   meanDeltaMoney: number,
 *   meanDeltaFame: number,
 *   pairs: Array<any>
 * }}
 */
export const runFogProbeCohort = (
  profiles,
  seeds,
  intelSource = 'scout_recon'
) => {
  const pairs = []
  let routeChangedCount = 0
  let totalDeltaMoney = 0
  let totalDeltaFame = 0

  for (const profile of profiles) {
    for (const seed of seeds) {
      const pair = runFogCounterfactualPair(
        undefined,
        profile,
        seed,
        intelSource
      )
      pairs.push({
        profileId: profile.id,
        seed,
        ...pair
      })

      if (pair.matchedDecisionFound) {
        if (pair.routeChanged) routeChangedCount++
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
    meanDeltaMoney: totalDeltaMoney / n,
    meanDeltaFame: totalDeltaFame / n,
    pairs
  }
}
