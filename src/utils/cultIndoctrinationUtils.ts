import type {
  SocialState,
  PlayerState,
  BandState,
  CultIndoctrinationConfig
} from '../types'
import { isFiniteNumber } from './gameState'

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
  if (
    currentDay === undefined ||
    !social ||
    social.lastCultIndoctrinationDay == null
  ) {
    return false
  }
  return social.lastCultIndoctrinationDay === currentDay
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
  if (!isFiniteNumber(player.money) || player.money < 0) return false
  if (!isFiniteNumber(band.harmony) || band.harmony < 1 || band.harmony > 100)
    return false

  if (checkHasIndoctrinatedToday(social, player.day)) return false
  if (
    !isFiniteNumber(social.zealotry) ||
    social.zealotry < config.REQUIRED_ZEALOTRY
  )
    return false
  if (player.money < config.COST) return false
  if (band.harmony < config.HARMONY_COST) return false
  return true
}
