import { mock } from 'node:test'

export class MockMembraneSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

export class MockMetalSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

export class MockNoiseSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

export class MockPolySynth {
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
      MockPolySynth.shouldThrowOnDispose = false
      throw new Error('Node disposal failed')
    }
  }
}

export class MockGain {
  static shouldFail = false
  constructor() {
    if (MockGain.shouldFail) {
      MockGain.shouldFail = false
      throw new Error('Gain setup failed')
    }
    MockGain.shouldFail = false
    this.gain = { rampTo: mock.fn() }
    this.input = this
  }
  connect() {
    return this
  }
  dispose() {}
}

export class MockVolume {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  dispose() {}
}

export class MockDistortion {
  connect() {
    return this
  }
  dispose() {}
}

export class MockChorus {
  start() {
    return this
  }
  connect() {
    return this
  }
  dispose() {}
}

export class MockEQ3 {
  connect() {
    return this
  }
  dispose() {}
}

export class MockStereoWidener {
  connect() {
    return this
  }
  dispose() {}
}

export class MockLimiter {
  toDestination() {
    return this
  }
  dispose() {}
}

export class MockCompressor {
  connect() {
    return this
  }
  dispose() {}
}

export class MockReverb {
  connect() {
    return this
  }
  dispose() {}
}

export class MockFMSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

export class MockMonoSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

export class MockSynth {
  constructor() {
    this.volume = { value: 0 }
  }
  connect() {
    return this
  }
  triggerAttackRelease() {}
  dispose() {}
}

export class MockSequence {
  constructor(callback, events, subdivision) {
    this.callback = callback
    this.events = events
    this.subdivision = subdivision
    this.start = mock.fn(() => this)
    this.stop = mock.fn(() => this)
    this.dispose = mock.fn()
  }
}

export class MockPart {
  constructor(callback, events) {
    this.callback = callback
    this.events = events
    this.loop = false
    this.loopEnd = 0
    this.loopStart = 0
    this.start = mock.fn(() => this)
    this.stop = mock.fn(() => this)
    this.dispose = mock.fn()
  }
}

export const createMockTone = () => {
  const mockToneContext = {
    rawContext: { state: 'running', close: mock.fn(async () => {}) },
    lookAhead: 0
  }

  const mockToneTransport = {
    stop: mock.fn(),
    start: mock.fn(),
    pause: mock.fn(),
    cancel: mock.fn(),
    clear: mock.fn(),
    scheduleOnce: mock.fn((cb, time) => {
      // Return a dummy ID
      return 123
    }),
    position: 0,
    state: 'stopped',
    bpm: { value: 120 },
    loop: false,
    loopEnd: 0,
    loopStart: 0
  }

  return {
    start: mock.fn(async () => {}),
    getContext: mock.fn(() => mockToneContext),
    setContext: mock.fn(),
    now: mock.fn(() => 0),
    getTransport: mock.fn(() => mockToneTransport),
    Context: class {
      constructor() {
        this.rawContext = {
          state: 'running',
          close: mock.fn(async () => {})
        }
      }
    },
    Limiter: MockLimiter,
    Compressor: MockCompressor,
    Gain: MockGain,
    Reverb: MockReverb,
    PolySynth: MockPolySynth,
    FMSynth: MockFMSynth,
    MonoSynth: MockMonoSynth,
    Synth: MockSynth,
    MembraneSynth: MockMembraneSynth,
    MetalSynth: MockMetalSynth,
    NoiseSynth: MockNoiseSynth,
    Distortion: MockDistortion,
    Chorus: MockChorus,
    EQ3: MockEQ3,
    StereoWidener: MockStereoWidener,
    Volume: MockVolume,
    Sequence: MockSequence,
    Part: MockPart,
    Frequency: _n => ({ toNote: () => 'C4' }),
    Time: (_t) => ({ toSeconds: () => 0.5 })
  }
}
