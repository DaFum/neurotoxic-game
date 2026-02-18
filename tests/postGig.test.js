import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shouldTriggerBankruptcy } from '../src/utils/economyEngine.js'

test('shouldTriggerBankruptcy returns true for negative money', () => {
  // If you are in debt, you are bankrupt regardless of income
  assert.strictEqual(shouldTriggerBankruptcy(-25, 100), true)
  assert.strictEqual(shouldTriggerBankruptcy(-1, -50), true)
})

test('shouldTriggerBankruptcy returns false for positive money', () => {
  // Even if losing money, if you have positive balance, you survive
  assert.strictEqual(shouldTriggerBankruptcy(10, -50), false)
  assert.strictEqual(shouldTriggerBankruptcy(100, 10), false)
})

test('shouldTriggerBankruptcy at zero money returns false if breaking even or profitable', () => {
  // 0 money, 0 net income -> Survive
  assert.strictEqual(shouldTriggerBankruptcy(0, 0), false)
  // 0 money, positive net income -> Survive
  assert.strictEqual(shouldTriggerBankruptcy(0, 50), false)
})

test('shouldTriggerBankruptcy at zero money returns true if losing money', () => {
  // 0 money, negative net income -> Bankrupt
  assert.strictEqual(shouldTriggerBankruptcy(0, -10), true)
})

test('shouldTriggerBankruptcy handles missing netIncome safely', () => {
  // If undefined (legacy), assume 0 (safe)
  assert.strictEqual(shouldTriggerBankruptcy(0, undefined), false)
  // But negative money is still bad
  assert.strictEqual(shouldTriggerBankruptcy(-10, undefined), true)
})

test('shouldTriggerBankruptcy throws for invalid money input', () => {
  assert.throws(() => shouldTriggerBankruptcy(undefined, 0), TypeError)
  assert.throws(() => shouldTriggerBankruptcy(NaN, 0), TypeError)
  assert.throws(() => shouldTriggerBankruptcy('bankrupt', 0), TypeError)
})

test('shouldTriggerBankruptcy handles numeric strings', () => {
  assert.strictEqual(shouldTriggerBankruptcy('-10', 0), true)
  assert.strictEqual(shouldTriggerBankruptcy('0', -10), true)
  assert.strictEqual(shouldTriggerBankruptcy('0', 0), false)
})
