import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils'

export const checkHasBroadcastedToday = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  playerDay: number
): boolean => {
  if (!social || !Number.isFinite(playerDay)) return false
  return social.lastPirateBroadcastDay === playerDay
}

const requireFiniteNumber = (value: unknown, label: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`)
  }
  return value
}

export const validatePirateBroadcast = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  player: { day?: unknown; money?: unknown } | null | undefined,
  band: { harmony?: unknown } | null | undefined,
  config: { COST?: unknown; HARMONY_COST?: unknown } | null | undefined
): boolean => {
  if (!social || !player || !band || !config) return false

  const day = requireFiniteNumber(player.day, 'player.day')
  const money = requireFiniteNumber(player.money, 'player.money')
  const harmony = requireFiniteNumber(band.harmony, 'band.harmony')
  const cost = requireFiniteNumber(config.COST, 'config.COST')
  const harmonyCost = requireFiniteNumber(
    config.HARMONY_COST,
    'config.HARMONY_COST'
  )
  const hasBroadcastedToday = checkHasBroadcastedToday(social, day)

  const currentMoney = clampPlayerMoney(money)
  const currentHarmony = clampBandHarmony(harmony)

  return (
    !hasBroadcastedToday &&
    currentMoney >= cost &&
    currentHarmony >= harmonyCost
  )
}
