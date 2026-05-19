/**
 * @fileoverview Tests for the rival reducer module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { handleUpdateRivalBand } from '../../src/context/reducers/rivalReducer.ts'
import { createUpdateRivalBandAction } from '../../src/context/actionCreators.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'

describe('rivalReducer', () => {
  describe('handleUpdateRivalBand', () => {
    it('merges sanitized patch fields into existing rivalBand', () => {
      const initialState = {
        rivalBand: {
          id: 'rival_1',
          name: 'Rival',
          alignment: 'NEUTRAL',
          powerLevel: 10,
          currentLocationId: 'node_a'
        }
      }

      const next = handleUpdateRivalBand(initialState, {
        powerLevel: 25,
        currentLocationId: 'node_b'
      })

      assert.equal(next.rivalBand.powerLevel, 25)
      assert.equal(next.rivalBand.currentLocationId, 'node_b')
      assert.equal(next.rivalBand.id, 'rival_1')
      assert.equal(next.rivalBand.name, 'Rival')
    })

    it('returns state unchanged when no rivalBand exists', () => {
      const initialState = { rivalBand: null }
      const next = handleUpdateRivalBand(initialState, { powerLevel: 5 })
      assert.equal(next, initialState)
    })
  })

  describe('createUpdateRivalBandAction', () => {
    it('produces a typed UPDATE_RIVAL_BAND action with only known fields', () => {
      const action = createUpdateRivalBandAction({
        powerLevel: 42,
        currentLocationId: 'node_x',
        bogus: 'should-be-dropped'
      })

      assert.equal(action.type, ActionTypes.UPDATE_RIVAL_BAND)
      assert.deepEqual(action.payload, {
        powerLevel: 42,
        currentLocationId: 'node_x'
      })
    })

    it('clamps negative powerLevel to zero', () => {
      const action = createUpdateRivalBandAction({ powerLevel: -5 })
      assert.equal(action.payload.powerLevel, 0)
    })

    it('coerces NaN powerLevel to zero', () => {
      const action = createUpdateRivalBandAction({ powerLevel: Number.NaN })
      assert.equal(action.payload.powerLevel, 0)
    })

    it('coerces Infinity powerLevel to zero', () => {
      const posInf = createUpdateRivalBandAction({
        powerLevel: Number.POSITIVE_INFINITY
      })
      assert.equal(posInf.payload.powerLevel, 0)
      const negInf = createUpdateRivalBandAction({
        powerLevel: Number.NEGATIVE_INFINITY
      })
      assert.equal(negInf.payload.powerLevel, 0)
    })
  })
})
