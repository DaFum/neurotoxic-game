import test from 'node:test'
import assert from 'node:assert/strict'
import { CHATTER_DB } from '../../src/data/chatter/index.ts'

test('chatter data does not use weight 0 entries', () => {
  for (const entry of CHATTER_DB) {
    assert.notEqual(
      entry.weight,
      0,
      `Chatter entry "${entry.text}" must not use weight 0`
    )
  }
})
