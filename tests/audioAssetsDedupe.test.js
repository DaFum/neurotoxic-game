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
  audioBufferCache: new Map(),
  currentCacheByteSize: 0
}
mock.module('../src/utils/audio/state.js', {
  namedExports: { audioState: mockAudioState }
})

// Mock Playback Utils
const mockOggUrlMap = {
  'test.ogg': '/assets/test.ogg',
  'other.ogg': '/assets/other.ogg',
  'fail.ogg': '/assets/fail.ogg'
}
mock.module('../src/utils/audio/playbackUtils.js', {
  namedExports: {
    buildAssetUrlMap: () => mockOggUrlMap,
    resolveAssetUrl: filename => ({
      url: mockOggUrlMap[filename],
      source: 'bundled'
    }),
    PATH_PREFIX_REGEX: /^\.?\//
  }
})

// Mock Setup
const mockContext = {
  decodeAudioData: mock.fn(async buffer => {
    // Simulate async decoding
    await new Promise(r => setTimeout(r, 10))
    return {
      duration: 1,
      sampleRate: 44100,
      length: 44100,
      numberOfChannels: 2
    }
  })
}
mock.module('../src/utils/audio/setup.js', {
  namedExports: {
    getRawAudioContext: () => mockContext
  }
})

// Import the module under test AFTER mocking
const { loadAudioBuffer } = await import('../src/utils/audio/assets.js')

// --- Tests ---

test('loadAudioBuffer Deduplication Tests', async t => {
  // Setup global fetch mock
  const originalFetch = global.fetch
  let fetchCallCount = 0

  global.fetch = mock.fn(async url => {
    fetchCallCount++
    if (url.includes('fail')) {
      return { ok: false, status: 404 }
    }
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 20))
    return {
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(100)
    }
  })

  t.beforeEach(() => {
    mockAudioState.audioBufferCache.clear()
    mockAudioState.currentCacheByteSize = 0
    mockLogger.debug.mock.resetCalls()
    mockLogger.warn.mock.resetCalls()
    fetchCallCount = 0
    global.fetch.mock.resetCalls()
    mockContext.decodeAudioData.mock.resetCalls()
  })

  t.after(() => {
    global.fetch = originalFetch
  })

  await t.test(
    'Deduplicates simultaneous requests for the same file',
    async () => {
      const filename = 'test.ogg'

      // Start two requests concurrently
      const p1 = loadAudioBuffer(filename)
      const p2 = loadAudioBuffer(filename)

      // Wait for both
      const [b1, b2] = await Promise.all([p1, p2])

      // Verify results are identical objects
      assert.strictEqual(
        b1,
        b2,
        'Both promises should return the same buffer instance'
      )
      assert.ok(b1, 'Buffer should be returned')

      // Verify fetch and decode were called ONLY ONCE
      assert.strictEqual(
        global.fetch.mock.calls.length,
        1,
        'Fetch should be called exactly once'
      )
      assert.strictEqual(
        mockContext.decodeAudioData.mock.calls.length,
        1,
        'Decode should be called exactly once'
      )
    }
  )

  await t.test('Processes distinct files independently', async () => {
    const p1 = loadAudioBuffer('test.ogg')
    const p2 = loadAudioBuffer('other.ogg')

    await Promise.all([p1, p2])

    assert.strictEqual(
      global.fetch.mock.calls.length,
      2,
      'Should fetch both files'
    )
    assert.strictEqual(
      mockContext.decodeAudioData.mock.calls.length,
      2,
      'Should decode both files'
    )
  })

  await t.test('Clears pending request after success', async () => {
    const filename = 'test.ogg'

    // First request
    await loadAudioBuffer(filename)
    assert.strictEqual(global.fetch.mock.calls.length, 1)

    // Clear cache to force re-fetch logic
    mockAudioState.audioBufferCache.clear()

    // Second request (sequential)
    await loadAudioBuffer(filename)
    assert.strictEqual(
      global.fetch.mock.calls.length,
      2,
      'Should fetch again if sequential and not in cache'
    )
  })

  await t.test('Clears pending request after failure', async () => {
    const filename = 'fail.ogg'

    // First request fails
    const result1 = await loadAudioBuffer(filename)
    assert.strictEqual(result1, null)
    assert.strictEqual(global.fetch.mock.calls.length, 1)

    // Second request (sequential) should try again
    const result2 = await loadAudioBuffer(filename)
    assert.strictEqual(result2, null)
    assert.strictEqual(
      global.fetch.mock.calls.length,
      2,
      'Should attempt fetch again after failure'
    )
  })
})
