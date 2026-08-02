import fallbackMapData from '../data/fallbackMap.json'
import { validateGeneratedMap } from './mapValidation'
import type { MapValidationResult } from './mapValidation'
import type { GameMap } from '../types'

/**
 * Committed template map used when procedural generation cannot produce a
 * valid map.
 *
 * @remarks
 * Deliberately a checked-in artifact rather than a second generator: the
 * recovery path must not share a code path with the thing that just failed.
 * `tests/node/fallbackMap.test.js` runs it through the same contract as
 * generated maps so it cannot rot silently.
 */
export const FALLBACK_MAP: unknown = fallbackMapData

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
  return fallbackMapData as unknown as GameMap
}

/**
 * Runs the committed fallback map through the generated-map validator.
 *
 * @returns The validation result, exposed so CI can assert on it directly.
 */
export const validateFallbackMap = (): MapValidationResult =>
  validateGeneratedMap(fallbackMapData)
