/**
 * @fileoverview Paired Extraction Counterfactual Probe (G6 Task 9).
 *
 * Evaluates paired branches at legal extraction windows:
 * Branch A: Extract now using optimal legal explicit rare carry selection under profile policy.
 * Branch B: Continue using same downstream policy and RNG stream.
 */

import { gameReducer } from '../src/context/gameReducer.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { extractExpedition } from '../src/context/expeditionActionCreators.ts'
import { getExplicitExtractionRareCarrySlots } from '../src/domain/expedition/extraction.ts'
import { runExpeditionSimulation } from './game-balance-expedition-runner.mjs'

export const EXTRACTION_CALIBRATION_NAMESPACE =
  '#roguelite-expedition-v1#extraction#calibration'
export const EXTRACTION_HOLDOUT_NAMESPACE =
  '#roguelite-expedition-v1#extraction#holdout'

/**
 * Runs a single paired extraction counterfactual for a given profile and seed.
 *
 * @param {import('../src/types').GameState} fixtureState
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile} profile
 * @param {number} seed
 * @param {object} [options={}]
 * @returns {{
 *   windowEncountered: boolean,
 *   windowRouteStep: number | null,
 *   branchA: {
 *     outcome: 'extracted',
 *     retainedMoney: number,
 *     retainedFame: number,
 *     explicitlyExtractedRares: number
 *   } | null,
 *   branchB: {
 *     outcome: 'extracted' | 'completed' | 'failed',
 *     retainedMoney: number,
 *     retainedFame: number,
 *     securedRares: number,
 *     explicitlyExtractedRares: number,
 *     abandonedRares: number
 *   } | null,
 *   deltaMoney: number | null,
 *   deltaFame: number | null
 * }}
 */
export const runExtractionCounterfactualPair = (
  fixtureState,
  profile,
  seed,
  options = {}
) => {
  let windowState = null
  let windowStep = null

  // Step 1: Run simulation with a spy that captures state at the first extraction window
  const initialResult = runExpeditionSimulation(fixtureState, profile, seed, {
    ...options,
    extractionDecisionSpy: (canExtract, state) => {
      if (canExtract && !windowState) {
        windowState = structuredClone(state)
        windowStep = state.expedition.routeStep
        // Force continue on this discovery run so we don't extract immediately if not needed
        return false
      }
      return false // Continue until we know what happens
    }
  })

  if (!windowState) {
    return {
      windowEncountered: false,
      windowRouteStep: null,
      branchA: null,
      branchB: null,
      deltaMoney: null,
      deltaFame: null
    }
  }

  // Branch A: Force extraction right at this window
  const carrySlots = getExplicitExtractionRareCarrySlots(windowState)
  const unmaterializedRares = windowState.expedition.rewardLedger
    .filter(entry => !entry.secured && !entry.abandoned)
    .slice(0, carrySlots)
    .map(entry => entry.id)

  const extractAction = extractExpedition(windowState, unmaterializedRares)
  let stateA = gameReducer(windowState, extractAction)
  const runIdA = stateA.expedition.outcome?.runId
  if (runIdA) {
    stateA = gameReducer(stateA, {
      type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER,
      payload: { runId: runIdA }
    })
    stateA = gameReducer(stateA, {
      type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT,
      payload: { runId: runIdA }
    })
  }

  const branchA = {
    outcome: /** @type {'extracted'} */ ('extracted'),
    retainedMoney: stateA.player.money,
    retainedFame: stateA.player.fame,
    explicitlyExtractedRares: unmaterializedRares.length
  }

  // Branch B: Continue downstream using standard profile policy from this point
  // initialResult already continued past this window with standard downstream logic!
  const branchB = {
    outcome: initialResult.outcome,
    retainedMoney: initialResult.telemetry.retainedMoney,
    retainedFame: initialResult.telemetry.retainedFame,
    securedRares: initialResult.telemetry.securedRares,
    explicitlyExtractedRares: initialResult.telemetry.explicitlyExtractedRares,
    abandonedRares: initialResult.telemetry.abandonedRares
  }

  return {
    windowEncountered: true,
    windowRouteStep: windowStep,
    branchA,
    branchB,
    deltaMoney: branchB.retainedMoney - branchA.retainedMoney,
    deltaFame: branchB.retainedFame - branchA.retainedFame
  }
}

/**
 * Runs extraction counterfactual cohort across profiles and seeds.
 *
 * @param {import('./game-balance-expedition-profiles.mjs').ExpeditionBalanceProfile[]} profiles
 * @param {number[]} seeds
 * @param {object} [options={}]
 * @returns {{
 *   totalPairsEvaluated: number,
 *   windowsEncounteredCount: number,
 *   meanDeltaMoney: number,
 *   meanDeltaFame: number,
 *   laterCompletedCount: number,
 *   laterFailedCount: number,
 *   laterExtractedCount: number,
 *   pairs: Array<any>
 * }}
 */
export const runExtractionProbeCohort = (profiles, seeds, options = {}) => {
  const pairs = []
  let windowsEncounteredCount = 0
  let totalDeltaMoney = 0
  let totalDeltaFame = 0
  let laterCompletedCount = 0
  let laterFailedCount = 0
  let laterExtractedCount = 0

  for (const profile of profiles) {
    for (const seed of seeds) {
      const pair = runExtractionCounterfactualPair(
        undefined,
        profile,
        seed,
        options
      )
      pairs.push({
        profileId: profile.id,
        seed,
        ...pair
      })

      if (pair.windowEncountered && pair.branchA && pair.branchB) {
        windowsEncounteredCount++
        totalDeltaMoney += pair.deltaMoney
        totalDeltaFame += pair.deltaFame

        if (pair.branchB.outcome === 'completed') laterCompletedCount++
        else if (pair.branchB.outcome === 'failed') laterFailedCount++
        else laterExtractedCount++
      }
    }
  }

  const n = windowsEncounteredCount || 1
  return {
    totalPairsEvaluated: pairs.length,
    windowsEncounteredCount,
    meanDeltaMoney: totalDeltaMoney / n,
    meanDeltaFame: totalDeltaFame / n,
    laterCompletedCount,
    laterFailedCount,
    laterExtractedCount,
    pairs
  }
}
