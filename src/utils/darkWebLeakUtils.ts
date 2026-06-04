import type {
  SocialState,
  PlayerState,
  BandState,
  DarkWebLeakConfig
} from '../types'
import { isFiniteNumber } from './finiteNumber'

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
  return social?.lastDarkWebLeakDay === currentDay
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
  if (!isFiniteNumber(player.money) || player.money < 0) return false
  if (!isFiniteNumber(band.harmony) || band.harmony < 1 || band.harmony > 100)
    return false

  if (checkHasLeakedToday(social, player.day)) return false
  if (
    !isFiniteNumber(social.controversyLevel) ||
    social.controversyLevel < config.REQUIRED_CONTROVERSY
  )
    return false
  if (player.money < config.COST) return false
  if (band.harmony < config.HARMONY_COST) return false
  return true
}
