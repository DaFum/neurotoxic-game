import { secureRandom } from './crypto.js'

/**
 * Returns a random subset of an array of a specific size.
 * Uses a partial Fisher-Yates shuffle to only shuffle the required number of elements,
 * resulting in O(count) time complexity rather than O(N).
 *
 * @param {Array} arr - The array to sample from.
 * @param {number} count - The number of items to pick.
 * @param {Function} [rng=secureRandom] - A random number generator function.
 * @returns {Array} An array containing the sampled items.
 */
export const pickRandomSubset = (arr, count, rng = secureRandom) => {
  if (!arr || arr.length === 0) return []
  const n = arr.length
  const k = Math.min(count, n)

  if (k === 0) return []

  // Create a copy so we don't mutate the original array
  const shuffled = [...arr]

  // Partial Fisher-Yates: only swap k times
  for (let i = n - 1; i > n - 1 - k; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // The selected elements are at the end of the array
  return shuffled.slice(n - k)
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @param {Function} [rng=secureRandom] - A random number generator function.
 * @returns {Array} The shuffled array.
 */
export const shuffleArray = (array, rng = secureRandom) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
