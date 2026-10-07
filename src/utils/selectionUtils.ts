import { secureRandom } from './crypto'
import { finiteNumberOr } from './finiteNumber'

const getFiniteRandomRoll = (rng: () => number): number =>
  finiteNumberOr(rng(), 0)

/**
 * Computes a random index into an array using the provided RNG, clamped to
 * the valid index range so an out-of-range RNG (e.g. returning exactly 1)
 * cannot produce an out-of-bounds index.
 *
 * @param items - The list to index into. Callers must guard empty lists; for
 * an empty list this returns `0`.
 * @param rng - Random number generator returning [0, 1).
 * @returns A clamped index in `[0, items.length - 1]`.
 */
export const pickIndex = (
  items: readonly unknown[],
  rng: () => number
): number => {
  return pickBoundedIndex(items.length, rng)
}

/**
 * Computes a random integer in `[offset, offset + span - 1]` using the
 * provided RNG, clamped like {@link pickIndex} so an out-of-range RNG value
 * (e.g. returning exactly 1) cannot exceed the range. Callers must guard
 * `span <= 0`; this returns `offset` in that case.
 *
 * @param span - Size of the index range.
 * @param rng - Random number generator returning [0, 1).
 * @param offset - Start of the range. Defaults to `0`.
 * @returns A clamped integer in `[offset, offset + span - 1]`.
 */
export const pickBoundedIndex = (
  span: number,
  rng: () => number,
  offset: number = 0
): number => {
  const roll = getFiniteRandomRoll(rng)
  return offset + Math.max(0, Math.min(span - 1, Math.floor(roll * span)))
}

/** A weighted candidate for {@link pickWeighted}. */
export interface WeightedEntry<T> {
  value: T
  weight: number
}

/**
 * Picks one entry by weight with a single RNG call.
 *
 * Boundary convention: the roll is scaled to `[0, totalWeight)` and entry `i`
 * owns the half-open interval `[sum(w[0..i-1]), sum(w[0..i]))`, so a
 * zero-weight entry is never picked. Negative or non-finite weights count as
 * `0`. The RNG is consumed exactly once even when nothing is pickable, so
 * seeded streams advance identically regardless of the outcome.
 *
 * @typeParam T - Entry value type.
 * @param entries - Candidates in stable order; the order defines the intervals.
 * @param rng - Random number generator returning [0, 1).
 * @returns The picked value, or `null` when there is no positive weight or
 * the roll falls beyond the total (an out-of-range RNG). Callers choose their
 * own fallback.
 */
export const pickWeighted = <T>(
  entries: readonly WeightedEntry<T>[],
  rng: () => number
): T | null => {
  const roll = getFiniteRandomRoll(rng)
  const weights = entries.map(entry =>
    Math.max(0, finiteNumberOr(entry.weight, 0))
  )
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total <= 0) return null

  let cursor = roll * total
  for (let i = 0; i < entries.length; i++) {
    cursor -= weights[i] ?? 0
    if (cursor < 0) return entries[i]?.value ?? null
  }
  return null
}

/**
 * Selects a random item from an array using the provided RNG.
 * @typeParam T - Item type.
 * @param items - The list of items to choose from.
 * @param rng - Random number generator returning [0, 1). Defaults to `secureRandom`.
 * @returns The selected item, or null when the list is empty.
 */
export const selectRandomItem = <T>(
  items: readonly T[] | null | undefined,
  rng: () => number = secureRandom
): T | null => {
  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  const list = items as readonly T[]
  return list[pickIndex(list, rng)] ?? null
}
