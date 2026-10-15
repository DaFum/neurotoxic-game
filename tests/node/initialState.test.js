import test from 'node:test'
import assert from 'node:assert/strict'
import { createInitialState } from '../../src/context/initialState'
import { handleResetState } from '../../src/context/reducers/systemReducer'

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

const collectSharedObjectPaths = (
  a,
  b,
  path = 'state',
  seen = new WeakSet()
) => {
  if (a === null || typeof a !== 'object') return []
  if (b === null || typeof b !== 'object') return []
  if (a === b) return [path]
  if (seen.has(a)) return []
  seen.add(a)
  const shared = []
  for (const key of Object.keys(a)) {
    if (!Object.hasOwn(b, key)) continue
    shared.push(
      ...collectSharedObjectPaths(a[key], b[key], `${path}.${key}`, seen)
    )
  }
  return shared
}

test('createInitialState does not share social.regionalGigHistory references', () => {
  const stateA = createInitialState()
  const stateB = createInitialState()

  assert.deepEqual(stateA.social.regionalGigHistory, {})
  assert.notEqual(
    stateA.social.regionalGigHistory,
    stateB.social.regionalGigHistory
  )
})

test('createInitialState shares no nested object references between states', () => {
  assert.deepEqual(
    collectSharedObjectPaths(createInitialState(), createInitialState()),
    []
  )
})

test('RESET_STATE results share no nested object references', () => {
  const base = createInitialState()
  const resetA = handleResetState(base, {})
  const resetB = handleResetState(base, {})

  assert.deepEqual(collectSharedObjectPaths(resetA, resetB), [])
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

test('createInitialState rejects coercive persisted settings values', () => {
  const baseline = createInitialState()
  const created = createInitialState({
    settings: {
      crtEnabled: 'false',
      tutorialSeen: '1',
      logLevel: '2'
    }
  })

  assert.deepEqual(created.settings, baseline.settings)
})
