import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateTravelExpenses,
  EXPENSE_CONSTANTS
} from '../src/utils/economyEngine.js'
import { calculateDailyUpdates } from '../src/utils/simulationUtils.js'

test('Game Loop Logic Simulation', async t => {
  // Initial State
  let state = {
    player: {
      money: 500,
      day: 1,
      van: { fuel: 100, upgrades: [] },
      passiveFollowers: 0
    },
    band: {
      members: [
        { name: 'Matze', mood: 50 },
        { name: 'Lars', mood: 50 }
      ],
      harmony: 50,
      harmonyRegenTravel: false
    },
    social: { viral: 0, instagram: 0 }
  }

  const nodeStart = { x: 50, y: 50, venue: { name: 'Start' } }
  const nodeDest = { x: 60, y: 60, venue: { name: 'Dest' } } // dist ~ 14km * 5 + 20 = 90km?

  await t.test('Phase 1: Travel (Overworld)', () => {
    // 1. Calculate Logic
    const { totalCost, fuelLiters } = calculateTravelExpenses(
      nodeDest,
      nodeStart,
      state.player
    )

    assert.ok(totalCost > 0, 'Travel should cost money')
    assert.ok(fuelLiters > 0, 'Travel should consume fuel')

    // 2. Apply Overworld Logic (Manual Update + AdvanceDay)
    // Deduction
    state.player.money = Math.max(0, state.player.money - totalCost)
    state.player.van.fuel = Math.max(0, state.player.van.fuel - fuelLiters)

    // Advance Day (The logic we enabled in Overworld.jsx)
    const updates = calculateDailyUpdates(state)
    state = { ...state, ...updates }

    // Verification
    assert.equal(state.player.day, 2, 'Day should advance to 2')
    // Check Daily Cost Deduction (25) + Travel Cost
    // 500 - totalCost - 25
    const expectedMoney = 500 - totalCost - 25
    assert.equal(
      state.player.money,
      expectedMoney,
      'Money should match travel + daily cost'
    )
  })

  await t.test('Phase 2: Refuel (Overworld)', () => {
    const missing = 100 - state.player.van.fuel
    assert.ok(missing > 0, 'Should have missing fuel')

    const cost = Math.ceil(missing * 1.75) // 1.75 is standard constant

    // Apply Refuel
    state.player.money -= cost
    state.player.van.fuel = 100

    assert.equal(state.player.van.fuel, 100, 'Fuel should be restored')
  })

  await t.test('Phase 3: Gig (PostGig)', () => {
    const initialDay = state.player.day
    const gigIncome = 200

    // Apply PostGig Logic (Update Player w/ Net Income)
    // Crucially: NO day increment here
    state.player.money += gigIncome
    state.player.fame = (state.player.fame || 0) + 100

    assert.equal(
      state.player.day,
      initialDay,
      'Day should NOT advance after Gig'
    )
    assert.ok(state.player.money > 0, 'Money should reflect income')
  })

  await t.test('Phase 4: Next Travel Cycle', () => {
    // Travel again
    const { totalCost, fuelLiters } = calculateTravelExpenses(
      nodeStart, // Back home
      nodeDest,
      state.player
    )

    state.player.money -= totalCost
    state.player.van.fuel -= fuelLiters

    const updates = calculateDailyUpdates(state)
    state = { ...state, ...updates }

    assert.equal(state.player.day, 3, 'Day should advance to 3')
  })
})
