import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils'

export const checkHasBroadcastedToday = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  playerDay: number
): boolean => {
  if (!social || !Number.isFinite(playerDay)) return false
  return social.lastPirateBroadcastDay === playerDay
}

const readFiniteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

export const validatePirateBroadcast = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  player: { day?: unknown; money?: unknown } | null | undefined,
  band: { harmony?: unknown } | null | undefined,
  config: { COST?: unknown; HARMONY_COST?: unknown } | null | undefined
): boolean => {
  if (!social || !player || !band || !config) return false

  const day = readFiniteNumber(player.day)
  const money = readFiniteNumber(player.money)
  const harmony = readFiniteNumber(band.harmony)
  const cost = readFiniteNumber(config.COST)
  const harmonyCost = readFiniteNumber(config.HARMONY_COST)
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
