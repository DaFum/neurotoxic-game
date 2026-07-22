import { clampBandHarmony, clampPlayerMoney } from './gameState'
import { isFiniteNumber } from './finiteNumber'

export type DailySocialActionThreshold = {
  value: unknown
  required: unknown
}

export type DailySocialActionEligibilityInput = {
  lastActionDay: unknown
  currentDay: unknown
  money: unknown
  harmony: unknown
  cost: unknown
  harmonyCost: unknown
  threshold?: DailySocialActionThreshold
}

/**
 * Checks whether a once-per-day social action already ran today.
 */
export const hasDailySocialActionRunToday = (
  lastActionDay: unknown,
  currentDay: unknown
): boolean => {
  if (!isFiniteNumber(currentDay) || !isFiniteNumber(lastActionDay)) {
    return false
  }
  return lastActionDay === currentDay
}

/**
 * Shared eligibility check for once-per-day social actions that spend money and harmony.
 */
export const validateDailySocialActionEligibility = ({
  lastActionDay,
  currentDay,
  money,
  harmony,
  cost,
  harmonyCost,
  threshold
}: DailySocialActionEligibilityInput): boolean => {
  if (
    !isFiniteNumber(currentDay) ||
    !isFiniteNumber(money) ||
    !isFiniteNumber(harmony) ||
    !isFiniteNumber(cost) ||
    !isFiniteNumber(harmonyCost)
  ) {
    return false
  }

  if (hasDailySocialActionRunToday(lastActionDay, currentDay)) {
    return false
  }

  if (threshold) {
    if (
      !isFiniteNumber(threshold.value) ||
      !isFiniteNumber(threshold.required) ||
      threshold.value < threshold.required
    ) {
      return false
    }
  }

  return (
    clampPlayerMoney(money) >= cost && clampBandHarmony(harmony) >= harmonyCost
  )
}
