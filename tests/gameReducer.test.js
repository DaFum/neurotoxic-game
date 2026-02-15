/**
 * @fileoverview Tests for the game reducer module
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import {
  initialState,
  createInitialState
} from '../src/context/initialState.js'

describe('gameReducer', () => {
  let testState

  beforeEach(() => {
    testState = createInitialState()
  })

  describe('CHANGE_SCENE', () => {
    it('should change the current scene', () => {
      const action = { type: ActionTypes.CHANGE_SCENE, payload: 'OVERWORLD' }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.currentScene, 'OVERWORLD')
    })

    it('should preserve other state properties', () => {
      const action = { type: ActionTypes.CHANGE_SCENE, payload: 'OVERWORLD' }
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

    it('should clamp band harmony above zero', () => {
      const action = {
        type: ActionTypes.UPDATE_BAND,
        payload: { harmony: -20 }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.harmony, 1)
    })

    it('should clamp band harmony of zero to one', () => {
      const action = { type: ActionTypes.UPDATE_BAND, payload: { harmony: 0 } }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.harmony, 1)
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
    it('should update gig modifiers with object payload', () => {
      const action = {
        type: ActionTypes.SET_GIG_MODIFIERS,
        payload: { soundcheck: true }
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.gigModifiers.soundcheck, true)
    })

    it('should update gig modifiers with function payload', () => {
      const action = {
        type: ActionTypes.SET_GIG_MODIFIERS,
        payload: prev => ({ ...prev, catering: true })
      }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.gigModifiers.catering, true)
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
    it('should decrement numeric inventory item', () => {
      testState = {
        ...testState,
        band: {
          ...testState.band,
          inventory: { ...testState.band.inventory, shirts: 50 }
        }
      }
      const action = { type: ActionTypes.CONSUME_ITEM, payload: 'shirts' }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.inventory.shirts, 49)
    })

    it('should set boolean inventory item to false', () => {
      testState = {
        ...testState,
        band: {
          ...testState.band,
          inventory: { ...testState.band.inventory, strings: true }
        }
      }
      const action = { type: ActionTypes.CONSUME_ITEM, payload: 'strings' }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.inventory.strings, false)
    })

    it('should not go below zero', () => {
      testState = {
        ...testState,
        band: {
          ...testState.band,
          inventory: { ...testState.band.inventory, shirts: 0 }
        }
      }
      const action = { type: ActionTypes.CONSUME_ITEM, payload: 'shirts' }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.band.inventory.shirts, 0)
    })
  })

  describe('RESET_STATE', () => {
    it('should reset to initial state', () => {
      testState.player.money = 9999
      testState.currentScene = 'GIG'

      const action = { type: ActionTypes.RESET_STATE }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.currentScene, initialState.currentScene)
      assert.strictEqual(newState.player.money, initialState.player.money)
    })
  })

  describe('LOAD_GAME', () => {
    it('should load saved state', () => {
      const savedData = {
        player: { money: 2000, day: 5, location: 'Berlin' },
        band: { harmony: 90 },
        social: { instagram: 500 },
        gameMap: { nodes: {} }
      }

      const action = { type: ActionTypes.LOAD_GAME, payload: savedData }
      const newState = gameReducer(testState, action)

      assert.strictEqual(newState.player.money, 2000)
      assert.strictEqual(newState.player.day, 5)
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
  })

  describe('unknown action', () => {
    it('should return current state for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION', payload: {} }
      const newState = gameReducer(testState, action)

      assert.deepStrictEqual(newState, testState)
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
      'ADVANCE_DAY'
    ]

    expectedTypes.forEach(type => {
      assert.ok(ActionTypes[type], `Missing action type: ${type}`)
      assert.strictEqual(ActionTypes[type], type)
    })
  })
})
