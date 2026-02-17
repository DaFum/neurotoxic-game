import assert from 'node:assert'
import { test, mock } from 'node:test'
import {
  MockGain,
  createMockTone
} from './mockUtils.js'

// Mock Tone.js
const mockTone = createMockTone()

mock.module('tone', { namedExports: mockTone })

// Import SUT
// We use dynamic import to ensure mocks are applied before module load
const { setupAudio, disposeAudio } = await import('../src/utils/audioEngine.js')

test('setupAudio', async t => {
  t.beforeEach(() => {
    disposeAudio()
    // Reset mocks
    mockTone.start.mock.resetCalls()
    mockTone.setContext.mock.resetCalls()
    // Default implementation
    mockTone.start.mock.mockImplementation(async () => {})
    MockGain.shouldFail = false
  })

  t.afterEach(() => {
    MockGain.shouldFail = false
  })

  await t.test('completes successfully', async () => {
    await setupAudio()
    assert.strictEqual(mockTone.setContext.mock.calls.length, 1)
  })

  await t.test('handles concurrent calls', async () => {
    let resolveStart
    const startPromise = new Promise(r => {
      resolveStart = r
    })
    mockTone.start.mock.mockImplementation(() => startPromise)

    // First call initiates setup and waits on startPromise
    const p1 = setupAudio()

    // Second call should detect setupLock and wait on it
    const p2 = setupAudio()

    resolveStart()
    await Promise.all([p1, p2])

    // Both should succeed
    assert.strictEqual(
      mockTone.setContext.mock.calls.length,
      1,
      'Should only set context once'
    )
  })

  await t.test('propagates errors to concurrent calls', async () => {
    let resolveStart
    // We delay Tone.start resolution so concurrent calls can queue up
    const startPromise = new Promise(r => {
      resolveStart = r
    })
    mockTone.start.mock.mockImplementation(() => startPromise)

    // First call initiates setup
    const p1 = setupAudio()

    // Second call waits
    const p2 = setupAudio()

    // Trigger failure in constructor (happens after Tone.start resolves)
    MockGain.shouldFail = true
    resolveStart()

    const expectedError = { message: 'Gain setup failed' }

    // Both should reject with the same error
    await assert.rejects(p1, expectedError)
    await assert.rejects(p2, expectedError)
  })
})
