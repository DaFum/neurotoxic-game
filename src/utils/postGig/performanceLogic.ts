import { calculateGigFameReward } from '../gameState'
import type { GameState } from '../../types'
import type { PostGigFinancials } from '../../types/economy'

const assertFiniteIntegerAtLeastZero = (value: unknown, label: string) => {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a finite integer >= 0`)
  }
}

const assertFiniteNumberAtLeastZero = (value: unknown, label: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite number >= 0`)
  }
}

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 150

export const calculateExcessMissMoneyPenalty = ({
  misses = 0,
  missTolerance,
  missMoneyPenalty
}: {
  misses?: number
  missTolerance: number
  missMoneyPenalty?: number
}) => {
  assertFiniteIntegerAtLeastZero(misses, 'misses')
  assertFiniteIntegerAtLeastZero(missTolerance, 'missTolerance')
  if (missMoneyPenalty !== undefined) {
    assertFiniteNumberAtLeastZero(missMoneyPenalty, 'missMoneyPenalty')
  }

  const excessMisses = Math.max(0, misses - missTolerance)
  return {
    excessMisses,
    penalty: excessMisses * (missMoneyPenalty ?? 0)
  }
}

/**
 * Adds performance miss penalties into the displayed post-gig expense breakdown.
 *
 * @param params - Financial report plus miss-penalty settings.
 * @returns Financial report with a performance-penalty expense line when applicable.
 */
export const applyPostGigPerformancePenalty = ({
  financials,
  misses = 0,
  missTolerance,
  missMoneyPenalty
}: {
  financials: PostGigFinancials
  misses?: number
  missTolerance: number
  missMoneyPenalty?: number
}) => {
  const { excessMisses, penalty } = calculateExcessMissMoneyPenalty({
    misses,
    missTolerance,
    missMoneyPenalty
  })

  if (penalty <= 0) return financials

  const newExpensesTotal = financials.expenses.total + penalty

  return {
    ...financials,
    expenses: {
      total: newExpensesTotal,
      breakdown: [
        ...financials.expenses.breakdown,
        {
          labelKey: 'economy:gigExpenses.performancePenalty.label',
          value: penalty,
          detailKey: 'economy:gigExpenses.performancePenalty.detail',
          detailParams: { misses: excessMisses }
        }
      ]
    },
    net: financials.income.total - newExpensesTotal
  }
}

/**
 * Calculates post-gig player stat changes for money and fame.
 *
 * - `params.player` - Current player state.
 * - `params.perfScore` - Gig performance score (0–100).
 * - `params.financials` - Post-gig financial breakdown.
 * - `params.misses` - Total missed notes.
 * - `params.calculateFameGain` - Applies diminishing returns to raw fame gain.
 * - `params.calculateFameLevel` - Maps total fame to a fame level.
 * - `params.clampPlayerFame` - Clamps fame to valid range.
 * - `params.clampPlayerMoney` - Clamps money to valid range.
 * - `params.BALANCE_CONSTANTS` - Shared balance tuning values.
 * @param params - Post-gig continuation inputs and helper functions.
 * @returns Updated money, fame, and fame level.
 */
export const calculateContinueStats = ({
  player,
  perfScore,
  financials,
  misses,
  calculateFameGain,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney,
  BALANCE_CONSTANTS
}: {
  player: GameState['player']
  perfScore: number
  financials: PostGigFinancials
  misses?: number
  calculateFameGain: (a: number, b: number, c: number) => number
  calculateFameLevel: (fame: number) => number
  clampPlayerFame: (n: number) => number
  clampPlayerMoney: (n: number) => number
  BALANCE_CONSTANTS: typeof import('../gameState').BALANCE_CONSTANTS
}) => {
  const prevFame = player.fame ?? 0

  let finalFameGain = -BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG
  if (perfScore >= 31) {
    const rawFameGain = calculateGigFameReward(perfScore)
    finalFameGain = calculateFameGain(
      rawFameGain,
      prevFame,
      BALANCE_CONSTANTS.MAX_FAME_GAIN
    )
  } else {
    // Progressive miss-penalty on bad gigs
    const missCount = misses ?? 0
    if (missCount > BALANCE_CONSTANTS.MISS_TOLERANCE) {
      const excessMisses = missCount - BALANCE_CONSTANTS.MISS_TOLERANCE
      const missPenalty = Math.round(
        excessMisses * BALANCE_CONSTANTS.MISS_PENALTY_RATE
      )
      finalFameGain -= missPenalty
    }
  }

  const prevMoney = player.money ?? 0
  const newMoney = clampPlayerMoney(prevMoney + financials.net)
  const newFame = clampPlayerFame(prevFame + finalFameGain)

  return {
    newMoney,
    newFame,
    fameLevel: calculateFameLevel(newFame)
  }
}
/**
 * Converts raw rhythm score into the clamped post-gig performance score.
 *
 * @param rawScore - Raw rhythm-game score.
 * @returns Post-gig performance score clamped to the display range.
 */
export const calculatePerformanceScore = (rawScore: number): number => {
  return Math.min(
    PERF_SCORE_MAX,
    Math.max(PERF_SCORE_MIN, rawScore / PERF_SCORE_SCALER)
  )
}
