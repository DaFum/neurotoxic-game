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
  dispose() {}
}

export class MockGain {
  static shouldFail = false
  constructor() {
    if (MockGain.shouldFail) {
      throw new Error('Gain setup failed')
    }
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
  dispose() {}
}

export class MockChorus {
  start() {
    return this
  }
  dispose() {}
}

export class MockEQ3 {
  dispose() {}
}

export class MockStereoWidener {
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

export const mockToneContext = {
  rawContext: { state: 'running', close: mock.fn(async () => {}) },
  lookAhead: 0
}

export const mockToneTransport = {
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
}

export const createMockTone = () => ({
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
  FMSynth: 'FMSynth',
  MonoSynth: 'MonoSynth',
  Synth: 'Synth',
  MembraneSynth: MockMembraneSynth,
  MetalSynth: MockMetalSynth,
  NoiseSynth: MockNoiseSynth,
  Distortion: MockDistortion,
  Chorus: MockChorus,
  EQ3: MockEQ3,
  StereoWidener: MockStereoWidener,
  Volume: MockVolume,
  Frequency: _n => ({ toNote: () => 'C4' })
})
