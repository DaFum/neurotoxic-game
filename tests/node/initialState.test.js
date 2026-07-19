import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'

test('initialState module keeps the base singleton internal', async () => {
  const moduleExports = await import('../../src/context/initialState')

  assert.equal(Object.hasOwn(moduleExports, 'initialState'), false)
})

test('createInitialState exposes empty unlocks default', () => {
  assert.deepEqual(createInitialState().unlocks, [])
})

test('createInitialState does not share social.influencers references', () => {
  const stateA = createInitialState()
  const stateB = createInitialState()

  assert.notEqual(stateA.social.influencers, stateB.social.influencers)
  for (const key of Object.keys(stateA.social.influencers)) {
    assert.notEqual(
      stateA.social.influencers[key],
      stateB.social.influencers[key],
      `influencer entry "${key}" must be a fresh object per state`
    )
  }
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
