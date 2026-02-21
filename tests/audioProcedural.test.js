import { test, mock, beforeEach } from 'node:test'
import assert from 'node:assert'
import { createMockTone } from './mockUtils.js'

// Mock Tone.js
const mockTone = createMockTone()
mock.module('tone', { namedExports: mockTone })

// Mock State
const mockAudioState = {
  playRequestId: 0,
  isSetup: true,
  loop: null,
  part: null,
  guitar: { triggerAttackRelease: mock.fn() },
  bass: { triggerAttackRelease: mock.fn() },
  drumKit: {
    kick: { triggerAttackRelease: mock.fn() },
    snare: { triggerAttackRelease: mock.fn() },
    hihat: { triggerAttackRelease: mock.fn() },
    crash: { triggerAttackRelease: mock.fn() }
  }
}

// We need to define audioState first so we can use it in the module mock
mock.module('../src/utils/audio/state.js', {
  namedExports: {
    audioState: mockAudioState
  }
})

// Mock Setup
const mockEnsureAudioContext = mock.fn(async () => true)
const mockGetRawAudioContext = mock.fn(() => ({ state: 'running' }))
mock.module('../src/utils/audio/setup.js', {
  namedExports: {
    ensureAudioContext: mockEnsureAudioContext,
    getRawAudioContext: mockGetRawAudioContext
  }
})

// Mock Playback
const mockStopAudioInternal = mock.fn()
const mockStopAudio = mock.fn()
mock.module('../src/utils/audio/playback.js', {
  namedExports: {
    stopAudioInternal: mockStopAudioInternal,
    stopAudio: mockStopAudio
  }
})

// Mock Playback Utils
const mockNormalizeMidiPlaybackOptions = mock.fn((options) => options || {})
mock.module('../src/utils/audio/playbackUtils.js', {
  namedExports: {
    normalizeMidiPlaybackOptions: mockNormalizeMidiPlaybackOptions,
    resolveAssetUrl: mock.fn(),
    PATH_PREFIX_REGEX: /^\.?\//,
    buildAssetUrlMap: mock.fn(() => ({})),
    encodePublicAssetPath: mock.fn((path) => path)
  }
})

// Import SUT
const { startMetalGenerator } = await import('../src/utils/audio/procedural.js')

test('startMetalGenerator', async (t) => {
  beforeEach(() => {
    // Reset mocks
    mockTone.getTransport().start.mock.resetCalls()
    mockTone.getTransport().stop.mock.resetCalls()
    mockTone.getTransport().cancel.mock.resetCalls()
    mockTone.getTransport().scheduleOnce.mock.resetCalls()
    mockTone.start.mock.resetCalls()
    mockStopAudioInternal.mock.resetCalls()
    mockEnsureAudioContext.mock.resetCalls()
    mockEnsureAudioContext.mock.mockImplementation(async () => true)
    mockNormalizeMidiPlaybackOptions.mock.resetCalls()

    // Reset state
    mockAudioState.playRequestId = 0
    mockAudioState.loop = null

    // Reset synth mocks
    mockAudioState.guitar.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.kick.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.snare.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.hihat.triggerAttackRelease.mock.resetCalls()
  })

  await t.test('Happy Path: starts generation with valid inputs', async () => {
    const song = { bpm: 120, difficulty: 3 }
    const result = await startMetalGenerator(song)

    assert.strictEqual(result, true, 'Should return true on success')
    assert.strictEqual(mockAudioState.playRequestId, 1, 'Should increment playRequestId')
    assert.strictEqual(mockEnsureAudioContext.mock.calls.length, 1, 'Should ensure audio context')
    assert.strictEqual(mockStopAudioInternal.mock.calls.length, 1, 'Should stop previous audio')

    // Check Transport
    assert.strictEqual(mockTone.getTransport().bpm.value, 120, 'Should set BPM')
    assert.strictEqual(mockTone.getTransport().start.mock.calls.length, 1, 'Should start transport')

    // Check Sequence creation
    assert.ok(mockAudioState.loop, 'Should create a loop sequence')
    assert.strictEqual(mockAudioState.loop.start.mock.calls.length, 1, 'Should start the loop')
  })

  await t.test('Input Validation: calculates BPM from difficulty if missing', async () => {
    const song = { difficulty: 2 } // Missing BPM
    // logic: rawBpm = song.bpm || 80 + (song.difficulty ?? 2) * 30
    // rawBpm = 80 + 2 * 30 = 140

    await startMetalGenerator(song)
    assert.strictEqual(mockTone.getTransport().bpm.value, 140, 'Should calculate BPM from difficulty')
  })

  await t.test('Input Validation: defaults difficulty if missing', async () => {
      const song = { bpm: 100 } // Missing difficulty
      // logic: rawBpm = 100
      // generation uses difficulty || 2

      const randomMock = mock.fn(() => 0.5)
      await startMetalGenerator(song, 0, {}, randomMock)

      // verify something related to difficulty...
      // generateRiffPattern uses difficulty.
      // We can't easily inspect the pattern directly unless we intercept it or inspect Sequence args.
      // But we can verify it doesn't crash.
      assert.strictEqual(mockTone.getTransport().bpm.value, 100)
  })

  await t.test('Input Validation: handles zero difficulty', async () => {
    const song = { difficulty: 0 }
    // rawBpm = 80 + 0 * 30 = 80
    await startMetalGenerator(song)
    assert.strictEqual(mockTone.getTransport().bpm.value, 80, 'Should handle difficulty 0 correctly')
  })

  await t.test('Input Validation: clamps delay', async () => {
      const song = { bpm: 120 }
      // startMetalGenerator(song, delay)
      // startDelay = Math.max(0.1, delay)
      // Transport.start(`+${startDelay}`)

      await startMetalGenerator(song, 0.5)
      const startCall = mockTone.getTransport().start.mock.calls[0]
      assert.strictEqual(startCall.arguments[0], '+0.5', 'Should use provided delay')

      mockTone.getTransport().start.mock.resetCalls()
      await startMetalGenerator(song, 0)
      const startCall2 = mockTone.getTransport().start.mock.calls[0]
      assert.strictEqual(startCall2.arguments[0], '+0.1', 'Should clamp delay to min 0.1')
  })

  await t.test('State Handling: fails if audio context is locked', async () => {
    mockEnsureAudioContext.mock.mockImplementation(async () => false)
    const result = await startMetalGenerator({ bpm: 120 })
    assert.strictEqual(result, false, 'Should return false if audio context is locked')
    assert.strictEqual(mockAudioState.playRequestId, 1, 'Should still increment request ID')
    assert.strictEqual(mockStopAudioInternal.mock.calls.length, 0, 'Should not stop audio if locked')
  })

  await t.test('Race Condition: aborts if request ID changes during setup', async () => {
    mockEnsureAudioContext.mock.mockImplementation(async () => {
      // Simulate delay and interruption
      mockAudioState.playRequestId++
      return true
    })

    const result = await startMetalGenerator({ bpm: 120 })
    assert.strictEqual(result, false, 'Should return false if request ID changed')
    assert.strictEqual(mockStopAudioInternal.mock.calls.length, 0, 'Should not proceed with setup')
    assert.strictEqual(mockTone.getTransport().start.mock.calls.length, 0, 'Should not start transport')
  })

  await t.test('Cleanup: schedules onEnded callback', async () => {
    const song = { bpm: 120, duration: 10 }
    const onEnded = mock.fn()

    await startMetalGenerator(song, 0, { onEnded })

    // Check scheduleOnce
    assert.strictEqual(mockTone.getTransport().scheduleOnce.mock.calls.length, 1, 'Should schedule callback')
    const [callback, time] = mockTone.getTransport().scheduleOnce.mock.calls[0].arguments
    assert.strictEqual(time, 10, 'Should schedule at song duration')

    // Test the callback wrapper logic (reqId check)
    // We need to ensure playRequestId matches what was captured in closure.
    // The captured ID is the one from startMetalGenerator call.
    // Current ID is that + 1 (from setup)
    // Wait, reqId = ++audioState.playRequestId.
    // So captured ID matches current ID unless changed.

    callback()
    assert.strictEqual(onEnded.mock.calls.length, 1, 'Should call onEnded when triggered')

    // Test wrapper with stale ID
    onEnded.mock.resetCalls()
    mockAudioState.playRequestId++
    callback()
    assert.strictEqual(onEnded.mock.calls.length, 0, 'Should NOT call onEnded if ID is stale')
  })
})
