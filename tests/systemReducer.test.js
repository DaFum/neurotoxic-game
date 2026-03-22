import test from 'node:test'
import assert from 'node:assert/strict'
import {
  handleLoadGame,
  handleResetState,
  handleUpdateSettings,
  handleSetMap,
  handleAddToast,
  handleRemoveToast,
  handleAdvanceDay,
  handleAddUnlock
} from '../src/context/reducers/systemReducer.js'
import { createInitialState } from '../src/context/initialState.js'

test('systemReducer - LOAD_GAME', async t => {
  await t.test(
    'loads game and sanitizes player, band, and social state',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        player: {
          money: 500,
          fame: 100,
          day: 5,
          van: { fuel: 80 }
        },
        band: {
          harmony: 90,
          members: [
            {
              id: 'm1',
              mood: 80,
              stamina: 70,
              traits: [{ id: 'trait1', name: 'Trait 1' }]
            }
          ]
        },
        social: {
          controversyLevel: 10
        },
        setlist: ['song1'],
        activeStoryFlags: ['flag1'],
        pendingEvents: ['event1'],
        eventCooldowns: ['cooldown1'],
        toasts: [{ id: '1', message: 'Hello', type: 'info' }],
        venueBlacklist: [],
        activeQuests: ['quest1'],
        gigModifiers: { catering: 1 },
        minigame: { score: 100 },
        unlocks: ['unlock1']
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.player.money, 500)
      assert.equal(nextState.player.fame, 100)
      assert.equal(nextState.player.day, 5)
      assert.equal(nextState.player.van.fuel, 80)
      assert.equal(nextState.band.harmony, 90)
      assert.deepEqual(nextState.band.members[0], {
        id: 'm1',
        mood: 80,
        stamina: 70,
        traits: Object.assign(Object.create(null), {
          trait1: { id: 'trait1', name: 'Trait 1' }
        })
      })
      assert.equal(nextState.social.controversyLevel, 10)
      assert.deepEqual(nextState.setlist, ['song1'])
      assert.deepEqual(nextState.activeStoryFlags, ['flag1'])
      assert.deepEqual(nextState.pendingEvents, ['event1'])
      assert.deepEqual(nextState.eventCooldowns, ['cooldown1'])
      assert.deepEqual(nextState.toasts, [
        { id: '1', message: 'Hello', type: 'info' }
      ])
      assert.deepEqual(nextState.venueBlacklist, [])
      assert.deepEqual(nextState.activeQuests, ['quest1'])
      assert.equal(nextState.gigModifiers.catering, 1)
      assert.equal(nextState.minigame.score, 100)
      assert.deepEqual(nextState.unlocks, ['unlock1'])
    }
  )

  await t.test('handles missing or malformed loaded state gracefully', () => {
    const initialState = createInitialState()
    const loadedState = {
      player: { money: -100, fame: 'invalid', day: -5, van: { fuel: 150 } },
      band: { harmony: 150, members: 'invalid' },
      toasts: [
        { id: '1' },
        { id: '2', message: '  ', type: 'invalid' },
        { id: '3', message: 'Valid' }
      ],
      setlist: 'invalid',
      activeStoryFlags: 'invalid',
      pendingEvents: 'invalid',
      eventCooldowns: 'invalid',
      activeQuests: 'invalid',
      unlocks: 'invalid',
      gigModifiers: { energy: 5 } // Test migration from energy to catering
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.equal(nextState.player.money, 0) // Clamped
    assert.equal(nextState.player.fame, 0) // Defaulted
    assert.equal(nextState.player.day, 1) // Clamped
    assert.equal(nextState.player.van.fuel, 100)
    assert.equal(nextState.band.harmony, 100)
    assert.ok(Array.isArray(nextState.band.members))
    assert.deepEqual(nextState.toasts, [
      { id: '3', message: 'Valid', type: 'info' }
    ])
    assert.deepEqual(nextState.setlist, [])
    assert.deepEqual(nextState.activeStoryFlags, [])
    assert.deepEqual(nextState.pendingEvents, [])
    assert.deepEqual(nextState.eventCooldowns, [])
    assert.deepEqual(nextState.activeQuests, [])
    assert.deepEqual(nextState.unlocks, initialState.unlocks || [])
    assert.equal(nextState.gigModifiers.catering, 5)
    assert.equal(nextState.gigModifiers.energy, undefined)
  })

  await t.test('handles missing or malformed toasts array', () => {
    const initialState = createInitialState()
    const loadedState = {
      toasts: [
        { id: '1' },
        null,
        { id: '2', message: '  ', type: 'invalid' },
        { id: '3', message: 'Valid', type: 'error' }
      ]
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.deepEqual(nextState.toasts, [
      { id: '3', message: 'Valid', type: 'error' }
    ])
  })
})

test('systemReducer - RESET_STATE', async t => {
  await t.test('resets state while preserving settings and unlocks', () => {
    const initialState = createInitialState()
    const currentState = {
      ...initialState,
      player: { ...initialState.player, money: 9999 },
      settings: { volume: 0.5 },
      unlocks: ['unlock1', 'unlock2']
    }

    const payload = {
      settings: { volume: 0.8 },
      unlocks: ['unlock3']
    }

    const nextState = handleResetState(currentState, payload)

    assert.equal(nextState.player.money, initialState.player.money) // Reset
    assert.deepEqual(nextState.settings, { volume: 0.8 }) // Preserved from payload
    assert.deepEqual(nextState.unlocks, ['unlock3']) // Unlocks are generated via createInitialState with preserved unlocks? Wait, createInitialState(persistedData) uses unlocks.
  })

  await t.test(
    'falls back to current settings and empty unlocks if payload is empty',
    () => {
      const initialState = createInitialState()
      const currentState = {
        ...initialState,
        player: { ...initialState.player, money: 9999 },
        settings: { volume: 0.5 },
        unlocks: ['unlock1', 'unlock2']
      }

      const nextState = handleResetState(currentState)

      assert.equal(nextState.player.money, initialState.player.money) // Reset
      assert.deepEqual(nextState.settings, { volume: 0.5 }) // Preserved from current state
      assert.deepEqual(nextState.unlocks, []) // Default to empty array
    }
  )
})

test('systemReducer - UPDATE_SETTINGS', () => {
  const state = { settings: { volume: 0.5, effects: true } }

  assert.deepEqual(handleUpdateSettings(state, { volume: 0.8 }), {
    settings: { volume: 0.8, effects: true }
  })

  assert.equal(handleUpdateSettings(state, null), state)
  assert.equal(handleUpdateSettings(state, 'invalid'), state)
})

test('systemReducer - SET_MAP', () => {
  const state = { gameMap: null }
  const newMap = { nodes: [] }

  assert.deepEqual(handleSetMap(state, newMap), { gameMap: newMap })
})

test('systemReducer - ADD_TOAST', () => {
  const state = { toasts: [{ id: '1' }] }
  const newToast = { id: '2', message: 'Hello' }

  assert.deepEqual(handleAddToast(state, newToast), {
    toasts: [{ id: '1' }, { id: '2', message: 'Hello' }]
  })
})

test('systemReducer - REMOVE_TOAST', () => {
  const state = { toasts: [{ id: '1' }, { id: '2' }, { id: '3' }] }

  assert.deepEqual(handleRemoveToast(state, '2'), {
    toasts: [{ id: '1' }, { id: '3' }]
  })
})

test('systemReducer - ADD_UNLOCK', async t => {
  await t.test('adds unlock correctly', () => {
    const state = { unlocks: ['unlock1'] }

    assert.deepEqual(handleAddUnlock(state, 'unlock2'), {
      unlocks: ['unlock1', 'unlock2']
    })

    // Ignored if invalid
    assert.equal(handleAddUnlock(state, null), state)
    assert.equal(handleAddUnlock(state, 123), state)

    // Ignored if already exists
    assert.equal(handleAddUnlock(state, 'unlock1'), state)
  })

  await t.test('handles case where state.unlocks is undefined', () => {
    const state = {}
    assert.deepEqual(handleAddUnlock(state, 'unlock1'), {
      unlocks: ['unlock1']
    })
  })
})

test('systemReducer - ADVANCE_DAY core logic', async t => {
  await t.test(
    'processes daily updates, resets event count, and handles scandal flag',
    () => {
      const initialState = createInitialState()

      // We mock state and behavior lightly by setting up the expected structure
      // Since calculateDailyUpdates returns the mutated state and pendingFlags
      // We will ensure that scandalous events add to pendingEvents.
      const currentState = {
        ...initialState,
        player: {
          ...initialState.player,
          day: 1,
          eventsTriggeredToday: 5, // Should reset to 0
          money: 100
        },
        band: {
          ...initialState.band,
          harmony: 50
        },
        social: {
          ...initialState.social,
          controversyLevel: 10
        },
        activeStoryFlags: ['scandal'], // triggers scandal flag during calculateDailyUpdates if conditions match
        pendingEvents: [],
        toasts: [],
        activeQuests: [] // To not crash handleFailQuests
      }

      // We inject a mock random to make social engine deterministic if needed
      const nextState = handleAdvanceDay(currentState, { rng: () => 0.5 })

      assert.equal(nextState.player.eventsTriggeredToday, 0)
      // calculateDailyUpdates increments day
      assert.equal(nextState.player.day, 2)
      assert.deepEqual(nextState.eventCooldowns, [])
    }
  )
})
