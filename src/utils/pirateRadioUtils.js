export const checkHasBroadcastedToday = (social, playerDay) => {
  if (!social || typeof playerDay !== 'number') return false
  return social.lastPirateBroadcastDay === playerDay
}

export const validatePirateBroadcast = (social, player, band, config) => {
  if (!social || !player || !band || !config) return false

  const hasBroadcastedToday = checkHasBroadcastedToday(social, player.day)

  const currentMoney = typeof player.money === 'number' ? player.money : 0
  const currentHarmony = typeof band.harmony === 'number' ? band.harmony : 0

  return (
    !hasBroadcastedToday &&
    config.COST !== undefined &&
    config.HARMONY_COST !== undefined &&
    Math.max(0, currentMoney) >= config.COST &&
    Math.max(0, currentHarmony) >= config.HARMONY_COST
  )
}
