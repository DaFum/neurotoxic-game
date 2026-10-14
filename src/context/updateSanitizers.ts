import type { BandState, PlayerState } from '../types'
import { hasForbiddenKeysDeep, isLooseRecord } from '../utils/objectUtils'
import {
  calculateFameLevel,
  clampBandHarmony,
  clampBandStress,
  clampLuck,
  clampNonNegative,
  clampPercent,
  clampPlayerFame,
  clampPlayerMoney,
  clampToNonNegativeInt,
  isFiniteNumber
} from '../utils/gameState'

/** Numeric field rules shared by partial updates and persisted-state recovery. */
export const PLAYER_NUMERIC_NORMALIZERS = {
  money: clampPlayerMoney,
  fame: clampPlayerFame,
  tutorialStep: (value: number): number => Math.max(-1, Math.floor(value)),
  score: clampNonNegative,
  eventsTriggeredToday: clampToNonNegativeInt,
  totalTravels: clampToNonNegativeInt,
  clinicVisits: clampToNonNegativeInt,
  passiveFollowers: clampToNonNegativeInt
} satisfies Record<string, (value: number) => number>

/** Band modifiers retain fractional effects; only inventory capacity is integral. */
export const BAND_NUMERIC_NORMALIZERS = {
  harmony: clampBandHarmony,
  inventorySlots: clampToNonNegativeInt,
  luck: clampLuck,
  stress: clampBandStress,
  tempo: clampPercent,
  style: clampNonNegative,
  crit: clampNonNegative,
  tourSuccess: (value: number): number => value,
  gigModifier: (value: number): number => value,
  practiceGain: (value: number): number => value,
  affinity: (value: number): number => value,
  crowdControl: (value: number): number => value
} satisfies Record<string, (value: number) => number>

const normalizeNumericPatch = (
  raw: Record<string, unknown>,
  normalizers: Record<string, (value: number) => number>
): Record<string, unknown> => {
  const result = { ...raw }
  for (const [key, normalize] of Object.entries(normalizers)) {
    if (!Object.hasOwn(raw, key)) continue
    const value = raw[key]
    if (isFiniteNumber(value)) result[key] = normalize(value)
    else delete result[key]
  }
  return result
}

/** Drops malformed numeric fields without resetting omitted state fields. */
export const sanitizePlayerUpdates = (
  updates: Partial<PlayerState>
): Partial<PlayerState> => {
  // Preserve hostile input for the reducer's identical-reference rejection,
  // without invoking an accessor in the creator.
  if (!isLooseRecord(updates) || hasForbiddenKeysDeep(updates)) return updates
  const result = normalizeNumericPatch(updates, PLAYER_NUMERIC_NORMALIZERS)
  if (isFiniteNumber(result.fame))
    result.fameLevel = calculateFameLevel(result.fame)
  else delete result.fameLevel
  return result as Partial<PlayerState>
}

/** Normalizes numeric band patches and preserves required container shapes. */
export const sanitizeBandUpdates = (
  updates: Partial<BandState>
): Partial<BandState> => {
  if (!isLooseRecord(updates) || hasForbiddenKeysDeep(updates)) return updates
  const result = normalizeNumericPatch(updates, BAND_NUMERIC_NORMALIZERS)
  for (const key of ['members', 'activeContrabandEffects', 'banterEvents']) {
    if (Object.hasOwn(result, key) && !Array.isArray(result[key]))
      delete result[key]
  }
  for (const key of ['inventory', 'stash', 'performance', 'merchPrices']) {
    if (Object.hasOwn(result, key) && !isLooseRecord(result[key]))
      delete result[key]
  }
  if (isLooseRecord(result.performance)) {
    const performance: Record<string, number> = {}
    for (const key of ['guitarDifficulty', 'drumMultiplier', 'crowdDecay']) {
      const value = result.performance[key]
      if (Object.hasOwn(result.performance, key) && isFiniteNumber(value))
        performance[key] = value
    }
    result.performance = performance
  }
  return result as Partial<BandState>
}
