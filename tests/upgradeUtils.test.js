import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  hasUpgrade,
  calcBaseBreakdownChance
} from '../src/utils/upgradeUtils.js'

describe('hasUpgrade', () => {
  test('returns true when upgrade is present', () => {
    assert.strictEqual(hasUpgrade(['van_suspension', 'van_storage'], 'van_suspension'), true)
  })

  test('returns false when upgrade is absent', () => {
    assert.strictEqual(hasUpgrade(['van_storage'], 'van_suspension'), false)
  })

  test('returns false for empty array', () => {
    assert.strictEqual(hasUpgrade([], 'van_suspension'), false)
  })

  test('returns false for non-array input', () => {
    assert.strictEqual(hasUpgrade(null, 'van_suspension'), false)
    assert.strictEqual(hasUpgrade(undefined, 'van_suspension'), false)
  })
})

describe('calcBaseBreakdownChance', () => {
  test('returns default 0.05 with no upgrades', () => {
    assert.strictEqual(calcBaseBreakdownChance([]), 0.05)
  })

  test('van_suspension reduces by 0.01', () => {
    assert.strictEqual(calcBaseBreakdownChance(['van_suspension']), 0.04)
  })

  test('hq_van_suspension reduces by 0.01', () => {
    assert.strictEqual(calcBaseBreakdownChance(['hq_van_suspension']), 0.04)
  })

  test('hq_van_tyre_spare reduces by 0.05', () => {
    assert.strictEqual(calcBaseBreakdownChance(['hq_van_tyre_spare']), 0)
  })

  test('all three upgrades clamp to 0', () => {
    const upgrades = ['van_suspension', 'hq_van_suspension', 'hq_van_tyre_spare']
    assert.strictEqual(calcBaseBreakdownChance(upgrades), 0)
  })

  test('both suspension upgrades stack', () => {
    const upgrades = ['van_suspension', 'hq_van_suspension']
    const result = calcBaseBreakdownChance(upgrades)
    assert.ok(Math.abs(result - 0.03) < 1e-10)
  })

  test('handles non-breakdown upgrades gracefully', () => {
    assert.strictEqual(calcBaseBreakdownChance(['van_storage', 'van_sound_system']), 0.05)
  })
})
