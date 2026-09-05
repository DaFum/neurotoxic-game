import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { handleLoadGame } from '../../src/context/reducers/systemReducer.ts'

test('career is a fresh required persisted state slice and legacy saves default safely', () => {
  const first = createInitialState()
  const second = createInitialState()
  assert.deepEqual(first.career.settledCrewRunIds, [])
  assert.notEqual(first.career, second.career)
  assert.notEqual(first.career.crewById, second.career.crewById)
  const loaded = handleLoadGame(first, { version: first.version })
  assert.deepEqual(loaded.career, second.career)
})

test('career sanitizer drops unknown Crew ids and non-canonical signature traits', () => {
  const base = createInitialState()
  const loaded = handleLoadGame(base, {
    version: base.version,
    career: {
      crewById: {
        mika: {
          loyalty: 100,
          storyProgress: 10,
          signatureTraitId: 'signature_pathfinder',
          unavailableUntilCompletedRunCount: 0
        },
        forged: {
          loyalty: 100,
          storyProgress: 10,
          signatureTraitId: 'signature_field_surgeon',
          unavailableUntilCompletedRunCount: 0
        }
      }
    }
  })
  assert.equal(loaded.career.crewById.mika.signatureTraitId, null)
  assert.equal(Object.hasOwn(loaded.career.crewById, 'forged'), false)
})
