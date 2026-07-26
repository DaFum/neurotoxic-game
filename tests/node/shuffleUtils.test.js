import test from 'node:test'
import assert from 'node:assert/strict'
import { shuffleInPlace } from '../../src/utils/shuffleUtils'

test('shuffleInPlace swaps valid undefined entries', () => {
  const items = [undefined, 'a']

  shuffleInPlace(items, () => 0)

  assert.deepEqual(items, ['a', undefined])
})

test('shuffleInPlace clamps an out-of-range RNG without reporting a sparse entry', () => {
  const items = [1, 2, 3]
  let missingEntries = 0

  shuffleInPlace(
    items,
    () => 1,
    () => {
      missingEntries++
    }
  )

  assert.equal(missingEntries, 0)
  assert.deepEqual(items, [1, 2, 3])
})
