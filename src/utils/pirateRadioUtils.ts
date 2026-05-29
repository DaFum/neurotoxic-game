import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils'
import { isFiniteNumber } from './finiteNumber'

export const checkHasBroadcastedToday = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  playerDay: number
): boolean => {
  if (!social || !Number.isFinite(playerDay)) return false
  return social.lastPirateBroadcastDay === playerDay
}

export const validatePirateBroadcast = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  player: { day?: unknown; money?: unknown } | null | undefined,
  band: { harmony?: unknown } | null | undefined,
  config: { COST?: unknown; HARMONY_COST?: unknown } | null | undefined
): boolean => {
  if (!social || !player || !band || !config) return false

  const day = isFiniteNumber(player.day) ? player.day : null
  const money = isFiniteNumber(player.money) ? player.money : null
  const harmony = isFiniteNumber(band.harmony) ? band.harmony : null
  const cost = isFiniteNumber(config.COST) ? config.COST : null
  const harmonyCost = isFiniteNumber(config.HARMONY_COST)
    ? config.HARMONY_COST
    : null
  if (
    day === null ||
    money === null ||
    harmony === null ||
    cost === null ||
    harmonyCost === null
  ) {
    return false
  }
  const hasBroadcastedToday = checkHasBroadcastedToday(social, day)

  const currentMoney = clampPlayerMoney(money)
  const currentHarmony = clampBandHarmony(harmony)

  return (
    !hasBroadcastedToday &&
    currentMoney >= cost &&
    currentHarmony >= harmonyCost
  )
}
