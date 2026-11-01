import assert from 'node:assert/strict'
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
mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: { logger: mockLogger }
})

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
  midiLead: { triggerAttackRelease: mock.fn() },
  midiBass: { triggerAttackRelease: mock.fn() },
  midiDrumKit: {
    kick: { triggerAttackRelease: mock.fn() },
    snare: { triggerAttackRelease: mock.fn() },
    hihat: { triggerAttackRelease: mock.fn() },
    crash: { triggerAttackRelease: mock.fn() },
    ride: { triggerAttackRelease: mock.fn() }
  },
  midiParts: [],
  transportEndEventId: null,
  transportStopEventId: null,
  part: null
}
mock.module(new URL('../../src/utils/audio/state.ts', import.meta.url).href, {
  namedExports: {
    audioState: mockAudioState,
    resetGigState: mock.fn(),
    releaseAudioResource: mock.fn()
  }
})

// Mock Tone.js
const mockTransport = {
  cancel: mock.fn(),
  stop: mock.fn(),
  start: mock.fn(),
  scheduleOnce: mock.fn(() => 123),
  clear: mock.fn(),
  position: 0,
  bpm: { value: 120 },
  loop: false,
  loopEnd: 0,
  loopStart: 0,
  state: 'stopped'
}

class MockPart {
  constructor(callback, events) {
    this.callback = callback
    this.events = events
    MockPart.instances.push(this)
  }
  start(_time) {}
  dispose() {}
}
MockPart.instances = []
MockPart.prototype.start = mock.fn()
MockPart.prototype.dispose = mock.fn()

const mockTone = {
  getTransport: mock.fn(() => mockTransport),
  Part: MockPart,
  now: mock.fn(() => 1000), // Fixed time: 1000s
  Frequency: mock.fn(_midi => ({
    toNote: () => 'C4',
    toFrequency: () => 440
  })),
  Time: mock.fn(_val => ({
    toSeconds: () => 0.5
  }))
}
mock.module('tone', { namedExports: mockTone })

// Mock Setup
const mockEnsureAudioContext = mock.fn(async () => true)
mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    ensureAudioContext: mockEnsureAudioContext,
    getAudioContextTimeSec: mock.fn(() => 0),
    getRawAudioContext: mock.fn(),
    // `transportControl` imports this by name, so the mock must provide it or
    // the module fails to link. A pass-through keeps this suite focused on
    // procedural playback rather than audio-context policy, which
    // `audioContextGuard.test.js` covers.
    withAudioContext: mock.fn(async fn => await fn())
  }
})

// Mock PlaybackUtils
const mockStopTransportAndClear = mock.fn()
mock.module(
  new URL('../../src/utils/audio/cleanupUtils.ts', import.meta.url).href,
  {
    namedExports: {
      stopTransportAndClear: mockStopTransportAndClear,
      clearTransportEvent: mock.fn(),
      cleanupTransportEvents: mock.fn()
    }
  }
)

// Mock Assets
const mockMidiUrlMap = {
  'test.mid': '/assets/test.mid'
}
const mockLoadAudioBuffer = mock.fn()
mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: {
    midiUrlMap: mockMidiUrlMap,
    loadAudioBuffer: mockLoadAudioBuffer,
    oggCandidates: []
  }
})

// Mock Shared Buffer Utils
mock.module(
  new URL('../../src/utils/audio/sharedBufferUtils.ts', import.meta.url).href,
  {
    namedExports: {
      createAndConnectBufferSource: mock.fn(),
      cleanupEndedSource: mock.fn()
    }
  }
)

// Mock Data
mock.module(new URL('../../src/data/songs.ts', import.meta.url).href, {
  namedExports: {
    SONGS_BY_ID: new Map(),
    SONGS_DB: []
  }
})

// Mock Playback Utils
mock.module(
  new URL('../../src/utils/audio/playbackUtils.ts', import.meta.url).href,
  {
    namedExports: {
      resolveAssetUrl: mock.fn(),
      getBaseAssetPath: () => ({ baseUrl: './', publicBasePath: './assets' }),
      prepareTransportPlayback: mock.fn(async (options = {}) => {
        const initialReqId = ++mockAudioState.playRequestId
        const ensured = await mockEnsureAudioContext()
        if (!ensured) return { success: false }
        if (initialReqId !== mockAudioState.playRequestId)
          return { success: false }

        mockStopTransportAndClear()

        return {
          success: true,
          reqId: initialReqId,
          normalizedOptions: {
            useCleanPlayback: true,
            onEnded:
              typeof options?.onEnded === 'function' ? options.onEnded : null,
            startTimeSec: Number.isFinite(options?.startTimeSec)
              ? options.startTimeSec
              : null,
            resolveStartTimeSec:
              typeof options?.resolveStartTimeSec === 'function'
                ? options.resolveStartTimeSec
                : null
          }
        }
      }),
      normalizeMidiPlaybackOptions: mock.fn(options => ({
        useCleanPlayback: true,
        onEnded: typeof options?.onEnded === 'function' ? options.onEnded : null
      }))
    }
  }
)

// Mock env
globalThis.import = { meta: { env: { BASE_URL: '/' } } }

// Import the module under test AFTER mocking
const { playSongFromData } = await import('../../src/utils/audio/midiPlayback')
const { calculateTimeFromTicks } = await import('../../src/utils/rhythmUtils')

/**
 * A manually released `ensureAudioContext()` result, standing in for a slow
 * closed-context rebuild.
 *
 * @returns {{ promise: Promise<boolean>, release: (value: boolean) => void }}
 */
const createAudioContextGate = () => {
  /** @type {(value: boolean) => void} */
  let release = () => {}
  /** @type {Promise<boolean>} */
  const promise = new Promise(resolve => {
    release = resolve
  })
  return { promise, release }
}

// --- Tests ---

test('playSongFromData Tests', async t => {
  // Test Data
  const validSong = {
    bpm: 120,
    tpb: 480,
    notes: [
      { t: 0, p: 60, v: 100, lane: 'guitar' },
      { t: 480, p: 64, v: 100, lane: 'bass' },
      { t: 960, p: 36, v: 100, lane: 'drums' }
    ]
  }

  // Reset mocks before each test
  t.beforeEach(() => {
    mockAudioState.playRequestId = 0
    mockAudioState.part = null
    mockAudioState.guitar = { triggerAttackRelease: mock.fn() }
    mockAudioState.bass = { triggerAttackRelease: mock.fn() }
    mockAudioState.drumKit = {
      kick: { triggerAttackRelease: mock.fn() },
      snare: { triggerAttackRelease: mock.fn() },
      hihat: { triggerAttackRelease: mock.fn() },
      crash: { triggerAttackRelease: mock.fn() },
      ride: { triggerAttackRelease: mock.fn() }
    }

    mockLogger.debug.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()

    mockTransport.cancel.mock.resetCalls()
    mockTransport.stop.mock.resetCalls()
    mockTransport.start.mock.resetCalls()
    mockTransport.scheduleOnce.mock.resetCalls()

    mockEnsureAudioContext.mock.resetCalls()
    mockStopTransportAndClear.mock.resetCalls()

    MockPart.instances = []
    MockPart.prototype.start.mock.resetCalls()

    mockEnsureAudioContext.mock.mockImplementation(async () => true)
  })

  await t.test('Happy Path: Successfully plays a valid song', async () => {
    const result = await playSongFromData(validSong)

    assert.strictEqual(result, true, 'Should return true on success')
    assert.strictEqual(
      mockEnsureAudioContext.mock.calls.length,
      1,
      'Should check audio context'
    )
    assert.strictEqual(
      mockStopTransportAndClear.mock.calls.length,
      1,
      'Should stop previous audio'
    )

    // Check Part creation
    assert.strictEqual(MockPart.instances.length, 1, 'Should create Tone.Part')
    assert.strictEqual(
      MockPart.prototype.start.mock.calls.length,
      1,
      'Should start Tone.Part'
    )

    // Check Transport start
    assert.strictEqual(
      mockTransport.start.mock.calls.length,
      1,
      'Should start Transport'
    )
    const startArgs = mockTransport.start.mock.calls[0].arguments
    assert.ok(startArgs[0] >= 1000.1, 'Start time should include lookahead')
  })

  await t.test('starts the transport at an absolute startTimeSec', async () => {
    const result = await playSongFromData(validSong, 2, {
      startTimeSec: 1234.5
    })
    assert.strictEqual(result, true)
    assert.strictEqual(mockTransport.start.mock.calls[0].arguments[0], 1234.5)
  })

  await t.test(
    'resolves the deferred start only once the audio context is ready (#3459)',
    async () => {
      const gate = createAudioContextGate()
      mockEnsureAudioContext.mock.mockImplementationOnce(() => gate.promise)
      const resolveStartTimeSec = mock.fn(() => {
        // The notes are already scheduled when the start time is chosen.
        assert.strictEqual(MockPart.instances.length, 1)
        assert.strictEqual(mockTransport.start.mock.calls.length, 0)
        return 1500.25
      })

      const pending = playSongFromData(validSong, 2, { resolveStartTimeSec })

      assert.strictEqual(mockEnsureAudioContext.mock.calls.length, 1)
      assert.strictEqual(resolveStartTimeSec.mock.calls.length, 0)
      assert.strictEqual(mockTransport.start.mock.calls.length, 0)
      assert.strictEqual(MockPart.instances.length, 0)

      gate.release(true)

      assert.strictEqual(await pending, true)
      assert.strictEqual(resolveStartTimeSec.mock.calls.length, 1)
      assert.strictEqual(mockTransport.start.mock.calls.length, 1)
      assert.strictEqual(
        mockTransport.start.mock.calls[0].arguments[0],
        1500.25
      )
    }
  )

  await t.test('a resolved start time wins over startTimeSec', async () => {
    const result = await playSongFromData(validSong, 2, {
      startTimeSec: 1234.5,
      resolveStartTimeSec: () => 1500.25
    })
    assert.strictEqual(result, true)
    assert.strictEqual(mockTransport.start.mock.calls[0].arguments[0], 1500.25)
  })

  await t.test(
    'a non-finite resolved start time falls back to the delay',
    async () => {
      const result = await playSongFromData(validSong, 2, {
        resolveStartTimeSec: () => Number.NaN
      })
      assert.strictEqual(result, true)
      // Tone.now() = 1000 plus the 2s delay.
      assert.strictEqual(mockTransport.start.mock.calls[0].arguments[0], 1002)
    }
  )

  await t.test(
    'a failed or superseded preparation never resolves the start (#3459)',
    async () => {
      for (const supersede of [false, true]) {
        mockTransport.start.mock.resetCalls()
        MockPart.instances = []
        const gate = createAudioContextGate()
        mockEnsureAudioContext.mock.mockImplementationOnce(() => gate.promise)
        const resolveStartTimeSec = mock.fn(() => 1500.25)

        const pending = playSongFromData(validSong, 2, { resolveStartTimeSec })
        if (supersede) mockAudioState.playRequestId++
        gate.release(supersede)

        assert.strictEqual(await pending, false)
        assert.strictEqual(resolveStartTimeSec.mock.calls.length, 0)
        assert.strictEqual(mockTransport.start.mock.calls.length, 0)
        assert.strictEqual(MockPart.instances.length, 0)
      }
    }
  )

  await t.test(
    'AudioContext Locked: Returns false if context not ensured',
    async () => {
      mockEnsureAudioContext.mock.mockImplementationOnce(async () => false)
      const result = await playSongFromData(validSong)

      assert.strictEqual(
        result,
        false,
        'Should return false if audio context is locked'
      )
      assert.strictEqual(
        mockStopTransportAndClear.mock.calls.length,
        0,
        'Should not stop audio if locked'
      )
    }
  )

  await t.test(
    'Race Condition: Aborts if playRequestId changes during ensureContext',
    async () => {
      mockEnsureAudioContext.mock.mockImplementationOnce(async () => {
        mockAudioState.playRequestId++
        return true
      })

      const result = await playSongFromData(validSong)

      assert.strictEqual(
        result,
        false,
        'Should return false if request ID changed'
      )
      assert.strictEqual(
        mockStopTransportAndClear.mock.calls.length,
        0,
        'Should not stop audio'
      )
    }
  )

  await t.test(
    'Missing Components: Returns false if audio components missing',
    async () => {
      mockAudioState.guitar = null
      const result = await playSongFromData(validSong)

      assert.strictEqual(
        result,
        false,
        'Should return false if guitar is missing'
      )
      assert.strictEqual(
        mockLogger.error.mock.calls.length,
        1,
        'Should log error'
      )
    }
  )

  await t.test(
    'Invalid Notes: Returns false if notes is not an array',
    async () => {
      const invalidSong = { ...validSong, notes: null }
      const result = await playSongFromData(invalidSong)

      assert.strictEqual(result, false, 'Should return false if notes is null')
      assert.strictEqual(
        mockLogger.error.mock.calls.length,
        1,
        'Should log error'
      )
    }
  )

  await t.test(
    'No Valid Notes: Returns false if no valid notes found',
    async () => {
      const invalidNotesSong = {
        ...validSong,
        notes: [{ t: -1, p: 60, v: 100 }]
      } // invalid time
      const result = await playSongFromData(invalidNotesSong)

      assert.strictEqual(result, false, 'Should return false if no valid notes')
      assert.strictEqual(
        mockLogger.warn.mock.calls.length,
        1,
        'Should warn about no valid notes'
      )
    }
  )

  await t.test('onEnded: Schedules callback', async () => {
    const onEnded = mock.fn()
    const result = await playSongFromData(validSong, 0, { onEnded })

    assert.strictEqual(result, true)
    assert.strictEqual(
      mockTransport.scheduleOnce.mock.calls.length,
      1,
      'Should schedule onEnded'
    )
  })

  await t.test('Delay: Passes delay to Transport.start', async () => {
    const delay = 2
    const result = await playSongFromData(validSong, delay)

    assert.strictEqual(result, true)
    const startArgs = mockTransport.start.mock.calls[0].arguments
    // startTime = Tone.now() + Math.max(0.1, delay)
    // 1000 + 2 = 1002
    assert.strictEqual(
      startArgs[0],
      1002,
      'Should pass delay to Transport.start time'
    )
  })

  await t.test('Tempo Map: Handles tempo map', async () => {
    const songWithTempo = {
      ...validSong,
      tempoMap: [{ tick: 0, usPerBeat: 500000 }] // 120 BPM
    }
    const result = await playSongFromData(songWithTempo)

    assert.strictEqual(result, true)
    // Check that we processed the tempo map (implied by success, hard to verify exact internal calculation without deep inspection)
    // But we can check that we created a part with events
    const partEvents = MockPart.instances[0].events
    assert.strictEqual(partEvents.length, 3, 'Should create part with 3 events')
    // We expect times to be calculated
    assert.strictEqual(
      typeof partEvents[0].time,
      'number',
      'Event time should be number'
    )
  })

  const HOSTILE_NUMBERS = [NaN, Infinity, true, '5', '1e3', [5], null]

  await t.test(
    'Song parameters: only finite numbers override bpm/tpb defaults',
    async () => {
      for (const value of HOSTILE_NUMBERS) {
        MockPart.instances = []
        const result = await playSongFromData({
          ...validSong,
          bpm: value,
          tpb: value
        })
        assert.strictEqual(result, true, String(value))
        assert.strictEqual(mockTransport.bpm.value, 120, String(value))
        // Default tpb 480 at 120 BPM puts tick 480 at 0.5 s.
        assert.strictEqual(
          MockPart.instances[0].events[1].time,
          0.5,
          String(value)
        )
      }
    }
  )

  await t.test(
    'Tempo Map: unusable events fall back to constant-BPM timing',
    async () => {
      for (const usPerBeat of [...HOSTILE_NUMBERS, 0, -500000]) {
        MockPart.instances = []
        const result = await playSongFromData({
          ...validSong,
          tempoMap: [{ tick: 0, usPerBeat }]
        })
        assert.strictEqual(result, true, String(usPerBeat))
        assert.deepStrictEqual(
          MockPart.instances[0].events.map(event => event.time),
          [0, 0.5, 1],
          String(usPerBeat)
        )
      }
    }
  )

  await t.test(
    'Tempo Map: malformed entries between valid entries are ignored',
    async () => {
      const cleanMap = [
        { tick: 0, usPerBeat: 500000 },
        { tick: 960, usPerBeat: 250000 }
      ]
      const notes = [0, 480, 960, 1440].map(tick => ({
        t: tick,
        p: 60,
        v: 100,
        lane: 'guitar'
      }))
      const result = await playSongFromData({
        ...validSong,
        notes,
        tempoMap: [
          cleanMap[0],
          { tick: -1, usPerBeat: 1000000 },
          Object.create({ tick: 480, usPerBeat: 1000000 }),
          { tick: 960, usPerBeat: NaN },
          null,
          cleanMap[1]
        ]
      })
      assert.strictEqual(result, true)
      assert.deepStrictEqual(
        MockPart.instances[0].events.map(event => event.time),
        notes.map(note => calculateTimeFromTicks(note.t, 480, cleanMap, 's'))
      )
    }
  )

  await t.test(
    'Tempo Map: a map with only negative-tick or inherited entries falls back to constant BPM',
    async () => {
      const result = await playSongFromData({
        ...validSong,
        tempoMap: [
          { tick: -480, usPerBeat: 1000000 },
          Object.create({ tick: 0, usPerBeat: 1000000 }),
          [0, 1000000],
          { tick: 0 }
        ]
      })
      assert.strictEqual(result, true)
      // validSong is 120 BPM at 480 tpb: one beat (480 ticks) per 0.5 s.
      assert.deepStrictEqual(
        MockPart.instances[0].events.map(event => event.time),
        [0, 0.5, 1]
      )
    }
  )
})
