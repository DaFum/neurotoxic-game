import test from 'node:test'
import assert from 'node:assert/strict'
import { RoadieTrafficManager } from '../../src/components/stage/RoadieTrafficManager'

test('RoadieTrafficManager clears stale sprites when traffic is malformed', () => {
  const removed = []
  const container = {
    addChild() {},
    removeChild(sprite) {
      removed.push(sprite)
    }
  }
  const sprite = {
    destroyed: false,
    destroy() {
      this.destroyed = true
    }
  }
  const manager = new RoadieTrafficManager(
    container,
    { cars: [] },
    { bloodRed: 0 }
  )

  manager.carSprites.set('old-car', sprite)
  manager.currentIds.add('old-car')

  manager.renderTraffic({ traffic: 'not an array' }, 10, 10)

  assert.deepEqual(removed, [sprite])
  assert.equal(sprite.destroyed, true)
  assert.equal(manager.carSprites.size, 0)
  assert.equal(manager.currentIds.size, 0)
})

test('RoadieTrafficManager handles errors when removing or destroying sprites safely', async (t) => {
  const { logger } = await import('../../src/utils/logger')
  const errorMock = t.mock.method(logger, 'error', () => {})

  const container = {
    addChild() {},
    removeChild() {
      throw new Error('Fake remove error')
    }
  }
  const sprite = {
    destroyed: false,
    destroy() {
      throw new Error('Fake destroy error')
    }
  }
  const manager = new RoadieTrafficManager(
    container,
    { cars: [] },
    { bloodRed: 0 }
  )

  manager.carSprites.set('error-car', sprite)

  manager.cleanupTraffic()

  // Verify sprite was deleted from tracking despite errors
  assert.equal(manager.carSprites.size, 0)
  assert.equal(manager.currentIds.size, 0)

  // Verify errors were logged and didn't pollute the console
  assert.equal(errorMock.mock.calls.length, 2)
})
