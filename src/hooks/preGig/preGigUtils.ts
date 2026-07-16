import { finiteNumberOr } from '../../utils/gameState'

/**
 * Represents the available minigame types that can be played.
 */
export type Minigame = 'roadie' | 'kabelsalat' | 'amp'

let lastMinigameFallback: Minigame | null = null

/**
 * Determines whether a given value is a valid minigame identifier.
 *
 * @param value - The value to check
 * @returns A boolean indicating whether the value is a valid minigame identifier
 */
export const isMinigame = (value: unknown): value is Minigame => {
  return value === 'roadie' || value === 'kabelsalat' || value === 'amp'
}

/**
 * Clears the stored fallback minigame identifier.
 *
 * @remarks
 * This function is used to reset the fallback state when it is no longer needed.
 */
export const resetLastMinigameFallback = (): void => {
  lastMinigameFallback = null
}

/**
 * Retrieves the previously stored fallback minigame identifier.
 *
 * @returns The stored fallback minigame identifier, or null if none is set
 */
export const getLastMinigameFallback = (): Minigame | null => {
  return lastMinigameFallback
}

/**
 * Stores a fallback minigame identifier for later retrieval.
 *
 * @param minigame - The minigame identifier to store as a fallback
 */
export const setLastMinigameFallback = (minigame: Minigame): void => {
  lastMinigameFallback = minigame
}

const BAND_MEETING_COST = 50

/**
 * Calculates the total cost of a band meeting based on the current training cost multiplier.
 *
 * @param trainingCostMultiplier - The multiplier applied to the base band meeting cost
 * @returns The calculated total cost for the band meeting
 */
export const resolveBandMeetingCost = (
  trainingCostMultiplier: unknown
): number => {
  const safeMultiplier = Math.max(0, finiteNumberOr(trainingCostMultiplier, 1))
  return Math.ceil(Math.max(0, BAND_MEETING_COST * safeMultiplier))
}
