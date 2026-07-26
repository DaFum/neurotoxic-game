import assert from 'node:assert/strict'
import test from 'node:test'
import { pickBoundedIndex, pickIndex } from '../../src/utils/selectionUtils'

test('bounded index helpers normalize non-finite RNG rolls', () => {
  assert.equal(
    pickBoundedIndex(3, () => Number.NaN),
    0
  )
  assert.equal(
    pickBoundedIndex(3, () => Number.POSITIVE_INFINITY, 2),
    2
  )
  assert.equal(
    pickIndex(['a', 'b', 'c'], () => Number.NaN),
    0
  )
})
