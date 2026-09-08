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
import {
  runExpeditionSimulation,
  explainExtractionDecision
} from './game-balance-expedition-runner.mjs'

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
        // What the live policy would have done here, recorded before it is
        // overridden. Without it the probe can price every window but cannot
        // say which ones the agent actually takes - and the question that
        // matters is not whether extracting is ever wrong, it is whether the
        // policy is wrong on the windows it chooses.
        const decision = explainExtractionDecision(state, profile)
        capturedWindows.push({
          state: structuredClone(state),
          routeStep: state.expedition.routeStep,
          policyWouldExtract: decision.extract,
          policyReason: decision.reason,
          policyScore: decision.score,
          policyTolerance: decision.tolerance
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
      policyWouldExtract: window.policyWouldExtract,
      policyReason: window.policyReason,
      policyScore: window.policyScore,
      policyTolerance: window.policyTolerance,
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

/** Percentile of a numeric sample, or `null` when the sample is empty. */
const percentile = (values, p) => {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return Math.round(sorted[index])
}

/**
 * Prices the policy's own extraction decisions against continuing.
 *
 * @param {Array<any>} pairs - Every evaluated pair, with per-window decisions.
 * @returns {{
 *   extractionRegret: Record<string, unknown>,
 *   forcedContinueOutcome: Record<string, unknown>
 * }}
 *
 * @remarks
 * The cohort already priced every legal window. What it could not say is
 * whether the *agent* is wrong, because it never recorded which windows the
 * agent would actually take. Both figures below are restricted to those.
 *
 * `extractionRegret` is `branchB.retained - branchA.retained` on the windows
 * the policy chose: positive means continuing would have paid more, so the
 * bail-out cost the Career money. `forcedContinueOutcome` is what became of
 * those same runs when they were made to continue - the risk the policy
 * bought its way out of. Read together they answer whether a defensive
 * profile is defensive for a reason: high regret with a low forced-failure
 * rate is an agent leaving money on the table, and the reverse is an agent
 * doing its job.
 */
export const summarizeExtractionRegret = pairs => {
  const regretMoney = []
  const regretFame = []
  let chosenWindows = 0
  let regretPositive = 0
  const reasons = Object.create(null)
  const forced = Object.create(null)
  let forcedTotal = 0

  for (const pair of pairs) {
    if (!pair.windowEncountered || !pair.branchB) continue
    let policyTookAWindow = false
    for (const window of pair.windows ?? []) {
      if (!window.policyWouldExtract) continue
      policyTookAWindow = true
      chosenWindows += 1
      regretMoney.push(window.deltaMoney)
      regretFame.push(window.deltaFame)
      if (window.deltaMoney > 0) regretPositive += 1
      const reason = String(window.policyReason ?? 'unknown')
      reasons[reason] = (reasons[reason] ?? 0) + 1
    }
    if (policyTookAWindow) {
      forced[pair.branchB.outcome] = (forced[pair.branchB.outcome] ?? 0) + 1
      forcedTotal += 1
    }
  }

  return {
    extractionRegret: {
      chosenWindows,
      betterToContinueCount: regretPositive,
      betterToContinueRate: chosenWindows === 0 ? null : regretPositive / chosenWindows,
      moneyP10: percentile(regretMoney, 10),
      moneyP25: percentile(regretMoney, 25),
      moneyP50: percentile(regretMoney, 50),
      moneyP75: percentile(regretMoney, 75),
      moneyP90: percentile(regretMoney, 90),
      fameP50: percentile(regretFame, 50),
      reasonCounts: { ...reasons }
    },
    forcedContinueOutcome: {
      runs: forcedTotal,
      completed: forced.completed ?? 0,
      extracted: forced.extracted ?? 0,
      failed: forced.failed ?? 0,
      failureRate: forcedTotal === 0 ? null : (forced.failed ?? 0) / forcedTotal
    }
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
    ...summarizeExtractionRegret(pairs),
    pairs
  }
}
