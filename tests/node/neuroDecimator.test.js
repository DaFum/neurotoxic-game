import test from 'node:test'
import assert from 'node:assert/strict'
import { bandReducer } from '../../src/context/reducers/bandReducer.js'
import { ActionTypes } from '../../src/context/actionTypes.js'

test('Neuro-Decimator Toggle enforces harmony clamp', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: false,
      inventory: { neuroDecimator: true }
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
  assert.strictEqual(result.band.harmony, 5, 'Harmony should be 10-5=5')
})

test('Neuro-Decimator Toggle OFF retains harmony', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: true,
      inventory: { neuroDecimator: true }
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

test('Neuro-Decimator clamps harmony at floor (1)', () => {
  const initialState = {
    band: {
      harmony: 3,
      neuroDecimatorActive: false,
      inventory: { neuroDecimator: true }
    }
  }
  const action = {
    type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
    payload: { isActive: true }
  }

  // @ts-expect-error testing specific reducer behaviour without full game state
  const result = bandReducer(initialState, action)

  assert.strictEqual(
    result.band.harmony,
    1,
    'Harmony must be clamped at minimum 1'
  )
})

test('Neuro-Decimator clamps harmony at ceiling (100)', () => {
  const initialState = {
    band: {
      harmony: 100,
      neuroDecimatorActive: false,
      inventory: { neuroDecimator: true }
    }
  }
  const action = {
    type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
    payload: { isActive: true }
  }

  // @ts-expect-error testing specific reducer behaviour without full game state
  const result = bandReducer(initialState, action)

  assert.strictEqual(result.band.harmony, 95, 'Harmony should be 100-5=95')
})

test('Neuro-Decimator toggle asymmetry: reduction is permanent until toggled again', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: false,
      inventory: { neuroDecimator: true }
    }
  }
  const toggleOn = {
    type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
    payload: { isActive: true }
  }
  const toggleOff = {
    type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
    payload: { isActive: false }
  }

  // @ts-expect-error testing specific reducer behaviour without full game state
  let result = bandReducer(initialState, toggleOn)
  assert.strictEqual(
    result.band.harmony,
    5,
    'After toggle ON: harmony reduced to 5'
  )

  // @ts-expect-error testing specific reducer behaviour without full game state
  result = bandReducer(result, toggleOff)
  assert.strictEqual(
    result.band.harmony,
    5,
    'After toggle OFF: harmony stays at 5'
  )
})

test('Neuro-Decimator guards against missing inventory', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: false,
      inventory: { neuroDecimator: false }
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
    false,
    'Decimator toggle should be ignored when not owned'
  )
  assert.strictEqual(result.band.harmony, 10, 'Harmony should not change')
})

test('Neuro-Decimator guards against invalid payload', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: false,
      inventory: { neuroDecimator: true }
    }
  }
  const action = {
    type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
    payload: null
  }

  // @ts-expect-error testing specific reducer behaviour without full game state
  const result = bandReducer(initialState, action)

  assert.strictEqual(
    result.band.neuroDecimatorActive,
    false,
    'Decimator toggle should be ignored with null payload'
  )
  assert.strictEqual(result.band.harmony, 10, 'Harmony should not change')
})

test('Neuro-Decimator guards against duplicate toggles', () => {
  const initialState = {
    band: {
      harmony: 10,
      neuroDecimatorActive: true,
      inventory: { neuroDecimator: true }
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
    'State should not change if already active'
  )
  assert.strictEqual(
    result.band.harmony,
    10,
    'Harmony should not change on duplicate toggle'
  )
})
