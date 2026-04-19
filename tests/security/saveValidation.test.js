import { test } from 'vitest'
import assert from 'node:assert/strict'
import { validateSaveData } from '../../src/utils/saveValidator'
import { gameReducer, ActionTypes } from '../../src/context/gameReducer'
import { GAME_PHASES } from '../../src/context/gameConstants'

test('validateSaveData rejects non-objects', () => {
  assert.throws(() => validateSaveData(null), /Save data must be an object/)
  assert.throws(() => validateSaveData('string'), /Save data must be an object/)
  assert.throws(() => validateSaveData([]), /Save data must be an object/)
})

test('validateSaveData rejects missing required keys', () => {
  const data = { player: {}, band: {}, social: {} } // missing gameMap
  assert.throws(
    () => validateSaveData(data),
    /Missing required top-level key: gameMap/
  )
})

test('validateSaveData validates player field types', () => {
  const data = {
    player: { money: 'rich' },
    band: { harmony: 80 },
    social: {},
    gameMap: {}
  }
  assert.throws(() => validateSaveData(data), /player.money must be a number/)
})

test('validateSaveData validates band field types', () => {
  const data = {
    player: { money: 100 },
    band: { harmony: 'good' },
    social: {},
    gameMap: {}
  }
  assert.throws(() => validateSaveData(data), /band.harmony must be a number/)
})

test('validateSaveData validates social values', () => {
  const data = {
    player: { money: 100 },
    band: { harmony: 80 },
    social: { fans: 'a lot' },
    gameMap: {}
  }
  assert.throws(
    () => validateSaveData(data),
    /Social value "fans" must be a number/
  )
})

test('gameReducer LOAD_GAME prevents prototype pollution and state pollution', () => {
  const initialState = {
    currentScene: GAME_PHASES.INTRO,
    player: { money: 500 },
    band: { harmony: 80 },
    toasts: []
  }

  const maliciousPayload = {
    player: { money: 999999 },
    band: { harmony: 100 },
    social: { instagram: 1000 },
    gameMap: { nodes: [] },
    currentScene: 'HACKED', // Should be ignored or reset
    toasts: [{ id: 1, message: 'Hacked' }], // Invalid ID type should be dropped
    __proto__: { pollutions: 'poison' }
  }

  const action = { type: ActionTypes.LOAD_GAME, payload: maliciousPayload }
  const newState = gameReducer(initialState, action)

  assert.equal(newState.player.money, 999999)
  assert.equal(
    newState.currentScene,
    GAME_PHASES.OVERWORLD,
    'currentScene should not be overwritten by save data'
  )
  assert.deepEqual(
    newState.toasts,
    [],
    'toasts with non-string IDs should be filtered out'
  )
  assert.equal(
    Object.prototype.pollutions,
    undefined,
    'Prototype should not be polluted'
  )
  assert.equal(
    newState.pollutions,
    undefined,
    'State should not have polluted property'
  )
})

test('gameReducer LOAD_GAME handles missing optional fields gracefully', () => {
  const initialState = {
    settings: { crtEnabled: true }
  }
  const payload = {
    player: { money: 100 },
    band: { harmony: 50 },
    social: {},
    gameMap: {}
    // missing settings
  }
  const action = { type: ActionTypes.LOAD_GAME, payload }
  const newState = gameReducer(initialState, action)

  assert.equal(
    newState.settings.crtEnabled,
    true,
    'Should keep existing settings if missing in payload'
  )
})

test('validateSaveData validates gameMap field type', () => {
  const data = {
    player: { money: 100 },
    band: { harmony: 80 },
    social: {},
    gameMap: 'not-an-object'
  }
  assert.throws(() => validateSaveData(data), /gameMap must be an object/)
})

test('validateSaveData rejects prototype pollution vectors', () => {
  // We expect our validateSaveData to spot the __proto__ key when checking hasOwn
  // Actually, JSON.parse in modern JS will assign __proto__ as a prototype, NOT an own property.
  // A true prototype pollution attack happens during merge operations,
  // but if the JSON literally has a key '__proto__' that makes it past parse,
  // our checkPrototypePollution will catch it if it is an own property.

  // Let's create an object where '__proto__' is explicitly an own property.
  const ownProtoObj = Object.defineProperty(
    {
      player: { money: 100 },
      band: { harmony: 80 },
      social: {},
      gameMap: {}
    },
    '__proto__',
    {
      value: { pollutions: 'poison' },
      enumerable: true
    }
  )

  assert.throws(
    () => validateSaveData(ownProtoObj),
    /Prototype pollution detected: __proto__/
  )

  const nestedProtoObj = {
    player: {
      money: 100,
      nested: Object.defineProperty({}, '__proto__', {
        value: 1,
        enumerable: true
      })
    },
    band: { harmony: 80 },
    social: {},
    gameMap: {}
  }
  assert.throws(
    () => validateSaveData(nestedProtoObj),
    /Prototype pollution detected: __proto__/
  )
})

test('validateSaveData clamps wildly out-of-bounds metrics', () => {
  const data = {
    player: { money: -1000, fame: -500, score: -100 },
    band: {
      harmony: -50,
      members: [{ name: 'Alex', mood: 999, stamina: -50 }]
    },
    social: {},
    gameMap: {}
  }

  validateSaveData(data)

  assert.equal(data.player.fame, 0, 'Negative fame should be clamped to 0')
  assert.equal(data.player.score, 0, 'Negative score should be clamped to 0')
  assert.equal(data.player.money, 0, 'Negative money should be clamped to 0')
  assert.equal(data.band.harmony, 1, 'Negative harmony should be clamped to 1')
  assert.equal(
    data.band.members[0].mood,
    100,
    'Mood > 100 should be clamped to 100'
  )
  assert.equal(
    data.band.members[0].stamina,
    0,
    'Negative stamina should be clamped to 0'
  )

  const upperData = {
    player: { money: 999999, fame: 999, score: 999 },
    band: {
      harmony: 999,
      members: [{ name: 'Alex', mood: -50, stamina: 999 }]
    },
    social: {},
    gameMap: {}
  }

  validateSaveData(upperData)

  assert.equal(
    upperData.band.harmony,
    100,
    'Harmony > 100 should be clamped to 100'
  )
  assert.equal(
    upperData.band.members[0].mood,
    0,
    'Negative mood should be clamped to 0'
  )
  assert.equal(
    upperData.band.members[0].stamina,
    100,
    'Stamina > 100 should be clamped to 100'
  )
})
