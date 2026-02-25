import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

// Import secureRandom
import { secureRandom } from '../../src/utils/crypto.js'

test('secureRandom returns values in [0, 1)', () => {
  for (let i = 0; i < 1000; i++) {
    const val = secureRandom()
    assert.ok(val >= 0 && val < 1, `Value ${val} out of range [0, 1)`)
  }
})

test('secureRandom utilizes crypto.getRandomValues', () => {
  const originalGetRandomValues = globalThis.crypto.getRandomValues
  const mockGetRandomValues = mock.fn(arr => {
    arr[0] = 2147483648 // Half of 2^32
    return arr
  })

  globalThis.crypto.getRandomValues = mockGetRandomValues

  try {
    const val = secureRandom()
    assert.equal(val, 0.5)
    assert.equal(mockGetRandomValues.mock.calls.length, 1)
  } finally {
    globalThis.crypto.getRandomValues = originalGetRandomValues
  }
})

test('eventEngine uses secureRandom for event selection', async () => {
  // We mock secureRandom before importing eventEngine
  mock.module('../../src/utils/crypto.js', {
    namedExports: {
      secureRandom: mock.fn(() => 0.1)
    }
  })

  // Mock other dependencies
  mock.module('../../src/utils/logger.js', {
    namedExports: { logger: { debug: mock.fn(), error: mock.fn() } }
  })
  mock.module('../../src/data/events/index.js', {
    namedExports: {
      EVENTS_DB: { travel: [{ id: 'test', trigger: 'travel', chance: 0.5 }] }
    }
  })

  const { eventEngine } = await import('../../src/utils/eventEngine.js')
  const { secureRandom: mockedSecureRandom } =
    await import('../../src/utils/crypto.js')

  const state = {
    player: {},
    band: {},
    social: {},
    flags: {},
    activeStoryFlags: [],
    eventCooldowns: [],
    pendingEvents: []
  }

  mockedSecureRandom.mock.resetCalls()
  eventEngine.checkEvent('travel', state)

  // checkEvent calls selectEvent
  // selectEvent calls secureRandom for Fisher-Yates shuffle (at least once if eligibleEvents.length > 1)
  // and for each event chance check.
  assert.ok(
    mockedSecureRandom.mock.calls.length >= 1,
    'secureRandom should have been called by eventEngine'
  )
})
