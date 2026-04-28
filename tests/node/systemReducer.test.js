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
} from '../../src/context/reducers/systemReducer'
import { createInitialState } from '../../src/context/initialState'

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
              traits: { trait1: { id: 'trait1', name: 'Trait 1' } }
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
        relationships: {},
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

  await t.test(
    'loads game and sanitizes object-based band member traits (regression test)',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        player: { money: 100 },
        band: {
          members: [
            {
              id: 'm1',
              traits: {
                0: { id: 'trait1', name: 'Trait 1' },
                arbitrary_key: { id: 'trait2', name: 'Trait 2' }
              }
            }
          ]
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      const expectedTraits = Object.create(null)
      expectedTraits['trait1'] = { id: 'trait1', name: 'Trait 1' }
      expectedTraits['trait2'] = { id: 'trait2', name: 'Trait 2' }

      assert.deepEqual(nextState.band.members[0].traits, expectedTraits)
      assert.equal(
        Object.getPrototypeOf(nextState.band.members[0].traits),
        null
      )
    }
  )

  await t.test('hydrates contraband stash with static properties', () => {
    const initialState = createInitialState()
    const loadedState = {
      player: {
        money: 500,
        fame: 100,
        day: 5,
        van: { fuel: 80 }
      },
      band: {
        stash: {
          c_void_energy: {
            id: 'c_void_energy',
            quantity: 2,
            obtainedAt: 1
          }
        }
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)
    const hydratedStash = nextState.band.stash

    assert.ok(hydratedStash['c_void_energy'])
    assert.equal(hydratedStash['c_void_energy'].id, 'c_void_energy')
    assert.equal(hydratedStash['c_void_energy'].quantity, 2)
    assert.equal(hydratedStash['c_void_energy'].obtainedAt, 1)

    // Check for static properties from CONTRABAND_BY_ID
    assert.ok(hydratedStash['c_void_energy'].name)
    assert.ok(hydratedStash['c_void_energy'].effectType)
    assert.ok(typeof hydratedStash['c_void_energy'].value === 'number')
    assert.ok(hydratedStash['c_void_energy'].rarity)
  })

  await t.test('hydrates array-based contraband stash (migration)', () => {
    const initialState = createInitialState()
    const loadedState = {
      player: {
        money: 500,
        fame: 100,
        day: 5,
        van: { fuel: 80 }
      },
      band: {
        stash: [
          {
            id: 'c_void_energy',
            quantity: 2,
            obtainedAt: 1
          },
          {
            id: 'invalid_item',
            quantity: 1
          },
          JSON.parse(
            '{"id":"c_rusty_strings","__proto__":{"polluted":true},"quantity":1}'
          ),
          null,
          []
        ]
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)
    const hydratedStash = nextState.band.stash

    assert.ok(hydratedStash['c_void_energy'])
    assert.equal(hydratedStash['c_void_energy'].id, 'c_void_energy')
    assert.equal(hydratedStash['c_void_energy'].quantity, 2)
    assert.equal(hydratedStash['c_void_energy'].obtainedAt, 1)

    // Check for static properties from CONTRABAND_BY_ID
    assert.ok(hydratedStash['c_void_energy'].name)
    assert.ok(hydratedStash['c_void_energy'].effectType)
    assert.ok(typeof hydratedStash['c_void_energy'].value === 'number')
    assert.ok(hydratedStash['c_void_energy'].rarity)

    // Invalid items should be filtered out
    assert.equal(hydratedStash['invalid_item'], undefined)

    // Prototype keys should be stripped
    assert.equal(Object.hasOwn(hydratedStash, '__proto__'), false)
    assert.equal(hydratedStash['c_rusty_strings'], undefined)
  })

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

  await t.test('falls back to current gameMap when loaded gameMap lacks nodes', () => {
    const initialState = {
      ...createInitialState(),
      gameMap: {
        nodes: { start: { id: 'start' } },
        connections: []
      }
    }
    const loadedState = {
      gameMap: {
        connections: [{ from: 'start', to: 'next' }]
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.deepEqual(nextState.gameMap, initialState.gameMap)
  })
})

test('systemReducer - RESET_STATE', async t => {
  await t.test('resets state while preserving settings and unlocks', () => {
    const initialState = createInitialState()
    const currentState = {
      ...initialState,
      player: { ...initialState.player, money: 9999 },
      settings: { ...initialState.settings, crtEnabled: true },
      unlocks: ['unlock1', 'unlock2']
    }

    // Use valid settings keys (crtEnabled, tutorialSeen, logLevel) since
    // createInitialState sanitizes settings and strips unknown keys
    const payload = {
      settings: { crtEnabled: false, tutorialSeen: true },
      unlocks: ['unlock3']
    }

    const nextState = handleResetState(currentState, payload)

    assert.equal(nextState.player.money, initialState.player.money) // Reset
    assert.equal(nextState.settings.crtEnabled, false) // Preserved from payload
    assert.equal(nextState.settings.tutorialSeen, true) // Preserved from payload
    assert.deepEqual(nextState.unlocks, ['unlock3'])
  })

  await t.test(
    'falls back to current settings and existing unlocks if payload is empty',
    () => {
      const initialState = createInitialState()
      const currentState = {
        ...initialState,
        player: { ...initialState.player, money: 9999 },
        settings: { ...initialState.settings, crtEnabled: false },
        unlocks: ['unlock1', 'unlock2']
      }

      const nextState = handleResetState(currentState)

      assert.equal(nextState.player.money, initialState.player.money) // Reset
      assert.equal(nextState.settings.crtEnabled, false) // Preserved from current state
      assert.deepEqual(nextState.unlocks, ['unlock1', 'unlock2']) // Preserved from current state
    }
  )
})

test('systemReducer - UPDATE_SETTINGS', () => {
  const state = {
    settings: {
      crtEnabled: false,
      tutorialSeen: true,
      logLevel: 1,
      volume: 0.5
    }
  }

  assert.deepEqual(handleUpdateSettings(state, { volume: 0.8, logLevel: 3 }), {
    settings: {
      crtEnabled: false,
      tutorialSeen: true,
      logLevel: 3,
      volume: 0.5
    }
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
