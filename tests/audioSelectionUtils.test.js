import assert from 'node:assert'
import { test } from 'node:test'
import { selectRandomItem } from '../src/utils/audioSelectionUtils.js'

test('selectRandomItem', async t => {
  await t.test('returns null for invalid or empty inputs', () => {
    assert.strictEqual(selectRandomItem([]), null)
    assert.strictEqual(selectRandomItem(null), null)
  })

  await t.test('returns a stable item with deterministic rng', () => {
    const items = ['a', 'b', 'c']
    const rng = () => 0.4
    assert.strictEqual(selectRandomItem(items, rng), 'b')
  })

  await t.test('clamps rng values to valid indices', () => {
    const items = ['x', 'y']
    const lowRng = () => -1
    const highRng = () => 2
    assert.strictEqual(selectRandomItem(items, lowRng), 'x')
    assert.strictEqual(selectRandomItem(items, highRng), 'y')
  })
})
