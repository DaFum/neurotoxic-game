// TODO: Implement this
import test from 'node:test'
import assert from 'node:assert/strict'
import * as constants from '../src/hooks/minigames/constants.js'

test('minigames/constants - exports expected values', () => {
  assert.equal(constants.GRID_WIDTH, 12)
  assert.equal(constants.GRID_HEIGHT, 8)
  assert.equal(constants.LANE_COUNT, 3)
  assert.equal(constants.BUS_Y_PERCENT, 85)
  assert.equal(constants.BUS_HEIGHT_PERCENT, 10)
})

test('minigames/constants - exactly expected constants are exported', () => {
  const expectedKeys = [
    'GRID_WIDTH',
    'GRID_HEIGHT',
    'LANE_COUNT',
    'BUS_Y_PERCENT',
    'BUS_HEIGHT_PERCENT'
  ]
  assert.deepEqual(Object.keys(constants).sort(), expectedKeys.sort())
})
