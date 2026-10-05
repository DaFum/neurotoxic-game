import test from 'node:test'
import assert from 'node:assert/strict'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { createInitialState } from '../../src/context/initialState'
import { FLAGS } from '../../src/data/flags.registry'

test('handleLoadGame keeps registered story flags and drops unknown or non-string ones', () => {
  const initialState = createInitialState()
  const loaded = {
    ...initialState,
    activeStoryFlags: [
      FLAGS.APOLOGY_TOUR_COMPLETE,
      'flag_from_a_removed_feature',
      FLAGS.PROVE_YOURSELF_ACTIVE,
      42,
      null,
      '__proto__'
    ]
  }

  const next = handleLoadGame(initialState, loaded)

  assert.deepEqual(next.activeStoryFlags, [
    FLAGS.APOLOGY_TOUR_COMPLETE,
    FLAGS.PROVE_YOURSELF_ACTIVE
  ])
})

test('handleLoadGame preserves every registered flag so progression gates survive a reload', () => {
  const initialState = createInitialState()
  const all = Object.values(FLAGS)
  const next = handleLoadGame(initialState, {
    ...initialState,
    activeStoryFlags: all
  })
  assert.deepEqual([...next.activeStoryFlags].sort(), [...all].sort())
})

test('handleLoadGame tolerates a missing activeStoryFlags field', () => {
  const initialState = createInitialState()
  const loaded = { ...initialState }
  delete loaded.activeStoryFlags
  const next = handleLoadGame(initialState, loaded)
  assert.deepEqual(next.activeStoryFlags, [])
})
