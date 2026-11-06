import test from 'node:test'
import assert from 'node:assert/strict'
import {
  handleLoadGame,
  handleSetTerminalOutcome,
  handleResetState,
  handleUpdateSettings,
  handleSetMap,
  handleAddToast,
  handleRemoveToast,
  handleAdvanceDay,
  handleAddUnlock,
  handleSetPendingBandHQOpen,
  handleSetPendingSupplyStopInventory,
  handleSetPendingRiskEvent
} from '../../src/context/reducers/systemReducer'
import { createInitialState } from '../../src/context/initialState'
import { gameReducer } from '../../src/context/gameReducer'
import { advanceDay } from '../../src/context/actionCreators'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { nextSeed } from '../../src/utils/seededRng'
import { SONGS_DB } from '../../src/data/songs'
import { FLAGS } from '../../src/data/flags.registry'
import { logger } from '../../src/utils/logger'
import { CURRENT_SAVE_VERSION } from '../../src/context/reducers/migrations'
import {
  createPersistedState,
  createRawLoadPayload
} from '../../src/context/usePersistence'
import { addQuest } from '../../src/domain/questAdd'
import { checkDeadlines } from '../../src/domain/questDeadlines'
import { QuestProgress } from '../../src/utils/questProgress'
import { EXPEDITION_REGIONS } from '../../src/data/expedition/regions'
import { getExpeditionIntelCapability } from '../../src/domain/expedition/nodeIntel'
import { createFixedClock } from '../../src/utils/clock'
import {
  FIXTURE_RUN_SEED,
  startedState
} from '../expeditionLifecycleFixture.js'

// ADVANCE_DAY takes no `rng` function: daily rolls come from `dayRngStream`.
// A run of neutral mid-range rolls stands in for the old `rng: () => 0.5`.
const HALF_ROLLS = new Array(256).fill(0.5)

test('loading progress preserves the current global preferences', () => {
  const state = createInitialState()
  state.settings.crtEnabled = false
  state.settings.gamepadLaneBindings = [3, 2, 1]
  const loaded = {
    ...state,
    settings: {
      ...state.settings,
      crtEnabled: true,
      gamepadLaneBindings: [0, 1, 2]
    }
  }
  const next = handleLoadGame(state, loaded)
  assert.equal(next.settings.crtEnabled, false)
  assert.deepEqual(next.settings.gamepadLaneBindings, [3, 2, 1])
})

// Loaded setlists are validated against the song catalog, so these tests must
// use real ids rather than placeholders.
const [CATALOG_SONG_A, CATALOG_SONG_B] = SONGS_DB.map(song => song.id)

test('handleLoadGame clamps and bounds persisted regional reputation', () => {
  // JSON.parse keeps __proto__ as an own key, unlike an object literal.
  const hostile = JSON.parse('{"__proto__": 5}')
  hostile.berlin = 9000
  hostile.hamburg = -9000
  // Underscore-free keys: the load migration folds `a_b` into region `a`.
  for (let i = 0; i < 150; i++) hostile[`junk${i}`] = 1

  const nextState = handleLoadGame(createInitialState(), {
    reputationByRegion: hostile
  })

  const result = nextState.reputationByRegion
  assert.equal(result.berlin, 100)
  assert.equal(result.hamburg, -100)
  assert.ok(!Object.hasOwn(result, '__proto__'))
  // The cap counts accepted entries, so real regions are never crowded out
  // by junk keys ahead of them.
  assert.equal(Object.keys(result).length, 100)
})

test('handleAdvanceDay ignores non-finite expired harmony effect values', () => {
  const createState = () => {
    const state = createInitialState()
    state.player.money = 10000
    state.band.harmony = 50
    state.rngSeed = 123
    return state
  }
  const stateWithExpiredEffect = createState()
  const controlState = createState()
  const payload = {
    dayRngStream: HALF_ROLLS,
    nextRngSeed: stateWithExpiredEffect.rngSeed
  }
  stateWithExpiredEffect.band.activeContrabandEffects = [
    {
      effectType: 'harmony',
      value: Number.NaN,
      remainingDuration: 1
    }
  ]

  const nextState = handleAdvanceDay(stateWithExpiredEffect, payload)
  const controlNextState = handleAdvanceDay(controlState, payload)

  assert.equal(nextState.band.harmony, controlNextState.band.harmony)
})

test('handleLoadGame restores bounded social and player state invariants', () => {
  const initialState = {
    ...createInitialState(),
    gameMap: { nodes: { stale: { id: 'stale' } }, connections: [] }
  }
  const nextState = handleLoadGame(initialState, {
    player: {
      day: 4.8,
      van: { condition: -20, breakdownChance: 9 }
    },
    band: {
      inventory: { shirts: -10, hoodies: 1.75, patches: '12' }
    },
    social: { scenePresence: 72 },
    gameMap: null
  })

  assert.equal(nextState.player.day, 4)
  assert.equal(nextState.player.van.condition, 0)
  assert.equal(nextState.player.van.breakdownChance, 0.5)
  assert.equal(nextState.band.inventory.shirts, 0)
  assert.equal(nextState.band.inventory.hoodies, 1)
  assert.equal(nextState.band.inventory.patches, 100)
  assert.equal(nextState.social.scenePresence, 72)
  assert.equal(nextState.gameMap, null)
})

test('handleLoadGame migrates duplicate legacy upgrade IDs to canonical IDs', () => {
  const state = createInitialState()
  const nextState = handleLoadGame(state, {
    player: {
      hqUpgrades: ['guitar_custom', 'hq_inst_guitar_custom', 'hq_room_coffee'],
      van: {
        upgrades: [
          'van_suspension',
          'hq_van_suspension',
          'van_sound_system',
          'van_storage',
          'guitar_custom',
          'drum_trigger',
          'bass_sansamp',
          'unrelated_upgrade'
        ]
      }
    }
  })

  assert.deepEqual(nextState.player.hqUpgrades, [
    'hq_inst_guitar_custom',
    'hq_room_coffee'
  ])
  assert.deepEqual(nextState.player.van.upgrades, [
    'hq_van_suspension',
    'hq_van_sound_system',
    'hq_van_storage',
    'hq_inst_guitar_custom',
    'hq_inst_drum_trigger',
    'hq_inst_bass_sansamp',
    'unrelated_upgrade'
  ])
})

test('handleAdvanceDay ignores non-finite expired additive effect values', () => {
  const createState = () => {
    const state = createInitialState()
    state.player.money = 10000
    state.rngSeed = 123
    state.band.performance = {
      ...state.band.performance,
      guitarDifficulty: 1.5
    }
    state.band.luck = 4
    state.band.style = 5
    state.band.tourSuccess = 6
    state.band.gigModifier = 7
    state.band.tempo = 8
    state.band.practiceGain = 9
    state.band.crit = 10
    state.band.affinity = 11
    state.band.crowdControl = 12
    state.band.members = state.band.members.map(member => ({
      ...member,
      staminaMax: 100
    }))
    return state
  }
  const stateWithExpiredEffects = createState()
  const controlState = createState()
  const payload = {
    dayRngStream: HALF_ROLLS,
    nextRngSeed: stateWithExpiredEffects.rngSeed
  }
  stateWithExpiredEffects.band.activeContrabandEffects = [
    'guitar_difficulty',
    'stamina_max',
    'luck',
    'style',
    'tour_success',
    'gig_modifier',
    'tempo',
    'practice_gain',
    'crit',
    'affinity',
    'crowd_control'
  ].map(effectType => ({
    effectType,
    value: Number.NaN,
    remainingDuration: 1
  }))

  const nextState = handleAdvanceDay(stateWithExpiredEffects, payload)
  const controlNextState = handleAdvanceDay(controlState, payload)

  assert.equal(
    nextState.band.performance?.guitarDifficulty,
    controlNextState.band.performance?.guitarDifficulty
  )
  assert.deepEqual(
    nextState.band.members.map(member => member.staminaMax),
    controlNextState.band.members.map(member => member.staminaMax)
  )
  assert.equal(nextState.band.luck, controlNextState.band.luck)
  assert.equal(nextState.band.style, controlNextState.band.style)
  assert.equal(nextState.band.tourSuccess, controlNextState.band.tourSuccess)
  assert.equal(nextState.band.gigModifier, controlNextState.band.gigModifier)
  assert.equal(nextState.band.tempo, controlNextState.band.tempo)
  assert.equal(nextState.band.practiceGain, controlNextState.band.practiceGain)
  assert.equal(nextState.band.crit, controlNextState.band.crit)
  assert.equal(nextState.band.affinity, controlNextState.band.affinity)
  assert.equal(nextState.band.crowdControl, controlNextState.band.crowdControl)
})

test('handleAdvanceDay reverts effects on non-finite band stats without persisting NaN', () => {
  const state = createInitialState()
  state.player.money = 10000
  state.rngSeed = 123
  // Stale-save corruption: the stat itself is NaN while the expiring effect
  // value is finite. `?? 0` would let NaN flow through the subtraction.
  state.band.luck = Number.NaN
  state.band.tempo = Number.NaN
  state.band.activeContrabandEffects = [
    { effectType: 'luck', value: 2, remainingDuration: 1 },
    { effectType: 'tempo', value: 3, remainingDuration: 1 }
  ]
  const payload = {
    dayRngStream: HALF_ROLLS,
    nextRngSeed: state.rngSeed
  }

  const nextState = handleAdvanceDay(state, payload)

  assert.ok(Number.isFinite(nextState.band.luck))
  assert.ok(Number.isFinite(nextState.band.tempo))
})

test('handleAdvanceDay floors every reverted zero-floor additive field at zero', () => {
  const state = createInitialState()
  state.player.money = 10000
  state.rngSeed = 123
  const fields = {
    luck: 'luck',
    style: 'style',
    tour_success: 'tourSuccess',
    gig_modifier: 'gigModifier',
    tempo: 'tempo',
    practice_gain: 'practiceGain',
    crit: 'crit',
    affinity: 'affinity',
    crowd_control: 'crowdControl'
  }
  for (const field of Object.values(fields)) state.band[field] = 1
  state.band.activeContrabandEffects = Object.keys(fields).map(effectType => ({
    effectType,
    value: 5,
    remainingDuration: 1
  }))

  const nextState = handleAdvanceDay(state, {
    dayRngStream: HALF_ROLLS,
    nextRngSeed: state.rngSeed
  })

  for (const field of Object.values(fields)) {
    assert.equal(nextState.band[field], 0, `${field} must be floored at 0`)
  }
})

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
        setlist: [CATALOG_SONG_A],
        activeStoryFlags: [FLAGS.COMEBACK_TRIGGERED],
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
      assert.deepEqual(nextState.setlist, [{ id: CATALOG_SONG_A }])
      assert.deepEqual(nextState.activeStoryFlags, [FLAGS.COMEBACK_TRIGGERED])
      assert.deepEqual(nextState.pendingEvents, ['event1'])
      assert.deepEqual(nextState.eventCooldowns, ['cooldown1'])
      assert.deepEqual(nextState.toasts, [
        { id: '1', message: 'Hello', type: 'info' }
      ])
      assert.deepEqual(nextState.venueBlacklist, [])
      assert.deepEqual(nextState.activeQuests, [
        { id: 'quest1', status: 'active', startedOnDay: 0 }
      ])
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

  await t.test('preserves practice metadata on loaded currentGig', () => {
    const initialState = createInitialState()
    const loadedState = {
      currentGig: {
        id: 'practice_room',
        name: 'Practice Room',
        isPractice: true,
        sourceScene: GAME_PHASES.MENU
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.equal(nextState.currentGig?.isPractice, true)
    assert.equal(nextState.currentGig?.sourceScene, GAME_PHASES.MENU)
  })

  await t.test('drops practice sourceScene outside return allowlist', () => {
    const initialState = createInitialState()
    const loadedState = {
      currentGig: {
        id: 'practice_room',
        name: 'Practice Room',
        isPractice: true,
        sourceScene: GAME_PHASES.PRE_GIG
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.equal(nextState.currentGig?.isPractice, true)
    assert.equal(nextState.currentGig?.sourceScene, undefined)
  })

  await t.test(
    'stale gig data on a loaded save never reopens gig/post-gig UI',
    () => {
      const initialState = createInitialState()
      // A tampered/legacy save claiming a post-gig scene with leftover gig data
      // (including a leaderboard-bearing songId) and stale rhythm stats.
      const loadedState = {
        currentScene: GAME_PHASES.POST_GIG,
        currentGig: {
          id: 'old_gig',
          name: 'Old Venue',
          songId: 'some_song'
        },
        lastGigStats: {
          score: 9999,
          misses: 0,
          accuracy: 100,
          combo: 50,
          maxCombo: 50
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      // handleLoadGame always lands the player on OVERWORLD, so neither the GIG
      // nor POST_GIG scene can run from a load. The leaderboard submit happens
      // during gig completion and practice-return happens in endGig — both are
      // scene-gated, so stale currentGig/lastGigStats stay inert after load.
      assert.equal(nextState.currentScene, GAME_PHASES.OVERWORLD)
      assert.notEqual(nextState.currentScene, GAME_PHASES.GIG)
      assert.notEqual(nextState.currentScene, GAME_PHASES.POST_GIG)
      // Not a practice gig, so the practice-return side channel is inert too.
      assert.notEqual(nextState.currentGig?.isPractice, true)
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

  await t.test(
    'stash hydration: canonical definition fields win over save data',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        player: { money: 500, fame: 100, day: 5, van: { fuel: 80 } },
        band: {
          stash: {
            c_void_energy: {
              id: 'c_void_energy',
              instanceId: 'inst-1',
              // Hostile/corrupted save data trying to override definition fields
              effectType: 'harmony',
              value: 'NaN-bait',
              type: 'equipment',
              maxStacks: 9999,
              stacks: 'not-a-number'
            }
          }
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)
      const item = nextState.band.stash['c_void_energy']

      assert.ok(item)
      // Canonical fields from CONTRABAND_BY_ID must win
      assert.equal(item.effectType, 'stamina')
      assert.equal(item.value, 50)
      assert.equal(item.type, 'consumable')
      assert.equal(item.maxStacks, 5)
      // Per-instance fields survive; invalid stacks falls back to 1
      assert.equal(item.instanceId, 'inst-1')
      assert.equal(item.stacks, 1)
    }
  )

  await t.test(
    'gigModifiers hydration: current catering key wins over legacy energy alias',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        player: { money: 500, fame: 100, day: 5, van: { fuel: 80 } },
        gigModifiers: { catering: true, energy: false }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.gigModifiers.catering, true)
    }
  )

  await t.test(
    'gigModifiers hydration: legacy energy alias still migrates when catering is absent',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        player: { money: 500, fame: 100, day: 5, van: { fuel: 80 } },
        gigModifiers: { energy: true }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.gigModifiers.catering, true)
    }
  )

  await t.test(
    'gigModifiers hydration: damaged_gear survives LOAD_GAME and bad values are dropped',
    () => {
      const kept = handleLoadGame(createInitialState(), {
        gigModifiers: { promo: true, damaged_gear: true }
      })
      assert.equal(kept.gigModifiers.damaged_gear, true)
      assert.equal(kept.gigModifiers.promo, true)

      const dropped = handleLoadGame(createInitialState(), {
        gigModifiers: { damaged_gear: 'yes', unknown_flag: true }
      })
      assert.equal(Object.hasOwn(dropped.gigModifiers, 'damaged_gear'), false)
      assert.equal(Object.hasOwn(dropped.gigModifiers, 'unknown_flag'), false)
    }
  )

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

  await t.test('rejects negative loaded member staminaMax values', () => {
    const initialState = createInitialState()
    const loadedState = {
      band: {
        members: [
          {
            id: 'm1',
            name: 'Matze',
            stamina: 80,
            staminaMax: -20
          }
        ]
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)
    const member = nextState.band.members[0]

    assert.equal(member.stamina, 80)
    assert.equal(Object.hasOwn(member, 'staminaMax'), false)
  })

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

  await t.test('drops empty relationship keys from loaded members', () => {
    const initialState = createInitialState()
    const loadedState = {
      band: {
        members: [
          {
            id: 'm1',
            name: 'Matze',
            relationships: { '': 50, Marius: 30 }
          }
        ]
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)
    const member = nextState.band.members[0]

    assert.equal(Object.hasOwn(member.relationships, ''), false)
    assert.deepEqual(member.relationships, { Marius: 30 })
  })

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
        shirts: initialState.band.inventory.shirts,
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
      // 'deal1' has no BRAND_DEALS_BY_ID entry: unknown deals are dropped on
      // load because a stub without type/offer matches no runtime consumer.
      assert.deepEqual(nextState.social.activeDeals, [])
      assert.deepEqual(nextState.social.brandReputation, { EVIL: 30 })
      assert.deepEqual(nextState.social.influencers, {
        local: { tier: 'Micro', trait: 'tastemaker', score: 12 }
      })
      assert.equal(Object.hasOwn(nextState.social, 'injected'), false)
      assert.equal(Object.hasOwn(nextState.social, '__proto__'), false)
    }
  )

  await t.test(
    'rehydrates known active deals from the brand deal registry on load',
    () => {
      const initialState = createInitialState()
      const loadedState = JSON.parse(`{
      "social": {
        "activeDeals": [
          { "id": "energy_drink_cx", "remainingGigs": 3, "type": "TAMPERED", "offer": { "perGig": 99999 } }
        ]
      }
    }`)

      const nextState = handleLoadGame(initialState, loadedState)
      const deal = nextState.social.activeDeals[0]

      // Registry fields win over persisted blobs; only remainingGigs is
      // player progress. Without type/offer, hasActiveSponsorship and
      // per-gig payouts silently stop matching after a save/load cycle.
      assert.equal(deal.id, 'energy_drink_cx')
      assert.equal(deal.remainingGigs, 3)
      assert.equal(deal.type, 'SPONSORSHIP')
      // The earned per-gig payout survives a load, capped at twice the
      // catalog value so a tampered blob cannot mint money (#3385).
      assert.equal(deal.offer.perGig, 100)
    }
  )

  await t.test(
    'drops loaded active deals when remainingGigs is non-integer or non-positive',
    () => {
      const initialState = createInitialState()
      const loadedState = JSON.parse(`{
      "social": {
        "activeDeals": [
          { "id": "energy_drink_cx", "remainingGigs": 2.5 }
        ]
      }
    }`)

      const nextState = handleLoadGame(initialState, loadedState)
      assert.equal(nextState.social.activeDeals.length, 0)

      const negativeState = handleLoadGame(
        initialState,
        JSON.parse(
          `{"social":{"activeDeals":[{"id":"energy_drink_cx","remainingGigs":-3}]}}`
        )
      )
      assert.equal(negativeState.social.activeDeals.length, 0)

      const zeroState = handleLoadGame(
        initialState,
        JSON.parse(
          `{"social":{"activeDeals":[{"id":"energy_drink_cx","remainingGigs":0}]}}`
        )
      )
      assert.equal(zeroState.social.activeDeals.length, 0)
    }
  )

  await t.test('drops active deals with unknown registry ids on load', () => {
    const initialState = createInitialState()
    const loadedState = JSON.parse(`{
      "social": {
        "activeDeals": [
          { "id": "removed_in_patch", "remainingGigs": 3 },
          { "id": "energy_drink_cx", "remainingGigs": 2 }
        ]
      }
    }`)

    const nextState = handleLoadGame(initialState, loadedState)

    assert.equal(nextState.social.activeDeals.length, 1)
    assert.equal(nextState.social.activeDeals[0].id, 'energy_drink_cx')
  })

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
      setlist: [CATALOG_SONG_A, 7, { songId: CATALOG_SONG_B }, null],
      activeStoryFlags: [FLAGS.SAW_CRISIS_50, 4],
      pendingEvents: ['event-a', {}],
      pendingForeclosureNotices: [
        'tourbus_chassis',
        'bad_kind',
        'tourbus_chassis',
        7
      ],
      eventCooldowns: ['cooldown-a', false],
      reputationByRegion: {
        berlin: 10,
        void: Number.NaN,
        bad: 'high'
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
        maxCombo: 11,
        failed: true,
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

    // Sanitized entries are normalized to the canonical save-path shape;
    // `{ songId }` carries no valid string `id`, so it is dropped.
    assert.deepEqual(nextState.setlist, [{ id: CATALOG_SONG_A }])
    assert.deepEqual(nextState.activeStoryFlags, [FLAGS.SAW_CRISIS_50])
    assert.deepEqual(nextState.pendingEvents, ['event-a'])
    assert.deepEqual(nextState.pendingForeclosureNotices, ['tourbus_chassis'])
    assert.deepEqual(nextState.eventCooldowns, ['cooldown-a'])
    assert.deepEqual(nextState.reputationByRegion, { berlin: 10 })
    assert.equal(nextState.gigModifiers.promo, true)
    assert.equal(nextState.gigModifiers.merch, false)
    assert.equal(nextState.gigModifiers.catering, true)
    assert.equal(Object.hasOwn(nextState.gigModifiers, 'unknown'), false)
    assert.deepEqual(nextState.currentGig, {
      id: 'venue-1',
      name: 'Venue',
      difficulty: 3
    })
    assert.deepEqual(nextState.lastGigStats, {
      score: 100,
      combo: 7,
      maxCombo: 11,
      failed: true
    })
    assert.deepEqual(nextState.venueBlacklist, ['venue-1'])
    assert.deepEqual(nextState.activeQuests, [
      { id: 'q1', progress: 2, status: 'active', startedOnDay: 0 }
    ])
    assert.deepEqual(nextState.unlocks, ['u1'])
  })

  await t.test(
    'strips the retired npcs field from old saves while loading the rest',
    () => {
      const nextState = handleLoadGame(createInitialState(), {
        player: { money: 777 },
        npcs: { n1: { id: 'n1', name: 'Nina', role: 'booker' } }
      })

      assert.equal(nextState.player.money, 777)
      assert.equal(Object.hasOwn(nextState, 'npcs'), false)
    }
  )

  await t.test('normalizes a legacy bare-string setlist on load', () => {
    const nextState = handleLoadGame(createInitialState(), {
      setlist: [CATALOG_SONG_A]
    })

    assert.deepEqual(nextState.setlist, [{ id: CATALOG_SONG_A }])
  })

  await t.test('normalizes a rich-object setlist on load', () => {
    const nextState = handleLoadGame(createInitialState(), {
      setlist: [{ id: CATALOG_SONG_B, name: 'Song B', bpm: 180 }]
    })

    // Only the canonical `id` survives; the save path stores nothing else.
    assert.deepEqual(nextState.setlist, [{ id: CATALOG_SONG_B }])
  })

  await t.test('drops loaded setlist entries without a valid string id', () => {
    const nextState = handleLoadGame(createInitialState(), {
      setlist: [{ songId: 'song-c' }, { id: 7 }, {}, null, 42, ['song-d']]
    })

    assert.deepEqual(nextState.setlist, [])
  })

  await t.test('drops loaded setlist entries with no catalog song', () => {
    // An empty or forged id resolves to no song yet would still count toward
    // `setlist.length`, which the Band HQ practice gate reads.
    const nextState = handleLoadGame(createInitialState(), {
      setlist: ['', { id: '' }, 'deleted_or_forged_song', CATALOG_SONG_A]
    })

    assert.deepEqual(nextState.setlist, [{ id: CATALOG_SONG_A }])
  })

  await t.test(
    'migrates nested active quest failure penalties while sanitizing loaded quests',
    () => {
      const initialState = createInitialState()
      const loadedState = JSON.parse(`{
        "activeQuests": [
          {
            "id": "QUEST_APOLOGY_TOUR",
            "label": "Apology Tour",
            "deadline": 7,
            "failurePenalty": {
              "social": {
                "controversyLevel": 25,
                "bad": null,
                "infinite": 1e999
              },
              "band": {
                "harmony": -20
              },
              "__proto__": {
                "polluted": true
              }
            }
          }
        ]
      }`)

      const nextState = handleLoadGame(initialState, loadedState)

      // Load is a migration boundary: the legacy nested record is converted to
      // tagged failurePenalties and the legacy field is dropped, so nothing
      // downstream has to read two schemas. Unrecognized keys (`bad`) and
      // non-finite values (`infinite`) carry no penalty and are not emitted.
      assert.deepEqual(nextState.activeQuests, [
        {
          id: 'QUEST_APOLOGY_TOUR',
          status: 'active',
          startedOnDay: 0,
          label: 'Apology Tour',
          deadline: 7,
          failurePenalties: [
            { type: 'social.controversy', amount: 25 },
            { type: 'band.harmony', amount: -20 }
          ]
        }
      ])
      assert.equal(
        Object.hasOwn(nextState.activeQuests[0], 'failurePenalty'),
        false
      )
      assert.equal(Object.hasOwn(nextState.activeQuests[0], '__proto__'), false)
      // Inherited read, not own: real pollution surfaces here.
      assert.equal({}.polluted, undefined)
    }
  )

  await t.test(
    'migrates registry-backed active quests to runtime fields on load',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        activeQuests: [
          {
            id: 'quest_viral_dance',
            label: 'Legacy Viral Dance',
            description: 'Legacy description',
            deadline: 12,
            progress: 50,
            required: 500,
            rewardType: 'fame',
            rewardData: { fame: 500 },
            rewards: [{ type: 'money', amount: 999999 }],
            failurePenalty: { social: { controversyLevel: 5 } },
            scopeKey: 'berlin',
            startedOnDay: 4,
            status: 'active'
          }
        ]
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.deepEqual(nextState.activeQuests, [
        {
          id: 'quest_viral_dance',
          deadline: 12,
          progress: 50,
          required: 500,
          scopeKey: 'berlin',
          status: 'active',
          startedOnDay: 4
        }
      ])
      assert.equal(Object.hasOwn(nextState.activeQuests[0], 'rewards'), false)
    }
  )

  const inlineDelivery = {
    id: 'inline_delivery',
    label: 'Inline delivery',
    description: 'Travel twice',
    kind: 'repeatable',
    repeatPolicy: 'cooldown',
    cooldownDays: 4,
    progress: 0,
    required: 2,
    deadline: 10,
    status: 'active',
    startedOnDay: 0,
    progressRules: [
      {
        event: 'travel.completed',
        amount: 'fixed',
        fixedAmount: 1,
        match: { scope: 'none', tags: ['delivery'] }
      }
    ],
    rewards: [{ type: 'money', amount: 100 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -7 }],
    startFlags: ['inline_delivery_active'],
    completionFlags: ['inline_delivery_done'],
    failureFlags: ['inline_delivery_failed'],
    clearFlagsOnComplete: ['inline_temporary'],
    clearFlagsOnFail: ['inline_temporary'],
    scopeKey: 'delivery_scope',
    followupQuestId: ''
  }
  const reloadInline = quest => {
    const initial = createInitialState()
    initial.social.loyalty = 50
    const admitted = addQuest(initial, quest)
    assert.equal(
      admitted.activeQuests.length,
      1,
      'inline quest must be admitted'
    )
    const persisted = createPersistedState(admitted, createFixedClock(1000))
    const parsed = JSON.parse(JSON.stringify(persisted))
    return handleLoadGame(
      createInitialState(),
      createRawLoadPayload(parsed, parsed.unlocks ?? [])
    )
  }
  const travel = state =>
    QuestProgress.applyEvent(state, {
      type: 'travel.completed',
      amount: 1,
      tags: ['delivery']
    })

  await t.test(
    'preserves an admitted canonical inline definition and its completion cooldown',
    () => {
      const loaded = reloadInline(inlineDelivery)
      assert.ok(loaded.activeStoryFlags.includes('inline_delivery_active'))
      assert.deepEqual(loaded.activeQuests, [inlineDelivery])
      const once = travel(loaded)
      assert.equal(once.activeQuests[0].progress, 1)
      const completed = travel(once)
      assert.deepEqual(completed.activeQuests, [])
      assert.equal(completed.player.money, loaded.player.money + 100)
      assert.ok(completed.completedQuestIds.includes(inlineDelivery.id))
      assert.ok(completed.activeStoryFlags.includes('inline_delivery_done'))
      assert.ok(!completed.activeStoryFlags.includes('inline_delivery_active'))
      assert.ok(
        completed.questCooldowns.some(
          c =>
            c.questId === inlineDelivery.id &&
            c.expiresOnDay === completed.player.day + 4
        )
      )
      assert.strictEqual(addQuest(completed, inlineDelivery), completed)
    }
  )

  await t.test(
    'applies inline failure penalties and flags after reload',
    () => {
      const loaded = reloadInline(inlineDelivery)
      const failed = checkDeadlines({
        ...loaded,
        player: { ...loaded.player, day: 11 }
      })
      assert.deepEqual(failed.activeQuests, [])
      assert.equal(failed.social.loyalty, loaded.social.loyalty - 7)
      assert.ok(failed.activeStoryFlags.includes('inline_delivery_failed'))
      assert.ok(!failed.activeStoryFlags.includes('inline_delivery_active'))
    }
  )

  await t.test(
    'preserves migrated inline rules, rewards and penalties through reload',
    () => {
      const legacy = {
        id: 'inline_legacy',
        progress: 0,
        required: 2,
        deadline: 10,
        progressSource: 'travel_completed',
        moneyReward: 100,
        rewardType: 'loyalty',
        rewardData: { loyalty: 5 },
        failurePenalty: {
          social: { controversyLevel: 9 },
          flags: ['legacy_failed']
        }
      }
      const admitted = addQuest(createInitialState(), legacy)
      const loaded = reloadInline(legacy)
      for (const key of [
        'progressRules',
        'rewards',
        'failurePenalties',
        'progressSource'
      ]) {
        assert.deepEqual(
          loaded.activeQuests[0][key],
          JSON.parse(JSON.stringify(admitted.activeQuests[0][key])),
          key
        )
      }
      const completed = travel(travel(loaded))
      assert.deepEqual(completed.activeQuests, [])
      assert.equal(completed.player.money, loaded.player.money + 100)
      assert.equal(completed.social.loyalty, loaded.social.loyalty + 5)
      const failed = checkDeadlines({
        ...loaded,
        player: { ...loaded.player, day: 11 }
      })
      assert.equal(
        failed.social.controversyLevel,
        loaded.social.controversyLevel + 9
      )
      assert.ok(failed.activeStoryFlags.includes('legacy_failed'))
    }
  )

  await t.test(
    'keeps populated canonical arrays ahead of legacy fields and falls back from empty arrays',
    () => {
      for (const populated of [true, false]) {
        const loaded = handleLoadGame(createInitialState(), {
          social: { loyalty: 50 },
          activeQuests: [
            {
              id: 'inline_precedence',
              progress: 0,
              required: 1,
              deadline: 10,
              progressRules: populated
                ? [
                    {
                      event: 'travel.completed',
                      amount: 'fixed',
                      fixedAmount: 1
                    }
                  ]
                : [],
              progressSource: 'travel_completed',
              rewards: populated ? [{ type: 'money', amount: 100 }] : [],
              moneyReward: 999,
              failurePenalties: populated
                ? [{ type: 'social.loyalty', amount: -3 }]
                : [],
              failurePenalty: { social: { loyalty: -8 } }
            }
          ]
        })
        assert.equal(loaded.activeQuests[0].progressRules.length, 1)
        assert.equal(
          travel(loaded).player.money,
          loaded.player.money + (populated ? 100 : 999)
        )
        const failed = checkDeadlines({
          ...loaded,
          player: { ...loaded.player, day: 11 }
        })
        assert.equal(
          failed.social.loyalty,
          loaded.social.loyalty - (populated ? 3 : 8)
        )
      }
      const canonical = reloadInline({ ...inlineDelivery, moneyReward: 999 })
      assert.deepEqual(canonical.activeQuests[0].rewards, [
        { type: 'money', amount: 100 }
      ])
      assert.equal(
        travel(travel(canonical)).player.money,
        canonical.player.money + 100
      )
    }
  )

  await t.test(
    'filters hostile and invalid inline definitions on direct LOAD_GAME',
    () => {
      const badReward = JSON.parse(
        '{"type":"money","amount":500,"__proto__":{"polluted":true}}'
      )
      const badMatch = JSON.parse(
        '{"tags":["delivery"],"constructor":{"prototype":{"polluted":true}}}'
      )
      const validRule = {
        event: 'travel.completed',
        amount: 'fixed',
        fixedAmount: 1,
        match: { tags: ['delivery'], minScore: 100 }
      }
      const raw = {
        ...inlineDelivery,
        kind: 'invalid',
        repeatPolicy: 'invalid',
        status: 'failed',
        deadlineOffset: 8,
        offer: { trigger: 'random' },
        unlisted: true,
        rewards: [
          badReward,
          null,
          { type: 'money', amount: '100' },
          { type: 'unknown' },
          { type: 'money', amount: 100 }
        ],
        failurePenalties: [
          null,
          { type: 'money', amount: -9 },
          { type: 'quest.cooldown', days: 0 },
          { type: 'social.loyalty', amount: -7 }
        ],
        progressRules: [
          null,
          { event: 'travel.typo' },
          { event: 'travel.completed', match: badMatch },
          validRule
        ],
        startFlags: ['active', 1, null],
        completionFlags: [false, 'done'],
        failureFlags: ['failed', {}],
        clearFlagsOnComplete: [2, 'clear_done'],
        clearFlagsOnFail: ['clear_fail', []]
      }
      const loaded = handleLoadGame(createInitialState(), {
        activeQuests: [raw]
      })
      const quest = loaded.activeQuests[0]
      assert.deepEqual(quest.rewards, [{ type: 'money', amount: 100 }])
      assert.deepEqual(quest.failurePenalties, [
        { type: 'social.loyalty', amount: -7 }
      ])
      assert.deepEqual(quest.progressRules, [validRule])
      const progressed = QuestProgress.applyEvent(loaded, {
        type: 'travel.completed',
        tags: ['delivery'],
        context: { score: 100 }
      })
      assert.equal(progressed.activeQuests[0].progress, 1)
      assert.notStrictEqual(quest.progressRules[0], validRule)
      assert.notStrictEqual(quest.progressRules[0].match, validRule.match)
      assert.notStrictEqual(
        quest.progressRules[0].match.tags,
        validRule.match.tags
      )
      assert.notStrictEqual(quest.rewards[0], raw.rewards.at(-1))
      assert.notStrictEqual(
        quest.failurePenalties[0],
        raw.failurePenalties.at(-1)
      )
      for (const key of [
        'kind',
        'repeatPolicy',
        'deadlineOffset',
        'offer',
        'unlisted'
      ])
        assert.equal(Object.hasOwn(quest, key), false, key)
      for (const [key, value] of Object.entries({
        startFlags: ['active'],
        completionFlags: ['done'],
        failureFlags: ['failed'],
        clearFlagsOnComplete: ['clear_done'],
        clearFlagsOnFail: ['clear_fail']
      }))
        assert.deepEqual(quest[key], value)
      assert.equal(quest.status, 'active')
      assert.equal({}.polluted, undefined)
      assert.equal(Object.hasOwn(quest.rewards[0], '__proto__'), false)
      assert.equal(
        Object.hasOwn(quest.progressRules[0].match, 'constructor'),
        false
      )
    }
  )

  await t.test('rejects nonpositive inline requirements', () => {
    for (const required of [0, -1, -0.5]) {
      const loaded = handleLoadGame(createInitialState(), {
        activeQuests: [{ id: 'inline_required', required }]
      })
      assert.deepEqual(loaded.activeQuests, [])
    }
    for (const fields of [{}, { required: 0.5 }, { required: 2 }]) {
      const loaded = handleLoadGame(createInitialState(), {
        activeQuests: [{ id: 'inline_required', ...fields }]
      })
      assert.equal(loaded.activeQuests.length, 1)
      assert.equal(loaded.activeQuests[0].required, fields.required)
    }
  })

  await t.test(
    'retains only saved start flags of surviving inline quests',
    () => {
      const loaded = handleLoadGame(createInitialState(), {
        activeStoryFlags: ['inline_kept', 'stale_unknown', 'inline_dropped'],
        activeQuests: [
          {
            id: 'inline_alive',
            required: 2,
            startFlags: ['inline_kept', 'not_present']
          },
          { id: 'inline_rejected', required: 0, startFlags: ['inline_dropped'] }
        ]
      })
      assert.deepEqual(loaded.activeStoryFlags, ['inline_kept'])
      assert.equal(loaded.activeQuests.length, 1)
    }
  )

  await t.test('filters invalid inline rule score thresholds', () => {
    for (const minScore of [NaN, Infinity, -Infinity, '100', null]) {
      const loaded = handleLoadGame(createInitialState(), {
        activeQuests: [
          {
            id: 'inline_invalid_score',
            progressRules: [{ event: 'travel.completed', match: { minScore } }]
          }
        ]
      })
      assert.deepEqual(loaded.activeQuests[0].progressRules, [])
    }
  })

  await t.test(
    'drops inline policies that cannot enforce their cooldown or scope',
    () => {
      const policies = [
        { repeatPolicy: 'cooldown' },
        ...[0, -1, NaN, Infinity, '4'].map(cooldownDays => ({
          repeatPolicy: 'cooldown',
          cooldownDays
        })),
        { repeatPolicy: 'perVenue' },
        { repeatPolicy: 'perRegion', scopeKey: '' },
        { repeatPolicy: 'perVenue', scopeKey: '__proto__' }
      ]
      for (const policy of policies) {
        const loaded = handleLoadGame(createInitialState(), {
          activeQuests: [{ id: 'inline_bad_policy', ...policy }]
        })
        assert.deepEqual(loaded.activeQuests, [], JSON.stringify(policy))
      }
      const loaded = handleLoadGame(createInitialState(), {
        activeQuests: [
          {
            id: 'inline_singular',
            repeatPolicy: 'perVenue',
            scopeKey: 'berlin_so36',
            progressRule: {
              event: 'travel.completed',
              match: { tags: ['delivery'] }
            }
          }
        ]
      })
      assert.equal(loaded.activeQuests[0].startedOnDay, 0)
      assert.equal(loaded.activeQuests[0].scopeKey, 'berlin_so36')
      assert.deepEqual(loaded.activeQuests[0].progressRules, [
        { event: 'travel.completed', match: { tags: ['delivery'] } }
      ])
      assert.equal(Object.hasOwn(loaded.activeQuests[0], 'progressRule'), false)
    }
  )

  await t.test(
    'uses registry required values and clamps loaded progress to 0..required',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        activeQuests: [
          {
            id: 'quest_viral_dance',
            progress: 999,
            required: 1,
            startedOnDay: 4
          },
          {
            id: 'quest_apology_tour',
            progress: -10,
            required: 999,
            startedOnDay: 2
          }
        ]
      }

      const nextState = handleLoadGame(initialState, loadedState)
      const viralDance = nextState.activeQuests.find(
        quest => quest.id === 'quest_viral_dance'
      )
      const apologyTour = nextState.activeQuests.find(
        quest => quest.id === 'quest_apology_tour'
      )

      assert.equal(viralDance.required, 500)
      assert.equal(viralDance.progress, 500)
      assert.equal(apologyTour.required, 3)
      assert.equal(apologyTour.progress, 0)
    }
  )

  await t.test('migrates unknown legacy quest reward fields on load', () => {
    const initialState = createInitialState()
    const loadedState = {
      activeQuests: [
        {
          id: 'legacy_custom_quest',
          label: 'Legacy custom quest',
          progress: 2,
          required: 7,
          moneyReward: 100
        }
      ]
    }

    const nextState = handleLoadGame(initialState, loadedState)

    // Non-registry quests keep their runtime fields, but the legacy
    // moneyReward is upgraded to a tagged reward at this boundary.
    assert.deepEqual(nextState.activeQuests, [
      {
        id: 'legacy_custom_quest',
        status: 'active',
        startedOnDay: 0,
        label: 'Legacy custom quest',
        progress: 2,
        required: 7,
        rewards: [{ type: 'money', amount: 100 }]
      }
    ])
    assert.equal(Object.hasOwn(nextState.activeQuests[0], 'moneyReward'), false)
  })

  await t.test(
    'drops loaded scoped registry quests without a scope key',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        activeQuests: [
          {
            id: 'quest_venue_residency',
            progress: 1,
            required: 3
          },
          {
            id: 'quest_local_legend',
            progress: 100,
            required: 500,
            scopeKey: 'berlin'
          }
        ]
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.deepEqual(nextState.activeQuests, [
        {
          id: 'quest_local_legend',
          deadline: 10,
          progress: 100,
          required: 500,
          scopeKey: 'berlin',
          status: 'active',
          startedOnDay: 0
        }
      ])
    }
  )

  await t.test(
    'backfills registry-backed active quest deadlines on load',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        activeQuests: [
          { id: 'quest_viral_dance', startedOnDay: 4 },
          {
            id: 'quest_prove_yourself',
            startedOnDay: undefined,
            deadline: null
          }
        ]
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(
        nextState.activeQuests.find(q => q.id === 'quest_viral_dance')
          ?.deadline,
        9
      )
      assert.equal(
        nextState.activeQuests.find(q => q.id === 'quest_prove_yourself')
          ?.deadline,
        20
      )
    }
  )

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
            layer: 0,
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
            layer: 0,
            type: 'GIG',
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
          start: { id: 'start', x: 9, y: 10, layer: 0, type: 'START' }
        }
      )
      assert.equal(Object.hasOwn(nextState.gameMap.nodes, '__proto__'), false)
      assert.equal(Object.hasOwn(nextState.gameMap.nodes, 'constructor'), false)
      assert.equal(Object.hasOwn(nextState.gameMap.nodes, 'prototype'), false)
      assert.equal(Object.getPrototypeOf(nextState.gameMap.nodes), null)
    }
  )

  await t.test(
    'drops non-finite numeric extras from loaded gameMap nodes',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        gameMap: {
          nodes: {
            start: {
              id: 'start',
              x: 1,
              y: 2,
              danger: Number.NaN,
              bonus: Number.POSITIVE_INFINITY,
              safeCount: 3,
              flags: ['legacy', Number.NaN, 4],
              metadata: {
                difficulty: Number.NEGATIVE_INFINITY,
                visited: false,
                weight: 2
              }
            }
          },
          connections: []
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)
      const node = nextState.gameMap.nodes.start

      assert.equal(Object.hasOwn(node, 'danger'), false)
      assert.equal(Object.hasOwn(node, 'bonus'), false)
      assert.equal(node.safeCount, 3)
      assert.deepEqual(node.flags, ['legacy', 4])
      assert.deepEqual(node.metadata, { visited: false, weight: 2 })
    }
  )

  await t.test('drops a non-finite loaded gameMap version', () => {
    const initialState = createInitialState()
    const nextState = handleLoadGame(initialState, {
      gameMap: {
        version: Number.POSITIVE_INFINITY,
        nodes: { start: { id: 'start', x: 0, y: 0 } },
        connections: []
      }
    })

    assert.equal(Object.hasOwn(nextState.gameMap, 'version'), false)
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

  await t.test('drops non-string entries from payload unlocks', () => {
    const currentState = createInitialState()

    const nextState = handleResetState(currentState, {
      unlocks: ['unlock1', 42, null, { evil: true }, 'unlock2']
    })

    assert.deepEqual(nextState.unlocks, ['unlock1', 'unlock2'])
  })
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
  const newMap = { nodes: {}, connections: [] }

  assert.deepEqual(handleSetMap(state, newMap), { gameMap: newMap })
})

test('systemReducer - SET_MAP rejects payloads that break the GameMap contract', () => {
  const state = { gameMap: { nodes: {}, connections: [] } }

  for (const malformed of [
    {},
    { nodes: {}, connections: 'bad' },
    { nodes: {} },
    { connections: [] },
    { nodes: [], connections: [] },
    { nodes: null, connections: [] },
    { nodes: 'x', connections: [] },
    { nodes: {}, connections: {} }
  ]) {
    assert.equal(handleSetMap(state, malformed), state)
  }
})

test('systemReducer - SET_MAP rejects non-object and hostile payloads', () => {
  const state = { gameMap: { nodes: {}, connections: [] } }

  assert.equal(handleSetMap(state, 'not a map'), state)
  assert.equal(handleSetMap(state, 42), state)
  assert.equal(handleSetMap(state, []), state)
  assert.equal(
    handleSetMap(
      state,
      JSON.parse('{"nodes":{"a":{"__proto__":{"x":1}}},"connections":[]}')
    ),
    state
  )
  // null stays a valid "generation failed" fallback.
  assert.deepEqual(handleSetMap(state, null), { gameMap: null })
})

test('systemReducer - SET_MAP rejects accessor-bearing maps without invoking their getters', () => {
  const state = { gameMap: { nodes: {}, connections: [] } }
  let getterCalls = 0
  const throwingGetter = () => {
    getterCalls++
    throw new Error('getter must not run')
  }
  const withNodesGetter = { connections: [] }
  Object.defineProperty(withNodesGetter, 'nodes', {
    enumerable: true,
    get: throwingGetter
  })
  const withConnectionsGetter = { nodes: {} }
  Object.defineProperty(withConnectionsGetter, 'connections', {
    enumerable: true,
    get: throwingGetter
  })

  for (const hostile of [withNodesGetter, withConnectionsGetter]) {
    assert.equal(handleSetMap(state, hostile), state)
  }
  assert.equal(getterCalls, 0)
})

test('systemReducer - ADD_TOAST', () => {
  const state = { toasts: [{ id: '1' }] }
  const newToast = { id: '2', type: 'info', message: 'Hello' }

  assert.deepEqual(handleAddToast(state, newToast), {
    toasts: [{ id: '1' }, { id: '2', type: 'info', message: 'Hello' }]
  })
})

test('systemReducer - ADD_TOAST keeps only primitive options and drops invalid toasts', () => {
  const state = { toasts: [] }
  const result = handleAddToast(state, {
    id: 't1',
    type: 'warning',
    messageKey: 'ui:toast.test',
    options: {
      count: 3,
      label: 'ok',
      ok: true,
      nothing: null,
      nested: { deep: 1 },
      list: [1, 2],
      fn: () => 1
    }
  })

  assert.deepEqual(result.toasts[0].options, {
    count: 3,
    label: 'ok',
    ok: true,
    nothing: null
  })

  // Missing id or missing message/messageKey: dropped, same state reference.
  assert.equal(handleAddToast(state, { type: 'info', message: 'x' }), state)
  assert.equal(handleAddToast(state, { id: 't2', type: 'info' }), state)
  assert.equal(handleAddToast(state, null), state)
  assert.equal(handleAddToast(state, 'toast'), state)
})

test('systemReducer - ADD_TOAST logs a malformed payload it drops', t => {
  const warn = t.mock.method(logger, 'warn', () => {})
  const state = { toasts: [] }

  handleAddToast(state, { id: 't1', type: 'info', message: 'kept' })
  assert.equal(warn.mock.callCount(), 0)

  assert.equal(handleAddToast(state, { id: 't2', type: 'info' }), state)
  assert.equal(warn.mock.callCount(), 1)
  assert.deepEqual(warn.mock.calls[0].arguments, [
    'GameState',
    'Rejected malformed ADD_TOAST payload'
  ])
})

test('systemReducer - LOAD_GAME logs "Game Loaded" only for a load it accepts', t => {
  const info = t.mock.method(logger, 'info', () => {})
  t.mock.method(logger, 'warn', () => {})
  const state = createInitialState()
  const loadedCalls = () =>
    info.mock.calls.filter(call => call.arguments[1] === 'Game Loaded').length

  assert.equal(
    handleLoadGame(state, { version: CURRENT_SAVE_VERSION + 1 }),
    state
  )
  assert.equal(loadedCalls(), 0)

  handleLoadGame(state, { version: CURRENT_SAVE_VERSION })
  assert.equal(loadedCalls(), 1)
})

test('systemReducer - LOAD_GAME sanitizes pending risk event descriptors', () => {
  const initialState = createInitialState()

  const validState = handleLoadGame(initialState, {
    pendingRiskEvent: {
      assetId: 'asset_1',
      eventType: 'fire',
      conditionLoss: 15
    }
  })
  assert.deepEqual(validState.pendingRiskEvent, {
    assetId: 'asset_1',
    eventType: 'fire',
    conditionLoss: 15
  })

  const invalidState = handleLoadGame(initialState, {
    pendingRiskEvent: {
      assetId: 'asset_1',
      eventType: 'bad_event',
      conditionLoss: Number.POSITIVE_INFINITY
    }
  })
  assert.equal(invalidState.pendingRiskEvent, null)
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

test('systemReducer - pending modal state', async t => {
  await t.test(
    'returns same state when pending Band HQ flag is unchanged',
    () => {
      const state = { ...createInitialState(), pendingBandHQOpen: true }

      assert.equal(handleSetPendingBandHQOpen(state, true), state)
    }
  )

  await t.test('rejects a non-boolean pending Band HQ flag', () => {
    const state = { ...createInitialState(), pendingBandHQOpen: false }

    for (const isOpen of ['yes', {}, undefined, 1, null]) {
      assert.equal(handleSetPendingBandHQOpen(state, isOpen), state)
    }
  })

  await t.test(
    'keeps a well-formed pending supply stop inventory as it was',
    () => {
      const inventory = [
        {
          id: 'strings',
          name: 'Strings',
          cost: 10,
          effect: { type: 'inventory_add', item: 'strings', value: 1 }
        }
      ]
      const state = createInitialState()

      const next = handleSetPendingSupplyStopInventory(state, inventory)
      assert.deepEqual(next.pendingSupplyStopInventory, inventory)
      // Settled: re-dispatching the stored value changes nothing observable.
      assert.deepEqual(
        handleSetPendingSupplyStopInventory(next, inventory)
          .pendingSupplyStopInventory,
        inventory
      )
    }
  )

  await t.test(
    'sanitizes a raw pending supply stop inventory like the load path',
    () => {
      const state = createInitialState()
      const good = {
        id: 'strings',
        name: 'Strings',
        cost: 10,
        effect: { type: 'inventory_add', item: 'strings', value: 1 }
      }
      const hostile = { ...good, id: 'bad', cost: -500 }
      const next = handleSetPendingSupplyStopInventory(state, [
        good,
        hostile,
        'x',
        null
      ])

      assert.ok(
        next.pendingSupplyStopInventory.every(item => item.cost >= 0),
        'no negative-cost item is offered'
      )
      assert.ok(
        next.pendingSupplyStopInventory.some(item => item.id === 'strings')
      )
      // The shop-item schema clamps a negative cost rather than dropping the item.
      assert.equal(
        next.pendingSupplyStopInventory.find(item => item.id === 'bad')?.cost,
        0
      )
      // Nothing usable left is no open shop.
      assert.equal(
        handleSetPendingSupplyStopInventory(state, ['x', null])
          .pendingSupplyStopInventory,
        null
      )
    }
  )

  await t.test(
    'returns same state when pending supply stop inventory stays null',
    () => {
      const state = {
        ...createInitialState(),
        pendingSupplyStopInventory: null
      }

      assert.equal(handleSetPendingSupplyStopInventory(state, null), state)
    }
  )

  await t.test('sets and clears pending risk event state', () => {
    const state = { ...createInitialState(), pendingRiskEvent: null }
    const pendingRiskEvent = {
      assetId: 'asset_1',
      eventType: 'fire',
      conditionLoss: 15
    }

    const nextState = handleSetPendingRiskEvent(state, pendingRiskEvent)

    assert.deepEqual(nextState.pendingRiskEvent, pendingRiskEvent)
    assert.equal(
      handleSetPendingRiskEvent(nextState, pendingRiskEvent),
      nextState
    )
    assert.equal(handleSetPendingRiskEvent(state, null), state)
    assert.equal(
      handleSetPendingRiskEvent(nextState, null).pendingRiskEvent,
      null
    )
  })

  await t.test('rejects malformed pending risk event payloads', () => {
    const state = { ...createInitialState(), pendingRiskEvent: null }
    const invalidPayloads = [
      [],
      { assetId: 'asset_1', eventType: 'fire', conditionLoss: Infinity },
      { assetId: 'asset_1', eventType: 'bad_event', conditionLoss: 15 },
      { eventType: 'fire', conditionLoss: 15 }
    ]

    for (const payload of invalidPayloads) {
      assert.equal(handleSetPendingRiskEvent(state, payload), state)
    }

    const hostilePayload = JSON.parse(
      '{"assetId":"asset_1","eventType":"fire","conditionLoss":15,"__proto__":{"polluted":true}}'
    )
    const nextState = handleSetPendingRiskEvent(state, hostilePayload)

    assert.deepEqual(nextState.pendingRiskEvent, {
      assetId: 'asset_1',
      eventType: 'fire',
      conditionLoss: 15
    })
    assert.equal(Object.hasOwn(nextState.pendingRiskEvent, '__proto__'), false)
  })
})

test('systemReducer - ADVANCE_DAY core logic', async t => {
  await t.test(
    'uses the pre-rolled day stream for all daily randomness',
    () => {
      const initialState = createInitialState()
      const state = {
        ...initialState,
        player: { ...initialState.player, money: 100_000, day: 1 },
        social: { ...initialState.social, newsletter: 1_000 }
      }
      const payload = {
        dayRngStream: new Array(16).fill(0),
        nextRngSeed: 123
      }

      const first = handleAdvanceDay(state, payload)
      const second = handleAdvanceDay(state, payload)

      assert.deepEqual(first, second)
      assert.equal(first.rngSeed, 123)
    }
  )

  await t.test(
    'normalizes malformed RNG payloads at the reducer boundary',
    () => {
      const initialState = createInitialState()
      const state = {
        ...initialState,
        assets: [
          {
            id: 'asset_1',
            kind: 'tourbus_chassis',
            chassisFlavor: 'legit',
            chassisTier: 1,
            condition: 100,
            baseUpkeep: 0,
            baseDailyRevenue: 0,
            slots: [],
            acquiredOnDay: 1,
            acquisitionMode: 'cash',
            baseRiskEventChance: 0.5
          }
        ]
      }

      const next = handleAdvanceDay(state, {
        dayRngStream: [Number.NaN],
        nextRngSeed: Number.POSITIVE_INFINITY
      })

      assert.equal(next.assets[0].condition, 99.7)
      assert.equal(next.pendingRiskEvent, null)
      assert.equal(Number.isFinite(next.rngSeed), true)
      assert.equal(next.rngSeed, nextSeed(initialState.rngSeed))
    }
  )

  await t.test('normalizes a non-finite persisted day before advancing', () => {
    const initialState = createInitialState()
    const state = {
      ...initialState,
      player: { ...initialState.player, day: Number.NaN }
    }

    const next = handleAdvanceDay(state, {
      dayRngStream: new Array(8).fill(1),
      nextRngSeed: 123
    })

    assert.equal(next.player.day, 2)
  })

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
      const nextState = handleAdvanceDay(currentState, {
        dayRngStream: HALF_ROLLS
      })

      assert.equal(nextState.player.eventsTriggeredToday, 0)
      // calculateDailyUpdates increments day
      assert.equal(nextState.player.day, 2)
      assert.deepEqual(nextState.eventCooldowns, [])
    }
  )

  await t.test('keeps timed event cooldowns until their expiry day', () => {
    const state = {
      ...createInitialState(),
      player: { ...createInitialState().player, day: 5, money: 100 },
      // Legacy untimed entry resets every advanceDay; timed entries persist
      // until expiry. expiry 10 (future) stays; expiry 5 (=current) drops.
      eventCooldowns: [
        'legacy_daily',
        'ego_management_retry:10',
        'expired_event:5'
      ]
    }
    const next = handleAdvanceDay(state, { dayRngStream: HALF_ROLLS })
    assert.deepEqual(next.eventCooldowns, ['ego_management_retry:10'])
  })

  await t.test(
    'preserves an existing pending risk event during daily rolls',
    () => {
      const initialState = createInitialState()
      const pendingRiskEvent = {
        assetId: 'existing_asset',
        eventType: 'theft',
        conditionLoss: 25
      }
      const currentState = {
        ...initialState,
        player: {
          ...initialState.player,
          day: 1
        },
        assets: [
          {
            id: 'new_asset',
            kind: 'tourbus_chassis',
            chassisFlavor: 'legit',
            chassisTier: 1,
            condition: 100,
            baseUpkeep: 0,
            baseDailyRevenue: 0,
            slots: [],
            acquiredOnDay: 1,
            acquisitionMode: 'cash',
            baseRiskEventChance: 1
          }
        ],
        pendingRiskEvent,
        toasts: [],
        activeQuests: []
      }

      const nextState = handleAdvanceDay(currentState, {
        dayRngStream: [0, ...HALF_ROLLS],
        nextRngSeed: initialState.rngSeed
      })

      assert.deepEqual(nextState.pendingRiskEvent, pendingRiskEvent)
      assert.equal(
        nextState.toasts.at(-1)?.messageKey,
        'assets:risk.event.fire'
      )
    }
  )

  await t.test(
    'gives risk-event toasts deterministic ids that avoid existing toast ids',
    () => {
      const initialState = createInitialState()
      const makeAsset = id => ({
        id,
        kind: 'tourbus_chassis',
        chassisFlavor: 'legit',
        chassisTier: 1,
        condition: 100,
        baseUpkeep: 0,
        baseDailyRevenue: 0,
        slots: [],
        acquiredOnDay: 1,
        acquisitionMode: 'cash',
        baseRiskEventChance: 1
      })
      // Two assets fire on the same day; an existing toast already holds the
      // id the first risk toast would otherwise take.
      const existingToast = {
        id: 'risk-toast-1',
        type: 'info',
        message: 'already shown'
      }
      const currentState = {
        ...initialState,
        player: { ...initialState.player, day: 1 },
        assets: [makeAsset('asset_a'), makeAsset('asset_b')],
        pendingRiskEvent: null,
        toasts: [existingToast],
        activeQuests: []
      }
      const payload = {
        dayRngStream: [0, 0, 0, 0, ...HALF_ROLLS],
        nextRngSeed: initialState.rngSeed
      }

      const first = handleAdvanceDay(currentState, payload)
      const riskToasts = first.toasts.filter(toast =>
        toast.messageKey?.startsWith('assets:risk.event.')
      )

      assert.deepEqual(
        riskToasts.map(toast => toast.options.assetId),
        ['asset_a', 'asset_b']
      )
      assert.deepEqual(
        riskToasts.map(toast => toast.id),
        ['risk-toast-2', 'risk-toast-3']
      )
      const ids = first.toasts.map(toast => toast.id)
      assert.equal(new Set(ids).size, ids.length)
      // Same input, same ids: no RNG or UUID in the reducer.
      assert.deepEqual(
        handleAdvanceDay(currentState, payload).toasts.map(toast => toast.id),
        ids
      )
    }
  )
})

test('systemReducer - rivalBand persistence', async t => {
  await t.test(
    'handleLoadGame preserves rivalBand id, name, alignment, currentLocationId, and clamps powerLevel',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        rivalBand: {
          id: 'rival_001',
          name: 'Die Konkurrenten',
          alignment: 'CORPORATE',
          powerLevel: 75,
          currentLocationId: 'node_2_3'
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.rivalBand?.id, 'rival_001')
      assert.equal(nextState.rivalBand?.name, 'Die Konkurrenten')
      assert.equal(nextState.rivalBand?.alignment, 'CORPORATE')
      assert.equal(nextState.rivalBand?.powerLevel, 75)
      assert.equal(nextState.rivalBand?.currentLocationId, 'node_2_3')
    }
  )

  await t.test(
    'handleLoadGame returns null rivalBand when save has no rivalBand',
    () => {
      const initialState = createInitialState()
      const loadedState = { player: { money: 100 } }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.rivalBand, null)
    }
  )

  await t.test(
    'handleLoadGame returns null rivalBand when save rivalBand is null',
    () => {
      const initialState = createInitialState()
      const loadedState = { rivalBand: null }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.rivalBand, null)
    }
  )

  await t.test(
    'handleLoadGame returns null rivalBand when save rivalBand is malformed (missing required id)',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        rivalBand: {
          name: 'No ID Band',
          alignment: 'INDIE',
          powerLevel: 50,
          currentLocationId: null
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.rivalBand, null)
    }
  )

  await t.test(
    'handleLoadGame strips hostile __proto__ key from rivalBand',
    () => {
      const initialState = createInitialState()
      // Simulate a parsed JSON object with a hostile __proto__ key
      const hostileRivalBand = JSON.parse(
        '{"id":"rival_hostile","name":"Hostile Band","alignment":"EVIL","powerLevel":60,"currentLocationId":null,"__proto__":{"polluted":true}}'
      )
      const loadedState = { rivalBand: hostileRivalBand }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.rivalBand?.id, 'rival_hostile')
      assert.equal(Object.hasOwn(nextState.rivalBand ?? {}, '__proto__'), false)
    }
  )

  await t.test('handleLoadGame clamps non-finite powerLevel to 0', () => {
    const initialState = createInitialState()
    const loadedState = {
      rivalBand: {
        id: 'rival_nan',
        name: 'NaN Band',
        alignment: 'NEUTRAL',
        powerLevel: NaN,
        currentLocationId: null
      }
    }

    const nextState = handleLoadGame(initialState, loadedState)

    assert.equal(nextState.rivalBand?.powerLevel, 0)
  })

  await t.test(
    'handleLoadGame handles rivalBand with null currentLocationId',
    () => {
      const initialState = createInitialState()
      const loadedState = {
        rivalBand: {
          id: 'rival_002',
          name: 'Wandering Band',
          alignment: 'INDIE',
          powerLevel: 30,
          currentLocationId: null
        }
      }

      const nextState = handleLoadGame(initialState, loadedState)

      assert.equal(nextState.rivalBand?.currentLocationId, null)
      assert.equal(nextState.rivalBand?.id, 'rival_002')
    }
  )
})

test('handleLoadGame sanitizes the persisted runSeed', async t => {
  await t.test('preserves a valid persisted seed', () => {
    const nextState = handleLoadGame(createInitialState(), { runSeed: 987654 })
    assert.equal(nextState.runSeed, 987654)
  })

  await t.test('coerces a seed into the unsigned 32-bit range', () => {
    const nextState = handleLoadGame(createInitialState(), { runSeed: -1.5 })
    assert.equal(nextState.runSeed, -1 >>> 0)
  })

  for (const [label, runSeed] of [
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a string', '123'],
    ['null', null]
  ]) {
    await t.test(`replaces ${label} with a fresh finite seed`, () => {
      const nextState = handleLoadGame(createInitialState(), { runSeed })
      assert.equal(Number.isFinite(nextState.runSeed), true)
      assert.equal(Number.isInteger(nextState.runSeed), true)
      assert.ok(nextState.runSeed >= 0 && nextState.runSeed <= 0xffffffff)
    })
  }

  await t.test('fills in a seed for saves that predate the field', () => {
    const nextState = handleLoadGame(createInitialState(), {})
    assert.equal(Number.isFinite(nextState.runSeed), true)
  })
})

test('terminal outcome survives a JSON round trip and routes load to GAMEOVER', () => {
  const ended = handleSetTerminalOutcome(createInitialState(), {
    reason: 'event_game_over',
    eventId: 'deal_devil'
  })
  assert.equal(ended.currentScene, GAME_PHASES.GAMEOVER)

  for (let load = 0; load < 2; load++) {
    const loaded = handleLoadGame(
      createInitialState(),
      JSON.parse(JSON.stringify({ terminalOutcome: ended.terminalOutcome }))
    )
    assert.equal(loaded.currentScene, GAME_PHASES.GAMEOVER)
    assert.deepEqual(loaded.terminalOutcome, ended.terminalOutcome)
  }

  const without = handleLoadGame(createInitialState(), {})
  assert.equal(without.currentScene, GAME_PHASES.OVERWORLD)
  assert.equal(without.terminalOutcome, null)
})

test('terminal outcome ignores a reason inherited from a polluted prototype', () => {
  Object.prototype.reason = 'bankruptcy'
  try {
    const state = createInitialState()
    assert.equal(handleSetTerminalOutcome(state, {}), state)
    assert.equal(
      handleLoadGame(createInitialState(), { terminalOutcome: {} })
        .terminalOutcome,
      null
    )
  } finally {
    delete Object.prototype.reason
  }
})

test('handleSetTerminalOutcome rejects malformed payloads by identity', () => {
  const state = createInitialState()
  for (const bad of [
    null,
    'x',
    { reason: 'other', eventId: 'a' },
    { reason: 'event_game_over', eventId: '' },
    JSON.parse('{"reason":"event_game_over","eventId":"a","__proto__":{"x":1}}')
  ]) {
    assert.equal(handleSetTerminalOutcome(state, bad), state)
  }
})

test('an open supply-stop shop survives a JSON round trip and is capped on load', () => {
  const items = [{ id: 'item_1', name: 'Snack', cost: 5 }]
  const loaded = handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify({ pendingSupplyStopInventory: items }))
  )
  // The sanitizer's copies are prototype-less; compare by content.
  assert.deepEqual(
    JSON.parse(JSON.stringify(loaded.pendingSupplyStopInventory)),
    items
  )

  const flood = Array.from({ length: 100 }, (_, i) => ({ id: i, cost: 1 }))
  const capped = handleLoadGame(createInitialState(), {
    pendingSupplyStopInventory: [...flood, 'junk', null]
  })
  assert.equal(capped.pendingSupplyStopInventory.length, 24)
})

test('restored supply-stop items go through the shop item field schema', () => {
  const loaded = handleLoadGame(createInitialState(), {
    pendingSupplyStopInventory: [
      { id: 'cheat', name: 'Free money', cost: -100, secret: 'dropped' },
      { id: 'bad_cost', cost: 'free' }
    ]
  })
  const [first, second] = loaded.pendingSupplyStopInventory
  // A negative cost can never turn a purchase into income.
  assert.equal(first.cost, 0)
  assert.equal(Object.hasOwn(first, 'secret'), false)
  // A non-numeric cost is dropped rather than copied.
  assert.equal(Object.hasOwn(second, 'cost'), false)
})

test('restored supply-stop items drop forbidden prototype keys', () => {
  const hostile = JSON.parse(
    '[{"id":"x","cost":1,"__proto__":{"polluted":true},"constructor":{"x":1}}]'
  )
  const loaded = handleLoadGame(createInitialState(), {
    pendingSupplyStopInventory: hostile
  })
  const [item] = loaded.pendingSupplyStopInventory
  assert.equal(Object.hasOwn(item, '__proto__'), false)
  assert.equal(Object.hasOwn(item, 'constructor'), false)
  assert.equal({}.polluted, undefined)
})

test('loading a save without a shop closes the live session shop', () => {
  const live = {
    ...createInitialState(),
    pendingSupplyStopInventory: [{ id: 'x', cost: 1 }]
  }
  assert.equal(handleLoadGame(live, {}).pendingSupplyStopInventory, null)
  assert.equal(
    handleLoadGame(live, { pendingSupplyStopInventory: 'nope' })
      .pendingSupplyStopInventory,
    null
  )
})

test('a saved supply-stop list with nothing usable restores no open shop', () => {
  for (const pendingSupplyStopInventory of [[], ['junk', null, 5]]) {
    const loaded = handleLoadGame(createInitialState(), {
      pendingSupplyStopInventory
    })
    assert.equal(loaded.pendingSupplyStopInventory, null)
  }
})

test('a saved supply-stop item with an inherited effect type loads without its effect', () => {
  const good = { id: 'item_ok', name: 'Snack', cost: 5 }
  for (const type of ['__proto__', 'constructor', 'toString']) {
    const hostile = JSON.parse(
      JSON.stringify({
        pendingSupplyStopInventory: [
          { id: 'item_bad', name: 'Bad', cost: 1, effect: { type } },
          good
        ]
      })
    )
    // Loading must not throw, and no effect with an inherited type survives.
    const loaded = handleLoadGame(createInitialState(), hostile)
    const items = loaded.pendingSupplyStopInventory
    assert.ok(Array.isArray(items), type)
    for (const item of items) {
      assert.equal(Object.hasOwn(item, 'effect'), false, type)
    }
    assert.ok(
      items.some(item => item.id === 'item_ok'),
      type
    )
  }
})

test('handleLoadGame keeps an active expedition whose saved runSeed is signed', () => {
  const run = startedState({ money: 5000 })
  const raw = JSON.parse(JSON.stringify(createPersistedState(run)))
  assert.equal(raw.expedition.status, 'active')
  // Same normalized seed, written the way a build that stored signed seeds
  // would have: `>>> 0` maps it back to FIXTURE_RUN_SEED.
  raw.runSeed = FIXTURE_RUN_SEED - 2 ** 32

  const loaded = handleLoadGame(createInitialState(), raw)

  assert.equal(loaded.runSeed, FIXTURE_RUN_SEED)
  assert.equal(loaded.expedition.status, 'active')
  assert.equal(loaded.expedition.runId, run.expedition.runId)
})

test('handleLoadGame still collapses an active expedition whose runSeed is missing', () => {
  const run = startedState({ money: 5000 })
  const raw = JSON.parse(JSON.stringify(createPersistedState(run)))
  delete raw.runSeed

  assert.notEqual(
    handleLoadGame(createInitialState(), raw).expedition.status,
    'active'
  )
})

test('an expiring stamina_max bonus leaves no member stamina above the lowered cap', () => {
  const base = createInitialState()
  const state = {
    ...base,
    band: {
      ...base.band,
      members: base.band.members.map(m => ({
        ...m,
        stamina: 120,
        staminaMax: 120
      })),
      activeContrabandEffects: [
        {
          instanceId: 'ampoule_1',
          effectType: 'stamina_max',
          value: 20,
          remainingDuration: 1
        }
      ]
    }
  }

  const next = gameReducer(state, advanceDay(state))

  assert.deepEqual(next.band.activeContrabandEffects, [])
  for (const member of next.band.members) {
    assert.equal(member.staminaMax, 100)
    assert.ok(
      member.stamina <= member.staminaMax,
      `${member.id} ${member.stamina}`
    )
  }
})

test('save/load preserves canonical Expedition reputation and familiar node intel', () => {
  const state = startedState()
  state.reputationByRegion = Object.fromEntries(
    Object.keys(EXPEDITION_REGIONS).map(id => [id, 50])
  )
  state.reputationByRegion['venues:berlin_so36.name'] = -60
  state.reputationByRegion.berlin = 20
  const before = getExpeditionIntelCapability(state).familiarNodeIds
  assert.ok(before.length > 0)
  const payload = JSON.parse(
    JSON.stringify(createPersistedState(state, createFixedClock(1000)))
  )
  const loaded = handleLoadGame(createInitialState(), payload)
  for (const id of Object.keys(EXPEDITION_REGIONS)) {
    assert.equal(loaded.reputationByRegion[id], 50, id)
  }
  assert.equal(loaded.reputationByRegion.berlin, -60)
  assert.deepEqual(getExpeditionIntelCapability(loaded).familiarNodeIds, before)
})

test('special contraband expiry does not subtract numeric stats and releases the relic', () => {
  const state = createInitialState()
  state.band.luck = 8
  state.band.stash = {
    relic: { stacks: 1, instanceId: 'special-relic', applied: true }
  }
  state.band.activeContrabandEffects = [
    {
      kind: 'special',
      effectType: 'luck',
      value: 100,
      remainingDuration: 1,
      instanceId: 'special-relic'
    }
  ]
  const next = handleAdvanceDay(state, {
    dayRngStream: HALF_ROLLS,
    nextRngSeed: state.rngSeed
  })
  assert.equal(next.band.luck, 8)
  assert.deepEqual(next.band.activeContrabandEffects, [])
  assert.equal(next.band.stash.relic.applied, false)
  assert.equal(state.band.stash.relic.applied, true)
})

test('load and expiry revert a legacy buff without subtracting a special numeric value', () => {
  const state = createInitialState()
  state.player.money = 10000
  state.band.luck = 13
  state.band.activeContrabandEffects = [
    { effectType: 'luck', value: 5, remainingDuration: 1 },
    { kind: 'special', effectType: 'luck', value: 100, remainingDuration: 1 }
  ]
  const snapshot = JSON.parse(
    JSON.stringify(createPersistedState(state, createFixedClock(1000)))
  )
  const loaded = handleLoadGame(createInitialState(), snapshot)
  assert.equal(loaded.band.luck, 13)
  assert.equal(loaded.band.activeContrabandEffects[0].kind, 'stat_buff')
  assert.equal(loaded.band.activeContrabandEffects[0].value, 5)
  assert.equal(loaded.band.activeContrabandEffects[1].kind, 'special')
  assert.equal(loaded.band.activeContrabandEffects[1].value, 100)

  const next = handleAdvanceDay(loaded, {
    dayRngStream: HALF_ROLLS,
    nextRngSeed: loaded.rngSeed
  })
  assert.equal(next.band.luck, 8)
  assert.deepEqual(next.band.activeContrabandEffects, [])
  assert.equal(loaded.band.luck, 13)
  assert.equal(loaded.band.activeContrabandEffects.length, 2)
  assert.equal(loaded.band.activeContrabandEffects[0].remainingDuration, 1)
  assert.equal(loaded.band.activeContrabandEffects[1].remainingDuration, 1)
})
