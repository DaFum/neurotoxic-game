import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { createInitialState } from '../../src/context/initialState'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { createRawLoadPayload } from '../../src/context/usePersistence'
import { validateSaveData } from '../../src/utils/saveValidator'
import { safeJsonParse } from '../../src/utils/objectUtils'
import { CURRENT_SAVE_VERSION } from '../../src/context/reducers/migrations'

/**
 * Asserts the load result is a usable game state rather than a half-populated
 * shell. A loader that "did not throw" but produced `player: undefined` still
 * breaks the first render, so every recovery case ends here.
 */
const assertSaneState = (state, label) => {
  assert.ok(state, `${label}: state is present`)
  assert.equal(typeof state.player, 'object', `${label}: player object`)
  assert.notEqual(state.player, null, `${label}: player not null`)
  assert.ok(Number.isFinite(state.player.money), `${label}: finite money`)
  assert.ok(Number.isFinite(state.player.day), `${label}: finite day`)
  assert.ok(Number.isFinite(state.player.fame), `${label}: finite fame`)
  assert.equal(typeof state.band, 'object', `${label}: band object`)
  assert.notEqual(state.band, null, `${label}: band not null`)
  assert.ok(Array.isArray(state.band.members), `${label}: band members array`)
  assert.ok(Number.isFinite(state.band.harmony), `${label}: finite harmony`)
  assert.ok(
    state.band.harmony >= 1 && state.band.harmony <= 100,
    `${label}: harmony in range`
  )
  assert.equal(typeof state.social, 'object', `${label}: social object`)
  assert.ok(Array.isArray(state.assets), `${label}: assets array`)
  assert.ok(Array.isArray(state.setlist), `${label}: setlist array`)
  assert.ok(Array.isArray(state.unlocks), `${label}: unlocks array`)
  assert.ok(Number.isFinite(state.version), `${label}: finite version`)
  assert.ok(
    state.version >= CURRENT_SAVE_VERSION,
    `${label}: version upgraded to current`
  )
  assert.equal(typeof state.currentScene, 'string', `${label}: scene string`)
}

describe('save recovery - truncated JSON', () => {
  const validSave = JSON.stringify({
    version: 1,
    player: { money: 500, day: 3 },
    band: { members: [{ name: 'Matze' }], harmony: 40 },
    social: { fans: 20 },
    gameMap: null
  })

  const truncations = {
    'mid-object': validSave.slice(0, validSave.length - 10),
    'mid-string': validSave.slice(0, validSave.indexOf('Matze') + 3),
    'mid-array': validSave.slice(0, validSave.indexOf('members') + 12),
    'first byte only': validSave.slice(0, 1),
    empty: ''
  }

  for (const [label, truncated] of Object.entries(truncations)) {
    it(`rejects a save truncated ${label} at the parse boundary`, () => {
      assert.throws(() => safeJsonParse(truncated))
    })
  }
})

describe('save recovery - non-object payloads', () => {
  for (const [label, stored] of Object.entries({
    'the string "null"': 'null',
    'the empty JSON string': '""',
    'a bare number': '42',
    'a top-level array': '[]'
  })) {
    it(`loads a sane state for ${label}`, () => {
      const parsed = safeJsonParse(stored)
      const state = handleLoadGame(createInitialState(), parsed)
      assertSaneState(state, label)
    })
  }
})

describe('save recovery - missing top-level keys', () => {
  const full = {
    version: CURRENT_SAVE_VERSION,
    player: { money: 500, day: 3 },
    band: { members: [{ name: 'Matze' }], harmony: 40 },
    social: { fans: 20 },
    gameMap: null,
    assets: []
  }

  for (const missing of ['player', 'band', 'assets', 'version']) {
    it(`loads a sane state when "${missing}" is absent`, () => {
      const payload = { ...full }
      delete payload[missing]
      const state = handleLoadGame(createInitialState(), payload)
      assertSaneState(state, `missing ${missing}`)
    })
  }

  it('rejects a payload missing a validator-required key before load', () => {
    const payload = { ...full }
    delete payload.player
    assert.throws(() => validateSaveData(payload), /player/)
  })
})

describe('save recovery - wrong types for present keys', () => {
  for (const [label, payload] of Object.entries({
    'player: null': { player: null },
    'player: array': { player: [] },
    'player: string': { player: 'broken' },
    'band: null': { band: null },
    'band.members: object': { band: { members: {}, harmony: 40 } },
    'assets: object': { assets: {} },
    'setlist: string': { setlist: 'song' },
    'social: number': { social: 7 },
    'reputationByRegion: array': { reputationByRegion: [] },
    'unlocks: string': { unlocks: 'all' }
  })) {
    it(`loads a sane state for ${label}`, () => {
      const state = handleLoadGame(createInitialState(), payload)
      assertSaneState(state, label)
    })
  }
})

describe('save recovery - version marker', () => {
  const cases = {
    missing: {},
    'non-numeric string': { version: 'two' },
    null: { version: null },
    NaN: { version: Number.NaN },
    Infinity: { version: Number.POSITIVE_INFINITY },
    negative: { version: -5 },
    'far above current': { version: 9999 }
  }

  for (const [label, payload] of Object.entries(cases)) {
    it(`loads a sane state for a ${label} version`, () => {
      const state = handleLoadGame(createInitialState(), payload)
      assertSaneState(state, `version ${label}`)
    })
  }

  it('upgrades an old version marker to the current one', () => {
    const state = handleLoadGame(createInitialState(), { version: 1 })
    assert.equal(state.version, CURRENT_SAVE_VERSION)
  })

  it('leaves a future version marker untouched', () => {
    const state = handleLoadGame(createInitialState(), { version: 9999 })
    assert.equal(state.version, 9999)
  })
})

describe('save recovery - whitelisted load payloads stay sane', () => {
  it('drops invalid field types before they reach the reducer', () => {
    const payload = createRawLoadPayload(
      {
        version: Number.NaN,
        player: 'broken',
        band: null,
        assets: {},
        setlist: 'song',
        rngSeed: Number.POSITIVE_INFINITY
      },
      []
    )

    assert.equal(Object.hasOwn(payload, 'player'), false)
    assert.equal(Object.hasOwn(payload, 'version'), false)
    assert.equal(Object.hasOwn(payload, 'assets'), false)
    assert.equal(Object.hasOwn(payload, 'rngSeed'), false)

    assertSaneState(
      handleLoadGame(createInitialState(), payload),
      'whitelisted payload'
    )
  })
})
