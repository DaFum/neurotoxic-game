import assert from 'node:assert/strict'
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
  calculateGigFameReward,
  FAME_PROGRESS_CONSTANTS,
  calculateAppliedDelta,
  isForbiddenKey
} from '../../src/utils/gameState'
import { wrapClockHour } from '../../src/utils/gameState/clamps'

test('wrapClockHour wraps fractional values correctly', () => {
  assert.strictEqual(wrapClockHour(11.5), 11.5)
  assert.strictEqual(wrapClockHour(-0.5), 23.5)
})

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
  assert.strictEqual(calculateFameLevel(100), 0) // below level 1 (needs 200)
  assert.strictEqual(calculateFameLevel(199), 0) // just below level 1
  assert.strictEqual(calculateFameLevel(200), 1) // exactly level 1
  assert.strictEqual(calculateFameLevel(800), 2) // exactly level 2
  assert.strictEqual(calculateFameLevel(20000), 10) // level 10
  assert.strictEqual(calculateFameLevel(-500), 0) // Should cap at 0
  assert.strictEqual(calculateFameLevel(null), 0)
  assert.strictEqual(calculateFameLevel(undefined), 0)
})

test('calculateGigFameReward scales successful gigs aggressively enough for shop progression', () => {
  assert.strictEqual(
    calculateGigFameReward(70),
    800,
    'A solid gig should grant high raw fame'
  )
  assert.strictEqual(
    calculateGigFameReward(100),
    1100,
    'A perfect gig should be able to reach the 20-30 gig shop target'
  )
})

test('calculateFameGain returns correct diminishing returns', () => {
  assert.strictEqual(
    calculateFameGain(1100, 0, 2000),
    1100,
    'Before diminishing returns start, raw gain is applied directly'
  )
  assert.strictEqual(
    calculateFameGain(3000, 0, 2000),
    2000,
    'The max gain cap is still enforced'
  )

  const currentFame = FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_START + 1000
  const expectedDiminished = Math.max(
    1,
    Math.round(
      1100 * Math.exp(-1000 * FAME_PROGRESS_CONSTANTS.DIMINISHING_RETURNS_RATE)
    )
  )
  assert.strictEqual(
    calculateFameGain(1100, currentFame, 2000),
    expectedDiminished,
    'Past the late-game threshold, gain is reduced exponentially'
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

test('applyEventDelta preserves deltas when persisted numeric bases are stale', () => {
  const state = {
    player: {
      money: Number.NaN,
      fame: undefined,
      van: {
        fuel: undefined,
        condition: Number.NaN
      }
    },
    band: {
      harmony: Number.NaN,
      luck: Number.NaN,
      members: []
    }
  }
  const delta = {
    player: {
      money: 25,
      fame: 10,
      van: {
        fuel: 7,
        condition: 8
      }
    },
    band: {
      harmony: 4,
      luck: 3
    }
  }

  const nextState = applyEventDelta(state, delta)

  assert.equal(nextState.player.money, 25)
  assert.equal(nextState.player.fame, 10)
  assert.equal(nextState.player.fameLevel, 0)
  assert.equal(nextState.player.van.fuel, 7)
  assert.equal(nextState.player.van.condition, 8)
  assert.equal(nextState.band.harmony, 5)
  assert.equal(nextState.band.luck, 3)
})

test('applyEventDelta ignores non-finite luck/skill deltas and sanitizes non-finite member skill base', () => {
  const state = {
    band: {
      luck: 10,
      members: [
        {
          mood: 50,
          stamina: 50,
          baseStats: { skill: Number.NaN }
        }
      ]
    }
  }
  const delta = {
    band: {
      skill: 1,
      luck: Number.POSITIVE_INFINITY
    }
  }

  const nextState = applyEventDelta(state, delta)

  assert.equal(nextState.band.members[0].baseStats.skill, 6)
  assert.equal(nextState.band.luck, 10)
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

test('applyEventDelta does not overwrite boolean inventory with numeric 0 from non-finite delta', () => {
  const state = {
    band: { inventory: { golden_pick: true } }
  }
  const delta = {
    band: {} // Represents a delta where the non-finite item update was skipped
  }

  const nextState = applyEventDelta(state, delta)
  assert.equal(
    nextState.band.inventory.golden_pick,
    true,
    'Should retain existing boolean values if delta skips inventory update'
  )
})

test('applyEventDelta reverts apply-on-add equipment bonus on stash confiscation', () => {
  const state = {
    band: {
      luck: 12, // 7 baseline + 5 from the equipped item
      stash: {
        c_rusty_strings: {
          id: 'c_rusty_strings',
          type: 'equipment',
          effectType: 'luck',
          value: 5,
          applyOnAdd: true,
          applied: true,
          stacks: null
        }
      }
    }
  }
  const delta = { band: { stashRemove: ['c_rusty_strings'] } }

  const nextState = applyEventDelta(state, delta)
  // Item removed AND its permanent bonus reverted, not orphaned.
  assert.equal(Object.hasOwn(nextState.band.stash, 'c_rusty_strings'), false)
  assert.equal(nextState.band.luck, 7)
})

test('applyEventDelta reverts a single application for apply-on-add equipment with legacy stacks > 1', () => {
  const state = {
    band: {
      luck: 12, // 7 baseline + a single 5 application (apply-on-add applies once)
      stash: {
        c_rusty_strings: {
          id: 'c_rusty_strings',
          type: 'equipment',
          effectType: 'luck',
          value: 5,
          applyOnAdd: true,
          applied: true,
          stacks: 4 // legacy save before stackable→false; must not over-revert
        }
      }
    }
  }
  const delta = { band: { stashRemove: ['c_rusty_strings'] } }

  const nextState = applyEventDelta(state, delta)
  assert.equal(Object.hasOwn(nextState.band.stash, 'c_rusty_strings'), false)
  assert.equal(nextState.band.luck, 7) // reverted by 5, not 5 × 4
})

test('applyEventDelta does not revert effect for an unapplied confiscated item', () => {
  const state = {
    band: {
      luck: 7,
      stash: {
        c_rusty_strings: {
          id: 'c_rusty_strings',
          type: 'equipment',
          effectType: 'luck',
          value: 5,
          applyOnAdd: true,
          applied: false,
          stacks: null
        }
      }
    }
  }
  const delta = { band: { stashRemove: ['c_rusty_strings'] } }

  const nextState = applyEventDelta(state, delta)
  assert.equal(Object.hasOwn(nextState.band.stash, 'c_rusty_strings'), false)
  assert.equal(nextState.band.luck, 7)
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

test('applyInventoryItemDelta rejects non-finite values instead of storing NaN', () => {
  // NaN passes `typeof === 'number'`; the finite guard must drop the delta.
  assert.equal(applyInventoryItemDelta(2, Number.NaN), 2)
  assert.equal(applyInventoryItemDelta(2, Infinity), 2)
  // A corrupted current count collapses to 0 before the addition.
  assert.equal(applyInventoryItemDelta(Number.NaN, 3), 3)
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
  assert.equal(
    Object.hasOwn(applied.band.membersDelta[0] ?? {}, 'prototype'),
    false
  )
})

test('calculateAppliedDelta falls back from non-finite current numeric state', () => {
  const state = {
    player: {
      money: Number.NaN,
      fame: Number.POSITIVE_INFINITY,
      score: Number.NaN,
      van: {
        fuel: Number.NaN,
        condition: Number.POSITIVE_INFINITY
      }
    },
    band: {
      harmony: Number.NaN,
      luck: Number.NaN,
      members: [],
      inventory: {}
    },
    social: {
      controversyLevel: Number.NaN,
      viral: Number.POSITIVE_INFINITY,
      loyalty: Number.NaN
    }
  }
  const delta = {
    player: {
      money: 15,
      fame: 20,
      score: 10,
      van: {
        fuel: 5,
        condition: 6
      }
    },
    band: {
      harmony: 7,
      luck: 2
    },
    social: {
      controversyLevel: 3,
      viral: 4,
      loyalty: 5
    }
  }

  const applied = calculateAppliedDelta(state, delta)

  assert.equal(applied.player.money, 15)
  assert.equal(applied.player.fame, 20)
  assert.equal(applied.score, 10)
  assert.equal(applied.player.van.fuel, 5)
  assert.equal(applied.player.van.condition, 6)
  assert.equal(applied.band.harmony, 7)
  assert.equal(applied.band.luck, 2)
  assert.equal(applied.social.controversyLevel, 3)
  assert.equal(applied.social.viral, 4)
  assert.equal(applied.social.loyalty, 5)
})

test('calculateAppliedDelta emits empty applied delta for missing members', () => {
  const state = {
    band: {
      members: [
        null,
        {
          mood: 50,
          stamina: 50,
          staminaMax: 100
        }
      ]
    }
  }
  const delta = {
    band: {
      membersDelta: [
        { moodChange: -10, staminaChange: -10 },
        { moodChange: -10, staminaChange: -10 }
      ]
    }
  }

  const applied = calculateAppliedDelta(state, delta)

  assert.deepStrictEqual(applied.band.membersDelta[0], Object.create(null))
  assert.deepStrictEqual(
    applied.band.membersDelta[1],
    Object.assign(Object.create(null), { moodChange: -10, staminaChange: -10 })
  )
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
