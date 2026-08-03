import { clampBandHarmony, clampPlayerMoney } from './gameState'
import { isFiniteNumber } from './finiteNumber'
import type {
  BandState,
  PlayerState,
  SocialState,
  ZealotryActionConfig
} from '../types'

/**
 * Social-state fields recording the day a zealotry action last ran.
 */
export type ZealotryActionDayField =
  'lastPirateBroadcastDay' | 'lastDarkWebLeakDay' | 'lastCultIndoctrinationDay'

/**
 * Static description of one once-per-day zealotry social action.
 *
 * @remarks
 * Replaces the per-action `*Utils` adapters: the day field, optional
 * eligibility threshold, logging labels, and success key are the only things
 * that differ between pirate radio, the dark-web leak, and cult indoctrination.
 */
export type ZealotryActionDescriptor = {
  /** Social-state field holding the day this action last ran. */
  dayField: ZealotryActionDayField
  /** Optional social-state gate that must reach `thresholdRequired`. */
  thresholdField?: 'controversyLevel' | 'zealotry'
  /** Minimum value of `thresholdField` required to run. */
  thresholdRequired?: number
  config: ZealotryActionConfig
  loggerScope: string
  validationFailureMessage: string
  successMessageKey: string
}

type DailySocialActionThreshold = {
  value: unknown
  required: unknown
}

type DailySocialActionEligibilityInput = {
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
const hasDailySocialActionRunToday = (
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
const validateDailySocialActionEligibility = ({
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

/**
 * Checks whether a zealotry social action has already run on the current day.
 *
 * @param social - Social state slice holding the last-run day fields.
 * @param dayField - Field recording when the action last ran.
 * @param currentDay - Current player day.
 * @returns True when the stored day matches the current day.
 */
export const hasZealotryActionRunToday = (
  social: Partial<SocialState> | null | undefined,
  dayField: ZealotryActionDayField,
  currentDay: unknown
): boolean => {
  if (!social) return false
  return hasDailySocialActionRunToday(social[dayField], currentDay)
}

/**
 * Validates whether a zealotry social action can run right now.
 *
 * @param social - Social state slice with run history and threshold values.
 * @param player - Player state slice containing money and current day.
 * @param band - Band state slice containing harmony.
 * @param descriptor - Static description of the action being validated.
 * @returns True when the action has not run today and every requirement is met.
 */
export const validateZealotryAction = (
  social: Partial<SocialState> | null | undefined,
  player: Partial<PlayerState> | null | undefined,
  band: Partial<BandState> | null | undefined,
  descriptor: ZealotryActionDescriptor
): boolean => {
  if (!social || !player || !band) return false
  const { dayField, thresholdField, thresholdRequired, config } = descriptor
  return validateDailySocialActionEligibility({
    lastActionDay: social[dayField],
    currentDay: player.day,
    money: player.money,
    harmony: band.harmony,
    cost: config.COST,
    harmonyCost: config.HARMONY_COST,
    threshold: thresholdField
      ? { value: social[thresholdField], required: thresholdRequired }
      : undefined
  })
}
