import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldTriggerBankruptcy } from '../src/scenes/PostGig.jsx'

test('shouldTriggerBankruptcy returns false for break-even at zero', () => {
  assert.strictEqual(shouldTriggerBankruptcy(0, 0), false)
})

test('shouldTriggerBankruptcy returns true for zero money after net loss', () => {
  assert.strictEqual(shouldTriggerBankruptcy(0, -25), true)
})

test('shouldTriggerBankruptcy returns false for positive money regardless of net', () => {
  assert.strictEqual(shouldTriggerBankruptcy(10, -100), false)
})
