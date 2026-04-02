import { test, vi } from 'vitest'
import assert from 'node:assert/strict'

// Define the mock before imports
vi.mock('../../src/utils/crypto.js', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    secureRandom: vi.fn(actual.secureRandom) // Default to actual implementation
  }
})

vi.mock('../../src/utils/logger.js', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
  LOG_LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 }
}))
vi.mock('../../src/data/events/index.js', () => ({
  EVENTS_DB: { travel: [{ id: 'test', trigger: 'travel', chance: 0.5 }] }
}))

// Import secureRandom
import {
  secureRandom,
  resetSecureRandomBatchForTesting
} from '../../src/utils/crypto.js'

test('secureRandom returns values in [0, 1)', () => {
  for (let i = 0; i < 1000; i++) {
    const val = secureRandom()
    assert.ok(val >= 0 && val < 1, `Value ${val} out of range [0, 1)`)
  }
})

test('secureRandom utilizes crypto.getRandomValues', () => {
  const originalGetRandomValues = globalThis.crypto.getRandomValues
  const mockGetRandomValues = vi.fn(arr => {
    arr[0] = 2147483648 // Half of 2^32
    return arr
  })

  globalThis.crypto.getRandomValues = mockGetRandomValues
  resetSecureRandomBatchForTesting()

  try {
    const val = secureRandom()
    assert.equal(val, 0.5)
    assert.equal(mockGetRandomValues.mock.calls.length, 1)
  } finally {
    globalThis.crypto.getRandomValues = originalGetRandomValues
  }
})

test('eventEngine uses secureRandom for event selection', async () => {
  // Set mock return value specifically for this test
  secureRandom.mockReturnValue(0.1)

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

  mockedSecureRandom.mockClear()
  eventEngine.checkEvent('travel', state)

  // checkEvent calls selectEvent
  // selectEvent calls secureRandom for Fisher-Yates shuffle (at least once if eligibleEvents.length > 1)
  // and for each event chance check.
  assert.ok(
    mockedSecureRandom.mock.calls.length >= 1,
    'secureRandom should have been called by eventEngine'
  )
})
