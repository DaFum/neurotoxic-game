/**
 * @fileoverview Tests for the player reducer module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { handleUpdatePlayer } from '../../src/context/reducers/playerReducer.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'

describe('playerReducer', () => {
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

    it('should clamp negative money updates to 0', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }

      const payload = { money: -500 }
      const newState = handleUpdatePlayer(initialState, payload)

      assert.strictEqual(newState.player.money, 0)
    })

    it('should clamp negative fame updates to 0', () => {
      const initialState = {
        player: { money: 100, fame: 50, day: 1 }
      }

      const payload = { fame: -10 }
      const newState = handleUpdatePlayer(initialState, payload)

      assert.strictEqual(newState.player.fame, 0)
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
        ...[{ money: 200 }].map(p => {
          const obj = { ...p }
          Object.defineProperty(obj, '__proto__', {
            value: { hacked: true },
            enumerable: true
          })
          return obj
        })
      ]

      hostilePayloads.forEach((payload, index) => {
        it(`should reject hostile/malformed payload ${index}`, () => {
          if (
            typeof payload === 'object' &&
            payload !== null &&
            Object.hasOwn(payload, 'money')
          ) {
            assert(Object.hasOwn(payload, '__proto__'))
          }
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

      for (const value of [
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY
      ]) {
        it(`should retain money for non-finite object payload ${String(value)}`, () => {
          const newState = handleUpdatePlayer(initialState, { money: value })
          assert.strictEqual(newState.player.money, initialState.player.money)
          assert.strictEqual(newState.player.fame, initialState.player.fame)
        })

        it(`should retain money for non-finite function payload ${String(value)}`, () => {
          const newState = handleUpdatePlayer(initialState, () => ({
            money: value
          }))
          assert.strictEqual(newState.player.money, initialState.player.money)
          assert.strictEqual(newState.player.fame, initialState.player.fame)
        })

        it(`should retain fame for non-finite object payload ${String(value)}`, () => {
          const newState = handleUpdatePlayer(initialState, { fame: value })
          assert.strictEqual(newState.player.money, initialState.player.money)
          assert.strictEqual(newState.player.fame, initialState.player.fame)
        })

        it(`should retain fame for non-finite function payload ${String(value)}`, () => {
          const newState = handleUpdatePlayer(initialState, () => ({
            fame: value
          }))
          assert.strictEqual(newState.player.money, initialState.player.money)
          assert.strictEqual(newState.player.fame, initialState.player.fame)
        })
      }

      it('should drop a standalone fameLevel update (derived from fame)', () => {
        const newState = handleUpdatePlayer(initialState, { fameLevel: 99 })
        assert.strictEqual(
          newState.player.fameLevel,
          initialState.player.fameLevel
        )
      })
    })

    describe('re-clamping of van, day, time and location', () => {
      const baseState = () => ({
        player: {
          money: 100,
          fame: 50,
          day: 4,
          time: 9,
          location: 'berlin',
          van: { fuel: 60, condition: 70, upgrades: [], breakdownChance: 0.05 }
        }
      })

      it('clamps van fuel and condition into their ranges', () => {
        const high = handleUpdatePlayer(baseState(), {
          van: { ...baseState().player.van, fuel: 900, condition: 250 }
        })
        assert.strictEqual(high.player.van.fuel, 100)
        assert.strictEqual(high.player.van.condition, 100)

        const low = handleUpdatePlayer(baseState(), {
          van: { ...baseState().player.van, fuel: -20, condition: -5 }
        })
        assert.strictEqual(low.player.van.fuel, 0)
        assert.strictEqual(low.player.van.condition, 0)
      })

      it('keeps the prior van fuel and condition for non-finite or non-numeric values', () => {
        for (const bad of [Number.NaN, Infinity, -Infinity, '90', true, null]) {
          const next = handleUpdatePlayer(baseState(), {
            van: { upgrades: [], fuel: bad, condition: bad }
          })
          assert.strictEqual(next.player.van.fuel, 60)
          assert.strictEqual(next.player.van.condition, 70)
        }
      })

      it('ignores a van payload that is not a record', () => {
        for (const bad of ['van', 7, null, [1, 2]]) {
          const next = handleUpdatePlayer(baseState(), { van: bad })
          assert.deepStrictEqual(next.player.van, baseState().player.van)
        }
      })

      it('floors day and keeps it at 1 or above', () => {
        assert.strictEqual(
          handleUpdatePlayer(baseState(), { day: 7.9 }).player.day,
          7
        )
        assert.strictEqual(
          handleUpdatePlayer(baseState(), { day: 0 }).player.day,
          1
        )
        assert.strictEqual(
          handleUpdatePlayer(baseState(), { day: -12 }).player.day,
          1
        )
      })

      it('keeps the prior day and time for non-finite or non-numeric values', () => {
        for (const bad of [Number.NaN, Infinity, '8', false, null]) {
          const next = handleUpdatePlayer(baseState(), { day: bad, time: bad })
          assert.strictEqual(next.player.day, 4)
          assert.strictEqual(next.player.time, 9)
        }
      })

      it('falls back to day 1 when both the update and the stored day are malformed', () => {
        const corrupt = { player: { ...baseState().player, day: Number.NaN } }
        assert.strictEqual(
          handleUpdatePlayer(corrupt, { day: 'x' }).player.day,
          1
        )
        assert.strictEqual(
          handleUpdatePlayer(corrupt, { day: 3 }).player.day,
          3
        )
      })

      it('wraps time into the 0..23 clock range', () => {
        assert.strictEqual(
          handleUpdatePlayer(baseState(), { time: 26 }).player.time,
          2
        )
        assert.strictEqual(
          handleUpdatePlayer(baseState(), { time: -1 }).player.time,
          23
        )
        assert.strictEqual(
          handleUpdatePlayer(baseState(), { time: 15 }).player.time,
          15
        )
      })

      it('accepts only string locations', () => {
        assert.strictEqual(
          handleUpdatePlayer(baseState(), { location: 'hamburg' }).player
            .location,
          'hamburg'
        )
        for (const bad of [42, null, {}, ['x'], true]) {
          const next = handleUpdatePlayer(baseState(), { location: bad })
          assert.strictEqual(next.player.location, 'berlin')
        }
      })

      it('applies the same clamps to functional updaters', () => {
        const next = handleUpdatePlayer(baseState(), prev => ({
          day: prev.day - 100,
          van: { ...prev.van, fuel: prev.van.fuel + 500 }
        }))
        assert.strictEqual(next.player.day, 1)
        assert.strictEqual(next.player.van.fuel, 100)
      })
    })

    describe('Dispatch Paths', () => {
      it('should delegate UPDATE_PLAYER action correctly', () => {
        const initialState = {
          player: { money: 100, fame: 50, day: 1 },
          band: { members: [] }
        }

        const action = {
          type: 'UPDATE_PLAYER',
          payload: { money: 200 }
        }

        const newState = gameReducer(initialState, action)
        assert.strictEqual(newState.player.money, 200)
        assert.strictEqual(newState.player.fame, 50)
      })

      it('should throw on UNKNOWN_ACTION correctly', () => {
        const initialState = {
          player: { money: 100, fame: 50, day: 1 },
          band: { members: [] }
        }

        const action = {
          type: 'UNKNOWN_ACTION',
          payload: { money: 200 }
        }

        assert.throws(
          () => gameReducer(initialState, action),
          /Unhandled action type: UNKNOWN_ACTION/
        )
      })
    })
  })
})
