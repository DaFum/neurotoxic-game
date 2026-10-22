import assert from 'node:assert/strict'
import { test, describe } from 'node:test'

import { stepTourbusObstacles } from '../../src/hooks/minigames/tourbusLogicUtils.ts'
import {
  TOURBUS_BUS_Y_PERCENT,
  TOURBUS_BUS_HEIGHT_PERCENT
} from '../../src/hooks/minigames/minigameConstants.ts'

const HIT_TOP = TOURBUS_BUS_Y_PERCENT
const HIT_BOTTOM = TOURBUS_BUS_Y_PERCENT + TOURBUS_BUS_HEIGHT_PERCENT
const TYPES = ['OBSTACLE', 'FUEL', 'VOID_HAZARD']

const makeGame = (y, type, lane = 1) => ({
  busLane: 1,
  obstacles: [{ id: 'o', lane, y, type, collided: false }],
  damage: 0,
  itemsCollected: []
})

/** Runs the given travel steps and returns the collision outcome. */
const run = (game, steps, upgrades = []) => {
  const collisions = []
  for (const travel of steps) {
    collisions.push(...stepTourbusObstacles(game, travel, upgrades))
  }
  return {
    damage: game.damage,
    itemsCollected: [...game.itemsCollected],
    collisions
  }
}

describe('stepTourbusObstacles swept collision', () => {
  for (const type of TYPES) {
    test(`a long frame cannot tunnel a ${type} past the bus hit region`, () => {
      // Audit probe: y=84 at max speed 0.12 for a 100 ms frame moves 12 points,
      // landing at 96, past the 85..95 hit region.
      const game = makeGame(HIT_TOP - 1, type)
      const outcome = run(game, [12])
      assert.deepEqual(outcome.collisions, [type])
      assert.equal(game.obstacles[0].collided, true)
    })
  }

  test('applies damage for OBSTACLE and records FUEL / VOID_HAZARD pickups', () => {
    assert.equal(run(makeGame(HIT_TOP - 1, 'OBSTACLE'), [12]).damage, 10)
    assert.equal(
      run(makeGame(HIT_TOP - 1, 'OBSTACLE'), [12], ['van_armor']).damage,
      2
    )
    assert.deepEqual(run(makeGame(HIT_TOP - 1, 'FUEL'), [12]).itemsCollected, [
      'FUEL'
    ])
    assert.deepEqual(
      run(makeGame(HIT_TOP - 1, 'VOID_HAZARD'), [12]).itemsCollected,
      ['VOID_HAZARD']
    )
    assert.equal(run(makeGame(HIT_TOP - 1, 'FUEL'), [12]).damage, 0)
  })

  test('consumes each collision exactly once across later frames', () => {
    const game = makeGame(HIT_TOP - 1, 'OBSTACLE')
    const outcome = run(game, [2, 2, 2, 2, 2, 2, 2])
    assert.deepEqual(outcome.collisions, ['OBSTACLE'])
    assert.equal(outcome.damage, 10)
  })

  test('ignores obstacles outside the bus lane', () => {
    const outcome = run(makeGame(HIT_TOP - 1, 'OBSTACLE', 0), [12])
    assert.deepEqual(outcome.collisions, [])
    assert.equal(outcome.damage, 0)
  })

  test('treats the hit region bounds as exclusive', () => {
    // Ending exactly on the top edge is not yet a hit; the next frame is.
    const touching = makeGame(HIT_TOP - 12, 'OBSTACLE')
    assert.deepEqual(run(touching, [12]).collisions, [])
    assert.deepEqual(run(touching, [1]).collisions, ['OBSTACLE'])
    // Starting on the bottom edge has already left the region.
    assert.deepEqual(run(makeGame(HIT_BOTTOM, 'FUEL'), [12]).collisions, [])
    // A zero-length frame keeps the positional test.
    assert.deepEqual(
      run(makeGame(HIT_TOP + 1, 'VOID_HAZARD'), [0]).collisions,
      ['VOID_HAZARD']
    )
  })

  test('removes obstacles once they leave the screen', () => {
    const game = makeGame(115, 'OBSTACLE', 0)
    stepTourbusObstacles(game, 10, [])
    assert.equal(game.obstacles.length, 0)
  })

  test('small frames and one long frame give identical outcomes, boundaries included', () => {
    const totalTravel = 12
    // Every split is exact in binary floating point, so positions match.
    const splits = [1, 2, 3, 4, 6, 12, 24]
    for (const type of TYPES) {
      for (let start = HIT_TOP - 16; start <= HIT_BOTTOM + 2; start += 0.5) {
        const longFrame = run(makeGame(start, type), [totalTravel])
        for (const parts of splits) {
          const steps = Array.from({ length: parts }, () => totalTravel / parts)
          const smallFrames = run(makeGame(start, type), steps)
          assert.deepEqual(
            smallFrames,
            longFrame,
            `${type} from y=${start} split into ${parts} frames`
          )
        }
        const expectHit = start + totalTravel > HIT_TOP && start < HIT_BOTTOM
        assert.equal(
          longFrame.collisions.length,
          expectHit ? 1 : 0,
          `${type} from y=${start}`
        )
      }
    }
  })
})
