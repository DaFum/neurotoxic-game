import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDailyUpdates } from '../src/utils/simulationUtils.js'
import {
  calculateGigFinancials,
  EXPENSE_CONSTANTS
} from '../src/utils/economyEngine.js'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import { applyEventDelta } from '../src/utils/gameStateUtils.js'

/**
 * Test helpers
 */
const DEFAULT_MEMBERS = [
  { name: 'Matze', mood: 80, stamina: 100, baseStats: { skill: 5 } },
  { name: 'Lars', mood: 80, stamina: 100, baseStats: { skill: 4 } },
  { name: 'Marius', mood: 80, stamina: 100, baseStats: { skill: 3 } }
]

const DEFAULT_VAN = { fuel: 100, condition: 100, upgrades: [], breakdownChance: 0.05 }

const buildFullState = (overrides = {}) => {
  const bandOverrides = overrides.band || {}
  const playerOverrides = overrides.player || {}

  return {
    player: {
      money: playerOverrides.money ?? 500,
      day: playerOverrides.day ?? 1,
      time: playerOverrides.time ?? 12,
      location: playerOverrides.location ?? 'Stendal',
      currentNodeId: playerOverrides.currentNodeId ?? 'node_0_0',
      score: playerOverrides.score ?? 0,
      fame: playerOverrides.fame ?? 0,
      van: { ...DEFAULT_VAN, ...(playerOverrides.van || {}) },
      passiveFollowers: playerOverrides.passiveFollowers ?? 0
    },
    band: {
      members: bandOverrides.members || DEFAULT_MEMBERS.map(m => ({ ...m })),
      harmony: 80,
      harmonyRegenTravel: false,
      inventory: { shirts: 50, hoodies: 20, patches: 100, cds: 30, vinyl: 10 },
      performance: { guitarDifficulty: 1.0, drumMultiplier: 1.0, crowdDecay: 1.0 },
      luck: 0,
      ...bandOverrides
    },
    social: {
      instagram: 228,
      tiktok: 64,
      youtube: 14,
      newsletter: 0,
      viral: 0,
      ...overrides.social
    },
    currentScene: overrides.currentScene || 'OVERWORLD',
    activeStoryFlags: overrides.activeStoryFlags || [],
    eventCooldowns: overrides.eventCooldowns || [],
    pendingEvents: overrides.pendingEvents || [],
    toasts: overrides.toasts || []
  }
}

// --- DAILY UPDATE TESTS ---

test('calculateDailyUpdates: daily cost includes band size scaling', () => {
  const state = buildFullState()
  const result = calculateDailyUpdates(state)

  // Base cost is 25, plus 3 members * 5 = 15, total = 40
  const expectedCost = EXPENSE_CONSTANTS.DAILY.BASE_COST + 3 * 5
  assert.equal(
    result.player.money,
    500 - expectedCost,
    `Should deduct ${expectedCost}€ daily (base + band)`
  )
})

test('calculateDailyUpdates: money never goes negative', () => {
  const state = buildFullState({ player: { money: 10 } })
  const result = calculateDailyUpdates(state)

  assert.ok(result.player.money >= 0, 'Money should not go negative')
  assert.equal(result.player.money, 0, 'Should clamp to 0')
})

test('calculateDailyUpdates: van condition decays daily', () => {
  const state = buildFullState()
  const result = calculateDailyUpdates(state)

  assert.equal(
    result.player.van.condition,
    98,
    'Van condition should decrease by 2 per day'
  )
})

test('calculateDailyUpdates: van breakdown chance increases when condition is low', () => {
  const state = buildFullState({
    player: { van: { fuel: 100, condition: 25, upgrades: [], breakdownChance: 0.05 } }
  })
  const result = calculateDailyUpdates(state)

  assert.equal(
    result.player.van.breakdownChance,
    0.15,
    'Should have high breakdown chance when condition < 30'
  )
})

test('calculateDailyUpdates: van condition does not go below 0', () => {
  const state = buildFullState({
    player: { van: { fuel: 100, condition: 1, upgrades: [], breakdownChance: 0.05 } }
  })
  const result = calculateDailyUpdates(state)

  assert.ok(result.player.van.condition >= 0, 'Van condition should not go negative')
})

test('calculateDailyUpdates: harmony is clamped to [1, 100]', () => {
  const state = buildFullState({ band: { harmony: 2 } })
  const result = calculateDailyUpdates(state)

  assert.ok(
    result.band.harmony >= 1,
    'Harmony should never fall below 1'
  )
  assert.ok(
    result.band.harmony <= 100,
    'Harmony should never exceed 100'
  )
})

test('calculateDailyUpdates: harmony clamped even with regen active', () => {
  const state = buildFullState({
    band: { harmony: 99, harmonyRegenTravel: true }
  })
  const result = calculateDailyUpdates(state)

  assert.ok(
    result.band.harmony <= 100,
    'Harmony should not exceed 100 even with regen'
  )
})

// --- MERCH FORMULA TESTS ---

test('calculateGigFinancials: low performance penalizes merch', () => {
  const gigData = { capacity: 300, price: 15, pay: 500, dist: 100, diff: 3 }
  const modifiers = { merch: true }
  const inventory = { shirts: 50, hoodies: 20, patches: 100, cds: 30, vinyl: 10 }
  const gigStats = { misses: 20, peakHype: 30 }

  const lowResult = calculateGigFinancials(
    gigData, 30, { hype: 30 }, modifiers, inventory, 100, gigStats
  )
  const highResult = calculateGigFinancials(
    gigData, 95, { hype: 80 }, modifiers, inventory, 100,
    { misses: 0, peakHype: 100 }
  )

  assert.ok(
    highResult.income.total > lowResult.income.total,
    'High performance should yield more income than low performance'
  )
})

test('calculateGigFinancials: merch table modifier increases merch revenue', () => {
  const gigData = { capacity: 300, price: 15, pay: 500, dist: 100, diff: 3 }
  const inventory = { shirts: 50, hoodies: 20, patches: 100, cds: 30, vinyl: 10 }
  const gigStats = { misses: 0, peakHype: 80 }

  const withoutMerch = calculateGigFinancials(
    gigData, 70, { hype: 50 }, {}, inventory, 100, gigStats
  )
  const withMerch = calculateGigFinancials(
    gigData, 70, { hype: 50 }, { merch: true }, inventory, 100, gigStats
  )

  assert.ok(
    withMerch.income.total >= withoutMerch.income.total,
    'Merch table modifier should not decrease income'
  )
})

// --- REDUCER STATE SAFETY TESTS ---

test('gameReducer: UPDATE_PLAYER clamps money to 0', () => {
  const state = buildFullState()
  const result = gameReducer(state, {
    type: ActionTypes.UPDATE_PLAYER,
    payload: { money: -100 }
  })

  assert.equal(result.player.money, 0, 'Money should be clamped to 0')
})

test('gameReducer: UPDATE_BAND clamps harmony to [1, 100]', () => {
  const state = buildFullState()

  const low = gameReducer(state, {
    type: ActionTypes.UPDATE_BAND,
    payload: { harmony: -50 }
  })
  assert.ok(low.band.harmony >= 1, 'Harmony should not go below 1')

  const high = gameReducer(state, {
    type: ActionTypes.UPDATE_BAND,
    payload: { harmony: 200 }
  })
  assert.equal(high.band.harmony, 100, 'Harmony should be clamped to 100')
})

test('gameReducer: ADVANCE_DAY clamps harmony', () => {
  const state = buildFullState({ band: { harmony: 2 } })
  const result = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })

  assert.ok(result.band.harmony >= 1, 'Harmony should stay >= 1 after day advance')
})

// --- EVENT DELTA STATE SAFETY TESTS ---

test('applyEventDelta: fuel clamped to [0, 100]', () => {
  const state = buildFullState()

  const overResult = applyEventDelta(state, {
    player: { van: { fuel: 200 } },
    band: {},
    social: {},
    flags: {}
  })
  assert.ok(
    overResult.player.van.fuel <= 100,
    'Fuel should not exceed 100 after event delta'
  )

  const underResult = applyEventDelta(state, {
    player: { van: { fuel: -200 } },
    band: {},
    social: {},
    flags: {}
  })
  assert.ok(
    underResult.player.van.fuel >= 0,
    'Fuel should not go below 0 after event delta'
  )
})

test('applyEventDelta: harmony clamped to [1, 100]', () => {
  const state = buildFullState()

  const result = applyEventDelta(state, {
    player: {},
    band: { harmony: -200 },
    social: {},
    flags: {}
  })
  assert.ok(
    result.band.harmony >= 1,
    'Harmony should not go below 1 after event delta'
  )
})

test('applyEventDelta: money clamped to 0', () => {
  const state = buildFullState({ player: { money: 50 } })

  const result = applyEventDelta(state, {
    player: { money: -200 },
    band: {},
    social: {},
    flags: {}
  })
  assert.equal(
    result.player.money,
    0,
    'Money should not go below 0 after event delta'
  )
})
