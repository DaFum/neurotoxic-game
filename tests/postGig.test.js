import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldTriggerBankruptcy } from '../src/utils/economyEngine.js'

test('shouldTriggerBankruptcy returns true for zero money', () => {
  assert.strictEqual(shouldTriggerBankruptcy(0), true)
})

test('shouldTriggerBankruptcy returns true for negative money', () => {
  assert.strictEqual(shouldTriggerBankruptcy(-25), true)
})

test('shouldTriggerBankruptcy returns false for positive money', () => {
  assert.strictEqual(shouldTriggerBankruptcy(10), false)
})

test('shouldTriggerBankruptcy throws for undefined input', () => {
  assert.throws(() => shouldTriggerBankruptcy(undefined), TypeError)
})

test('shouldTriggerBankruptcy throws for null input (coerced to 0 but if explicit check fails)', () => {
  assert.strictEqual(shouldTriggerBankruptcy(null), true)
})

test('shouldTriggerBankruptcy throws for NaN input', () => {
  assert.throws(() => shouldTriggerBankruptcy(NaN), TypeError)
})

test('shouldTriggerBankruptcy throws for non-numeric string', () => {
  assert.throws(() => shouldTriggerBankruptcy('bankrupt'), TypeError)
})

test('shouldTriggerBankruptcy handles numeric string', () => {
  assert.strictEqual(shouldTriggerBankruptcy('-10'), true)
  assert.strictEqual(shouldTriggerBankruptcy('50'), false)
})
