export const checkHasBroadcastedToday = (social, playerDay) => {
  if (!social || typeof playerDay !== 'number') return false
  return social.lastPirateBroadcastDay === playerDay
}

export const validatePirateBroadcast = (social, player, band, config) => {
  if (!social || !player || !band || !config) return false

  const hasBroadcastedToday = checkHasBroadcastedToday(social, player.day)

  return (
    !hasBroadcastedToday &&
    config.COST !== undefined &&
    config.HARMONY_COST !== undefined &&
    (player.money || 0) >= config.COST &&
    (band.harmony || 0) >= config.HARMONY_COST
  )
}
