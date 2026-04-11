// TODO: Review this file
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
  const countInt = Math.floor(count)

  if (!Number.isFinite(countInt)) return []
  const k = Math.min(countInt, n)

  if (k <= 0) return []

  // Fast-path: pick 1 element without array copy
  if (k === 1) {
    return [arr[Math.floor(rng() * n)]]
  }

  // Fast-path: pick 2 elements without array copy
  if (k === 2) {
    const j1 = Math.floor(rng() * n)
    const j2 = Math.floor(rng() * (n - 1))
    return [j2 === j1 ? arr[n - 1] : arr[j2], arr[j1]]
  }

  // Sparse Fisher-Yates shuffle using Map to avoid O(n) copy for small k relative to n
  if (k < n / 4) {
    const result = new Array(k)
    const swaps = new Map()
    for (let i = 0; i < k; i++) {
      const targetIdx = n - 1 - i
      const j = Math.floor(rng() * (targetIdx + 1))

      const valTarget = swaps.has(targetIdx)
        ? swaps.get(targetIdx)
        : arr[targetIdx]
      const valJ = swaps.has(j) ? swaps.get(j) : arr[j]

      // Place the chosen element at the correct spot in the result
      result[k - 1 - i] = valJ
      // Record what took its place in the remaining pool
      swaps.set(j, valTarget)
    }
    return result
  }

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
