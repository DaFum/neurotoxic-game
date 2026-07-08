import { secureRandom } from './crypto'

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
): number =>
  Math.max(0, Math.min(items.length - 1, Math.floor(rng() * items.length)))

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
