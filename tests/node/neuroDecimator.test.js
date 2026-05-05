import test from 'node:test'
import assert from 'node:assert'
import { bandReducer } from '../../src/context/reducers/bandReducer.js'
import { ActionTypes } from '../../src/context/actionTypes.js'

test('Neuro-Decimator Toggle enforces harmony clamp', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: false
    }
  }
  const action = {
    type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
    payload: { isActive: true }
  }

  // @ts-expect-error testing specific reducer behaviour without full game state
  const result = bandReducer(initialState, action)

  assert.strictEqual(
    result.band.neuroDecimatorActive,
    true,
    'Decimator must be active'
  )
  assert.ok(
    result.band.harmony >= 0,
    'Harmony must be strictly clamped above 0'
  )
  assert.strictEqual(result.band.harmony, 5, 'Harmony should be clamped to 5')
})

test('Neuro-Decimator Toggle OFF retains harmony', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: true
    }
  }
  const action = {
    type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
    payload: { isActive: false }
  }

  // @ts-expect-error testing specific reducer behaviour without full game state
  const result = bandReducer(initialState, action)

  assert.strictEqual(
    result.band.neuroDecimatorActive,
    false,
    'Decimator must be inactive'
  )
  assert.strictEqual(
    result.band.harmony,
    10,
    'Harmony must be preserved when turned off'
  )
})
