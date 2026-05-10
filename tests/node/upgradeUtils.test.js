import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calcBaseBreakdownChance,
  hasUpgrade
} from '../../src/utils/upgradeUtils'

test('hasUpgrade - checks ownership correctly', () => {
  assert.equal(hasUpgrade(['van_suspension'], 'van_suspension'), true)
  assert.equal(hasUpgrade(['van_suspension'], 'other_upgrade'), false)
  assert.equal(hasUpgrade([], 'van_suspension'), false)
  assert.equal(hasUpgrade(undefined, 'van_suspension'), false)
})

const breakdownCases = [
  { label: 'no upgrades', upgrades: [], expected: 0.05 },
  { label: 'undefined upgrades', upgrades: undefined, expected: 0.05 },
  {
    label: 'single van_suspension (-0.01)',
    upgrades: ['van_suspension'],
    expected: 0.04
  },
  {
    label: 'two known upgrades (-0.02)',
    upgrades: ['van_suspension', 'hq_van_suspension'],
    expected: 0.03
  },
  {
    label: 'duplicate upgrades (no double count)',
    upgrades: ['van_suspension', 'van_suspension'],
    expected: 0.04
  },
  {
    label: 'large reduction hq_van_tyre_spare (-0.05 → 0)',
    upgrades: ['hq_van_tyre_spare'],
    expected: 0
  },
  {
    label: 'clamped to 0 (over-reduction)',
    upgrades: ['hq_van_tyre_spare', 'van_suspension'],
    expected: 0
  },
  {
    label: 'prototype pollution ignored',
    upgrades: ['toString', 'constructor'],
    expected: 0.05
  },
  {
    label: 'unknown upgrade ignored',
    upgrades: ['unknown_upgrade'],
    expected: 0.05
  },
  {
    label: 'mixed known and unknown upgrades',
    upgrades: ['van_suspension', 'unknown_upgrade'],
    expected: 0.04
  }
]

breakdownCases.forEach(({ label, upgrades, expected }) => {
  test(`calcBaseBreakdownChance - ${label}`, () => {
    const result = calcBaseBreakdownChance(upgrades)
    assert.ok(
      Math.abs(result - expected) < Number.EPSILON,
      `expected ${expected}, got ${result}`
    )
  })
})
