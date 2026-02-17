import assert from 'node:assert'
import { test, mock } from 'node:test'
import { logger } from '../src/utils/logger.js'
import {
  MockPolySynth,
  MockMembraneSynth,
  MockMetalSynth,
  MockNoiseSynth,
  MockGain,
  MockVolume,
  MockDistortion,
  MockChorus,
  MockEQ3,
  MockStereoWidener,
  MockLimiter,
  MockCompressor,
  MockReverb,
  mockToneContext,
  mockToneTransport
} from './mockUtils.js'

// Override MockPolySynth dispose for this test
MockPolySynth.prototype.dispose = function () {
  if (MockPolySynth.shouldThrowOnDispose) {
    throw new Error('Dispose failed')
  }
}

const mockTone = {
  start: mock.fn(async () => {}),
  getContext: mock.fn(() => mockToneContext),
  setContext: mock.fn(),
  now: mock.fn(() => 0),
  getTransport: mock.fn(() => mockToneTransport),
  Context: class {
    constructor() {
      this.rawContext = { state: 'running', close: mock.fn(async () => {}) }
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
}

mock.module('tone', { namedExports: mockTone })

// Import SUT
const { setupAudio, disposeAudio } = await import('../src/utils/audioEngine.js')

test('disposeAudio logs error when dispose fails', async _t => {
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
