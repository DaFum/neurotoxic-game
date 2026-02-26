import assert from 'node:assert'
import { test, mock } from 'node:test'

// --- Mocks ---

// Mock Logger
const mockLogger = {
  debug: mock.fn(),
  info: mock.fn(),
  warn: mock.fn(),
  error: mock.fn(),
  logs: []
}
mock.module('../src/utils/logger.js', { namedExports: { logger: mockLogger } })

// Mock Audio State
const mockAudioState = {
  isSetup: true,
  playRequestId: 0,
  guitar: { triggerAttackRelease: mock.fn() },
  bass: { triggerAttackRelease: mock.fn() },
  drumKit: {
    kick: { triggerAttackRelease: mock.fn() },
    snare: { triggerAttackRelease: mock.fn() },
    hihat: { triggerAttackRelease: mock.fn() },
    crash: { triggerAttackRelease: mock.fn() },
    ride: { triggerAttackRelease: mock.fn() }
  },
  loop: null,
  transportEndEventId: null,
  transportStopEventId: null
}
mock.module('../src/utils/audio/state.js', {
  namedExports: { audioState: mockAudioState }
})

// Mock Tone.js
const mockTransport = {
  cancel: mock.fn(),
  stop: mock.fn(),
  start: mock.fn(),
  scheduleOnce: mock.fn((_cb, _time) => {
    // Return a fake event ID
    return 123
  }),
  clear: mock.fn(),
  position: 0,
  bpm: { value: 120 },
  loop: false,
  loopEnd: 0,
  loopStart: 0,
  state: 'stopped'
}

class MockSequence {
  constructor(callback, events, subdivision) {
    this.callback = callback
    this.events = events
    this.subdivision = subdivision
    this.started = false
    this.disposed = false
    this.startTime = null
  }
  start(time) {
    this.started = true
    this.startTime = time
    return this
  }
  dispose() {
    this.disposed = true
  }
}

// Ensure MockSequence methods are mocked so we can assert calls
// (Though in this case we can inspect instance state directly which is easier)

const mockTone = {
  getTransport: mock.fn(() => mockTransport),
  Sequence: MockSequence,
  now: mock.fn(() => 1000), // Fixed time: 1000s
  Frequency: mock.fn(val => ({
    toNote: () => val, // Simple pass-through or mock logic
    toFrequency: () => 440
  })),
  Time: mock.fn(_val => ({
    toSeconds: () => 0.5
  }))
}
mock.module('tone', { namedExports: mockTone })

// Mock @tonejs/midi (not used directly but imported)
mock.module('@tonejs/midi', {
  namedExports: { Midi: class {} },
  defaultExport: { Midi: class {} }
})

// Mock Setup
const mockEnsureAudioContext = mock.fn(async () => true)
mock.module('../src/utils/audio/setup.js', {
  namedExports: { ensureAudioContext: mockEnsureAudioContext }
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

// Mock Assets (not used directly but imported)
mock.module('../src/utils/audio/assets.js', {
  namedExports: {
    midiUrlMap: {},
    loadAudioBuffer: mock.fn(),
    oggCandidates: []
  }
})

// Mock Shared Buffer Utils (not used directly)
mock.module('../src/utils/audio/sharedBufferUtils.js', {
  namedExports: {
    createAndConnectBufferSource: mock.fn()
  }
})

// Mock other utils
mock.module('../src/utils/rhythmUtils.js', {
  namedExports: {
    calculateTimeFromTicks: mock.fn(),
    preprocessTempoMap: mock.fn()
  }
})

mock.module('../src/utils/audio/selectionUtils.js', {
  namedExports: {
    selectRandomItem: mock.fn()
  }
})

mock.module('../src/utils/audio/playbackUtils.js', {
  namedExports: {
    resolveAssetUrl: mock.fn(),
    normalizeMidiPlaybackOptions: options => ({
      onEnded:
        typeof options?.onEnded === 'function' ? options.onEnded : null,
      useCleanPlayback: true
    })
  }
})

mock.module('../src/utils/audio/midiUtils.js', {
  namedExports: {
    isPercussionTrack: mock.fn(),
    isValidMidiNote: mock.fn(),
    buildMidiTrackEvents: mock.fn(),
    normalizeMidiPitch: mock.fn(),
    getNoteName: mock.fn(n => n)
  }
})

mock.module('../src/data/songs.js', {
  namedExports: {
    SONGS_DB: []
  }
})

// Import the function under test
const { startMetalGenerator } = await import('../src/utils/audio/procedural.js')

// --- Tests ---

test('startMetalGenerator Tests', async t => {
  // Reset mocks before each test
  t.beforeEach(() => {
    mockAudioState.playRequestId = 0
    mockAudioState.loop = null
    mockLogger.debug.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
    mockTransport.cancel.mock.resetCalls()
    mockTransport.stop.mock.resetCalls()
    mockTransport.start.mock.resetCalls()
    mockTransport.scheduleOnce.mock.resetCalls()
    mockEnsureAudioContext.mock.resetCalls()
    mockStopAudioInternal.mock.resetCalls()

    // Reset instrument mocks
    mockAudioState.guitar.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.kick.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.snare.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.hihat.triggerAttackRelease.mock.resetCalls()

    mockEnsureAudioContext.mock.mockImplementation(async () => true)
  })

  await t.test('Happy Path: Successfully starts metal generator', async () => {
    const song = { difficulty: 3, bpm: 120, duration: 30 }
    const delay = 0.5
    // Deterministic random
    const random = () => {
      return 0.1 // Low value to ensure density check passes
    }

    const result = await startMetalGenerator(song, delay, {}, random)

    assert.strictEqual(result, true, 'Should return true on success')
    assert.strictEqual(
      mockEnsureAudioContext.mock.calls.length,
      1,
      'Should ensure audio context'
    )
    assert.strictEqual(
      mockStopAudioInternal.mock.calls.length,
      1,
      'Should stop previous audio'
    )

    // Check BPM
    assert.strictEqual(mockTransport.bpm.value, 120, 'Should set BPM correctly')

    // Check Sequence creation
    assert.ok(
      mockAudioState.loop instanceof MockSequence,
      'Should create Tone.Sequence'
    )
    assert.strictEqual(
      mockAudioState.loop.started,
      true,
      'Sequence should be started'
    )
    assert.strictEqual(
      mockAudioState.loop.startTime,
      0,
      'Sequence should start at 0 (relative to transport)'
    )

    // Check Transport start
    assert.strictEqual(
      mockTransport.start.mock.calls.length,
      1,
      'Should start Transport'
    )
    const startArgs = mockTransport.start.mock.calls[0].arguments
    // Expect +0.5 (delay) but capped at min 0.1 lookahead.
    // Wait, code says `const startDelay = Math.max(0.1, delay)`.
    // And `Tone.getTransport().start(\`+\${startDelay}\`)`
    // Wait, the code actually does: `Tone.getTransport().start(\`+\${startDelay}\`)`
    // mockTransport.start mock receives the string argument.
    assert.strictEqual(
      startArgs[0],
      '+0.5',
      'Should start transport with correct delay'
    )
  })

  await t.test(
    'AudioContext Locked: Returns false if context not ensured',
    async () => {
      mockEnsureAudioContext.mock.mockImplementationOnce(async () => false)
      const song = { difficulty: 3 }
      const result = await startMetalGenerator(song)

      assert.strictEqual(
        result,
        false,
        'Should return false if audio context is locked'
      )
      assert.strictEqual(
        mockTransport.start.mock.calls.length,
        0,
        'Should not start transport'
      )
    }
  )

  await t.test('Race Condition: Aborts if playRequestId changes', async () => {
    mockEnsureAudioContext.mock.mockImplementationOnce(async () => {
      mockAudioState.playRequestId++
      return true
    })
    const song = { difficulty: 3 }
    const result = await startMetalGenerator(song)

    assert.strictEqual(
      result,
      false,
      'Should return false if request ID changed'
    )
    assert.strictEqual(
      mockTransport.start.mock.calls.length,
      0,
      'Should not start transport'
    )
  })

  await t.test(
    'BPM Calculation: Defaults correctly if BPM missing',
    async () => {
      const song = { difficulty: 2 } // Missing bpm
      // Code: const rawBpm = song.bpm || 80 + (song.difficulty ?? 2) * 30
      // 80 + 2 * 30 = 140
      await startMetalGenerator(song)

      assert.strictEqual(
        mockTransport.bpm.value,
        140,
        'Should calculate BPM from difficulty'
      )
    }
  )

  await t.test(
    'Cleanup: Calls stopAudioInternal which handles previous cleanup',
    async () => {
      await startMetalGenerator({ difficulty: 1 })
      assert.strictEqual(
        mockStopAudioInternal.mock.calls.length,
        1,
        'Should call stopAudioInternal'
      )
    }
  )

  await t.test('OnEnded: Schedules callback if duration provided', async () => {
    const song = { difficulty: 1, duration: 10 }
    const onEnded = mock.fn()

    await startMetalGenerator(song, 0, { onEnded })

    assert.strictEqual(
      mockTransport.scheduleOnce.mock.calls.length,
      1,
      'Should schedule onEnded'
    )

    // Verify the scheduled callback calls onEnded
    const callback = mockTransport.scheduleOnce.mock.calls[0].arguments[0]
    const time = mockTransport.scheduleOnce.mock.calls[0].arguments[1]

    assert.strictEqual(time, 10, 'Should schedule at duration')

    callback()
    assert.strictEqual(
      onEnded.mock.calls.length,
      1,
      'Scheduled callback should execute onEnded'
    )
  })

  await t.test('Callback Execution: Trigger guitar and drums', async () => {
    const song = { difficulty: 5 } // High difficulty for more drums
    // Deterministic random
    const random = () => 0.05 // Force hits

    await startMetalGenerator(song, 0, {}, random)

    const sequence = mockAudioState.loop
    const callback = sequence.callback

    // Simulate a step
    // callback(time, note)
    callback(100, 'E2')

    // Check guitar trigger
    assert.strictEqual(
      mockAudioState.guitar.triggerAttackRelease.mock.calls.length,
      1
    )
    const guitarArgs =
      mockAudioState.guitar.triggerAttackRelease.mock.calls[0].arguments
    assert.strictEqual(guitarArgs[0], 'E2')
    assert.strictEqual(guitarArgs[2], 100)

    // Check drum trigger (playDrumsLegacy)
    // difficulty 5 -> kick, snare (random > 0.5), hihat
    // random() returns 0.05.
    // kick is always triggered at diff 5
    assert.strictEqual(
      mockAudioState.drumKit.kick.triggerAttackRelease.mock.calls.length,
      1
    )

    // random > 0.5 for snare? 0.05 is not > 0.5. So no snare?
    // Wait, let's check code:
    // `if (diff === 5) { ... if (random() > 0.5) ... }`
    // So with 0.05, snare is NOT triggered.
    assert.strictEqual(
      mockAudioState.drumKit.snare.triggerAttackRelease.mock.calls.length,
      0
    )

    // Hihat always triggered at diff 5
    assert.strictEqual(
      mockAudioState.drumKit.hihat.triggerAttackRelease.mock.calls.length,
      1
    )
  })
})
