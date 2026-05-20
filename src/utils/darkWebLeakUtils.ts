import type {
  SocialState,
  PlayerState,
  BandState,
  DarkWebLeakConfig
} from '../types'

export const checkHasLeakedToday = (
  social: Partial<SocialState> | undefined | null,
  currentDay: number | undefined
) => {
  return social?.lastDarkWebLeakDay === currentDay
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

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
