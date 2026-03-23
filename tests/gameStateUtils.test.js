import assert from 'node:assert'
import { test } from 'node:test'
import {
  applyEventDelta,
  applyInventoryItemDelta,
  clampBandHarmony,
  clampNonNegative,
  clampPlayerMoney,
  clampVanFuel,
  calculateFameLevel,
  calculateFameGain,
  calculateAppliedDelta,
  isForbiddenKey
} from '../src/utils/gameStateUtils.js'

test('clampNonNegative edge cases', () => {
  assert.strictEqual(clampNonNegative(10), 10)
  assert.strictEqual(clampNonNegative(0), 0)
  assert.strictEqual(clampNonNegative(-5), 0)
  assert.strictEqual(clampNonNegative(NaN), 0)
  assert.strictEqual(clampNonNegative(Infinity), 0)
  assert.strictEqual(clampNonNegative(-Infinity), 0)
})

test('calculateFameLevel', () => {
  assert.strictEqual(calculateFameLevel(0), 0)
  assert.strictEqual(calculateFameLevel(50), 0) // below first threshold
  assert.strictEqual(calculateFameLevel(100), 1) // exactly level 1
  assert.strictEqual(calculateFameLevel(150), 1) // within level 1
  assert.strictEqual(calculateFameLevel(200), 2) // exactly level 2
  assert.strictEqual(calculateFameLevel(1050), 10) // level 10
  assert.strictEqual(calculateFameLevel(-500), 0) // Should cap at 0
  assert.strictEqual(calculateFameLevel(null), 0)
  assert.strictEqual(calculateFameLevel(undefined), 0)
})

test('calculateFameGain returns correct diminishing returns', () => {
  assert.strictEqual(
    calculateFameGain(100, 0, 500),
    100,
    'Below 50 fame, raw gain is uncapped'
  )
  assert.strictEqual(
    calculateFameGain(600, 0, 500),
    500,
    'Below 50 fame, max gain is strictly applied'
  )

  // At 100 current fame, multiplier is exp(-50 * 0.01) = exp(-0.5) = 0.6065
  // Raw 100 => 61
  assert.strictEqual(
    calculateFameGain(100, 100, 500),
    61,
    'At 100 fame, gain is diminished (~60%)'
  )

  // At 500 current fame, multiplier is exp(-450 * 0.01) = exp(-4.5) = 0.0111
  // Raw 100 => 1
  assert.strictEqual(
    calculateFameGain(100, 500, 500),
    1,
    'At 500 fame, gain is heavily diminished'
  )
})

test('applyEventDelta applies player updates', () => {
  const state = {
    player: { money: 100, time: 12, fame: 50, van: { fuel: 50, condition: 80 } }
  }
  const delta = {
    player: { money: -20, time: 2, fame: 10, van: { fuel: 10, condition: -5 } }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.player.money, 80)
  assert.equal(nextState.player.time, 14)
  assert.equal(nextState.player.fame, 60)
  assert.equal(nextState.player.van.fuel, 60)
  assert.equal(nextState.player.van.condition, 75)
})

test('applyEventDelta clamps values', () => {
  const state = {
    player: { money: 10, van: { fuel: 90, condition: 10 } },
    band: { harmony: 10, members: [{ mood: 10, stamina: 10 }] }
  }
  const delta = {
    player: { money: -50, van: { fuel: 20, condition: -20 } },
    band: {
      harmony: -20,
      membersDelta: { moodChange: -20, staminaChange: -20 }
    }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.player.money, 0) // min 0
  assert.equal(nextState.player.van.fuel, 100) // max 100
  assert.equal(nextState.player.van.condition, 0) // min 0
  assert.equal(nextState.band.harmony, 1) // min 1
  assert.equal(nextState.band.members[0].mood, 0) // min 0
  assert.equal(nextState.band.members[0].stamina, 0) // min 0
})

test('applyEventDelta handles band inventory updates', () => {
  const state = {
    band: { inventory: { shirts: 10, golden_pick: false } }
  }
  const delta = {
    band: { inventory: { shirts: 5, golden_pick: true } }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.band.inventory.shirts, 15)
  assert.equal(nextState.band.inventory.golden_pick, true)
})

test('applyEventDelta applies per-member deltas', () => {
  const state = {
    band: {
      members: [
        { mood: 50, stamina: 50 },
        { mood: 80, stamina: 20 }
      ]
    }
  }
  const delta = {
    band: {
      members: [
        { moodChange: 10, staminaChange: -5 },
        { moodChange: -20, staminaChange: 15 }
      ]
    }
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.band.members[0].mood, 60)
  assert.equal(nextState.band.members[0].stamina, 45)
  assert.equal(nextState.band.members[1].mood, 60)
  assert.equal(nextState.band.members[1].stamina, 35)
})

test('applyEventDelta handles social updates', () => {
  const state = {
    social: { instagram: 100, viral: 0 }
  }
  const delta = {
    social: { instagram: 50, viral: 1 }
  }
  const nextState = applyEventDelta(state, delta)
  assert.equal(nextState.social.instagram, 150)
  assert.equal(nextState.social.viral, 1)
})

test('applyEventDelta handles flags', () => {
  const state = {
    activeStoryFlags: [],
    pendingEvents: []
  }
  const delta = {
    flags: { addStoryFlag: 'MET_RIVAL', queueEvent: 'RIVAL_BATTLE' }
  }
  const nextState = applyEventDelta(state, delta)
  assert.ok(nextState.activeStoryFlags.includes('MET_RIVAL'))
  assert.ok(nextState.pendingEvents.includes('RIVAL_BATTLE'))
})

test('applyEventDelta ignores unsupported score mutations in flags', () => {
  const state = { player: { score: 100 } }
  const delta = { flags: { score: 50 } }
  const nextState = applyEventDelta(state, delta)

  assert.deepStrictEqual(nextState.player, state.player)
})

test('state safety helpers clamp canonical values', () => {
  assert.equal(clampPlayerMoney(19.7), 19)
  assert.equal(clampPlayerMoney(-10), 0)
  assert.equal(clampBandHarmony(55.9), 55)
  assert.equal(clampBandHarmony(-4), 1)
  assert.equal(clampBandHarmony(220), 100)
})

test('applyInventoryItemDelta handles numeric and boolean deltas', () => {
  assert.equal(applyInventoryItemDelta(2, -1), 1)
  assert.equal(applyInventoryItemDelta(0, -5), 0)
  assert.equal(applyInventoryItemDelta(undefined, 3), 3)
  assert.equal(applyInventoryItemDelta(true, false), false)
})

test('calculateAppliedDelta calculates correctly with limits and forbidden keys', () => {
  const state = {
    player: {
      money: 10,
      van: { fuel: 90, condition: 10 },
      stats: { someStat: 5 },
      score: 100
    },
    band: {
      harmony: 100,
      luck: 0,
      members: [{ baseStats: { skill: 7 }, mood: 10, stamina: 10 }],
      inventory: { someItem: 1 }
    },
    social: { controversyLevel: 5, viral: 1, loyalty: 10 },
    flags: {}
  }

  const delta = {
    player: {
      money: -20, // clamps to 0 (applied -10)
      van: { fuel: 20, condition: -20 }, // fuel clamps to 100 (applied 10), condition clamps to 0 (applied -10)
      stats: { someNewStat: 2, __proto__: { evil: 1 } },
      score: 10
    },
    band: {
      harmony: 10, // clamps to 100 (applied 0)
      luck: 10,
      skill: 5, // starting at 7, clamps to 10 (applied 3)
      inventory: {
        someItem: false, // will subtract 1
        newItem: true, // will add true
        constructor: { evil: 2 }
      },
      membersDelta: {
        moodChange: -5,
        staminaChange: 2,
        prototype: { evil: 3 }
      }
    },
    social: {
      viral: 5,
      loyalty: 10
    },
    flags: {
      someFlag: true,
      __proto__: { evil: 4 }
    }
  }

  const applied = calculateAppliedDelta(state, delta)

  assert.equal(applied.player.money, -10)
  assert.equal(applied.player.van.fuel, 10)
  assert.equal(applied.player.van.condition, -10)
  assert.equal(applied.score, 10)
  assert.equal(applied.social.viral, 5)
  assert.equal(applied.social.loyalty, 10)
  assert.equal(applied.band.harmony, 0)
  assert.equal(applied.band.luck, 10)
  assert.equal(applied.band.skill, 3)
  assert.deepEqual(applied.band.members, [{ skill: 3 }])
  assert.equal(applied.band.inventory.someItem, -1)
  assert.equal(applied.band.inventory.newItem, true)
  assert.equal(applied.flags.someFlag, true)

  // Checking forbidden keys are absent (by checking if the properties were copied)
  assert.equal(Object.hasOwn(applied.flags, '__proto__'), false)
  assert.equal(Object.hasOwn(applied.player.stats, '__proto__'), false)
  assert.equal(Object.hasOwn(applied.band.inventory, 'constructor'), false)
  assert.equal(Object.hasOwn(applied.band.membersDelta, 'prototype'), false)
})

test('clampVanFuel edge cases', () => {
  // Normal value
  assert.strictEqual(clampVanFuel(50), 50)
  // Boundary values
  assert.strictEqual(clampVanFuel(0), 0)
  assert.strictEqual(clampVanFuel(100), 100)
  // Negative values
  assert.strictEqual(clampVanFuel(-10), 0)
  // Overflow values
  assert.strictEqual(clampVanFuel(150), 100)
  // Non-finite values
  assert.strictEqual(clampVanFuel(NaN), 0)
  assert.strictEqual(clampVanFuel(Infinity), 0)
  assert.strictEqual(clampVanFuel(-Infinity), 0)
  // Custom maxFuel
  assert.strictEqual(clampVanFuel(150, 200), 150)
  assert.strictEqual(clampVanFuel(250, 200), 200)
})

test('isForbiddenKey identifies prototype pollution keys', () => {
  // Forbidden keys
  assert.strictEqual(isForbiddenKey('__proto__'), true)
  assert.strictEqual(isForbiddenKey('constructor'), true)
  assert.strictEqual(isForbiddenKey('prototype'), true)

  // Safe keys
  assert.strictEqual(isForbiddenKey('money'), false)
  assert.strictEqual(isForbiddenKey('fame'), false)
  assert.strictEqual(isForbiddenKey('inventory'), false)
  assert.strictEqual(isForbiddenKey(''), false)
  assert.strictEqual(isForbiddenKey(null), false)
  assert.strictEqual(isForbiddenKey(undefined), false)
})
