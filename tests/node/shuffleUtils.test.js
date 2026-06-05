import test from 'node:test'
import assert from 'node:assert/strict'
import { shuffleInPlace } from '../../src/utils/shuffleUtils'

test('shuffleInPlace swaps valid undefined entries', () => {
  const items = [undefined, 'a']

  shuffleInPlace(items, () => 0)

  assert.deepEqual(items, ['a', undefined])
})
