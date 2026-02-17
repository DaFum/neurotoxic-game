import assert from 'node:assert'
import { test, mock } from 'node:test'
import {
  MockPolySynth,
  MockMembraneSynth,
  MockMetalSynth,
  MockGain,
  MockVolume,
  MockNoiseSynth,
  MockDistortion,
  MockChorus,
  MockEQ3,
  MockStereoWidener,
  MockLimiter,
  MockCompressor,
  MockReverb,
  mockToneTransport
} from './mockUtils.js'

const mockTone = {
  start: mock.fn(async () => {}),
  getContext: mock.fn(() => ({
    rawContext: {
      state: 'running',
      decodeAudioData: mock.fn(async arrayBuffer => {
        return {
          length: arrayBuffer.byteLength / 4,
          numberOfChannels: 2,
          sampleRate: 44100,
          duration: arrayBuffer.byteLength / (4 * 2 * 44100)
        }
      }),
      currentTime: 0,
      close: mock.fn(async () => {})
    },
    lookAhead: 0
  })),
  setContext: mock.fn(),
  now: mock.fn(() => 0),
  context: { state: 'running' },
  getTransport: mock.fn(() => mockToneTransport),
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
  Context: class {
    constructor() {
      this.rawContext = {
        state: 'running',
        close: mock.fn(async () => {})
      }
    }
  }
}

mock.module('tone', { namedExports: mockTone })

let fetchResponseSize = 1024 // Default 1KB

global.fetch = mock.fn(async _url => {
  return {
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(fetchResponseSize)
  }
})

const { loadAudioBuffer, disposeAudio } = await import(
  '../src/utils/audioEngine.js'
)

test('audioBufferCache optimization', async t => {
  t.beforeEach(() => {
    disposeAudio()
    global.fetch.mock.resetCalls()
    fetchResponseSize = 1024
  })

  await t.test('respects MAX_AUDIO_BUFFER_CACHE_SIZE (10 items)', async () => {
    // Load 15 small files
    for (let i = 0; i < 15; i++) {
      await loadAudioBuffer(`small${i}.ogg`)
    }

    global.fetch.mock.resetCalls()

    // Last 10 should be in cache (small5 to small14)
    for (let i = 5; i < 15; i++) {
      await loadAudioBuffer(`small${i}.ogg`)
    }
    assert.strictEqual(
      global.fetch.mock.calls.length,
      0,
      'Last 10 items should be in cache'
    )

    // First 5 should have been evicted
    for (let i = 0; i < 5; i++) {
      await loadAudioBuffer(`small${i}.ogg`)
    }
    assert.strictEqual(
      global.fetch.mock.calls.length,
      5,
      'First 5 items should have been evicted'
    )
  })

  await t.test('respects MAX_AUDIO_BUFFER_BYTE_SIZE (50MB)', async () => {
    // getAudioBufferSize = byteLength * 2
    // If I want 20MB decoded: fetchResponseSize = 10MB
    fetchResponseSize = 10 * 1024 * 1024

    // Load 3 large files (Total decoded = 60MB, limit = 50MB)
    await loadAudioBuffer('large1.ogg') // Cache: 20MB, 1 item
    await loadAudioBuffer('large2.ogg') // Cache: 40MB, 2 items
    await loadAudioBuffer('large3.ogg') // Cache should evict large1. Total: 40MB (large2, large3), 2 items

    global.fetch.mock.resetCalls()

    // large2 and large3 should be in cache
    await loadAudioBuffer('large2.ogg')
    await loadAudioBuffer('large3.ogg')
    assert.strictEqual(
      global.fetch.mock.calls.length,
      0,
      'large2 and large3 should be in cache'
    )

    // large1 should have been evicted
    await loadAudioBuffer('large1.ogg')
    assert.strictEqual(
      global.fetch.mock.calls.length,
      1,
      'large1 should have been evicted due to byte size limit'
    )
  })

  await t.test(
    'always keeps at least one item even if it exceeds byte limit',
    async () => {
      // 60MB decoded size
      fetchResponseSize = 30 * 1024 * 1024

      await loadAudioBuffer('huge.ogg') // Cache: 60MB (exceeds 50MB)

      global.fetch.mock.resetCalls()
      await loadAudioBuffer('huge.ogg')
      assert.strictEqual(
        global.fetch.mock.calls.length,
        0,
        'huge.ogg should still be in cache as the only item'
      )

      // Loading another one will evict the huge one
      fetchResponseSize = 1024
      await loadAudioBuffer('small.ogg')

      global.fetch.mock.resetCalls()
      await loadAudioBuffer('huge.ogg')
      assert.strictEqual(
        global.fetch.mock.calls.length,
        1,
        'huge.ogg should have been evicted by small.ogg because it was already over limit'
      )
    }
  )

  await t.test('LRU behavior preserved with item limit', async () => {
    fetchResponseSize = 1024
    for (let i = 0; i < 10; i++) {
      await loadAudioBuffer(`file${i}.ogg`)
    }

    // Access file0 to make it MRU
    global.fetch.mock.resetCalls()
    await loadAudioBuffer('file0.ogg')
    assert.strictEqual(global.fetch.mock.calls.length, 0)

    // Load file10, should evict file1 (not file0)
    await loadAudioBuffer('file10.ogg')

    global.fetch.mock.resetCalls()
    await loadAudioBuffer('file0.ogg')
    assert.strictEqual(
      global.fetch.mock.calls.length,
      0,
      'file0 should still be in cache'
    )

    await loadAudioBuffer('file1.ogg')
    assert.strictEqual(
      global.fetch.mock.calls.length,
      1,
      'file1 should have been evicted'
    )
  })
})
