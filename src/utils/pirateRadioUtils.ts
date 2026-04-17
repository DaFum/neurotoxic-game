import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils'

export const checkHasBroadcastedToday = (
  social: any,
  playerDay: number
): boolean => {
  if (!social || typeof playerDay !== 'number') return false
  return social.lastPirateBroadcastDay === playerDay
}

export const validatePirateBroadcast = (
  social: any,
  player: any,
  band: any,
  config: any
): boolean => {
  if (!social || !player || !band || !config) return false

  const hasBroadcastedToday = checkHasBroadcastedToday(social, player.day)

  const currentMoney = clampPlayerMoney(player.money)
  const currentHarmony = clampBandHarmony(band.harmony)

  return (
    !hasBroadcastedToday &&
    config.COST !== undefined &&
    config.HARMONY_COST !== undefined &&
    currentMoney >= config.COST &&
    currentHarmony >= config.HARMONY_COST
  )
}
