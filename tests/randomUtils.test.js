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

  await t.test('uses provided RNG for deterministic shuffling', () => {
    const input = ['a', 'b', 'c', 'd']
    // input.length = 4
    // count = 2
    // k = 2
    // n = 4

    // Loop 1: i = 3
    // j = Math.floor(rng() * (3 + 1)) = Math.floor(rng() * 4)
    // if rng returns 0, j = 0. swap(shuffled[3], shuffled[0])

    // Loop 2: i = 2
    // j = Math.floor(rng() * (2 + 1)) = Math.floor(rng() * 3)
    // if rng returns 0.5, j = 1. swap(shuffled[2], shuffled[1])

    let rngCallCount = 0
    const mockRng = () => {
      rngCallCount++
      if (rngCallCount === 1) return 0 // first call for i=3 -> j=0
      if (rngCallCount === 2) return 0.5 // second call for i=2 -> j=1
      return 0
    }

    const result = pickRandomSubset(input, 2, mockRng)

    // Initial: ['a', 'b', 'c', 'd']
    // i=3, j=0: swap('d', 'a') -> ['d', 'b', 'c', 'a']
    // i=2, j=1: swap('c', 'b') -> ['d', 'c', 'b', 'a']
    // slice(4-2) -> slice(2) -> ['b', 'a']

    assert.deepStrictEqual(result, ['b', 'a'])
    assert.strictEqual(rngCallCount, 2)
  })
})
