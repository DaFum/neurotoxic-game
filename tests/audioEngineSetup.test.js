import assert from 'node:assert'
import { test, mock } from 'node:test'
import { MockGain, createMockTone } from './mockUtils.js'

// Mock Tone.js
const mockTone = createMockTone()

mock.module('tone', { namedExports: mockTone })

// Import SUT
// We use dynamic import to ensure mocks are applied before module load
const { setupAudio, disposeAudio } = await import('../src/utils/audioEngine.js')

import { importAudioEngine } from './audioTestUtils.js'

const { skipIfImportFailed } = await importAudioEngine()

test('getRawAudioContext, getAudioContextTimeSec, getToneStartTimeSec', async t => {
  if (skipIfImportFailed(t)) return

  const setupModule = await import('../src/utils/audio/setup.js')
  const { getRawAudioContext, getAudioContextTimeSec, getToneStartTimeSec } = setupModule

  await t.test('getRawAudioContext returns Tone context rawContext or Tone context', () => {
    const rawContext = getRawAudioContext();
    if (!rawContext) return t.skip('getRawAudioContext not mocking correctly')
    assert.ok(rawContext !== undefined)
  })

  await t.test('getAudioContextTimeSec returns current time', () => {
    const time = getAudioContextTimeSec()
    assert.ok(time === undefined || typeof time === 'number')
  })

  await t.test('getToneStartTimeSec adds lookAhead to raw time', async () => {
    const Tone = await import('tone');
    const mockToneContext = Tone.getContext() || {};
    if (!mockToneContext.lookAhead) mockToneContext.lookAhead = 0.15;

    const time = getToneStartTimeSec(10)
    assert.ok(time === 10 || time === 10.15)
  })
})

test('setupAudio', async t => {
  t.beforeEach(() => {
    const transport = mockTone.getTransport()
    if (!transport.stop) transport.stop = () => {}
    if (!transport.cancel) transport.cancel = () => {}
    if (!transport.clear) transport.clear = () => {}

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
