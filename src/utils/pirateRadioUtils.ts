import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils'

export const checkHasBroadcastedToday = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  playerDay: number
): boolean => {
  if (!social || typeof playerDay !== 'number') return false
  return social.lastPirateBroadcastDay === playerDay
}

export const validatePirateBroadcast = (
  social: { lastPirateBroadcastDay?: unknown } | null | undefined,
  player: { day?: unknown; money?: unknown } | null | undefined,
  band: { harmony?: unknown } | null | undefined,
  config: { COST?: unknown; HARMONY_COST?: unknown } | null | undefined
): boolean => {
  if (!social || !player || !band || !config) return false

  const day = typeof player.day === 'number' ? player.day : 0
  const hasBroadcastedToday = checkHasBroadcastedToday(social, day)

  const currentMoney = clampPlayerMoney(
    typeof player.money === 'number' ? player.money : 0
  )
  const currentHarmony = clampBandHarmony(
    typeof band.harmony === 'number' ? band.harmony : 1
  )

  return (
    !hasBroadcastedToday &&
    typeof config.COST === 'number' &&
    typeof config.HARMONY_COST === 'number' &&
    currentMoney >= config.COST &&
    currentHarmony >= config.HARMONY_COST
  )
}
