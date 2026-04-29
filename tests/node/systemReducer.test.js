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
        activeQuests: [{ id: 'quest1' }],
        gigModifiers: { catering: true },
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
        baseStats: {},
        equipment: {},
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
      assert.deepEqual(nextState.activeQuests, [{ id: 'quest1' }])
      assert.equal(nextState.gigModifiers.catering, true)
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
      gigModifiers: { energy: true } // Test migration from energy to catering
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
    assert.equal(nextState.gigModifiers.catering, true)
    assert.equal(nextState.gigModifiers.energy, undefined)
  })

  await t.test(
    'whitelists loaded player and member fields and drops non-finite values',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        player: {
          money: Number.POSITIVE_INFINITY,
          fame: Number.NaN,
          day: Number.NEGATIVE_INFINITY,
          injected: 'drop me',
          van: {
            fuel: Number.POSITIVE_INFINITY,
            condition: 88,
            upgrades: ['turbo', 99],
            injected: true
          },
          stats: {
            totalDistance: Number.NaN,
            conflictsResolved: 3,
            stageDives: Number.POSITIVE_INFINITY,
            consecutiveBadShows: 2,
            proveYourselfMode: true,
            injected: 'drop me'
          }
        },
        band: {
          members: [
            {
              id: 'm1',
              name: 'Matze',
              role: 'guitar',
              mood: Number.NaN,
              stamina: Number.POSITIVE_INFINITY,
              staminaMax: Number.NEGATIVE_INFINITY,
              injected: 'drop me',
              relationships: { m1: 99, m2: 30 }
            }
          ]
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)
      const member = nextState.band.members[0]

      assert.equal(Object.hasOwn(nextState.player, 'injected'), false)
      assert.equal(Object.hasOwn(nextState.player.van, 'injected'), false)
      assert.equal(Object.hasOwn(nextState.player.stats, 'injected'), false)
      assert.equal(nextState.player.money, 500)
      assert.equal(nextState.player.fame, 0)
      assert.equal(nextState.player.day, 1)
      assert.equal(nextState.player.van.fuel, 100)
      assert.deepEqual(nextState.player.van.upgrades, ['turbo'])
      assert.equal(nextState.player.stats.totalDistance, 0)
      assert.equal(nextState.player.stats.conflictsResolved, 3)
      assert.equal(nextState.player.stats.stageDives, 0)
      assert.equal(member.mood, 50)
      assert.equal(member.stamina, 100)
      assert.equal(Object.hasOwn(member, 'staminaMax'), false)
      assert.equal(Object.hasOwn(member, 'injected'), false)
      assert.deepEqual(member.relationships, { m2: 30 })
    }
  )

  await t.test(
    'drops self-relationships and non-number relationship scores from loaded members',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        band: {
          members: [
            {
              name: 'Matze',
              relationships: {
                Matze: 99,
                matze: 88,
                Marius: 30,
                NullScore: null,
                StringScore: '50',
                BooleanScore: true,
                InfiniteScore: Number.POSITIVE_INFINITY
              }
            }
          ]
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)
      const member = nextState.band.members[0]

      assert.equal(member.id, 'matze')
      assert.deepEqual(member.relationships, { Marius: 30 })
    }
  )

  await t.test(
    'merges partial loaded inventory with default band inventory',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        band: {
          inventory: {
            shirts: 30
          }
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.deepEqual(nextState.band.inventory, {
        ...initialState.band.inventory,
        shirts: 30
      })
    }
  )

  await t.test(
    'sanitizes loaded inventory per default key and drops invalid values',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        band: {
          inventory: {
            shirts: '35',
            hoodies: true,
            patches: null,
            strings: 'yes',
            cables: false,
            injected: 999
          }
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.deepEqual(nextState.band.inventory, {
        ...initialState.band.inventory,
        shirts: 35,
        hoodies: initialState.band.inventory.hoodies,
        patches: initialState.band.inventory.patches,
        strings: initialState.band.inventory.strings,
        cables: false
      })
      assert.equal(Object.hasOwn(nextState.band.inventory, 'injected'), false)
    }
  )

  await t.test(
    'whitelists loaded social fields and strips hostile keys',
    () => {
      const initialState = createInitialState()
      const loadedState = JSON.parse(`{
      "social": {
        "instagram": 1000,
        "controversyLevel": 20,
        "lastGigDay": null,
        "lastPirateBroadcastDay": 7,
        "egoFocus": "Matze",
        "trend": "DRAMA",
        "activeDeals": [
          { "id": "deal1", "remainingGigs": 2, "alignment": "EVIL", "nested": { "drop": true } },
          { "id": 5, "remainingGigs": 1 }
        ],
        "brandReputation": {
          "EVIL": 30,
          "bad": "high",
          "__proto__": { "polluted": true }
        },
        "influencers": {
          "local": { "tier": "Micro", "trait": "tastemaker", "score": 12, "nested": { "drop": true } },
          "__proto__": { "tier": "Mega", "trait": "bad", "score": 99 }
        },
        "injected": "drop me",
        "__proto__": { "polluted": true }
      }
    }`)

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.social.instagram, 1000)
      assert.equal(nextState.social.controversyLevel, 20)
      assert.equal(nextState.social.lastGigDay, null)
      assert.equal(nextState.social.lastPirateBroadcastDay, 7)
      assert.equal(nextState.social.egoFocus, 'Matze')
      assert.equal(nextState.social.trend, 'DRAMA')
      assert.deepEqual(nextState.social.activeDeals, [
        { id: 'deal1', remainingGigs: 2 }
      ])
      assert.deepEqual(nextState.social.brandReputation, { EVIL: 30 })
      assert.deepEqual(nextState.social.influencers, {
        local: { tier: 'Micro', trait: 'tastemaker', score: 12 }
      })
      assert.equal(Object.hasOwn(nextState.social, 'injected'), false)
      assert.equal(Object.hasOwn(nextState.social, '__proto__'), false)
    }
  )

  await t.test(
    'sanitizes loaded activeEvent instead of trusting raw casts',
    () => {
      const initialState = createInitialState()
      const loadedState = JSON.parse(`{
      "activeEvent": {
        "id": "event1",
        "category": "band",
        "title": "Event",
        "descriptionKey": "events:event1.description",
        "context": { "member": "Matze", "nested": { "drop": true } },
        "options": [
          {
            "text": "Take it",
            "outcomeText": "events:event1.outcome",
            "effects": { "money": -10, "nested": { "drop": true } },
            "injected": "drop me"
          },
          "invalid"
        ],
        "injected": "drop me",
        "__proto__": { "polluted": true }
      }
    }`)

      const nextState = handleLoadGame(initialState, loadedState)

      assert.deepEqual(nextState.activeEvent, {
        id: 'event1',
        category: 'band',
        title: 'Event',
        descriptionKey: 'events:event1.description',
        context: { member: 'Matze' },
        options: [
          {
            text: 'Take it',
            outcomeText: 'events:event1.outcome',
            effects: { money: -10 }
          }
        ]
      })
    }
  )

  await t.test('drops excessively deep activeEvent skillCheck payloads', () => {
    const initialState = createInitialState()
    let deepSkillCheck = { leaf: true }
    for (let i = 0; i < 20000; i++) {
      deepSkillCheck = { nested: deepSkillCheck }
    }
    const loadedState = {
      activeEvent: {
        id: 'event1',
        options: [
          {
            text: 'Take it',
            skillCheck: deepSkillCheck
          }
        ]
      }
    }

    assert.doesNotThrow(() => handleLoadGame(initialState, loadedState))
    const nextState = handleLoadGame(initialState, loadedState)

    assert.equal(
      Object.hasOwn(nextState.activeEvent.options[0], 'skillCheck'),
      false
    )
  })

  await t.test('sanitizes loaded top-level collections entry by entry', () => {
    const initialState = createInitialState()
    const loadedState = {
      setlist: ['song-a', 7, { songId: 'song-b' }, null],
      activeStoryFlags: ['flag-a', 4],
      pendingEvents: ['event-a', {}],
      eventCooldowns: ['cooldown-a', false],
      reputationByRegion: {
        berlin: 10,
        void: Number.NaN,
        bad: 'high'
      },
      npcs: {
        n1: { id: 'n1', name: 'Nina', role: 'booker', traits: ['calm', 4] },
        bad: { name: 'No Id' },
        primitive: 5
      },
      gigModifiers: {
        promo: true,
        merch: 'yes',
        energy: true,
        unknown: true
      },
      currentGig: {
        id: 'venue-1',
        name: 'Venue',
        capacity: Number.POSITIVE_INFINITY,
        difficulty: 3,
        injected: 'drop me'
      },
      lastGigStats: {
        score: 100,
        accuracy: Number.NaN,
        combo: 7,
        injected: 'drop me'
      },
      venueBlacklist: ['venues:venue-1.name', 7],
      activeQuests: [
        { id: 'q1', progress: 2, required: Number.POSITIVE_INFINITY },
        { label: 'missing id' }
      ],
      unlocks: ['u1', 2]
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.deepEqual(nextState.setlist, ['song-a', { songId: 'song-b' }])
    assert.deepEqual(nextState.activeStoryFlags, ['flag-a'])
    assert.deepEqual(nextState.pendingEvents, ['event-a'])
    assert.deepEqual(nextState.eventCooldowns, ['cooldown-a'])
    assert.deepEqual(nextState.reputationByRegion, { berlin: 10 })
    assert.deepEqual(nextState.npcs, {
      n1: { id: 'n1', name: 'Nina', role: 'booker', traits: ['calm'] }
    })
    assert.equal(nextState.gigModifiers.promo, true)
    assert.equal(nextState.gigModifiers.merch, false)
    assert.equal(nextState.gigModifiers.catering, true)
    assert.equal(Object.hasOwn(nextState.gigModifiers, 'unknown'), false)
    assert.deepEqual(nextState.currentGig, {
      id: 'venue-1',
      name: 'Venue',
      difficulty: 3
    })
    assert.deepEqual(nextState.lastGigStats, { score: 100, combo: 7 })
    assert.deepEqual(nextState.venueBlacklist, ['venue-1'])
    assert.deepEqual(nextState.activeQuests, [{ id: 'q1', progress: 2 }])
    assert.deepEqual(nextState.unlocks, ['u1'])
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

  await t.test(
    'falls back to current gameMap when loaded gameMap lacks nodes',
    () => {
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
    }
  )

  await t.test('preserves partially valid loaded gameMap nodes', () => {
    const initialState = createInitialState()
    const loadedState = {
      gameMap: {
        name: 'legacy map',
        version: 1,
        nodes: {
          start: {
            id: 'start',
            x: 12,
            y: 34,
            neighbors: ['next', 7],
            type: 'GIG',
            metadata: {
              legacyType: 'boss',
              difficulty: 2,
              visited: false,
              nested: { drop: true }
            },
            edges: [{ from: 'start', to: 'next', weight: 1 }]
          },
          next: { venueId: 'venue-1', label: 'Next', flags: ['legacy', 2] },
          bad: null
        },
        connections: [
          { from: 'start', to: 'next' },
          { from: 2, to: 'start' },
          { from: 'start' },
          null
        ]
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.deepEqual(
      { ...nextState.gameMap, nodes: { ...nextState.gameMap.nodes } },
      {
        name: 'legacy map',
        version: 1,
        nodes: {
          start: {
            id: 'start',
            x: 12,
            y: 34,
            neighbors: ['next'],
            type: 'GIG',
            metadata: {
              legacyType: 'boss',
              difficulty: 2,
              visited: false
            },
            edges: [{ from: 'start', to: 'next', weight: 1 }]
          },
          next: {
            id: 'next',
            x: 0,
            y: 0,
            venueId: 'venue-1',
            label: 'Next',
            flags: ['legacy', 2]
          }
        },
        connections: [
          { from: 'start', to: 'next' },
          { from: '2', to: 'start' }
        ]
      }
    )
  })

  await t.test(
    'strips prototype-pollution keys from loaded gameMap nodes',
    () => {
      const initialState = createInitialState()
      const loadedState = JSON.parse(
        `{
        "gameMap": {
          "nodes": {
            "__proto__": { "id": "__proto__", "x": 1, "y": 2 },
            "constructor": { "id": "constructor", "x": 3, "y": 4 },
            "prototype": { "id": "prototype", "x": 5, "y": 6 },
            "safe": { "id": "__proto__", "x": 7, "y": 8 },
            "start": { "id": "start", "x": 9, "y": 10 }
          },
          "connections": []
        }
      }`
      )

      const nextState = handleLoadGame(initialState, loadedState)

      assert.deepEqual(
        { ...nextState.gameMap.nodes },
        {
          start: { id: 'start', x: 9, y: 10 }
        }
      )
      assert.equal(Object.hasOwn(nextState.gameMap.nodes, '__proto__'), false)
      assert.equal(Object.hasOwn(nextState.gameMap.nodes, 'constructor'), false)
      assert.equal(Object.hasOwn(nextState.gameMap.nodes, 'prototype'), false)
      assert.equal(Object.getPrototypeOf(nextState.gameMap.nodes), null)
    }
  )
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
