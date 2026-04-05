import test from 'node:test'
import assert from 'node:assert/strict'
import * as constants from '../src/hooks/minigames/constants.js'

test('minigames/constants - exports expected values', () => {
  assert.equal(constants.ROADIE_GRID_WIDTH, 12)
  assert.equal(constants.ROADIE_GRID_HEIGHT, 8)
  assert.equal(constants.ROADIE_MOVE_COOLDOWN_BASE, 120)
  assert.equal(constants.TOURBUS_LANE_COUNT, 3)
  assert.equal(constants.TOURBUS_BUS_Y_PERCENT, 85)
  assert.equal(constants.TOURBUS_BUS_HEIGHT_PERCENT, 10)
  assert.equal(constants.TOURBUS_BASE_SPEED, 0.05)
  assert.equal(constants.TOURBUS_MAX_SPEED, 0.12)
  assert.equal(constants.TOURBUS_SPAWN_RATE_MS, 1500)
  assert.equal(constants.TOURBUS_TARGET_DISTANCE, 2500)
})

test('minigames/constants - exactly expected constants are exported', () => {
  const expectedKeys = [
    'GRID_HEIGHT',
    'GRID_WIDTH',
    'ROADIE_GRID_WIDTH',
    'ROADIE_GRID_HEIGHT',
    'ROADIE_MOVE_COOLDOWN_BASE',
    'TOURBUS_LANE_COUNT',
    'TOURBUS_BUS_Y_PERCENT',
    'TOURBUS_BUS_HEIGHT_PERCENT',
    'TOURBUS_BASE_SPEED',
    'TOURBUS_MAX_SPEED',
    'TOURBUS_SPAWN_RATE_MS',
    'TOURBUS_TARGET_DISTANCE',
    'GRID_WIDTH',
    'GRID_HEIGHT'
  ]
  assert.deepEqual(Object.keys(constants).sort(), expectedKeys.sort())
})
