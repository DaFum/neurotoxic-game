/**
 * @fileoverview Tests for the game reducer module
 */

import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert'
import { GAME_PHASES } from '../src/context/gameConstants.js'

// Mock applyTraitUnlocks with improved matching logic
const mockApplyTraitUnlocks = mock.fn((state, unlocks) => {
  const band = { ...state.band }
  // Deep copy members to avoid mutation issues in test
  band.members = band.members.map(m => ({ ...m, traits: { ...m.traits } }))

  unlocks.forEach(u => {
    // Mock matching logic: ID match OR case-insensitive name match
    const member = band.members.find(
      m =>
        (m.id && m.id === u.memberId) ||
        (m.name && m.name.toLowerCase() === u.memberId.toLowerCase())
    )
    if (member) {
      member.traits[u.traitId] = { id: u.traitId }
    }
  })

  return {
    band,
    toasts:
      unlocks.length > 0
        ? [
            ...(state.toasts || []),
            { message: `Unlocked ${unlocks[0].traitId}`, type: 'success' }
          ]
        : state.toasts || []
  }
})

mock.module('../src/utils/traitUtils.js', {
  namedExports: {
    applyTraitUnlocks: mockApplyTraitUnlocks,
    getTraitById: mock.fn(traitId => ({ id: traitId })),
    normalizeTraitMap: mock.fn(traits => {
      if (!traits) return Object.create(null)
      if (Array.isArray(traits)) {
        const result = Object.create(null)
        traits.forEach(t => {
          if (t && t.id) result[t.id] = t
        })
        return result
      }
      return Object.assign(Object.create(null), traits)
    })
  }
})

// Import SUT after mocking
const { gameReducer, ActionTypes } =
  await import('../src/context/gameReducer.js')
const { createInitialState, initialState } =
  await import('../src/context/initialState.js')

describe('gameReducer', () => {
  let testState

  beforeEach(() => {
    testState = createInitialState()
    mockApplyTraitUnlocks.mock.resetCalls()
  })

  describe('CHANGE_SCENE', () => {
    it('should change the current scene', () => {
      const action = {
        type: ActionTypes.CHANGE_SCENE,
        payload: GAME_PHASES.OVERWORLD
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.currentScene, GAME_PHASES.OVERWORLD)
    })

    it('should preserve other state properties', () => {
      const action = {
        type: ActionTypes.CHANGE_SCENE,
        payload: GAME_PHASES.OVERWORLD
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.player.money, testState.player.money)
      assert.strictEqual(newState.band.harmony, testState.band.harmony)
    })
  })

  describe('UPDATE_PLAYER', () => {
    it('should update player money', () => {
      const action = {
        type: ActionTypes.UPDATE_PLAYER,
        payload: { money: 1000 }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.player.money, 1000)
    })

    it('should update player fame', () => {
      const action = { type: ActionTypes.UPDATE_PLAYER, payload: { fame: 50 } }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.player.fame, 50)
    })

    it('should merge player updates with existing state', () => {
      const action = {
        type: ActionTypes.UPDATE_PLAYER,
        payload: { money: 1000 }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.player.money, 1000)
      assert.strictEqual(newState.player.day, testState.player.day)
      assert.strictEqual(newState.player.location, testState.player.location)
    })
  })

  describe('UPDATE_BAND', () => {
    it('should update band harmony', () => {
      const action = { type: ActionTypes.UPDATE_BAND, payload: { harmony: 50 } }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.harmony, 50)
    })

    // Parametrized: UPDATE_BAND harmony clamping
    const harmonyclampVariants = [
      { label: 'clamp band harmony above zero [-20 → 1]', input: -20 },
      { label: 'clamp band harmony of zero to one [0 → 1]', input: 0 }
    ]

    harmonyclampVariants.forEach(variant => {
      it(`should ${variant.label}`, () => {
        const action = {
          type: ActionTypes.UPDATE_BAND,
          payload: { harmony: variant.input }
        }
        const newState = gameReducer(testState, action)

        assert.strictEqual(newState.band.harmony, 1)
      })
    })

    it('should update band members', () => {
      const newMembers = [{ name: 'Test', mood: 100, stamina: 100 }]
      const action = {
        type: ActionTypes.UPDATE_BAND,
        payload: { members: newMembers }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.members.length, 1)
      assert.strictEqual(newState.band.members[0].name, 'Test')
    })
  })

  describe('ADVANCE_DAY', () => {
    it('should clamp harmony after daily updates', () => {
      testState = {
        ...testState,
        band: { ...testState.band, harmony: -10, harmonyRegenTravel: false }
      }

      const action = { type: ActionTypes.ADVANCE_DAY }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.harmony, 1)
    })
  })

  describe('UPDATE_SOCIAL', () => {
    it('should update social media followers', () => {
      const action = {
        type: ActionTypes.UPDATE_SOCIAL,
        payload: { instagram: 1000 }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.social.instagram, 1000)
    })

    it('should preserve other social stats', () => {
      const action = {
        type: ActionTypes.UPDATE_SOCIAL,
        payload: { instagram: 1000 }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.social.tiktok, testState.social.tiktok)
    })
  })

  describe('SET_GIG_MODIFIERS', () => {
    // Parametrized: SET_GIG_MODIFIERS payload variations
    const setModifiersVariants = [
      {
        label: 'update gig modifiers with object payload',
        payloadFn: () => ({ soundcheck: true }),
        expectedKey: 'soundcheck',
        expectedValue: true
      },
      {
        label: 'update gig modifiers with function payload',
        payloadFn: () => prev => ({ ...prev, catering: true }),
        expectedKey: 'catering',
        expectedValue: true
      }
    ]

    setModifiersVariants.forEach(variant => {
      it(`should ${variant.label}`, () => {
        const action = {
          type: ActionTypes.SET_GIG_MODIFIERS,
          payload: variant.payloadFn()
        }
        const newState = gameReducer(testState, action)

        assert.strictEqual(
          newState.gigModifiers[variant.expectedKey],
          variant.expectedValue,
          `${variant.expectedKey} should be ${variant.expectedValue}`
        )
      })
    })
  })

  describe('ADD_TOAST', () => {
    it('should add toast to array', () => {
      const toast = { id: 1, message: 'Test', type: 'info' }
      const action = { type: ActionTypes.ADD_TOAST, payload: toast }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.toasts.length, 1)
      assert.strictEqual(newState.toasts[0].message, 'Test')
    })
  })

  describe('REMOVE_TOAST', () => {
    it('should remove toast by id', () => {
      testState = {
        ...testState,
        toasts: [
          { id: 1, message: 'Test1' },
          { id: 2, message: 'Test2' }
        ]
      }

      const action = { type: ActionTypes.REMOVE_TOAST, payload: 1 }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.toasts.length, 1)
      assert.strictEqual(newState.toasts[0].id, 2)
    })
  })

  describe('CONSUME_ITEM', () => {
    // Parametrized: CONSUME_ITEM inventory variants
    const consumeItemVariants = [
      {
        label: 'decrement numeric inventory item [shirts: 50 → 49]',
        itemKey: 'shirts',
        initialValue: 50,
        expectedValue: 49,
        expectedType: 'numeric'
      },
      {
        label: 'set boolean inventory item to false [strings: true → false]',
        itemKey: 'strings',
        initialValue: true,
        expectedValue: false,
        expectedType: 'boolean'
      },
      {
        label: 'not go below zero [shirts: 0 → 0]',
        itemKey: 'shirts',
        initialValue: 0,
        expectedValue: 0,
        expectedType: 'numeric'
      }
    ]

    consumeItemVariants.forEach(variant => {
      it(`should ${variant.label}`, () => {
        testState = {
          ...testState,
          band: {
            ...testState.band,
            inventory: {
              ...testState.band.inventory,
              [variant.itemKey]: variant.initialValue
            }
          }
        }
        const action = {
          type: ActionTypes.CONSUME_ITEM,
          payload: variant.itemKey
        }
        const newState = gameReducer(testState, action)

        assert.strictEqual(
          newState.band.inventory[variant.itemKey],
          variant.expectedValue,
          `${variant.itemKey} should be ${variant.expectedValue}`
        )
      })
    })
  })

  describe('RESET_STATE', () => {
    it('should reset to initial state', () => {
      testState.player.money = 9999
      testState.currentScene = GAME_PHASES.GIG

      const action = { type: ActionTypes.RESET_STATE }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.currentScene, initialState.currentScene)
      assert.strictEqual(newState.player.money, initialState.player.money)
    })

    it('should retain unlocks on reset when payload is provided', () => {
      testState.player.money = 9999
      testState.currentScene = GAME_PHASES.GIG

      const action = {
        type: ActionTypes.RESET_STATE,
        payload: { unlocks: ['retained_unlock'] }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.currentScene, initialState.currentScene)
      assert.strictEqual(newState.player.money, initialState.player.money)
      assert.deepStrictEqual(newState.unlocks, ['retained_unlock'])
    })
  })

  describe('LOAD_GAME', () => {
    it('should load saved state', () => {
      const savedData = {
        player: { money: 2000, day: 5, location: 'Berlin' },
        band: { harmony: 90 },
        social: { instagram: 500 },
        gameMap: { nodes: {} },
        activeQuests: [
          {
            id: 'quest_apology_tour',
            label: 'ui:quests.postgig.apologyTour.title',
            description: 'ui:quests.postgig.apologyTour.description',
            progress: 1,
            required: 3,
            deadline: 10
          }
        ]
      }

      const action = { type: ActionTypes.LOAD_GAME, payload: savedData }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.player.money, 2000)
      assert.strictEqual(newState.player.day, 5)
      assert.strictEqual(newState.activeQuests.length, 1)
      assert.strictEqual(newState.activeQuests[0].id, 'quest_apology_tour')
    })

    it('should migrate energy to catering in gigModifiers', () => {
      const savedData = {
        player: {},
        band: {},
        social: {},
        gameMap: {},
        gigModifiers: { energy: true }
      }

      const action = { type: ActionTypes.LOAD_GAME, payload: savedData }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.gigModifiers.catering, true)
      assert.strictEqual(newState.gigModifiers.energy, undefined)
    })

    it('should merge with default values for missing properties', () => {
      const savedData = {
        player: { money: 2000 },
        band: {},
        social: {},
        gameMap: {}
      }

      const action = { type: ActionTypes.LOAD_GAME, payload: savedData }
      const newState = gameReducer(testState, action)

      // Should have default van properties
      assert.ok(newState.player.van !== undefined)
      assert.strictEqual(typeof newState.player.van.fuel, 'number')
    })

    it('should hydrate unlocks from payload', () => {
      const savedData = {
        player: { money: 2000 },
        band: {},
        social: {},
        gameMap: {},
        unlocks: ['test1', 'test2']
      }

      const action = { type: ActionTypes.LOAD_GAME, payload: savedData }
      const newState = gameReducer(testState, action)

      assert.deepStrictEqual(newState.unlocks, ['test1', 'test2'])
    })

    it('should fallback unlocks to state.unlocks or empty array', () => {
      const savedData = {
        player: { money: 2000 },
        band: {},
        social: {},
        gameMap: {}
        // unlocks omitted
      }

      testState.unlocks = ['existing_unlock']
      const action = { type: ActionTypes.LOAD_GAME, payload: savedData }
      const newState = gameReducer(testState, action)

      assert.deepStrictEqual(newState.unlocks, ['existing_unlock'])

      // Test complete omission
      delete testState.unlocks
      const newState2 = gameReducer(testState, action)
      assert.deepStrictEqual(newState2.unlocks, [])
    })
  })

  describe('unknown action', () => {
    it('should return current state for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION', payload: {} }
      const newState = gameReducer(testState, action)

      assert.deepStrictEqual(newState, testState)
    })
  })

  describe('UNLOCK_TRAIT', () => {
    it('UNLOCK_TRAIT unlocks a trait for a band member (Name fallback)', () => {
      // Use immutable update pattern
      const testState = {
        ...createInitialState(),
        band: {
          ...createInitialState().band,
          members: [
            { name: 'Matze', traits: {} },
            { name: 'Marius', traits: {} }
          ]
        }
      }

      const action = {
        type: ActionTypes.UNLOCK_TRAIT,
        payload: { memberId: 'matze', traitId: 'gear_nerd' }
      }

      const nextState = gameReducer(testState, action)

      // Verify mock was called exactly once for this action
      assert.strictEqual(mockApplyTraitUnlocks.mock.calls.length, 1)

      // Verify arguments: (state, [{ memberId: 'matze', traitId: 'gear_nerd' }])
      const callArgs = mockApplyTraitUnlocks.mock.calls[0].arguments
      assert.deepStrictEqual(callArgs[1], [
        { memberId: 'matze', traitId: 'gear_nerd' }
      ])

      // Verify state change (simulated by mock)
      const matze = nextState.band.members.find(m => m.name === 'Matze')
      assert.strictEqual(Object.keys(matze.traits).length, 1)
      assert.strictEqual(matze.traits.gear_nerd.id, 'gear_nerd')
    })

    it('UNLOCK_TRAIT adds toast', () => {
      const testState = {
        ...createInitialState(),
        band: {
          ...createInitialState().band,
          members: [{ name: 'Matze', traits: {} }]
        }
      }

      const action = {
        type: ActionTypes.UNLOCK_TRAIT,
        payload: { memberId: 'matze', traitId: 'gear_nerd' }
      }
      const nextState = gameReducer(testState, action)
      assert.ok(nextState.toasts.length > 0, 'Should add a toast')
      assert.ok(
        nextState.toasts[0].message.includes('Unlocked'),
        'Toast should mention unlock'
      )
    })
  })

  describe('SET_LAST_GIG_STATS', () => {
    it('should not check trait unlocks in practice mode', () => {
      const testState = {
        ...createInitialState(),
        currentGig: { isPractice: true },
        band: {
          ...createInitialState().band,
          members: [{ name: 'Matze', traits: {} }]
        }
      }

      const action = {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: { score: 10000, perfectHits: 50 }
      }

      const newState = gameReducer(testState, action)

      assert.strictEqual(
        mockApplyTraitUnlocks.mock.calls.length,
        0,
        'Should not call applyTraitUnlocks'
      )
      assert.deepStrictEqual(newState.lastGigStats, action.payload)
    })

    it('should check trait unlocks in normal mode', () => {
      const testState = {
        ...createInitialState(),
        currentGig: { isPractice: false },
        band: {
          ...createInitialState().band,
          members: [{ name: 'Matze', traits: {} }]
        }
      }

      const action = {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: { score: 10000, perfectHits: 50 }
      }

      // We need to mock checkTraitUnlocks for this test to be truly isolated,
      // but since it's imported inside the reducer file, we rely on its behavior or verify via applyTraitUnlocks
      // Note: we can't easily spy on checkTraitUnlocks because it's a direct import in gameReducer.js
      // However, we mock applyTraitUnlocks. gameReducer calls applyTraitUnlocks with result of checkTraitUnlocks.
      // So if applyTraitUnlocks is called, we know the path was taken.

      const newState = gameReducer(testState, action)

      assert.strictEqual(
        mockApplyTraitUnlocks.mock.calls.length,
        1,
        'Should call applyTraitUnlocks'
      )
      assert.deepStrictEqual(newState.lastGigStats, action.payload)
    })
  })

  describe('ADD_UNLOCK', () => {
    it('should add a new unlock', () => {
      const testState = {
        ...createInitialState(),
        unlocks: ['existing_unlock']
      }

      const action = {
        type: ActionTypes.ADD_UNLOCK,
        payload: 'new_unlock'
      }

      const newState = gameReducer(testState, action)

      assert.deepStrictEqual(newState.unlocks, [
        'existing_unlock',
        'new_unlock'
      ])
      assert.deepStrictEqual(testState.unlocks, ['existing_unlock']) // Verify immutability
      assert.notStrictEqual(newState, testState)
    })

    it('should not add a duplicate unlock', () => {
      const testState = {
        ...createInitialState(),
        unlocks: ['existing_unlock']
      }

      const action = {
        type: ActionTypes.ADD_UNLOCK,
        payload: 'existing_unlock'
      }

      const newState = gameReducer(testState, action)

      assert.strictEqual(newState, testState) // Check reference equality for early return
      assert.deepStrictEqual(newState.unlocks, ['existing_unlock'])
    })

    it('should handle undefined state.unlocks', () => {
      const testState = {
        ...createInitialState()
      }
      delete testState.unlocks // explicitly remove

      const action = {
        type: ActionTypes.ADD_UNLOCK,
        payload: 'new_unlock'
      }

      const newState = gameReducer(testState, action)

      assert.deepStrictEqual(newState.unlocks, ['new_unlock'])
    })

    it('should ignore falsy and non-string unlockIds', () => {
      const testState = {
        ...createInitialState(),
        unlocks: ['existing']
      }

      const testCases = [null, undefined, '', 123, {}, []]

      testCases.forEach(payload => {
        const action = { type: ActionTypes.ADD_UNLOCK, payload }
        const newState = gameReducer(testState, action)
        assert.strictEqual(newState, testState)
        assert.deepStrictEqual(newState.unlocks, ['existing'])
      })
    })
  })
})

describe('ActionTypes', () => {
  it('should have all expected action types', () => {
    const expectedTypes = [
      'CHANGE_SCENE',
      'UPDATE_PLAYER',
      'UPDATE_BAND',
      'UPDATE_SOCIAL',
      'UPDATE_SETTINGS',
      'SET_MAP',
      'SET_GIG',
      'START_GIG',
      'SET_SETLIST',
      'SET_LAST_GIG_STATS',
      'SET_ACTIVE_EVENT',
      'ADD_TOAST',
      'REMOVE_TOAST',
      'SET_GIG_MODIFIERS',
      'LOAD_GAME',
      'RESET_STATE',
      'APPLY_EVENT_DELTA',
      'POP_PENDING_EVENT',
      'CONSUME_ITEM',
      'ADVANCE_DAY',
      'UNLOCK_TRAIT',
      'ADD_UNLOCK',
      'PIRATE_BROADCAST'
    ]

    expectedTypes.forEach(type => {
      assert.ok(ActionTypes[type], `Missing action type: ${type}`)
      assert.strictEqual(ActionTypes[type], type)
    })
  })
})
