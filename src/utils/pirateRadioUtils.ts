import {
  hasDailySocialActionRunToday,
  validateDailySocialActionEligibility
} from './dailySocialActionUtils'

/**
 * Checks whether the pirate broadcast action has already run today.
 *
 * @param social - Social state slice containing the last broadcast day.
 * @param playerDay - Current day index; a non-finite value makes the check return false.
 * @returns True when the stored broadcast day matches the current day.
 */
export const checkHasBroadcastedToday = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  playerDay: number
): boolean => {
  if (!social) return false
  return hasDailySocialActionRunToday(social.lastPirateBroadcastDay, playerDay)
}

/**
 * Validates whether the player can perform a pirate broadcast action.
 *
 * @param social - Social state slice containing broadcast history.
 * @param player - Player state slice containing current day and money.
 * @param band - Band state slice containing harmony.
 * @param config - Broadcast cost and harmony-cost configuration.
 * @returns True when the action has not run today and costs can be paid.
 */
export const validatePirateBroadcast = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  player: { day?: unknown; money?: unknown } | null | undefined,
  band: { harmony?: unknown } | null | undefined,
  config: { COST?: unknown; HARMONY_COST?: unknown } | null | undefined
): boolean => {
  if (!social || !player || !band || !config) return false
  return validateDailySocialActionEligibility({
    lastActionDay: social.lastPirateBroadcastDay,
    currentDay: player.day,
    money: player.money,
    harmony: band.harmony,
    cost: config.COST,
    harmonyCost: config.HARMONY_COST
  })
}
