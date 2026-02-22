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
  }
  start(time) {}
  dispose() {}
}

// We need to spy on start method to assert calls
// We can overwrite prototype.start with a mock function or just attach it to instance if we control creation
// But since we export the class, we can mock the prototype method?
MockPart.prototype.start = mock.fn()
MockPart.prototype.dispose = mock.fn()

const mockTone = {
  getTransport: mock.fn(() => mockTransport),
  Part: MockPart,
  now: mock.fn(() => 1000), // Fixed time: 1000s
  Frequency: mock.fn(midi => ({
    toNote: () => 'C4',
    toFrequency: () => 440
  })),
  Time: mock.fn(val => ({
    toSeconds: () => 0.5
  }))
}
mock.module('tone', { namedExports: mockTone })

// Mock @tonejs/midi
class MockMidi {
  constructor(arrayBuffer) {
    // If buffer is empty, simulate 0 duration
    if (arrayBuffer.byteLength === 0) {
      this.duration = 0
      this.header = { tempos: [] }
      this.tracks = []
      return
    }

    this.duration = 10 // 10 seconds
    this.header = {
      tempos: [{ bpm: 120 }]
    }
    this.tracks = [
      {
        channel: 1,
        instrument: { number: 0, family: 'piano' },
        notes: [
          { midi: 60, time: 0, duration: 1, velocity: 0.8 },
          { midi: 64, time: 1, duration: 1, velocity: 0.8 }
        ]
      }
    ]
  }
}
mock.module('@tonejs/midi', {
  namedExports: { Midi: MockMidi },
  defaultExport: { Midi: MockMidi }
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

// Mock Assets
const mockMidiUrlMap = {
  'test.mid': '/assets/test.mid',
  'fail.mid': '/assets/fail.mid',
  'invalid.mid': '/assets/invalid.mid',
  'empty.mid': '/assets/empty.mid'
}
const mockLoadAudioBuffer = mock.fn()
mock.module('../src/utils/audio/assets.js', {
  namedExports: {
    midiUrlMap: mockMidiUrlMap,
    loadAudioBuffer: mockLoadAudioBuffer,
    oggCandidates: []
  }
})

// Mock Shared Buffer Utils
mock.module('../src/utils/audio/sharedBufferUtils.js', {
  namedExports: {
    createAndConnectBufferSource: mock.fn()
  }
})

// Import the module under test AFTER mocking
const { playMidiFile } = await import('../src/utils/audio/procedural.js')

// --- Tests ---

test('playMidiFile Tests', async t => {
  // Setup global fetch mock
  const originalFetch = global.fetch
  let fetchResponse = { ok: true, arrayBuffer: async () => new ArrayBuffer(10) }

  global.fetch = mock.fn(async url => {
    if (url.includes('fail')) {
      return {
        ok: false,
        status: 404,
        arrayBuffer: async () => new ArrayBuffer(0)
      }
    }
    if (url.includes('timeout')) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (url.includes('empty')) {
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) }
    }
    return fetchResponse
  })

  // Reset mocks before each test
  t.beforeEach(() => {
    mockAudioState.playRequestId = 0
    mockAudioState.midiParts = []
    mockLogger.debug.mock.resetCalls()
    mockLogger.error.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
    mockTransport.cancel.mock.resetCalls()
    mockTransport.stop.mock.resetCalls()
    mockTransport.start.mock.resetCalls()
    mockTransport.scheduleOnce.mock.resetCalls()
    mockEnsureAudioContext.mock.resetCalls()
    mockStopAudioInternal.mock.resetCalls()
    global.fetch.mock.resetCalls()

    // Reset Part prototype mocks
    MockPart.prototype.start.mock.resetCalls()

    mockEnsureAudioContext.mock.mockImplementation(async () => true)
  })

  t.after(() => {
    global.fetch = originalFetch
  })

  await t.test('Happy Path: Successfully plays a valid MIDI file', async () => {
    const filename = 'test.mid'
    const result = await playMidiFile(filename)

    assert.strictEqual(result, true, 'Should return true on success')
    assert.strictEqual(
      mockEnsureAudioContext.mock.calls.length,
      1,
      'Should check audio context'
    )
    assert.strictEqual(
      mockStopAudioInternal.mock.calls.length,
      1,
      'Should stop previous audio'
    )
    assert.strictEqual(
      global.fetch.mock.calls.length,
      1,
      'Should fetch MIDI file'
    )

    // Check if MockPart was instantiated?
    // We can't easily check constructor calls unless we spy on the class or use a proxy.
    // But we can check if start() was called on the prototype.
    // However, start() is called on instances.
    // Since all instances share the prototype where we put the mock, we can check that.
    assert.ok(
      MockPart.prototype.start.mock.calls.length >= 1,
      'Should create and start Tone.Part'
    )

    assert.strictEqual(
      mockTransport.start.mock.calls.length,
      1,
      'Should start Transport'
    )

    const startArgs = mockTransport.start.mock.calls[0].arguments
    assert.ok(startArgs[0] >= 1000.1, 'Start time should include lookahead')
  })

  await t.test(
    'Fetch Failure: Returns false if MIDI file not found',
    async () => {
      const filename = 'fail.mid'
      const result = await playMidiFile(filename)

      assert.strictEqual(result, false, 'Should return false on fetch failure')
      assert.strictEqual(global.fetch.mock.calls.length, 1)
      assert.strictEqual(
        mockLogger.error.mock.calls.length,
        1,
        'Should log error'
      )
    }
  )

  await t.test(
    'AudioContext Locked: Returns false if context not ensured',
    async () => {
      mockEnsureAudioContext.mock.mockImplementationOnce(async () => false)
      const result = await playMidiFile('test.mid')

      assert.strictEqual(
        result,
        false,
        'Should return false if audio context is locked'
      )
      assert.strictEqual(
        global.fetch.mock.calls.length,
        0,
        'Should not fetch if locked'
      )
    }
  )

  await t.test(
    'Race Condition: Aborts if playRequestId changes during fetch',
    async () => {
      global.fetch.mock.mockImplementationOnce(async () => {
        mockAudioState.playRequestId++
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(10) }
      })

      const result = await playMidiFile('test.mid')

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
    }
  )

  await t.test('Looping: Sets Transport loop parameters', async () => {
    const result = await playMidiFile('test.mid', 0, true)

    assert.strictEqual(result, true)
    assert.strictEqual(
      mockTransport.loop,
      true,
      'Transport loop should be true'
    )
    assert.strictEqual(
      mockTransport.loopEnd,
      10,
      'Loop end should match MIDI duration'
    )
    assert.strictEqual(mockTransport.loopStart, 0, 'Loop start should be 0')
  })

  await t.test('Offset: Passes offset to Transport.start', async () => {
    const offset = 2
    const result = await playMidiFile('test.mid', offset)

    assert.strictEqual(result, true)
    const startArgs = mockTransport.start.mock.calls[0].arguments
    assert.strictEqual(
      startArgs[1],
      offset,
      'Should pass offset to Transport.start'
    )
  })

  await t.test(
    'Invalid MIDI Duration: Returns false if duration is 0',
    async () => {
      const result = await playMidiFile('empty.mid')

      assert.strictEqual(
        result,
        false,
        'Should return false for 0 duration MIDI'
      )
      assert.strictEqual(
        mockLogger.warn.mock.calls.length,
        1,
        'Should warn about 0 duration'
      )
      assert.strictEqual(
        mockTransport.start.mock.calls.length,
        0,
        'Should not start transport'
      )
    }
  )

  await t.test('Options: stopAfterSeconds schedules stop', async () => {
    const result = await playMidiFile('test.mid', 0, false, 0, {
      stopAfterSeconds: 5
    })
    assert.strictEqual(result, true)
    assert.strictEqual(
      mockTransport.scheduleOnce.mock.calls.length > 0,
      true,
      'Should schedule stop event'
    )
  })
})
