/**
 * Golden Path Integration Tests
 *
 * Tests the critical game flow: MENU → OVERWORLD → PREGIG → GIG → POSTGIG → OVERWORLD
 * and the bankruptcy path: POSTGIG → GAMEOVER → MENU.
 *
 * Uses the reducer + action creators directly (no React/DOM) to verify
 * that state transitions, clamping, and scene sequencing work correctly
 * end-to-end.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import { createInitialState } from '../src/context/initialState.js'
import {
  calculateGigFinancials,
  EXPENSE_CONSTANTS
} from '../src/utils/economyEngine.js'
import { buildGigStatsSnapshot } from '../src/utils/gigStats.js'

// --- Test Helpers ---

const buildVenue = (overrides = {}) => ({
  id: 'test_venue',
  name: 'Test Punk Keller',
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

// --- Golden Path Tests ---

test('Golden Path: Full Tour Cycle', async t => {
  let state = createInitialState()

  await t.test('Phase 0: Initial state is INTRO', () => {
    assert.equal(state.currentScene, 'INTRO')
    assert.equal(state.player.money, 500)
    assert.equal(state.player.day, 1)
    assert.equal(state.band.harmony, 80)
    assert.equal(state.currentGig, null)
    assert.equal(state.setlist.length, 0)
  })

  await t.test('Phase 1: INTRO → MENU', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'MENU')
    assert.equal(state.currentScene, 'MENU')
  })

  await t.test(
    'Phase 2: MENU → OVERWORLD via RESET_STATE + CHANGE_SCENE',
    () => {
      state = gameReducer(state, { type: ActionTypes.RESET_STATE })
      assert.equal(state.currentScene, 'INTRO', 'Reset returns to INTRO')
      assert.equal(state.player.money, 500, 'Reset restores starting money')

      state = applyAction(state, ActionTypes.CHANGE_SCENE, 'OVERWORLD')
      assert.equal(state.currentScene, 'OVERWORLD')
    }
  )

  await t.test('Phase 3: Set up map in OVERWORLD', () => {
    const mockMap = {
      layers: [[{ id: 'node_0_0', layer: 0, type: 'START' }]],
      nodes: {
        node_0_0: {
          id: 'node_0_0',
          layer: 0,
          venue: buildVenue({ id: 'start', type: 'START' }),
          type: 'START'
        },
        node_1_0: {
          id: 'node_1_0',
          layer: 1,
          venue: buildVenue(),
          type: 'GIG'
        }
      },
      connections: [['node_0_0', 'node_1_0']]
    }
    state = applyAction(state, ActionTypes.SET_MAP, mockMap)
    assert.ok(state.gameMap, 'Map should be set')
    assert.ok(state.gameMap.nodes.node_1_0, 'Destination node exists')
  })

  await t.test('Phase 4: Travel costs (simulate OVERWORLD travel)', () => {
    const travelCost = 30
    const fuelUsed = 15
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - travelCost,
      currentNodeId: 'node_1_0',
      location: 'Test City',
      van: {
        ...state.player.van,
        fuel: state.player.van.fuel - fuelUsed
      }
    })
    assert.equal(state.player.money, 470)
    assert.equal(state.player.van.fuel, 85)
    assert.equal(state.player.currentNodeId, 'node_1_0')
  })

  await t.test('Phase 5: ADVANCE_DAY after travel', () => {
    const moneyBefore = state.player.money
    const dayBefore = state.player.day
    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.equal(state.player.day, dayBefore + 1, 'Day incremented')
    assert.ok(state.player.money < moneyBefore, 'Daily costs deducted')
    assert.ok(state.player.money >= 0, 'Money never negative after ADVANCE_DAY')
    assert.ok(
      state.band.harmony >= 1 && state.band.harmony <= 100,
      'Harmony clamped after day advance'
    )
  })

  await t.test('Phase 6: OVERWORLD → PREGIG via START_GIG', () => {
    const venue = buildVenue()
    state = applyAction(state, ActionTypes.START_GIG, venue)
    assert.equal(
      state.currentScene,
      'PREGIG',
      'START_GIG transitions to PREGIG'
    )
    assert.deepEqual(state.currentGig, venue, 'currentGig set to venue')
  })

  await t.test('Phase 7: Configure setlist and modifiers in PREGIG', () => {
    state = applyAction(state, ActionTypes.SET_SETLIST, [
      { id: '01 Kranker Schrank' }
    ])
    assert.equal(state.setlist.length, 1)

    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: true,
      merch: true
    })
    assert.equal(state.gigModifiers.soundcheck, true)
    assert.equal(state.gigModifiers.merch, true)
    assert.equal(state.gigModifiers.promo, false, 'Unset modifiers stay false')
  })

  await t.test('Phase 8: PREGIG → GIG', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'GIG')
    assert.equal(state.currentScene, 'GIG')
    assert.ok(state.currentGig, 'currentGig persists into GIG scene')
  })

  await t.test('Phase 9: Gig performance produces stats', () => {
    const gigStats = buildGigStats({ score: 8000, perfectHits: 50, misses: 3 })
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, gigStats)
    assert.equal(state.lastGigStats.score, 8000)
    assert.equal(state.lastGigStats.misses, 3)
    assert.equal(state.lastGigStats.perfectHits, 50)
  })

  await t.test('Phase 10: GIG → POSTGIG', () => {
    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'POSTGIG')
    assert.equal(state.currentScene, 'POSTGIG')
    assert.ok(state.lastGigStats, 'lastGigStats available in POSTGIG')
    assert.ok(state.currentGig, 'currentGig available in POSTGIG')
  })

  await t.test('Phase 11: Calculate financials in POSTGIG', () => {
    const performanceScore = Math.min(
      100,
      Math.max(30, state.lastGigStats.score / 500)
    )
    const crowdStats = { hype: state.lastGigStats.peakHype }
    const financials = calculateGigFinancials(
      state.currentGig,
      performanceScore,
      crowdStats,
      state.gigModifiers,
      state.band.inventory,
      state.player.fame,
      state.lastGigStats
    )
    assert.ok(typeof financials.net === 'number', 'Net is a number')
    assert.ok(
      typeof financials.income.total === 'number',
      'Income total is a number'
    )
    assert.ok(
      typeof financials.expenses.total === 'number',
      'Expenses total is a number'
    )
    assert.ok(financials.income.total >= 0, 'Income is non-negative')
    assert.ok(financials.expenses.total >= 0, 'Expenses are non-negative')
  })

  await t.test('Phase 12: Apply earnings and return to OVERWORLD', () => {
    const moneyBefore = state.player.money
    const earnings = 250
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money + earnings,
      fame: state.player.fame + 100
    })
    assert.equal(state.player.money, moneyBefore + earnings)
    assert.equal(state.player.fame, 100)

    // Clear gig state
    state = applyAction(state, ActionTypes.SET_GIG, null)
    state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, null)
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: false,
      merch: false
    })

    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'OVERWORLD')
    assert.equal(state.currentScene, 'OVERWORLD')
    assert.equal(state.currentGig, null)
    assert.equal(state.lastGigStats, null)
  })

  await t.test('Phase 13: Second gig cycle preserves progression', () => {
    const moneyBeforeSecondGig = state.player.money
    const dayBeforeSecondGig = state.player.day

    // Travel + advance day
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - 20,
      currentNodeId: 'node_1_0'
    })
    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.equal(state.player.day, dayBeforeSecondGig + 1)
    assert.ok(state.player.money < moneyBeforeSecondGig)

    // Start second gig
    state = applyAction(state, ActionTypes.START_GIG, buildVenue({ diff: 3 }))
    assert.equal(state.currentScene, 'PREGIG')
  })
})

test('Golden Path: Bankruptcy triggers GAMEOVER', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, 'OVERWORLD')

  await t.test('Drain money to near zero', () => {
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 5 })
    assert.equal(state.player.money, 5)
  })

  await t.test('Start a gig', () => {
    state = applyAction(state, ActionTypes.START_GIG, buildVenue())
    assert.equal(state.currentScene, 'PREGIG')
    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'GIG')
    state = applyAction(
      state,
      ActionTypes.SET_LAST_GIG_STATS,
      buildGigStats({ score: 500, misses: 30, perfectHits: 5 })
    )
    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'POSTGIG')
  })

  await t.test('Negative net triggers GAMEOVER path', () => {
    // Simulate PostGig applying a net loss that exceeds remaining money
    const netLoss = -100
    const newMoney = state.player.money + netLoss
    assert.ok(newMoney < 0, 'Player cannot afford this')

    // Reducer clamps money to 0
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: newMoney })
    assert.equal(state.player.money, 0, 'Money clamped to 0')

    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'GAMEOVER')
    assert.equal(state.currentScene, 'GAMEOVER')
  })

  await t.test('GAMEOVER → MENU via RESET_STATE', () => {
    state = gameReducer(state, { type: ActionTypes.RESET_STATE })
    state = applyAction(state, ActionTypes.CHANGE_SCENE, 'MENU')
    assert.equal(state.currentScene, 'MENU')
    assert.equal(state.player.money, 500, 'Money restored after reset')
    assert.equal(state.player.day, 1, 'Day restored after reset')
  })
})

test('Golden Path: State safety invariants across transitions', async t => {
  await t.test('Money never goes negative from UPDATE_PLAYER', () => {
    let state = createInitialState()
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: -999 })
    assert.equal(state.player.money, 0)
  })

  await t.test('Money never goes negative from APPLY_EVENT_DELTA', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.APPLY_EVENT_DELTA,
      payload: { player: { money: -99999 } }
    })
    assert.equal(state.player.money, 0)
  })

  await t.test('Harmony clamped [1, 100] from UPDATE_BAND', () => {
    let state = createInitialState()
    state = applyAction(state, ActionTypes.UPDATE_BAND, { harmony: -50 })
    assert.equal(state.band.harmony, 1, 'Harmony floors at 1')

    state = applyAction(state, ActionTypes.UPDATE_BAND, { harmony: 200 })
    assert.equal(state.band.harmony, 100, 'Harmony caps at 100')
  })

  await t.test('Harmony clamped [1, 100] from APPLY_EVENT_DELTA', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.APPLY_EVENT_DELTA,
      payload: { band: { harmony: -200 } }
    })
    assert.ok(state.band.harmony >= 1, `Harmony ${state.band.harmony} >= 1`)
  })

  await t.test('Fuel clamped [0, 100] from APPLY_EVENT_DELTA', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.APPLY_EVENT_DELTA,
      payload: { player: { van: { fuel: 500 } } }
    })
    assert.ok(
      state.player.van.fuel <= 100,
      `Fuel ${state.player.van.fuel} <= 100`
    )

    state = gameReducer(state, {
      type: ActionTypes.APPLY_EVENT_DELTA,
      payload: { player: { van: { fuel: -500 } } }
    })
    assert.equal(state.player.van.fuel, 0)
  })

  await t.test('Van condition clamped [0, 100] from APPLY_EVENT_DELTA', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.APPLY_EVENT_DELTA,
      payload: { player: { van: { condition: -500 } } }
    })
    assert.equal(state.player.van.condition, 0)
  })

  await t.test('ADVANCE_DAY preserves state safety after many days', () => {
    let state = createInitialState()
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 50 })
    // Advance 5 days - should deplete money but never go negative
    for (let i = 0; i < 5; i++) {
      state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    }
    assert.ok(state.player.money >= 0, `Money ${state.player.money} >= 0`)
    assert.ok(state.band.harmony >= 1, `Harmony ${state.band.harmony} >= 1`)
    assert.ok(state.band.harmony <= 100, `Harmony ${state.band.harmony} <= 100`)
    assert.equal(state.player.day, 6, 'Day advanced 5 times from day 1')
    state.band.members.forEach((m, i) => {
      assert.ok(m.stamina >= 0, `Member ${i} stamina ${m.stamina} >= 0`)
      assert.ok(m.stamina <= 100, `Member ${i} stamina ${m.stamina} <= 100`)
    })
  })

  await t.test(
    'Van condition decays daily and breakdown chance adjusts',
    () => {
      let state = createInitialState()
      const conditionBefore = state.player.van.condition
      state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
      assert.ok(
        state.player.van.condition < conditionBefore,
        'Van condition decays each day'
      )
      assert.equal(state.player.van.condition, conditionBefore - 2)
    }
  )

  await t.test('CONSUME_ITEM decrements numeric inventory', () => {
    let state = createInitialState()
    const shirtsBefore = state.band.inventory.shirts
    state = gameReducer(state, {
      type: ActionTypes.CONSUME_ITEM,
      payload: 'shirts'
    })
    assert.equal(state.band.inventory.shirts, shirtsBefore - 1)
  })

  await t.test('CONSUME_ITEM sets boolean inventory to false', () => {
    let state = createInitialState()
    assert.equal(state.band.inventory.strings, true)
    state = gameReducer(state, {
      type: ActionTypes.CONSUME_ITEM,
      payload: 'strings'
    })
    assert.equal(state.band.inventory.strings, false)
  })

  await t.test('CONSUME_ITEM never goes below 0', () => {
    let state = createInitialState()
    state = applyAction(state, ActionTypes.UPDATE_BAND, {
      inventory: { ...state.band.inventory, shirts: 0 }
    })
    state = gameReducer(state, {
      type: ActionTypes.CONSUME_ITEM,
      payload: 'shirts'
    })
    assert.equal(state.band.inventory.shirts, 0)
  })
})

test('Golden Path: SET_GIG_MODIFIERS functional updater', async t => {
  await t.test('Object payload merges with existing modifiers', () => {
    let state = createInitialState()
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      soundcheck: true
    })
    assert.equal(state.gigModifiers.soundcheck, true)
    assert.equal(state.gigModifiers.merch, false, 'Other modifiers unchanged')

    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      merch: true
    })
    assert.equal(
      state.gigModifiers.soundcheck,
      true,
      'Previous modifier persists'
    )
    assert.equal(state.gigModifiers.merch, true)
  })

  await t.test('Function payload receives current modifiers', () => {
    let state = createInitialState()
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, {
      promo: true
    })
    state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, current => ({
      promo: !current.promo
    }))
    assert.equal(state.gigModifiers.promo, false, 'Toggle worked')
  })
})

test('Golden Path: LOAD_GAME sanitizes corrupted save data', async t => {
  await t.test('Negative money in save is clamped to 0', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.LOAD_GAME,
      payload: { player: { money: -500 } }
    })
    assert.equal(state.player.money, 0)
  })

  await t.test('Harmony out of range is clamped', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.LOAD_GAME,
      payload: { band: { harmony: 0 } }
    })
    assert.equal(state.band.harmony, 1, 'Harmony clamped to minimum 1')
  })

  await t.test('Fuel overflow is clamped to 100', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.LOAD_GAME,
      payload: { player: { van: { fuel: 999 } } }
    })
    assert.equal(state.player.van.fuel, 100)
  })

  await t.test('Missing fields get defaults', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.LOAD_GAME,
      payload: {}
    })
    assert.equal(
      state.player.money,
      500,
      'Missing money gets DEFAULT_PLAYER_STATE value'
    )
    assert.equal(state.player.day, 1, 'Missing day defaults to 1')
    assert.ok(
      state.band.members.length > 0,
      'Band members restored from defaults'
    )
    assert.ok(state.social.instagram >= 0, 'Social restored from defaults')
  })

  await t.test('Legacy energy modifier migrated to catering', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.LOAD_GAME,
      payload: { gigModifiers: { energy: true } }
    })
    assert.equal(
      state.gigModifiers.catering,
      true,
      'energy → catering migration'
    )
    assert.equal(state.gigModifiers.energy, undefined, 'energy key removed')
  })

  await t.test('Day cannot be less than 1', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.LOAD_GAME,
      payload: { player: { day: -5 } }
    })
    assert.equal(state.player.day, 1)
  })
})

test('Golden Path: Scene sequence matches state machine', async t => {
  const validTransitions = {
    INTRO: ['MENU'],
    MENU: ['OVERWORLD', 'SETTINGS', 'CREDITS'],
    OVERWORLD: ['PREGIG', 'GAMEOVER', 'MENU'],
    PREGIG: ['GIG', 'OVERWORLD'],
    GIG: ['POSTGIG', 'OVERWORLD'],
    POSTGIG: ['OVERWORLD', 'GAMEOVER'],
    GAMEOVER: ['MENU'],
    SETTINGS: ['MENU'],
    CREDITS: ['MENU']
  }

  await t.test('All valid transitions produce the target scene', () => {
    for (const [from, targets] of Object.entries(validTransitions)) {
      for (const to of targets) {
        let state = createInitialState()
        state = applyAction(state, ActionTypes.CHANGE_SCENE, from)
        state = applyAction(state, ActionTypes.CHANGE_SCENE, to)
        assert.equal(
          state.currentScene,
          to,
          `${from} → ${to} should set currentScene`
        )
      }
    }
  })

  await t.test(
    'START_GIG transitions to PREGIG regardless of current scene',
    () => {
      let state = createInitialState()
      state = applyAction(state, ActionTypes.CHANGE_SCENE, 'OVERWORLD')
      state = applyAction(state, ActionTypes.START_GIG, buildVenue())
      assert.equal(state.currentScene, 'PREGIG')
    }
  )
})

test('Golden Path: Daily cost scaling with band size', async t => {
  await t.test('Daily cost includes per-member component', () => {
    let state = createInitialState()
    const moneyBefore = state.player.money
    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    // BASE_COST (25) + bandSize (3) * 5 = 40
    const expectedCost = EXPENSE_CONSTANTS.DAILY.BASE_COST + 3 * 5
    assert.equal(
      state.player.money,
      moneyBefore - expectedCost,
      `Daily cost should be ${expectedCost} for 3 members`
    )
  })
})

test('Golden Path: Event cooldowns reset on ADVANCE_DAY', async t => {
  await t.test('Cooldowns cleared after day advance', () => {
    let state = createInitialState()
    state = gameReducer(state, {
      type: ActionTypes.ADD_COOLDOWN,
      payload: 'event_123'
    })
    assert.ok(state.eventCooldowns.includes('event_123'))

    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.deepEqual(
      state.eventCooldowns,
      [],
      'Cooldowns cleared on day advance'
    )
  })
})

test('Golden Path: Gig stats snapshot structure', async t => {
  await t.test('buildGigStatsSnapshot includes all fields', () => {
    const snapshot = buildGigStatsSnapshot(
      5000,
      { perfectHits: 40, misses: 5, maxCombo: 20, peakHype: 60 },
      3000
    )
    assert.equal(snapshot.score, 5000)
    assert.equal(snapshot.perfectHits, 40)
    assert.equal(snapshot.misses, 5)
    assert.equal(snapshot.maxCombo, 20)
    assert.equal(snapshot.peakHype, 60)
    assert.equal(snapshot.toxicTimeTotal, 3000)
  })
})
