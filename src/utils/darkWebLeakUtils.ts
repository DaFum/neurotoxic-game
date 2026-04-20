import type { GameState } from '../types/game'

export const checkHasLeakedToday = (social: GameState['social'], currentDay: number) => {
  return social?.lastDarkWebLeakDay === currentDay
}

export const validateDarkWebLeak = (
  social: GameState['social'],
  player: GameState['player'],
  band: GameState['band'],
  config: { REQUIRED_CONTROVERSY: number; COST: number; HARMONY_COST: number; }
) => {
  if ((social?.controversyLevel ?? 0) < config.REQUIRED_CONTROVERSY) return false
  if ((player?.money ?? 0) < config.COST) return false
  if ((band?.harmony ?? 0) < config.HARMONY_COST) return false
  return true
}
