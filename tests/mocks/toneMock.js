import { vi } from 'vitest'

const createMockAudioNode = () => {
  return class MockAudioNode {
    constructor() {
      this.volume = { value: 0 }
      this.gain = { rampTo: vi.fn(), value: 1 }
    }
    connect() {
      return this
    }
    chain() {
      return this
    }
    toDestination() {
      return this
    }
    dispose() {}
    start() {
      return this
    }
    stop() {
      return this
    }
    cancel() {
      return this
    }
  }
}

const MockNode = createMockAudioNode()

export const mockTone = {
  getContext: () => ({ rawContext: { currentTime: 0 } }),
  getTransport: () => ({
    stop: vi.fn(),
    position: 0,
    cancel: vi.fn(),
    state: 'stopped'
  }),
  getDestination: () => ({ mute: false }),
  Context: class {
    resume() {
      return Promise.resolve()
    }
    state = 'running'
  },
  setContext: vi.fn(),
  start: vi.fn().mockResolvedValue(),
  context: { state: 'running', resume: vi.fn().mockResolvedValue() },
  Draw: { schedule: vi.fn(), cancel: vi.fn() },
  Limiter: MockNode,
  Synth: MockNode,
  StereoWidener: MockNode,
  Volume: MockNode,
  NoiseSynth: MockNode,
  Compressor: MockNode,
  Reverb: MockNode,
  Delay: MockNode,
  EQ3: MockNode,
  Channel: MockNode,
  Sequence: MockNode,
  Player: MockNode,
  Gain: MockNode,
  PolySynth: MockNode,
  FMSynth: MockNode,
  Sampler: MockNode,
  Distortion: MockNode,
  Chorus: MockNode,
  Filter: MockNode,
  AutoWah: MockNode,
  Tremolo: MockNode,
  Phaser: MockNode,
  BitCrusher: MockNode,
  PingPongDelay: MockNode,
  Vibrato: MockNode,
  FeedbackDelay: MockNode,
  MembraneSynth: MockNode,
  MetalSynth: MockNode,
  PluckSynth: MockNode,
  AMSynth: MockNode,
  MonoSynth: MockNode,
  Oscillator: MockNode,
  LFO: MockNode,
  Envelope: MockNode,
  AmplitudeEnvelope: MockNode,
  Meter: MockNode,
  Analyser: MockNode,
  Waveform: MockNode,
  FFT: MockNode,
  PitchShift: MockNode,
  JCReverb: MockNode,
  AutoPanner: MockNode,
  Chebyshev: MockNode,
  Panner: MockNode,
  CrossFade: MockNode,
  Merge: MockNode,
  Split: MockNode,
  Transport: {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    position: 0,
    state: 'stopped',
    nextSubdivision: vi.fn()
  },
  TransportTime: vi.fn(),
  Time: vi.fn(),
  Loop: MockNode
}
