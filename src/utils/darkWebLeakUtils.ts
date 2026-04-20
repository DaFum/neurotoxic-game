import { SocialState, PlayerState, BandState } from '../types/game'

export const checkHasLeakedToday = (
  social: Partial<SocialState> | undefined | null,
  currentDay: number | undefined
) => {
  return social?.lastDarkWebLeakDay === currentDay
}

export const validateDarkWebLeak = (
  social: Partial<SocialState> | undefined | null,
  player: Partial<PlayerState> | undefined | null,
  band: Partial<BandState> | undefined | null,
  config: any
) => {
  if (checkHasLeakedToday(social, player?.day)) return false
  if ((social?.controversyLevel ?? 0) < config.REQUIRED_CONTROVERSY)
    return false
  if ((player?.money ?? 0) < config.COST) return false
  if ((band?.harmony ?? 0) < config.HARMONY_COST) return false
  return true
}
