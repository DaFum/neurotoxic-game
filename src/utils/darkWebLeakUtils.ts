export const checkHasLeakedToday = (social: any, currentDay: number) => {
  return social?.lastDarkWebLeakDay === currentDay
}

export const validateDarkWebLeak = (
  social: any,
  player: any,
  band: any,
  config: any
) => {
  if (social?.controversyLevel < config.REQUIRED_CONTROVERSY) return false
  if (player?.money < config.COST) return false
  if (band?.harmony < config.HARMONY_COST) return false
  return true
}
