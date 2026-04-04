import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoist variables for use inside vi.mock
const mocks = vi.hoisted(() => {
  return {
    mockResolveAssetUrlReturn: { url: 'mock/path/test.ogg', source: 'bundled' },
    mockBaseAssetPathReturn: { publicBasePath: '/' },
    mockGetRawAudioContextReturn: null,
    mockAudioState: {
      audioBufferCache: new Map(),
      currentCacheByteSize: 0
    }
  }
})

vi.mock('../../../src/utils/audio/state.js', () => ({
  audioState: mocks.mockAudioState
}))

vi.mock('../../../src/utils/audio/context.js', () => ({
  getRawAudioContext: () => mocks.mockGetRawAudioContextReturn
}))

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock('../../../src/utils/audio/playbackUtils.js', () => ({
  buildAssetUrlMap: () => ({}),
  resolveAssetUrl: () => mocks.mockResolveAssetUrlReturn,
  PATH_PREFIX_REGEX: /^\.?\//,
  getBaseAssetPath: () => mocks.mockBaseAssetPathReturn
}))

// Import assets AFTER setting up mocks
import { loadAudioBuffer } from '../../../src/utils/audio/assets.js'
import {
  MAX_AUDIO_BUFFER_BYTE_SIZE
} from '../../../src/utils/audio/constants.js'

describe('loadAudioBuffer tests', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mocks.mockResolveAssetUrlReturn = { url: 'mock/path/test.ogg', source: 'bundled' }
    mocks.mockBaseAssetPathReturn = { publicBasePath: '/' }
    mocks.mockGetRawAudioContextReturn = null
    mocks.mockAudioState.audioBufferCache.clear()
    mocks.mockAudioState.currentCacheByteSize = 0
    global.fetch = originalFetch
  })

  it('Happy path - successfully fetching and decoding', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    })

    // Mock AudioContext decodeAudioData
    const mockAudioBuffer = {
      length: 10,
      numberOfChannels: 2,
      duration: 1,
      sampleRate: 44100
    }

    mocks.mockGetRawAudioContextReturn = {
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer)
    }

    const result = await loadAudioBuffer('test.ogg')

    expect(result).toBe(mockAudioBuffer)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(1)
    expect(mocks.mockAudioState.audioBufferCache.has('test.ogg')).toBe(true)
    // 10 * 2 * 4 = 80
    expect(mocks.mockAudioState.currentCacheByteSize).toBe(80)
  })

  it('Returns null if URL cannot be resolved', async () => {
    mocks.mockResolveAssetUrlReturn = { url: null, source: null }

    const result = await loadAudioBuffer('not_found.ogg')

    expect(result).toBe(null)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(0)
  })

  it('Returns null on fetch HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    })

    const result = await loadAudioBuffer('error.ogg')

    expect(result).toBe(null)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(0)
  })

  it('Returns null on generic decode error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    })

    mocks.mockGetRawAudioContextReturn = {
      decodeAudioData: vi.fn().mockRejectedValue(new Error('Generic decode error'))
    }

    const result = await loadAudioBuffer('decode_error.ogg')

    expect(result).toBe(null)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(0)
  })

  it('Returns cached buffer immediately', async () => {
    const cachedBuffer = { length: 5, numberOfChannels: 1 }
    mocks.mockAudioState.audioBufferCache.set('cached.ogg', cachedBuffer)
    mocks.mockAudioState.currentCacheByteSize = 20 // 5 * 1 * 4

    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    const result = await loadAudioBuffer('cached.ogg')

    expect(result).toBe(cachedBuffer)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('Evicts oldest item when byte size limit is exceeded', async () => {
    // Populate cache with an old item
    const oldBuffer = { length: 1000, numberOfChannels: 1 } // size: 4000
    mocks.mockAudioState.audioBufferCache.set('old.ogg', oldBuffer)
    mocks.mockAudioState.currentCacheByteSize = 4000

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    })

    // Create a new buffer that exceeds the max size minus current size
    const hugeSize = Math.floor(MAX_AUDIO_BUFFER_BYTE_SIZE / 4) + 100
    const newBuffer = {
      length: hugeSize,
      numberOfChannels: 1,
      duration: 1,
      sampleRate: 44100
    }

    mocks.mockGetRawAudioContextReturn = {
      decodeAudioData: vi.fn().mockResolvedValue(newBuffer)
    }

    const result = await loadAudioBuffer('huge.ogg')

    expect(result).toBe(newBuffer)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(1)
    expect(mocks.mockAudioState.audioBufferCache.has('huge.ogg')).toBe(true)
    expect(mocks.mockAudioState.audioBufferCache.has('old.ogg')).toBe(false)
    expect(mocks.mockAudioState.currentCacheByteSize).toBe(hugeSize * 4)
  })

  it('Returns null on fetch timeout (AbortError)', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      const err = new Error('The operation was aborted')
      err.name = 'AbortError'
      return Promise.reject(err)
    })

    const result = await loadAudioBuffer('timeout.ogg')

    expect(result).toBe(null)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(0)
  })

  it('Returns null on decode timeout (AUDIO_DECODE_TIMEOUT)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    })

    mocks.mockGetRawAudioContextReturn = {
      decodeAudioData: vi.fn().mockRejectedValue(new Error('AUDIO_DECODE_TIMEOUT'))
    }

    const result = await loadAudioBuffer('decode_timeout.ogg')

    expect(result).toBe(null)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(0)
  })

  it('Concurrent requests for the same file are deduplicated', async () => {
    let resolveFetch = null

    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise(resolve => {
        resolveFetch = () => resolve({
          ok: true,
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        })
      })
    })

    const mockAudioBuffer = {
      length: 10,
      numberOfChannels: 2,
      duration: 1,
      sampleRate: 44100
    }

    mocks.mockGetRawAudioContextReturn = {
      decodeAudioData: vi.fn().mockResolvedValue(mockAudioBuffer)
    }

    // Start two concurrent requests
    const promise1 = loadAudioBuffer('concurrent.ogg')
    const promise2 = loadAudioBuffer('concurrent.ogg')

    // Resolve the first fetch which should unblock both
    if (resolveFetch) resolveFetch()

    const [result1, result2] = await Promise.all([promise1, promise2])

    expect(result1).toBe(mockAudioBuffer)
    expect(result2).toBe(mockAudioBuffer)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(mocks.mockAudioState.audioBufferCache.size).toBe(1)
  })
})
