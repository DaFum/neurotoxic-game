import test from 'node:test'
import assert from 'node:assert/strict'

test('initialState populates unlocks from unlockManager', async t => {
  // We need to use t.mock.module to mock unlockManager before importing initialState
  t.mock.module('../src/utils/unlockManager.js', {
    namedExports: {
      getUnlocks: () => ['test_unlock_1', 'test_unlock_2']
    }
  })

  // Dynamic import so it uses the mocked module
  const { initialState, createInitialState } = await import(
    '../src/context/initialState.js'
  )

  assert.deepEqual(initialState.unlocks, ['test_unlock_1', 'test_unlock_2'])

  const createdState = createInitialState()
  assert.deepEqual(createdState.unlocks, ['test_unlock_1', 'test_unlock_2'])

  // Ensure it's a new copy
  assert.notEqual(initialState.unlocks, createdState.unlocks)
})
