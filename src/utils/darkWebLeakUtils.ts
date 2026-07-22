import type {
  SocialState,
  PlayerState,
  BandState,
  DarkWebLeakConfig
} from '../types'
import {
  hasDailySocialActionRunToday,
  validateDailySocialActionEligibility
} from './dailySocialActionUtils'

/**
 * Checks whether a dark-web leak has already run on the current day.
 *
 * @param social - Social state slice containing the last leak day.
 * @param currentDay - Current player day.
 * @returns True when the stored leak day matches the current day.
 */
export const checkHasLeakedToday = (
  social: Partial<SocialState> | undefined | null,
  currentDay: number | undefined
) => {
  if (!social) return false
  return hasDailySocialActionRunToday(social.lastDarkWebLeakDay, currentDay)
}

/**
 * Validates whether the player can trigger a dark-web leak.
 *
 * @param social - Social state slice containing controversy and leak history.
 * @param player - Player state slice containing money and current day.
 * @param band - Band state slice containing harmony.
 * @param config - Leak thresholds and costs.
 * @returns True when requirements are met and the leak has not run today.
 */
export const validateDarkWebLeak = (
  social: Partial<SocialState> | undefined | null,
  player: Partial<PlayerState> | undefined | null,
  band: Partial<BandState> | undefined | null,
  config: DarkWebLeakConfig
) => {
  if (!social || !player || !band) return false
  return validateDailySocialActionEligibility({
    lastActionDay: social.lastDarkWebLeakDay,
    currentDay: player.day,
    money: player.money,
    harmony: band.harmony,
    cost: config.COST,
    harmonyCost: config.HARMONY_COST,
    threshold: {
      value: social.controversyLevel,
      required: config.REQUIRED_CONTROVERSY
    }
  })
}
