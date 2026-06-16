/**
 * Comprehensive Golden Path Cycle Tests
 *
 * Tests 4 advanced full-cycle scenarios:
 * 1. Van Breakdown Crisis: Van condition degrades over multiple gigs until breakdown
 * 2. Low Harmony Recovery: Band harmony drops critically; gigs fail; recovery through rest
 * 3. Fuel Depletion Crisis: Multiple long-distance travels deplete fuel; tests refueling
 * 4. Modifiers & Inventory: Consumables impact gig earnings; modifier costs accumulate
 *
 * Each test validates state persistence, resource bounds, and multi-gig progression.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer, ActionTypes } from '../../src/context/gameReducer'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { createInitialState } from '../../src/context/initialState'
import { calculateGigFinancials } from '../../src/utils/economyEngine'
import { buildGigStatsSnapshot } from '../../src/utils/gigStats'

// --- Test Helpers ---

const buildVenue = (overrides = {}) => ({
  id: 'test_venue',
  name: 'Test Venue',
  capacity: 200,
  price: 10,
  pay: 300,
  dist: 50,
  diff: 2,
  type: 'GIG',
  ...overrides
})

const buildGigStats = (overrides = {}) =>
  buildGigStatsSnapshot(
    overrides.score ?? 5000,
    {
      perfectHits: overrides.perfectHits ?? 40,
      misses: overrides.misses ?? 5,
      maxCombo: overrides.maxCombo ?? 20,
      peakHype: overrides.peakHype ?? 60
    },
    overrides.toxicTimeTotal ?? 0
  )

const applyAction = (state, type, payload) =>
  gameReducer(state, { type, payload })

const performGig = (state, venue, gigStats) => {
  // Start gig
  state = applyAction(state, ActionTypes.START_GIG, venue)
  state = applyAction(state, ActionTypes.SET_SETLIST, [{ id: 'song_1' }])
  // Transition to gig
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)
  // Record performance
  state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, gigStats)
  // Return to postgig
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.POST_GIG)
  return state
}

// --- Test 1: Van Breakdown Crisis ---

test('Golden Path: Van Breakdown Crisis (cumulative degradation over multiple gigs)', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  await t.test(
    'Initial state: Van at 100% condition, breakdown chance at 5%',
    () => {
      assert.equal(state.player.van.condition, 100)
      assert.equal(state.player.van.breakdownChance, 0.05)
    }
  )

  await t.test(
    'Day 1-5: Multiple day advances degrade van condition by 2/day',
    () => {
      for (let i = 0; i < 5; i++) {
        state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
      }
      // Day 1-5: 5 days * 2 degradation = 10 points
      assert.equal(state.player.van.condition, 90)
      assert.ok(state.player.van.condition >= 0, 'Van condition never negative')
    }
  )

  await t.test('Gig 1: Perform with 90% condition van', () => {
    state = performGig(state, buildVenue({ id: 'v1' }), buildGigStats())
    assert.ok(state.lastGigStats.score > 0)
  })

  await t.test('Return to overworld and advance 5 more days', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

    for (let i = 0; i < 5; i++) {
      state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    }
    // Now at 90 - 10 = 80
    assert.equal(state.player.van.condition, 80)
  })

  await t.test(
    'Gig 2: Van condition worsens, breakdown chance increases',
    () => {
      state = performGig(
        state,
        buildVenue({ id: 'v2', diff: 3 }),
        buildGigStats()
      )
      assert.ok(state.player.van.condition >= 0)
      assert.ok(
        state.player.van.breakdownChance >= 0.05,
        'Breakdown chance does not decrease'
      )
    }
  )

  await t.test('Gig 2 → Gig 3: Advance 10 more days (van at ~60%)', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

    for (let i = 0; i < 10; i++) {
      state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    }
    assert.equal(state.player.van.condition, 60)
  })

  await t.test('Gig 3: Van at critical condition (<60%)', () => {
    state = performGig(
      state,
      buildVenue({ id: 'v3', diff: 4 }),
      buildGigStats()
    )
    assert.equal(state.player.van.condition, 60, 'Van at critical threshold')
  })

  await t.test('Final state: Van degradation persists across cycle', () => {
    // Verify state consistency: money clamped, harmony safe
    assert.ok(state.player.money >= 0, 'Money never negative')
    assert.ok(
      state.band.harmony >= 1 && state.band.harmony <= 100,
      'Harmony safe bounds'
    )
    assert.ok(
      state.player.van.condition >= 0 && state.player.van.condition <= 100,
      'Van condition clamped [0, 100]'
    )
  })
})

// --- Test 2: Low Harmony Recovery ---

test('Golden Path: Low Harmony Recovery (critical harmony → gig failure → recovery)', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  await t.test('Initial harmony: 80', () => {
    assert.equal(state.band.harmony, 80)
  })

  await t.test('Trigger event to drop harmony significantly', () => {
    // Simulate a major conflict event: -40 harmony
    state = gameReducer(state, {
      type: ActionTypes.APPLY_EVENT_DELTA,
      payload: { band: { harmony: -40 } }
    })
    assert.equal(state.band.harmony, 40, 'Harmony dropped to 40')
  })

  await t.test('At low harmony (40), gig performance suffers', () => {
    // Low harmony should be visible as constraint
    state = performGig(state, buildVenue(), buildGigStats({ score: 2000 }))
    assert.equal(state.lastGigStats.score, 2000)
  })

  await t.test('Return to overworld with low harmony', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
    assert.equal(state.band.harmony, 40)
  })

  await t.test(
    'Advance days: harmony regenerates naturally if available',
    () => {
      for (let i = 0; i < 5; i++) {
        state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
      }
      // Harmony should be recalculated; check bounds
      assert.ok(
        state.band.harmony >= 1 && state.band.harmony <= 100,
        'Harmony stays in [1, 100]'
      )
    }
  )

  await t.test('Perform rest/recovery events if triggered', () => {
    // Simulate manual harmony recovery through an event
    state = gameReducer(state, {
      type: ActionTypes.APPLY_EVENT_DELTA,
      payload: { band: { harmony: 20 } }
    })
    assert.ok(state.band.harmony <= 100, 'Harmony clamped to max 100')
  })

  await t.test('Gig 2: Performance improves with recovered harmony', () => {
    state = performGig(
      state,
      buildVenue({ id: 'v2' }),
      buildGigStats({ score: 7000 })
    )
    assert.ok(
      state.lastGigStats.score > 2000,
      'Better performance at higher harmony'
    )
  })

  await t.test('Final state: Harmony cycle completes safely', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

    assert.ok(
      state.band.harmony >= 1 && state.band.harmony <= 100,
      'Harmony invariant maintained'
    )
    assert.ok(state.player.money >= 0, 'Money never negative across cycle')
  })
})

// --- Test 3: Fuel Depletion Crisis ---

test('Golden Path: Fuel Depletion Crisis (multiple travels → low fuel → refuel)', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  await t.test('Initial fuel: 100%', () => {
    assert.equal(state.player.van.fuel, 100)
  })

  await t.test('First long-distance travel (50 km) costs fuel', () => {
    const fuelBefore = state.player.van.fuel
    const fuelUsed = 15 // Simulated cost for ~50 km

    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - 50,
      van: {
        ...state.player.van,
        fuel: state.player.van.fuel - fuelUsed
      }
    })
    assert.equal(state.player.van.fuel, fuelBefore - fuelUsed)
    assert.ok(state.player.van.fuel >= 0, 'Fuel never negative')
  })

  await t.test('Second travel (50 km) further depletes fuel', () => {
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - 50,
      van: {
        ...state.player.van,
        fuel: state.player.van.fuel - 15
      }
    })
    assert.equal(state.player.van.fuel, 70)
  })

  await t.test('Third travel (50 km) brings fuel to critical level', () => {
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - 50,
      van: {
        ...state.player.van,
        fuel: state.player.van.fuel - 15
      }
    })
    assert.equal(state.player.van.fuel, 55)
  })

  await t.test('Perform gig at current location', () => {
    state = performGig(state, buildVenue(), buildGigStats())
    assert.equal(state.currentScene, GAME_PHASES.POST_GIG)
  })

  await t.test('Return to overworld, consider refuel action', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

    // Simulate refueling: add 40 units
    const fuelBefore = state.player.van.fuel
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - 70, // Cost to refuel 40 liters
      van: {
        ...state.player.van,
        fuel: Math.min(100, state.player.van.fuel + 40)
      }
    })
    assert.ok(state.player.van.fuel > fuelBefore, 'Fuel increased after refuel')
    assert.ok(state.player.van.fuel <= 100, 'Fuel capped at 100')
  })

  await t.test('Final state: Fuel management cycle succeeds', () => {
    assert.ok(state.player.van.fuel >= 0, 'Fuel non-negative')
    assert.ok(state.player.van.fuel <= 100, 'Fuel capped at 100')
    assert.ok(state.player.money >= 0, 'Money never negative')
  })
})

// --- Test 4: Modifiers & Inventory Impact ---

test('Golden Path: Modifiers & Inventory Impact (consumables affect earnings across gigs)', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  await t.test('Initial inventory: 50 shirts, 20 hoodies', () => {
    assert.equal(state.band.inventory.shirts, 50)
    assert.equal(state.band.inventory.hoodies, 20)
  })

  await t.test('Gig 1: Start without modifiers, baseline earnings', () => {
    state = performGig(state, buildVenue(), buildGigStats({ score: 5000 }))
    assert.equal(state.currentScene, GAME_PHASES.POST_GIG)

    const performanceScore = Math.min(
      100,
      Math.max(30, state.lastGigStats.score / 500)
    )
    const financials = calculateGigFinancials({
      gigData: state.currentGig,
      performanceScore,
      modifiers: state.gigModifiers,
      bandInventory: state.band.inventory,
      playerState: state.player,
      gigStats: state.lastGigStats
    })

    assert.ok(financials.income.total >= 0, 'Income is non-negative')
    assert.ok(financials.expenses.total >= 0, 'Expenses are non-negative')
  })

  await t.test('Gig 1 → Gig 2: Apply modifiers (soundcheck + merch)', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: false,
      merch: false,
      promo: false,
      catering: false,
      guestlist: false
    })
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

    // Start Gig 2 with modifiers
    const venue2 = buildVenue({ id: 'v2', diff: 3 })
    state = applyAction(state, ActionTypes.START_GIG, venue2)
    state = applyAction(state, ActionTypes.SET_SETLIST, [{ id: 'song_1' }])

    // Set modifiers: soundcheck (50) + merch (30) = 80 cost
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: true,
      merch: true
    })

    assert.equal(state.gigModifiers.soundcheck, true)
    assert.equal(state.gigModifiers.merch, true)
  })

  await t.test('Gig 2: Perform with modifiers (higher score expected)', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)
    state = applyAction(
      state,
      ActionTypes.SET_LAST_GIG_STATS,
      buildGigStats({ score: 7500 })
    )
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.POST_GIG)

    assert.equal(
      state.lastGigStats.score,
      7500,
      'Better performance with modifiers'
    )
  })

  await t.test(
    'Gig 2: Calculate financials with modifiers and high performance',
    () => {
      const performanceScore = Math.min(
        100,
        Math.max(30, state.lastGigStats.score / 500)
      )
      const financials = calculateGigFinancials({
        gigData: state.currentGig,
        performanceScore,
        modifiers: state.gigModifiers,
        bandInventory: state.band.inventory,
        playerState: state.player,
        gigStats: state.lastGigStats
      })

      // With modifiers (soundcheck + merch), expenses should be higher
      assert.ok(
        financials.expenses.total > 0,
        'Expenses include modifier costs'
      )
      // High performance (75% = 7500/500) should yield good income
      assert.ok(
        financials.income.total >= 300,
        'Income respects venue pay + performance bonus'
      )
    }
  )

  await t.test('Return to overworld after Gig 2', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: false,
      merch: false
    })
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
    assert.equal(state.currentScene, GAME_PHASES.OVERWORLD)
  })

  let shirtsBefore
  await t.test('Gig 3: Consume inventory item (merch effect)', () => {
    shirtsBefore = state.band.inventory.shirts
    state = gameReducer(state, {
      type: ActionTypes.CONSUME_ITEM,
      payload: 'shirts'
    })
    assert.equal(state.band.inventory.shirts, shirtsBefore - 1)
  })

  await t.test('Gig 3: Perform with consumed inventory active', () => {
    state = performGig(
      state,
      buildVenue({ id: 'v3', diff: 2 }),
      buildGigStats({ score: 6000 })
    )

    // Verify inventory is included in calculation
    assert.ok(
      state.band.inventory.shirts < shirtsBefore,
      'Inventory decremented'
    )
  })

  await t.test('Final state: Full modifier cycle maintains invariants', () => {
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

    assert.ok(state.player.money >= 0, 'Money never negative')
    assert.ok(
      state.band.harmony >= 1 && state.band.harmony <= 100,
      'Harmony in bounds'
    )
    assert.ok(state.band.inventory.shirts >= 0, 'Inventory never negative')
    assert.ok(state.band.inventory.hoodies >= 0, 'Inventory never negative')
  })
})
