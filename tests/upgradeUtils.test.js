import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  calcBaseBreakdownChance,
  hasUpgrade
} from '../src/utils/upgradeUtils.js'

test('hasUpgrade - checks ownership correctly', () => {
  assert.equal(hasUpgrade(['van_suspension'], 'van_suspension'), true)
  assert.equal(hasUpgrade(['van_suspension'], 'other_upgrade'), false)
  assert.equal(hasUpgrade([], 'van_suspension'), false)
  assert.equal(hasUpgrade(undefined, 'van_suspension'), false)
})

test('calcBaseBreakdownChance - no upgrades', () => {
  const result = calcBaseBreakdownChance([])
  assert.equal(result, 0.05)
})

test('calcBaseBreakdownChance - undefined upgrades', () => {
  const result = calcBaseBreakdownChance(undefined)
  assert.equal(result, 0.05)
})

test('calcBaseBreakdownChance - single upgrade (van_suspension)', () => {
  const result = calcBaseBreakdownChance(['van_suspension'])
  // 0.05 - 0.01 = 0.04
  assert.ok(Math.abs(result - 0.04) < Number.EPSILON)
})

test('calcBaseBreakdownChance - multiple upgrades', () => {
  const result = calcBaseBreakdownChance([
    'van_suspension',
    'hq_van_suspension'
  ])
  // 0.05 - 0.01 - 0.01 = 0.03
  assert.ok(Math.abs(result - 0.03) < Number.EPSILON)
})

test('calcBaseBreakdownChance - duplicate upgrades (should not double count)', () => {
  const result = calcBaseBreakdownChance(['van_suspension', 'van_suspension'])
  // 0.05 - 0.01 = 0.04 (not 0.03)
  assert.ok(Math.abs(result - 0.04) < Number.EPSILON)
})

test('calcBaseBreakdownChance - large reduction (hq_van_tyre_spare)', () => {
  const result = calcBaseBreakdownChance(['hq_van_tyre_spare'])
  // 0.05 - 0.05 = 0
  assert.equal(result, 0)
})

test('calcBaseBreakdownChance - clamping to zero', () => {
  const result = calcBaseBreakdownChance([
    'hq_van_tyre_spare',
    'van_suspension'
  ])
  // 0.05 - 0.05 - 0.01 = -0.01 -> clamped to 0
  assert.equal(result, 0)
})

test('calcBaseBreakdownChance - prototype pollution attempt', () => {
  // Should ignore 'toString' even if it exists on Object.prototype
  const result = calcBaseBreakdownChance(['toString', 'constructor'])
  assert.equal(result, 0.05)
})

test('calcBaseBreakdownChance - unknown upgrade', () => {
  const result = calcBaseBreakdownChance(['unknown_upgrade'])
  assert.equal(result, 0.05)
})

test('calcBaseBreakdownChance - mixed known and unknown upgrades', () => {
  const result = calcBaseBreakdownChance(['van_suspension', 'unknown_upgrade'])
  // 0.05 - 0.01 = 0.04
  assert.ok(Math.abs(result - 0.04) < Number.EPSILON)
})
