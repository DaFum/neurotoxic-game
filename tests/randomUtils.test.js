import test from 'node:test'
import assert from 'node:assert/strict'
import { pickRandomSubset } from '../src/utils/randomUtils.js'

test('pickRandomSubset', async t => {
  await t.test(
    'returns an empty array if input array is null or undefined',
    () => {
      assert.deepStrictEqual(pickRandomSubset(null, 1), [])
      assert.deepStrictEqual(pickRandomSubset(undefined, 1), [])
    }
  )

  await t.test('returns an empty array if input array is empty', () => {
    assert.deepStrictEqual(pickRandomSubset([], 1), [])
  })

  await t.test('returns an empty array if count is 0', () => {
    assert.deepStrictEqual(pickRandomSubset([1, 2, 3], 0), [])
  })

  await t.test('picks correct number of elements in happy path', () => {
    const input = [1, 2, 3, 4, 5]
    const count = 3
    const result = pickRandomSubset(input, count)
    assert.strictEqual(result.length, count)
    // Check all elements in result are from input
    result.forEach(item => {
      assert.ok(input.includes(item))
    })
    // Check all elements in result are unique (assuming input has unique elements)
    assert.strictEqual(new Set(result).size, count)
  })

  await t.test('handles count greater than array length', () => {
    const input = [1, 2]
    const count = 5
    const result = pickRandomSubset(input, count)
    assert.strictEqual(result.length, input.length)
    assert.ok(result.includes(1))
    assert.ok(result.includes(2))
  })

  await t.test('handles negative count', () => {
    // Math.min(count, n) where count is negative will result in negative k
    // If k <= 0, it should return []
    assert.deepStrictEqual(pickRandomSubset([1, 2, 3], -1), [])
  })

  await t.test('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5]
    const inputCopy = [...input]
    pickRandomSubset(input, 3)
    assert.deepStrictEqual(input, inputCopy)
  })

  await t.test('handles fractional count by flooring it', () => {
    const input = Array.from({ length: 20 }, (_, index) => index + 1)
    // 4.9 should be floored to 4.
    // With n = 20 and k = 4, this also exercises the sparse Fisher–Yates path (k < n / 4),
    // which is where a prior regression could throw from `new Array(4.9)` if count was not floored.
    const result = pickRandomSubset(input, 4.9)
    assert.strictEqual(result.length, 4)
  })

  await t.test('uses provided RNG for deterministic shuffling (k=2 fast-path)', () => {
    const input = ['a', 'b', 'c', 'd']
    // input.length = 4
    // count = 2
    // k = 2
    // n = 4
    // For k=2:
    // j1 = Math.floor(rng() * 4)
    // j2 = Math.floor(rng() * 3)
    let rngCallCount = 0
    const mockRng = () => {
      rngCallCount++
      if (rngCallCount === 1) return 0.5 // j1 = floor(0.5 * 4) = 2. input[2] = 'c'
      if (rngCallCount === 2) return 0.5 // j2 = floor(0.5 * 3) = 1.
      return 0
    }

    const result = pickRandomSubset(input, 2, mockRng)

    // j1 = 2
    // j2 = 1
    // j2 !== j1, so result is [input[j2], input[j1]] = ['b', 'c']
    assert.deepStrictEqual(result, ['b', 'c'])
    assert.strictEqual(rngCallCount, 2)
  })

  await t.test('uses provided RNG for deterministic shuffling (k=1 fast-path)', () => {
    const input = ['a', 'b', 'c', 'd']
    let rngCallCount = 0
    const mockRng = () => {
      rngCallCount++
      return 0.5 // Math.floor(0.5 * 4) = 2 -> 'c'
    }

    const result = pickRandomSubset(input, 1, mockRng)

    assert.deepStrictEqual(result, ['c'])
    assert.strictEqual(rngCallCount, 1)
  })

  await t.test('uses provided RNG for deterministic shuffling (sparse Fisher-Yates, k < n/4)', () => {
    const input = Array.from({ length: 20 }, (_, i) => i) // [0, 1, ..., 19]
    // k = 4, n = 20
    // 4 < 20 / 4 => 4 < 5, so it takes the sparse Fisher-Yates path
    let rngCallCount = 0
    const mockRng = () => {
      rngCallCount++
      // For i=0, targetIdx=19, j=Math.floor(rng * 20). rng=0.0 -> j=0
      if (rngCallCount === 1) return 0.0

      // For i=1, targetIdx=18, j=Math.floor(rng * 19). rng=0.5 -> j=9
      if (rngCallCount === 2) return 0.5

      // For i=2, targetIdx=17, j=Math.floor(rng * 18). rng=0.1 -> j=1
      if (rngCallCount === 3) return 0.1

      // For i=3, targetIdx=16, j=Math.floor(rng * 17). rng=0.9 -> j=15
      if (rngCallCount === 4) return 0.9

      return 0
    }

    const result = pickRandomSubset(input, 4, mockRng)

    // Expected sequence:
    // i=0: targetIdx=19, j=0. valTarget=19, valJ=0. result[3] = 0. swaps.set(0, 19).
    // i=1: targetIdx=18, j=9. valTarget=18, valJ=9. result[2] = 9. swaps.set(9, 18).
    // i=2: targetIdx=17, j=1. valTarget=17, valJ=1. result[1] = 1. swaps.set(1, 17).
    // i=3: targetIdx=16, j=15. valTarget=16, valJ=15. result[0] = 15. swaps.set(15, 16).
    // result = [15, 1, 9, 0]

    assert.deepStrictEqual(result, [15, 1, 9, 0])
    assert.strictEqual(rngCallCount, 4)
  })

  await t.test('uses provided RNG for deterministic shuffling (partial Fisher-Yates copy, k >= n/4)', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    // count = 3, n = 5, k = 3
    // 3 < 5/4 is false, falls back to copy+partial shuffle
    let rngCallCount = 0
    const mockRng = () => {
      rngCallCount++
      // i=4, j=Math.floor(rng * 5)
      if (rngCallCount === 1) return 0.0 // j=0

      // i=3, j=Math.floor(rng * 4)
      if (rngCallCount === 2) return 0.5 // j=2

      // i=2, j=Math.floor(rng * 3)
      if (rngCallCount === 3) return 0.9 // j=2

      return 0
    }

    const result = pickRandomSubset(input, 3, mockRng)

    // Original: ['a', 'b', 'c', 'd', 'e']
    // i=4, j=0: swap('e', 'a') -> ['e', 'b', 'c', 'd', 'a']
    // i=3, j=2: swap('d', 'c') -> ['e', 'b', 'd', 'c', 'a']
    // i=2, j=2: swap('d', 'd') -> ['e', 'b', 'd', 'c', 'a']
    // result = slice(5-3) = slice(2) -> ['d', 'c', 'a']

    assert.deepStrictEqual(result, ['d', 'c', 'a'])
    assert.strictEqual(rngCallCount, 3)
  })
})
