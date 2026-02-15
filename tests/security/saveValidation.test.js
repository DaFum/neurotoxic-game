import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSaveData } from '../../src/utils/saveValidator.js'
import { gameReducer, ActionTypes } from '../../src/context/gameReducer.js'

test('validateSaveData rejects non-objects', () => {
  assert.throws(() => validateSaveData(null), /Save data must be an object/)
  assert.throws(() => validateSaveData('string'), /Save data must be an object/)
  assert.throws(() => validateSaveData([]), /Save data must be an object/)
})

test('validateSaveData rejects missing required keys', () => {
  const data = { player: {}, band: {}, social: {} } // missing gameMap
  assert.throws(() => validateSaveData(data), /Missing required top-level key: gameMap/)
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
  assert.throws(() => validateSaveData(data), /Social values must be numbers/)
})

test('gameReducer LOAD_GAME prevents prototype pollution and state pollution', () => {
  const initialState = {
    currentScene: 'INTRO',
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
    toasts: [{ id: 1, message: 'Hacked' }], // Should be ignored
    __proto__: { pollutions: 'poison' }
  }

  const action = { type: ActionTypes.LOAD_GAME, payload: maliciousPayload }
  const newState = gameReducer(initialState, action)

  assert.equal(newState.player.money, 999999)
  assert.equal(newState.currentScene, 'INTRO', 'currentScene should not be overwritten by save data')
  assert.deepEqual(newState.toasts, [], 'toasts should be empty after load')
  assert.equal(Object.prototype.pollutions, undefined, 'Prototype should not be polluted')
  assert.equal(newState.pollutions, undefined, 'State should not have polluted property')
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

  assert.equal(newState.settings.crtEnabled, true, 'Should keep existing settings if missing in payload')
})
