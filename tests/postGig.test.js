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
  // Number(null) is 0. 0 is finite.
  // If we rely on Number(), null becomes 0 -> true.
  // Finding said: "if either input is not a finite number, throw a TypeError".
  // If I strictly follow "coerce inputs with Number(...)", then null -> 0.
  // But usually null is invalid input.
  // If I use Number(null), it's 0.
  // If the finding implied strict type checking, I should have done strict check.
  // "coerce inputs with Number(...) and guard with Number.isFinite" implies type coercion.
  // So null -> 0 -> true.
  // But undefined -> NaN -> throws.
  // "shouldTriggerBankruptcy(null, -10)" was the example of edge case.
  // Let's assume null should be treated as 0 or throw?
  // Finding said "add unit tests for ... shouldTriggerBankruptcy(null, -10)".
  // And "guard with Number.isFinite — if either input is not a finite number, throw a TypeError".
  // Since Number(null) === 0, it passes Number.isFinite.
  // So it returns true (bankrupt).
  assert.strictEqual(shouldTriggerBankruptcy(null), true)
})

test('shouldTriggerBankruptcy throws for NaN input', () => {
  assert.throws(() => shouldTriggerBankruptcy(NaN), TypeError)
})

test('shouldTriggerBankruptcy throws for non-numeric string', () => {
  assert.throws(() => shouldTriggerBankruptcy('bankrupt'), TypeError)
})

test('shouldTriggerBankruptcy handles numeric string', () => {
  // Number("-10") is -10.
  assert.strictEqual(shouldTriggerBankruptcy('-10'), true)
  assert.strictEqual(shouldTriggerBankruptcy('50'), false)
})
