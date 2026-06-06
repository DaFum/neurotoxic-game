import { clampNonNegative } from './clamps'
import { FAME_PROGRESS_CONSTANTS, BALANCE_CONSTANTS } from './constants'
import { finiteNumberOr } from '../finiteNumber'

/**
 * Derives fame level from raw fame.
 * @param fame - Raw fame amount.
 * @returns Derived fame level.
 */
export const calculateFameLevel = (fame: number): number => {
  const clampedFame = clampNonNegative(fame)
  return Math.floor(Math.sqrt(clampedFame / 200))
}

/**
 * Calculates the raw fame reward for a successful gig before any diminishing returns.
 * Tuned so the full fame catalog remains reachable in roughly 20-30 strong gigs.
 *
 * @param performanceScore - Gig performance score.
 * @returns Raw gig fame reward.
 */
export const calculateGigFameReward = (performanceScore: number): number => {
  const safePerformanceScore = Number.isFinite(performanceScore)
    ? Math.max(0, performanceScore)
    : 0

  return (
    FAME_PROGRESS_CONSTANTS.GIG_BASE_REWARD +
    Math.floor(
      safePerformanceScore * FAME_PROGRESS_CONSTANTS.GIG_SCORE_MULTIPLIER
    )
  )
}

/**
 * Calculates fame gain with exponential diminishing returns.
 * Ensures the logic is synced across the app and simulation.
 * @param rawGain - The uncapped fame gain calculated from performance.
 * @param currentFame - The player's current fame.
 * @param maxGain - Hard cap on raw gain. Defaults to `2000`.
 * @returns The final damped fame gain.
 */
export const calculateFameGain = (
  rawGain: number,
  currentFame: number,
  maxGain = BALANCE_CONSTANTS.MAX_FAME_GAIN
): number => {
  const safeRawGain = Math.max(0, finiteNumberOr(rawGain, 0))
  const safePrevFame = Math.max(0, finiteNumberOr(currentFame, 0))
  const safeMaxGain = Math.max(1, finiteNumberOr(maxGain, BALANCE_CONSTANTS.MAX_FAME_GAIN))

  let fameGain = Math.round(Math.min(safeMaxGain, safeRawGain))

  if (
    fameGain > 0 &&
    safePrevFame > FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_START
  ) {
    const diminishingMultiplier = Math.exp(
      -(safePrevFame - FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_START) *
        FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_RATE
    )
    fameGain = Math.max(1, Math.round(fameGain * diminishingMultiplier))
  }

  return Math.max(0, Math.round(finiteNumberOr(fameGain, 0)))
}

/**
 * Pure probability of gig cancellation given current harmony.
 * Mirrors the engine check in arrivalUtils so UI and runtime are always in sync.
 *
 * @param harmony - Current band harmony (clamped to 1..100 by caller)
 * @param threshold - Low-harmony threshold (default: BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD)
 * @param chance - Cancellation probability when below threshold (default: BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE)
 * @returns 0 = no risk, 0..1 = probabilistic, 1 = certain cancellation
 */
export const calcCancellationRisk = (
  harmony: number,
  threshold = BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD,
  chance = BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE
): number => {
  if (harmony <= 1) return 1
  if (harmony < threshold) return chance
  return 0
}
