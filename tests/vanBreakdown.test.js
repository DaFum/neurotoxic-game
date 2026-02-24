import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDailyUpdates } from '../src/utils/simulationUtils.js'

test('Van Breakdown: Base breakdown chance with no upgrades and perfect condition', () => {
  const currentState = {
    player: {
      day: 1,
      money: 1000,
      van: {
        condition: 100,
        upgrades: [],
        breakdownChance: 0 // Should be recalculated
      }
    },
    band: { members: [], harmony: 50 },
    social: {}
  }

  const { player } = calculateDailyUpdates(currentState)

  // Base chance is 0.05 (5%)
  // Condition 100 -> Multiplier 1.0
  // Result: 0.05
  assert.equal(player.van.breakdownChance, 0.05, 'Base breakdown chance should be 0.05')
})

test('Van Breakdown: Condition below 60 increases breakdown chance', () => {
  const currentState = {
    player: {
      day: 1,
      money: 1000,
      van: {
        condition: 59, // Decays by 2 -> 57 (< 60)
        upgrades: []
      }
    },
    band: { members: [], harmony: 50 },
    social: {}
  }

  const { player } = calculateDailyUpdates(currentState)

  // Base 0.05
  // Condition 57 -> Multiplier 1.6
  // Result: 0.05 * 1.6 = 0.08
  assert.equal(player.van.breakdownChance, 0.08, 'Breakdown chance should be 0.08 for worn condition')
})

test('Van Breakdown: Condition below 30 significantly increases breakdown chance', () => {
  const currentState = {
    player: {
      day: 1,
      money: 1000,
      van: {
        condition: 29, // Decays by 2 -> 27 (< 30)
        upgrades: []
      }
    },
    band: { members: [], harmony: 50 },
    social: {}
  }

  const { player } = calculateDailyUpdates(currentState)

  // Base 0.05
  // Condition 27 -> Multiplier 3.0
  // Result: 0.05 * 3.0 = 0.15
  assert.equal(player.van.breakdownChance, 0.15, 'Breakdown chance should be 0.15 for very low condition')
})

test('Van Breakdown: Upgrades reduce base breakdown chance', () => {
  const currentState = {
    player: {
      day: 1,
      money: 1000,
      van: {
        condition: 100,
        upgrades: ['van_suspension'] // -0.01 reduction
      }
    },
    band: { members: [], harmony: 50 },
    social: {}
  }

  const { player } = calculateDailyUpdates(currentState)

  // Base 0.05 - 0.01 = 0.04
  // Condition 100 -> Multiplier 1.0
  // Result: 0.04
  assert.equal(player.van.breakdownChance, 0.04, 'Breakdown chance should be reduced by upgrades')
})

test('Van Breakdown: NO COMPOUNDING - Breakdown chance is stable over multiple days with similar condition', () => {
  // Scenario: Condition starts at 50 (multiplier 1.6 range).
  // We run updates for 3 days. Condition decays by 2 each day.
  // Day 1: Start 50 -> 48. Chance = 0.05 * 1.6 = 0.08.
  // Day 2: Start 48 -> 46. Chance = 0.05 * 1.6 = 0.08.
  // Day 3: Start 46 -> 44. Chance = 0.05 * 1.6 = 0.08.

  // If compounding bug existed:
  // Day 1: 0.08
  // Day 2: 0.08 * 1.6 = 0.128
  // Day 3: 0.128 * 1.6 = 0.2048

  let currentState = {
    player: {
      day: 1,
      money: 1000,
      van: {
        condition: 50,
        upgrades: [],
        breakdownChance: 0.05 // Initial dummy value
      }
    },
    band: { members: [], harmony: 50 },
    social: {}
  }

  // Day 1
  let update1 = calculateDailyUpdates(currentState)
  assert.equal(update1.player.van.condition, 48)
  assert.equal(update1.player.van.breakdownChance, 0.08, 'Day 1 chance should be 0.08')

  // Day 2 (Feed previous state back in)
  // Merge back the full state structure properly
  let state2 = {
    ...currentState,
    player: update1.player,
    band: update1.band,
    social: update1.social
  }
  let update2 = calculateDailyUpdates(state2)
  assert.equal(update2.player.van.condition, 46)
  assert.equal(update2.player.van.breakdownChance, 0.08, 'Day 2 chance should remain 0.08 (no compounding)')

  // Day 3
  let state3 = {
    ...currentState,
    player: update2.player,
    band: update2.band,
    social: update2.social
  }
  let update3 = calculateDailyUpdates(state3)
  assert.equal(update3.player.van.condition, 44)
  assert.equal(update3.player.van.breakdownChance, 0.08, 'Day 3 chance should remain 0.08 (no compounding)')
})
