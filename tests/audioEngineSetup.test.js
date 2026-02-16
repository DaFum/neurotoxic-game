import assert from 'node:assert'
import { test, mock } from 'node:test'

// Mock classes
class MockPolySynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() { return this }
  chain() { return this }
  triggerAttackRelease() {}
  dispose() {}
}

class MockMembraneSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() { return this }
  triggerAttackRelease() {}
  dispose() {}
}

class MockMetalSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() { return this }
  triggerAttackRelease() {}
  dispose() {}
}

class MockGain {
  static shouldFail = false
  constructor() {
    if (MockGain.shouldFail) {
      throw new Error('Gain setup failed')
    }
    this.gain = { rampTo: mock.fn() }
    this.input = this
  }
  connect() { return this }
  dispose() {}
}

class MockVolume {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() { return this }
  dispose() {}
}

// Mock Tone.js
const mockTone = {
  // Functions
  start: mock.fn(async () => {}),
  getContext: mock.fn(() => ({
    rawContext: {
      state: 'running',
      close: mock.fn(async () => {})
    },
    lookAhead: 0
  })),
  setContext: mock.fn(),
  now: mock.fn(() => 0),
  getTransport: mock.fn(() => ({
    stop: mock.fn(),
    start: mock.fn(),
    pause: mock.fn(),
    cancel: mock.fn(),
    clear: mock.fn(),
    scheduleOnce: mock.fn(),
    position: 0,
    state: 'stopped',
    bpm: { value: 120 },
    loop: false,
    loopEnd: 0,
    loopStart: 0
  })),

  // Classes (Constructors)
  Context: class {
    constructor() {
      this.rawContext = {
        state: 'running',
        close: mock.fn(async () => {})
      }
    }
  },

  // Audio Nodes (Mock them to return chainable objects)
  Limiter: class { toDestination() { return this } connect() { return this } dispose() {} },
  Compressor: class { connect() { return this } dispose() {} },
  Gain: MockGain,
  Reverb: class { connect() { return this } dispose() {} },
  PolySynth: MockPolySynth,
  FMSynth: 'FMSynth',
  MonoSynth: 'MonoSynth',
  Synth: 'Synth',
  MembraneSynth: MockMembraneSynth,
  MetalSynth: MockMetalSynth,
  NoiseSynth: class { connect() { return this } triggerAttackRelease() {} dispose() {} },
  Distortion: class { dispose() {} },
  Chorus: class { start() { return this } dispose() {} },
  EQ3: class { dispose() {} },
  StereoWidener: class { dispose() {} },
  Volume: MockVolume,
}

mock.module('tone', { namedExports: mockTone })

// Import SUT
// We use dynamic import to ensure mocks are applied before module load
const { setupAudio, disposeAudio } = await import('../src/utils/audioEngine.js')

test('setupAudio', async t => {
  t.beforeEach(() => {
    disposeAudio()
    // Reset mocks
    mockTone.start.mock.restore()
    mockTone.start.mock.resetCalls()
    mockTone.setContext.mock.resetCalls()
    // Default implementation
    mockTone.start.mock.mockImplementation(async () => {})
    MockGain.shouldFail = false
  })

  await t.test('completes successfully', async () => {
    await setupAudio()
    assert.strictEqual(mockTone.setContext.mock.calls.length, 1)
  })

  await t.test('handles concurrent calls', async () => {
    let resolveStart
    const startPromise = new Promise(r => { resolveStart = r })
    mockTone.start.mock.mockImplementation(() => startPromise)

    // First call initiates setup and waits on startPromise
    const p1 = setupAudio()

    // Second call should detect setupLock and wait on it
    const p2 = setupAudio()

    resolveStart()
    await Promise.all([p1, p2])

    // Both should succeed
    assert.strictEqual(mockTone.setContext.mock.calls.length, 1, 'Should only set context once')
  })

  await t.test('propagates errors to concurrent calls', async () => {
    let resolveStart
    // We delay Tone.start resolution so concurrent calls can queue up
    const startPromise = new Promise(r => { resolveStart = r })
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
