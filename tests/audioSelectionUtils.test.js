import assert from 'node:assert'
import { test } from 'node:test'
import { selectRandomItem } from '../src/utils/audio/selectionUtils.js'

test('selectRandomItem', async t => {
  await t.test('returns null for invalid or empty inputs', () => {
    assert.strictEqual(selectRandomItem([]), null)
    assert.strictEqual(selectRandomItem(null), null)
    assert.strictEqual(selectRandomItem(undefined), null)
    assert.strictEqual(selectRandomItem('not an array'), null)
    assert.strictEqual(selectRandomItem(123), null)
    assert.strictEqual(selectRandomItem({ a: 1 }), null)
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

  await t.test('handles rng boundary values', () => {
    const items = ['a', 'b', 'c']
    assert.strictEqual(
      selectRandomItem(items, () => 0),
      'a'
    )
    assert.strictEqual(
      selectRandomItem(items, () => 0.999),
      'c'
    )
    assert.strictEqual(
      selectRandomItem(items, () => 1.0),
      'c'
    )
  })
})
