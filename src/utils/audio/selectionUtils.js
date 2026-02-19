/**
 * Selects a random item from an array using the provided RNG.
 * @template T
 * @param {T[]} items - The list of items to choose from.
 * @param {() => number} [rng=Math.random] - Random number generator returning [0, 1).
 * @returns {T | null} The selected item, or null when the list is empty.
 */
export const selectRandomItem = (items, rng = Math.random) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null
  }

  const rawIndex = Math.floor(rng() * items.length)
  const safeIndex = Math.min(Math.max(0, rawIndex), items.length - 1)
  return items[safeIndex]
}
