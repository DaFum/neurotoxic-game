import { StateError } from '../errorHandler'
import { pickBoundedIndex, pickIndex } from '../selectionUtils'

/**
 * Picks a random subset of items from an array.
 * @param arr - The source array.
 * @param count - The number of items to pick.
 * @param random - A function returning a float between 0 and 1.
 * @returns A new array with the selected items.
 */
export function pickRandomSubset<T>(
  arr: readonly T[],
  count: number,
  random: () => number
): T[] {
  const n = arr.length
  const countInt = Math.floor(count)
  if (!Number.isFinite(countInt)) return []
  const k = Math.min(countInt, n)
  if (k <= 0) return []

  if (k === 1) {
    const value = arr[pickIndex(arr, random)]
    if (value === undefined) {
      throw new StateError(
        'Sparse array invariant violated in pickRandomSubset(k=1)'
      )
    }
    return [value]
  }

  if (k === 2) {
    const idx1 = pickIndex(arr, random)
    let idx2 = pickBoundedIndex(n - 1, random)
    if (idx2 >= idx1) idx2++
    const first = arr[idx1]
    const second = arr[idx2]
    if (first === undefined || second === undefined) {
      throw new StateError(
        'Sparse array invariant violated in pickRandomSubset(k=2)'
      )
    }
    return [first, second]
  }

  // Sparse Fisher-Yates shuffle using Map to avoid O(n) copy for small k relative to n
  if (k < n / 4) {
    const result: T[] = []
    const swaps = new Map<number, T>()
    for (let i = 0; i < k; i++) {
      const j = pickBoundedIndex(n - i, random, i)

      // Retrieve values, falling back to original array if not swapped
      const valI = swaps.has(i) ? swaps.get(i) : arr[i]
      const valJ = swaps.has(j) ? swaps.get(j) : arr[j]
      if (valI === undefined || valJ === undefined) {
        throw new StateError(
          `Sparse array invariant violated in pickRandomSubset(fisher-yates) at i=${i}, j=${j}`
        )
      }

      result.push(valJ)
      // Since j = i + Math.floor(random() * (n - i)), it is guaranteed that j >= i.
      // Therefore, subsequent iterations will never need to read indices < i again,
      // so we only need to record what value is placed into position j in the swaps Map.
      // We will never need the original value at i again to populate the result array.
      swaps.set(j, valI)
    }
    return result
  }

  // For large k, full shallow copy is more efficient than Map overhead
  const shuffled = [...arr]
  for (let i = 0; i < k; i++) {
    const j = pickBoundedIndex(n - i, random, i)
    const valueI = shuffled[i]
    const valueJ = shuffled[j]
    if (valueI === undefined || valueJ === undefined) {
      throw new StateError(
        `Sparse array invariant violated in pickRandomSubset(shallow-copy) at i=${i}, j=${j}`
      )
    }
    shuffled[i] = valueJ
    shuffled[j] = valueI
  }
  const rawResult = shuffled.slice(0, k)
  const result: T[] = []
  for (let i = 0; i < rawResult.length; i++) {
    const value = rawResult[i]
    if (value === undefined) {
      throw new StateError(
        `Sparse array invariant violated in pickRandomSubset(result-slice) at i=${i}`
      )
    }
    result.push(value)
  }
  return result
}
