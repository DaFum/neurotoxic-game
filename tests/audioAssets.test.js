import assert from 'node:assert'
import { test, mock } from 'node:test'
import { createMockTone } from './mockUtils.js'

// --- Mocks ---

const mockTone = createMockTone()

// Shared mock implementation for decodeAudioData so we can control it in tests
const mockDecodeAudioData = mock.fn(async (arrayBuffer) => {
  return {
    length: arrayBuffer.byteLength / 4,
    numberOfChannels: 2,
    sampleRate: 44100,
    duration: arrayBuffer.byteLength / (4 * 2 * 44100)
  }
})

const mockRawContext = {
  state: 'running',
  decodeAudioData: mockDecodeAudioData,
  currentTime: 0,
  close: mock.fn(async () => {})
}

// Mock getContext to return the consistent rawContext
mockTone.getContext = mock.fn(() => ({
  rawContext: mockRawContext,
  lookAhead: 0
}))

mockTone.context = { state: 'running' }

mock.module('tone', { namedExports: mockTone })

// We need to import the module under test AFTER mocking dependencies
const { loadAudioBuffer, disposeAudio } = await import('../src/utils/audioEngine.js')

// --- Test Suite ---

test('Audio Assets Loading Logic', async (t) => {
  const originalFetch = global.fetch
  let fetchResponseOk = true
  let fetchResponseBody = new ArrayBuffer(1024) // Default 1KB
  let fetchDelay = 0

  // Helper to reset fetch mock behavior
  const resetFetchMock = () => {
    fetchResponseOk = true
    fetchResponseBody = new ArrayBuffer(1024)
    fetchDelay = 0
    // Reset fetch calls but keep our custom implementation
    if (global.fetch.mock) global.fetch.mock.resetCalls()
  }

  // Mock global.fetch
  global.fetch = mock.fn(async (url, options) => {
    if (fetchDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, fetchDelay))
    }
    // Check abort signal
    if (options?.signal?.aborted) {
      const error = new Error('The operation was aborted')
      error.name = 'AbortError'
      throw error
    }

    if (!fetchResponseOk) {
      return {
        ok: false,
        status: 404,
        arrayBuffer: async () => new ArrayBuffer(0)
      }
    }
    return {
      ok: true,
      arrayBuffer: async () => fetchResponseBody
    }
  })

  // Setup / Teardown
  t.beforeEach(() => {
    disposeAudio()
    resetFetchMock()
    // Reset decodeAudioData mock behavior
    mockDecodeAudioData.mock.resetCalls()
    // Restore default implementation if it was changed
    mockDecodeAudioData.mock.mockImplementation(async (arrayBuffer) => {
      return {
        length: arrayBuffer.byteLength / 4,
        numberOfChannels: 2,
        sampleRate: 44100,
        duration: arrayBuffer.byteLength / (4 * 2 * 44100)
      }
    })
  })

  t.after(() => {
    global.fetch = originalFetch
  })

  await t.test('Input Validation: returns null for invalid filenames', async () => {
    const resultNull = await loadAudioBuffer(null)
    assert.strictEqual(resultNull, null, 'Should return null for null input')

    const resultEmpty = await loadAudioBuffer('')
    assert.strictEqual(resultEmpty, null, 'Should return null for empty string')

    assert.strictEqual(global.fetch.mock.calls.length, 0, 'Fetch should not be called')
  })

  await t.test('Successful Load: fetches, decodes, and returns buffer', async () => {
    const filename = 'test-asset.ogg'
    const buffer = await loadAudioBuffer(filename)

    assert.ok(buffer, 'Should return a buffer')
    assert.strictEqual(buffer.numberOfChannels, 2, 'Should have 2 channels (from mock)')

    // Verify fetch called with correct URL (public fallback assumed due to empty glob)
    assert.strictEqual(global.fetch.mock.calls.length, 1)
    const [url] = global.fetch.mock.calls[0].arguments
    assert.ok(url.endsWith('/assets/test-asset.ogg'), `URL should end with /assets/test-asset.ogg, got ${url}`)
  })

  await t.test('Caching: subsequent calls return cached buffer without fetch', async () => {
    const filename = 'cached-asset.ogg'

    // First call
    const buffer1 = await loadAudioBuffer(filename)
    assert.ok(buffer1)
    assert.strictEqual(global.fetch.mock.calls.length, 1, 'First call should trigger fetch')

    // Second call
    const buffer2 = await loadAudioBuffer(filename)
    assert.ok(buffer2)
    assert.strictEqual(buffer1, buffer2, 'Should return the same buffer instance')
    assert.strictEqual(global.fetch.mock.calls.length, 1, 'Second call should NOT trigger fetch')
  })

  await t.test('Fetch Failure: returns null on 404', async () => {
    fetchResponseOk = false
    const filename = 'missing.ogg'

    const buffer = await loadAudioBuffer(filename)
    assert.strictEqual(buffer, null, 'Should return null on 404')
    assert.strictEqual(global.fetch.mock.calls.length, 1)
  })

  await t.test('Network Error: returns null on fetch exception', async () => {
    global.fetch.mock.mockImplementationOnce(async () => {
      throw new Error('Network Error')
    })

    const buffer = await loadAudioBuffer('network-error.ogg')
    assert.strictEqual(buffer, null, 'Should return null on network error')
  })

  await t.test('Decode Error: returns null if decoding fails', async () => {
    // Mock decodeAudioData to throw
    mockDecodeAudioData.mock.mockImplementationOnce(async () => {
      throw new Error('Decode Error')
    })

    const buffer = await loadAudioBuffer('bad-audio.ogg')
    assert.strictEqual(buffer, null, 'Should return null on decode error')
  })

  // Timeout tests using fake timers
  await t.test('Fetch Timeout: returns null if fetch takes too long', async (context) => {
    if (context.mock.timers) {
        context.mock.timers.enable({ apis: ['setTimeout'] })

        // Mock fetch to hang but respect abort signal
        global.fetch.mock.mockImplementationOnce(async (url, options) => {
             return new Promise((resolve, reject) => {
                 if (options?.signal) {
                     if (options.signal.aborted) {
                         const err = new Error('Aborted')
                         err.name = 'AbortError'
                         return reject(err)
                     }
                     options.signal.addEventListener('abort', () => {
                         const err = new Error('Aborted')
                         err.name = 'AbortError'
                         reject(err)
                     })
                 }
                 // Never resolve otherwise
             })
        })

        const promise = loadAudioBuffer('timeout.ogg')

        // Advance time past AUDIO_BUFFER_LOAD_TIMEOUT_MS (10000ms)
        context.mock.timers.tick(15000)

        const buffer = await promise
        assert.strictEqual(buffer, null, 'Should return null on fetch timeout')
    } else {
        context.skip('Mock timers not available')
    }
  })

   await t.test('Decode Timeout: returns null if decoding takes too long', async (context) => {
    if (context.mock.timers) {
        context.mock.timers.enable({ apis: ['setTimeout'] })

        // Ensure fetch works (in case it was messed up by previous test)
        // Reset fetch mock just in case
        if (global.fetch.mock) global.fetch.mock.resetCalls()

        // Mock decode to hang
        mockDecodeAudioData.mock.mockImplementationOnce(async () => {
            await new Promise(() => {}) // Hang
        })

        const promise = loadAudioBuffer('decode-timeout.ogg')

        // Wait for fetch and arrayBuffer to resolve so we reach the decode phase
        await new Promise(resolve => setImmediate(resolve))

        // Advance time past AUDIO_BUFFER_DECODE_TIMEOUT_MS (10000ms)
        context.mock.timers.tick(15000)

        const buffer = await promise
        assert.strictEqual(buffer, null, 'Should return null on decode timeout')
    } else {
        context.skip('Mock timers not available')
    }
  })
})
