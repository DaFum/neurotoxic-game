import test from 'node:test'
import assert from 'node:assert/strict'
import { RoadieTrafficManager } from '../../src/components/stage/RoadieTrafficManager'

import { logger } from '../../src/utils/logger'

test('RoadieTrafficManager gracefully handles and logs errors during sprite cleanup', () => {
  const loggedErrors = []
  const originalError = logger.error
  logger.error = (channel, message, error) => {
    loggedErrors.push({ channel, message, error })
  }

  try {
    const container = {
      addChild() {},
      removeChild() {
        throw new Error('removeChild failed')
      }
    }
    const sprite = {
      destroy() {
        throw new Error('destroy failed')
      }
    }
    const manager = new RoadieTrafficManager(
      container,
      { cars: [] },
      { bloodRed: 0 }
    )

    manager.carSprites.set('error-car', sprite)
    manager.currentIds.add('error-car')

    manager.renderTraffic({ traffic: 'not an array' }, 10, 10)

    assert.equal(loggedErrors.length, 2)
    assert.equal(loggedErrors[0].message, 'Error removing sprite from container for id error-car:')
    assert.equal(loggedErrors[0].error.message, 'removeChild failed')
    assert.equal(loggedErrors[1].message, 'Error destroying sprite for id error-car:')
    assert.equal(loggedErrors[1].error.message, 'destroy failed')
    assert.equal(manager.carSprites.size, 0)
    assert.equal(manager.currentIds.size, 0)
  } finally {
    logger.error = originalError
  }
})

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
