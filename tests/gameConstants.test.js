import test from 'node:test'
import assert from 'node:assert/strict'
import {
  GAME_PHASES,
  MINIGAME_TYPES,
  DEFAULT_MINIGAME_STATE,
  DEFAULT_EQUIPMENT_COUNT
} from '../src/context/gameConstants.js'

test('gameConstants - GAME_PHASES exports expected values', () => {
  assert.ok(GAME_PHASES, 'GAME_PHASES should be exported')
  assert.equal(GAME_PHASES.OVERWORLD, 'OVERWORLD')
  assert.equal(GAME_PHASES.TRAVEL_MINIGAME, 'TRAVEL_MINIGAME')
  assert.equal(GAME_PHASES.PRE_GIG, 'PREGIG')
  assert.equal(GAME_PHASES.PRE_GIG_MINIGAME, 'PRE_GIG_MINIGAME')
  assert.equal(GAME_PHASES.GIG, 'GIG')
  assert.equal(GAME_PHASES.POST_GIG, 'POSTGIG')
  assert.equal(GAME_PHASES.MENU, 'MENU')
  assert.equal(GAME_PHASES.SETTINGS, 'SETTINGS')
  assert.equal(GAME_PHASES.CREDITS, 'CREDITS')
  assert.equal(GAME_PHASES.GAMEOVER, 'GAMEOVER')
  assert.equal(GAME_PHASES.INTRO, 'INTRO')

  // Verify it is an object with the expected keys
  const expectedKeys = [
    'OVERWORLD',
    'TRAVEL_MINIGAME',
    'PRE_GIG',
    'PRE_GIG_MINIGAME',
    'GIG',
    'POST_GIG',
    'MENU',
    'SETTINGS',
    'CREDITS',
    'GAMEOVER',
    'INTRO'
  ]
  assert.deepEqual(Object.keys(GAME_PHASES).sort(), expectedKeys.sort())
})

test('gameConstants - MINIGAME_TYPES exports expected values', () => {
  assert.ok(MINIGAME_TYPES, 'MINIGAME_TYPES should be exported')
  assert.equal(MINIGAME_TYPES.TOURBUS, 'TOURBUS')
  assert.equal(MINIGAME_TYPES.ROADIE, 'ROADIE')

  // Verify it is an object with the expected keys
  const expectedKeys = ['TOURBUS', 'ROADIE']
  assert.deepEqual(Object.keys(MINIGAME_TYPES).sort(), expectedKeys.sort())
})

test('gameConstants - DEFAULT_MINIGAME_STATE exports expected structure', () => {
  assert.ok(DEFAULT_MINIGAME_STATE, 'DEFAULT_MINIGAME_STATE should be exported')
  assert.equal(DEFAULT_MINIGAME_STATE.active, false)
  assert.equal(DEFAULT_MINIGAME_STATE.type, null)
  assert.equal(DEFAULT_MINIGAME_STATE.targetDestination, null)
  assert.equal(DEFAULT_MINIGAME_STATE.gigId, null)
  assert.equal(DEFAULT_MINIGAME_STATE.equipmentRemaining, 0)
  assert.equal(DEFAULT_MINIGAME_STATE.accumulatedDamage, 0)
  assert.equal(DEFAULT_MINIGAME_STATE.score, 0)

  // Verify it is an object with the expected keys
  const expectedKeys = [
    'active',
    'type',
    'targetDestination',
    'gigId',
    'equipmentRemaining',
    'accumulatedDamage',
    'score'
  ]
  assert.deepEqual(
    Object.keys(DEFAULT_MINIGAME_STATE).sort(),
    expectedKeys.sort()
  )
})

test('gameConstants - DEFAULT_EQUIPMENT_COUNT exports expected value', () => {
  assert.equal(typeof DEFAULT_EQUIPMENT_COUNT, 'number')
  assert.equal(DEFAULT_EQUIPMENT_COUNT, 10)
})
