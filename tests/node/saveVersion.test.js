import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parseSaveVersion } from '../../src/utils/saveVersion'
import { validateSaveData } from '../../src/utils/saveValidator'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { CURRENT_SAVE_VERSION } from '../../src/context/reducers/migrations'
import { createInitialState } from '../../src/context/initialState'

describe('parseSaveVersion', () => {
  it('accepts non-negative integer numbers', () => {
    assert.equal(parseSaveVersion(0), 0)
    assert.equal(parseSaveVersion(2), 2)
    assert.equal(parseSaveVersion(42), 42)
  })

  it('accepts digit-only strings as the documented legacy format', () => {
    // PERSISTED_FIELDS.version has always persisted number-or-string; rejecting
    // these would silently re-run every migration from 0 on such a save.
    assert.equal(parseSaveVersion('0'), 0)
    assert.equal(parseSaveVersion('2'), 2)
  })

  it('rejects the values Number() would have coerced', () => {
    // The whole point of the helper: `Number(...)` turned each of these into a
    // finite number and picked a migration schema off it.
    for (const hostile of [true, false, [], [2], null, ' 2', '2 ', '', '0x2']) {
      assert.equal(
        parseSaveVersion(hostile),
        null,
        `expected ${JSON.stringify(hostile)} to be rejected`
      )
    }
  })

  it('rejects non-integer, negative, and non-finite numbers', () => {
    for (const bad of [2.5, -1, NaN, Infinity, -Infinity]) {
      assert.equal(parseSaveVersion(bad), null, `expected ${bad} rejected`)
    }
  })

  it('rejects undefined and objects', () => {
    assert.equal(parseSaveVersion(undefined), null)
    assert.equal(parseSaveVersion({}), null)
    assert.equal(parseSaveVersion({ valueOf: () => 2 }), null)
  })
})

describe('save-version contract is shared by every load boundary', () => {
  const validSave = () => ({
    player: {},
    band: {},
    social: {},
    gameMap: null
  })

  it('validateSaveData rejects a version the parser rejects', () => {
    // String(...) + /^\d+$/ used to accept `[2]`, because stringifying a
    // single-element array yields "2".
    assert.throws(
      () => validateSaveData({ ...validSave(), version: [2] }),
      /Save version must be an integer/
    )
    assert.throws(
      () => validateSaveData({ ...validSave(), version: 2.5 }),
      /Save version must be an integer/
    )
  })

  it('validateSaveData accepts what the parser accepts', () => {
    assert.equal(validateSaveData({ ...validSave(), version: 2 }), true)
    assert.equal(validateSaveData({ ...validSave(), version: '2' }), true)
    assert.equal(validateSaveData(validSave()), true)
  })

  it('handleLoadGame does not stamp a coerced version into state', () => {
    // This path skips validateSaveData entirely (direct LOAD_GAME dispatch and
    // screenshot hydration), so it is the boundary the old Number() coercion
    // actually exposed. `Number([999])` is 999, so a hostile single-element
    // array used to stamp version 999 into state -- above CURRENT_SAVE_VERSION,
    // which would make every future migration skip this save for good.
    const base = createInitialState({ unlocks: [] })
    const next = handleLoadGame(base, { ...validSave(), version: [999] })
    assert.equal(next.version, CURRENT_SAVE_VERSION)
  })

  it('handleLoadGame still honors a legitimate high version marker', () => {
    const base = createInitialState({ unlocks: [] })
    const next = handleLoadGame(base, { ...validSave(), version: 999 })
    assert.equal(next.version, 999)
  })
})
