import { finiteNumberOr } from '../../utils/gameState'

export type Minigame = 'roadie' | 'kabelsalat' | 'amp'

let lastMinigameFallback: Minigame | null = null

export const isMinigame = (value: unknown): value is Minigame => {
  return value === 'roadie' || value === 'kabelsalat' || value === 'amp'
}

export const resetLastMinigameFallback = (): void => {
  lastMinigameFallback = null
}

export const getLastMinigameFallback = (): Minigame | null => {
  return lastMinigameFallback
}

export const setLastMinigameFallback = (minigame: Minigame): void => {
  lastMinigameFallback = minigame
}

const BAND_MEETING_COST = 50

export const resolveBandMeetingCost = (trainingCostMultiplier: unknown): number => {
  const safeMultiplier = Math.max(0, finiteNumberOr(trainingCostMultiplier, 1))
  return Math.ceil(Math.max(0, BAND_MEETING_COST * safeMultiplier))
}
