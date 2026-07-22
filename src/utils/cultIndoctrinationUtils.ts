import type {
  SocialState,
  PlayerState,
  BandState,
  CultIndoctrinationConfig
} from '../types'
import {
  hasDailySocialActionRunToday,
  validateDailySocialActionEligibility
} from './dailySocialActionUtils'

/**
 * Checks whether a cult indoctrination has already run on the current day.
 *
 * @param social - Social state slice containing the last indoctrination day.
 * @param currentDay - Current player day.
 * @returns True when the stored indoctrination day matches the current day.
 */
export const checkHasIndoctrinatedToday = (
  social: Partial<SocialState> | undefined | null,
  currentDay: number | undefined
) => {
  if (!social) return false
  return hasDailySocialActionRunToday(
    social.lastCultIndoctrinationDay,
    currentDay
  )
}

/**
 * Validates whether the player can trigger a cult indoctrination.
 *
 * @param social - Social state slice containing zealotry and indoctrination history.
 * @param player - Player state slice containing money and current day.
 * @param band - Band state slice containing harmony.
 * @param config - Indoctrination thresholds and costs.
 * @returns True when requirements are met and the indoctrination has not run today.
 */
export const validateCultIndoctrination = (
  social: Partial<SocialState> | undefined | null,
  player: Partial<PlayerState> | undefined | null,
  band: Partial<BandState> | undefined | null,
  config: CultIndoctrinationConfig
) => {
  if (!social || !player || !band) return false
  return validateDailySocialActionEligibility({
    lastActionDay: social.lastCultIndoctrinationDay,
    currentDay: player.day,
    money: player.money,
    harmony: band.harmony,
    cost: config.COST,
    harmonyCost: config.HARMONY_COST,
    threshold: {
      value: social.zealotry,
      required: config.REQUIRED_ZEALOTRY
    }
  })
}
