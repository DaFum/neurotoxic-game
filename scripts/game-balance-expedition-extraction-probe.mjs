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
  /** @type {{ state: import('../src/types').GameState, routeStep: number }[]} */
  const capturedWindows = []

  // Step 1: Run once, capturing EVERY legal extraction window. Task 9 pairs
  // each window against the same downstream continuation; stopping at the
  // first one measured a single decision and called it the run's extraction
  // economics.
  const initialResult = runExpeditionSimulation(fixtureState, profile, seed, {
    ...options,
    extractionDecisionSpy: (canExtract, state) => {
      if (canExtract) {
        capturedWindows.push({
          state: structuredClone(state),
          routeStep: state.expedition.routeStep
        })
      }
      // Always continue: branch B is the single downstream continuation every
      // captured window is compared against.
      return false
    }
  })

  // Branch B: Continue downstream using standard profile policy.
  const branchB = {
    outcome: initialResult.outcome,
    retainedMoney: initialResult.telemetry.retainedMoney,
    retainedFame: initialResult.telemetry.retainedFame,
    securedRares: initialResult.telemetry.securedRares,
    explicitlyExtractedRares: initialResult.telemetry.explicitlyExtractedRares,
    abandonedRares: initialResult.telemetry.abandonedRares
  }

  /**
   * Extracts at one captured window and settles it, so branch A is a real
   * terminal Career result rather than a mid-run snapshot.
   *
   * @param {{ state: import('../src/types').GameState, routeStep: number }} window
   */
  const extractAt = window => {
    const carrySlots = getExplicitExtractionRareCarrySlots(window.state)
    const unmaterializedRares = window.state.expedition.rewardLedger
      .filter(entry => !entry.secured && !entry.abandoned)
      .slice(0, carrySlots)
      .map(entry => entry.id)

    let stateA = gameReducer(
      window.state,
      extractExpedition(window.state, unmaterializedRares)
    )
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
    return {
      windowRouteStep: window.routeStep,
      branchA,
      deltaMoney: branchB.retainedMoney - branchA.retainedMoney,
      deltaFame: branchB.retainedFame - branchA.retainedFame
    }
  }

  const windows = capturedWindows.map(extractAt)

  if (windows.length === 0) {
    return {
      windowEncountered: false,
      windowCount: 0,
      windows: [],
      windowRouteStep: null,
      branchA: null,
      branchB: null,
      deltaMoney: null,
      deltaFame: null
    }
  }

  const first = windows[0]
  return {
    windowEncountered: true,
    windowCount: windows.length,
    windows,
    // The first window stays on the top level so a reader (and the existing
    // corridor assertions) keep a single canonical pair to point at.
    windowRouteStep: first.windowRouteStep,
    branchA: first.branchA,
    branchB,
    deltaMoney: first.deltaMoney,
    deltaFame: first.deltaFame
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
        windowsEncounteredCount += pair.windowCount
        // One delta per window, matching the denominator. Adding only the
        // first window's delta while counting every window pulled both means
        // toward zero as route depth grew, so a deeper Tour looked like a
        // smaller extraction gap than it was.
        for (const window of pair.windows) {
          totalDeltaMoney += window.deltaMoney
          totalDeltaFame += window.deltaFame
        }

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
