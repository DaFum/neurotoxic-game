import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initialState,
  createInitialState
} from '../src/context/initialState.js'

test('initialState exposes empty unlocks default', () => {
  assert.deepEqual(initialState.unlocks, [])
})

test('createInitialState accepts persistedData', () => {
  const createdState = createInitialState({
    unlocks: ['test_unlock_1', 'test_unlock_2']
  })
  assert.deepEqual(createdState.unlocks, ['test_unlock_1', 'test_unlock_2'])

  // Ensure it's a new copy
  const createdState2 = createInitialState({
    unlocks: ['test_unlock_1', 'test_unlock_2']
  })
  assert.notEqual(createdState.unlocks, createdState2.unlocks)
})
