/**
 * @fileoverview Tests for the player reducer module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'

import {
  playerReducer,
  handleUpdatePlayer
} from '../../src/context/reducers/playerReducer'
import { ActionTypes } from '../../src/context/actionTypes'

describe('playerReducer', () => {
  describe('playerReducer (Main Dispatch)', () => {
    it('should handle UPDATE_PLAYER action object correctly', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }
      const action = {
        type: ActionTypes.UPDATE_PLAYER,
        payload: { money: 200, fame: 100 }
      }

      const newState = playerReducer(initialState, action)

      assert.strictEqual(newState.player.money, 200)
      assert.strictEqual(newState.player.fame, 100)
      assert.strictEqual(newState.player.day, 1) // Unchanged
    })

    it('should handle UPDATE_PLAYER action function correctly', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }
      const action = {
        type: ActionTypes.UPDATE_PLAYER,
        payload: player => ({
          money: player.money + 50,
          day: player.day + 1
        })
      }

      const newState = playerReducer(initialState, action)

      assert.strictEqual(newState.player.money, 150)
      assert.strictEqual(newState.player.day, 2)
      assert.strictEqual(newState.player.fame, 50) // Unchanged
    })

    it('should clamp negative money and fame to 0 when using a function payload', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }
      const action = {
        type: ActionTypes.UPDATE_PLAYER,
        payload: player => ({
          money: player.money - 200, // Becomes -100
          fame: player.fame - 100 // Becomes -50
        })
      }

      const newState = playerReducer(initialState, action)

      assert.strictEqual(newState.player.money, 0)
      assert.strictEqual(newState.player.fame, 0)
      assert.strictEqual(newState.player.day, 1) // Unchanged
    })

    it('should ignore unhandled actions and return current state', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }
      const action = {
        type: 'UNKNOWN_ACTION_TYPE',
        payload: { money: 200 }
      }

      const newState = playerReducer(initialState, action)

      assert.strictEqual(newState, initialState)
      assert.strictEqual(newState.player.money, 100)
    })
  })

  describe('handleUpdatePlayer', () => {
    it('should update player properties based on payload object', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }

      const payload = { money: 200, fame: 100 }
      const newState = handleUpdatePlayer(initialState, payload)

      assert.strictEqual(newState.player.money, 200)
      assert.strictEqual(newState.player.fame, 100)
      assert.strictEqual(newState.player.day, 1) // Unchanged
    })

    it('should update player properties based on payload function', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }

      const payload = player => ({
        money: player.money + 50,
        day: player.day + 1
      })

      const newState = handleUpdatePlayer(initialState, payload)

      assert.strictEqual(newState.player.money, 150)
      assert.strictEqual(newState.player.day, 2)
      assert.strictEqual(newState.player.fame, 50) // Unchanged
    })



    it('should preserve properties not updated', () => {
      const initialState = {
        otherProp: 'test',
        player: { money: 100, otherPlayerProp: 'testPlayer' }
      }

      const payload = { money: 200 }
      const newState = handleUpdatePlayer(initialState, payload)

      assert.strictEqual(newState.otherProp, 'test')
      assert.strictEqual(newState.player.money, 200)
      assert.strictEqual(newState.player.otherPlayerProp, 'testPlayer')
    })

    describe('Rejection Branches for Malformed/Hostile Payloads', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }

      const hostilePayloads = [
        null,
        undefined,
        [{ money: 200 }],
        'string',
        42,
        { constructor: { hacked: true } },
        { prototype: {} },
        ...([
          { money: 200 }
        ].map(p => {
          const obj = { ...p }
          Object.defineProperty(obj, '__proto__', {
            value: { hacked: true },
            enumerable: true
          })
          return obj
        }))
      ]

      hostilePayloads.forEach((payload, index) => {
        it(`should reject hostile/malformed payload ${index}`, () => {
          const newState = handleUpdatePlayer(initialState, payload)
          assert.strictEqual(newState, initialState)
          assert.strictEqual(newState.player.money, 100)
        })

        it(`should reject hostile/malformed function payload ${index}`, () => {
          const fnPayload = () => payload
          const newState = handleUpdatePlayer(initialState, fnPayload)
          assert.strictEqual(newState, initialState)
          assert.strictEqual(newState.player.money, 100)
        })
      })
    })
  })
})
