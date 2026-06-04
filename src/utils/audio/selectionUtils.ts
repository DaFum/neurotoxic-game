import { secureRandom } from '../crypto'

/**
 * Selects a random item from an array using the provided RNG.
 * @typeParam T - Item type.
 * @param items - The list of items to choose from.
 * @param rng - Random number generator returning [0, 1). Defaults to `secureRandom`.
 * @returns The selected item, or null when the list is empty.
 */
export const selectRandomItem = <T>(
  items: T[] | null | undefined,
  rng: () => number = secureRandom
): T | null => {
  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  const rawIndex = Math.floor(rng() * items.length)
  const safeIndex = Math.min(Math.max(0, rawIndex), items.length - 1)
  return items[safeIndex] ?? null
}
