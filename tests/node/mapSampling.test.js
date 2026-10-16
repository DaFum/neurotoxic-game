import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pickRandomSubset } from '../../src/utils/mapGenerator/mathUtils.ts'

for (const [size, count, expected] of [
  [8, 1, [4]],
  [8, 2, [4, 3]],
  [16, 3, [8, 0, 9]],
  [8, 3, [4, 0, 5]]
]) {
  test(`sampling ${count} of ${size} preserves seeded order and draw count`, () => {
    const input = Object.freeze(
      Array.from({ length: size }, (_, index) => index)
    )
    let draws = 0
    const result = pickRandomSubset(input, count, () => {
      draws += 1
      return 0.5
    })
    assert.deepEqual(result, expected)
    assert.equal(draws, count)
    assert.notEqual(result, input)
  })
}

test('sampling rejects an undefined selected entry in each strategy', () => {
  for (const [size, count] of [
    [8, 1],
    [8, 2],
    [16, 3],
    [8, 3]
  ]) {
    const input = Array.from({ length: size }, (_, index) => index)
    delete input[0]
    assert.throws(
      () => pickRandomSubset(input, count, () => 0),
      /Sparse array invariant/
    )
  }
})

test('dense sampling allows holes outside the selected prefix', () => {
  const input = Array.from({ length: 8 }, (_, index) => index)
  delete input[7]
  assert.deepEqual(
    pickRandomSubset(input, 3, () => 0),
    [0, 1, 2]
  )
})
