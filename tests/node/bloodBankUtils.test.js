import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateBloodBankPayout } from '../../src/utils/bloodBankUtils'
import { GAME_CONSTANTS } from '../../src/context/gameConstants'

test('calculateBloodBankPayout scales the base by 20% per fame level and floors', () => {
  assert.equal(calculateBloodBankPayout(100, 0), 100)
  assert.equal(calculateBloodBankPayout(100, 3), 160)
  assert.equal(calculateBloodBankPayout(33, 1), 39) // floor(39.6)
  assert.equal(calculateBloodBankPayout(100, 2.5), 150)
})

test('calculateBloodBankPayout treats non-finite fame levels as 0 instead of leaking NaN', () => {
  for (const bad of [Number.NaN, Infinity, undefined, null, '3', true]) {
    assert.equal(calculateBloodBankPayout(100, bad), 100, String(bad))
  }
})

test('calculateBloodBankPayout reproduces the retired inline formulas for both donation variants', () => {
  const legacy = (base, fame) => Math.floor(base * (1 + fame * 0.2))
  for (const base of [
    GAME_CONSTANTS.BLOOD_BANK.BLOOD_BASE_MONEY,
    GAME_CONSTANTS.BLOOD_BANK.MARROW_BASE_MONEY
  ]) {
    for (let fame = 0; fame <= 20; fame++) {
      assert.equal(calculateBloodBankPayout(base, fame), legacy(base, fame))
    }
  }
})
