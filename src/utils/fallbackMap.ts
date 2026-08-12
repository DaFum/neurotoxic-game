import fallbackMapData from '../data/fallbackMap.json'
import { validateGeneratedMap } from './mapValidation'
import type { MapValidationResult } from './mapValidation'
import type { GameMap } from '../types'

/**
 * Validates and returns the committed fallback map.
 *
 * @returns The fallback map when it satisfies the map contract, or `null` when
 * the committed artifact itself is invalid — in which case the caller must
 * fall back to the menu.
 */
export const loadFallbackMap = (): GameMap | null => {
  const result = validateFallbackMap()
  if (!result.success) return null
  return result.data
}

/**
 * Runs the committed fallback map through the generated-map validator.
 *
 * @returns The validation result, exposed so CI can assert on it directly.
 */
export const validateFallbackMap = (): MapValidationResult =>
  validateGeneratedMap(fallbackMapData)
