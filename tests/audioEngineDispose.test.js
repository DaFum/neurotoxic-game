import assert from 'node:assert'
import { test, mock } from 'node:test'
import { logger } from '../src/utils/logger.js'

// Mock classes
class MockPolySynth {
  static shouldThrowOnDispose = false
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  chain() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {
    if (MockPolySynth.shouldThrowOnDispose) {
      throw new Error('Dispose failed')
    }
  }
}

class MockMembraneSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

class MockMetalSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

class MockNoiseSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

class MockGain {
  constructor() {
    this.gain = { rampTo: mock.fn() }
    this.input = this
  }
  connect() {
    return this
  }
  dispose() {}
}

class MockVolume {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  dispose() {}
}

class MockSignal {
  connect() {
    return this
  }
  dispose() {}
  toDestination() {
    return this
  }
  start() {
    return this
  }
  chain() {
    return this
  }
}

class MockReverb {
  constructor() {
    this.wet = { value: 0 }
  }
  connect() {
    return this
  }
  dispose() {}
}

const mockTone = {
  start: mock.fn(async () => {}),
  getContext: mock.fn(() => ({
    rawContext: { state: 'running', close: mock.fn(async () => {}) },
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
  Context: class {
    constructor() {
      this.rawContext = { state: 'running', close: mock.fn(async () => {}) }
    }
  },
  Limiter: MockSignal,
  Compressor: MockSignal,
  Gain: MockGain,
  Reverb: MockReverb,
  PolySynth: MockPolySynth,
  FMSynth: 'FMSynth',
  MonoSynth: 'MonoSynth',
  Synth: 'Synth',
  MembraneSynth: MockMembraneSynth,
  MetalSynth: MockMetalSynth,
  NoiseSynth: MockNoiseSynth,
  Distortion: MockSignal,
  Chorus: MockSignal,
  EQ3: MockSignal,
  StereoWidener: MockSignal,
  Volume: MockVolume,
  Frequency: n => ({ toNote: () => 'C4' })
}

mock.module('tone', { namedExports: mockTone })

// Import SUT
const { setupAudio, disposeAudio } = await import('../src/utils/audioEngine.js')

test('disposeAudio logs error when dispose fails', async t => {
  // Spy on logger.debug
  const debugSpy = mock.method(logger, 'debug')

  // Setup
  await setupAudio()

  // Configure mock to throw
  MockPolySynth.shouldThrowOnDispose = true

  // Act
  disposeAudio()

  // Assert
  // We expect logger.debug to be called at least once with the error message
  const calls = debugSpy.mock.calls
  const found = calls.find(
    call =>
      call.arguments[1] && call.arguments[1].includes('Node disposal failed')
  )

  if (!found) {
    console.log(
      'Logger calls:',
      calls.map(c => c.arguments)
    )
  }

  assert.ok(found, 'Should have logged disposal failure')

  // Cleanup
  MockPolySynth.shouldThrowOnDispose = false
  debugSpy.mock.restore()
})
