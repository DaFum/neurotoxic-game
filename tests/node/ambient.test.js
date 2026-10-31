import { test, mock, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Create a logger double to collect messages
const loggerHistory = []
const mockLogger = {
  debug: (...args) => loggerHistory.push(['debug', ...args]),
  warn: (...args) => loggerHistory.push(['warn', ...args]),
  error: (...args) => loggerHistory.push(['error', ...args])
}
mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: { logger: mockLogger }
})

// Mock state
const mockAudioState = {
  playRequestId: 1,
  ambientSource: null
}
mock.module(new URL('../../src/utils/audio/state.ts', import.meta.url).href, {
  namedExports: { audioState: mockAudioState }
})

// Mock playback functions
const capturedReqIds = []
const mockStopAudio = mock.fn(() => {
  mockAudioState.playRequestId++
  capturedReqIds.push(mockAudioState.playRequestId)
})
mock.module(
  new URL('../../src/utils/audio/transportControl.ts', import.meta.url).href,
  {
    namedExports: { stopAudio: mockStopAudio }
  }
)

// Mock assets
let loadAudioDeferred = null
const defaultLoadAudioBufferImpl = async () => {
  if (loadAudioDeferred) return loadAudioDeferred.promise
  return { duration: 60 }
}
const mockLoadAudioBuffer = mock.fn(defaultLoadAudioBufferImpl)

// Define arrays that we will empty out
const mockMidiUrlMap = { 'test1.mid': 'url1', 'test2.mid': 'url2' }
const mockOggCandidates = ['test1.ogg', 'test2.ogg']

mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: {
    midiUrlMap: mockMidiUrlMap,
    oggCandidates: mockOggCandidates,
    loadAudioBuffer: mockLoadAudioBuffer
  }
})

// Mock audio routing
// Each call returns a distinct source so an ended node and its replacement can
// be told apart.
const createdSources = []
const createMockSource = () => {
  const source = { start: mock.fn(), disconnect: mock.fn(), onended: null }
  createdSources.push(source)
  return source
}
const mockCreateAndConnect = mock.fn(createMockSource)
mock.module(
  new URL('../../src/utils/audio/sharedBufferUtils.ts', import.meta.url).href,
  {
    namedExports: {
      createAndConnectBufferSource: mockCreateAndConnect,
      // Mirrors the real helper (covered in audioSharedBufferUtils.test.js) so
      // the per-call source spies observe the cleanup ambient.ts performs.
      cleanupEndedSource: source => {
        source.onended = null
        try {
          source.disconnect()
        } catch {
          // ignore
        }
      }
    }
  }
)

// Mock generic utils
let currentMockSelectRandomItem = (arr, _rng) =>
  arr && arr.length > 0 ? arr[0] : null
mock.module(
  new URL('../../src/utils/selectionUtils.ts', import.meta.url).href,
  {
    namedExports: {
      selectRandomItem: (..._args) => currentMockSelectRandomItem(..._args)
    }
  }
)

let ensureAudioDeferred = null
const mockEnsureAudioContext = mock.fn(async () => {
  if (ensureAudioDeferred) return ensureAudioDeferred.promise
  return true
})
mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: { ensureAudioContext: mockEnsureAudioContext }
})

// Mock midi playback
const mockPlayMidiFileInternal = mock.fn(async () => true)
mock.module(
  new URL('../../src/utils/audio/midiPlayback.ts', import.meta.url).href,
  {
    namedExports: { playMidiFileInternal: mockPlayMidiFileInternal }
  }
)

// Mock songs db
mock.module(new URL('../../src/data/songs.ts', import.meta.url).href, {
  namedExports: {
    SONGS_BY_ID: new Map(),
    SONGS_DB: [],
    SONGS_BY_MID: new Map()
  }
})

describe('ambient.ts', () => {
  let playRandomAmbientMidi
  let playRandomAmbientOgg
  let assetsModule

  beforeEach(async () => {
    loggerHistory.length = 0
    capturedReqIds.length = 0
    ensureAudioDeferred = null
    loadAudioDeferred = null
    mockEnsureAudioContext.mock.resetCalls()
    mockStopAudio.mock.resetCalls()
    mockLoadAudioBuffer.mock.resetCalls()
    mockLoadAudioBuffer.mock.mockImplementation(defaultLoadAudioBufferImpl)
    mockCreateAndConnect.mock.resetCalls()
    mockCreateAndConnect.mock.mockImplementation(createMockSource)
    mockPlayMidiFileInternal.mock.resetCalls()
    createdSources.length = 0
    mockAudioState.playRequestId = 1
    mockAudioState.ambientSource = null

    // Restore module exports state
    mockMidiUrlMap['test1.mid'] = 'url1'
    mockMidiUrlMap['test2.mid'] = 'url2'

    mockOggCandidates.length = 0
    mockOggCandidates.push('test1.ogg', 'test2.ogg')

    currentMockSelectRandomItem = (arr, _rng) => {
      if (Array.isArray(arr) && arr.length > 0) return arr[0]
      if (
        typeof arr === 'object' &&
        arr !== null &&
        Object.keys(arr).length > 0
      )
        return Object.keys(arr)[0]
      return null
    }

    // Load module fresh
    const mod = await import('../../src/utils/audio/ambient.ts')
    playRandomAmbientMidi = mod.playRandomAmbientMidi
    playRandomAmbientOgg = mod.playRandomAmbientOgg
    assetsModule = await import('../../src/utils/audio/assets.ts')
  })

  describe('playRandomAmbientMidi', () => {
    test('stops current audio before starting', async () => {
      await playRandomAmbientMidi([], () => 0)
      assert.equal(mockStopAudio.mock.calls.length, 1)
    })

    test('warns and returns false if no MIDI files available', async () => {
      // Clear properties on the actual imported module
      for (const key of Object.keys(assetsModule.midiUrlMap)) {
        delete assetsModule.midiUrlMap[key]
      }

      const result = await playRandomAmbientMidi([], () => 0)

      assert.equal(result, false)
      assert.ok(
        loggerHistory.some(
          log => log[0] === 'warn' && log[2].includes('No MIDI files found')
        )
      )
    })

    test('warns and returns false if MIDI selection fails', async () => {
      currentMockSelectRandomItem = () => null
      const result = await playRandomAmbientMidi([], () => 0)

      assert.equal(result, false)
      assert.ok(
        loggerHistory.some(
          log =>
            log[0] === 'warn' &&
            log[2].includes('Random MIDI selection returned null')
        )
      )
    })

    test('plays the selected MIDI file with 0 offset and correct options', async () => {
      const mockSongsDB = [{ sourceMid: 'test1.mid', name: 'Test Song' }]
      const result = await playRandomAmbientMidi(mockSongsDB, () => 0)

      assert.equal(result, true)
      assert.equal(mockPlayMidiFileInternal.mock.calls.length, 1)
      const args = mockPlayMidiFileInternal.mock.calls[0].arguments
      assert.equal(args[0].filename, 'test1.mid')
      assert.equal(args[0].offset, 0) // offset
      assert.equal(args[0].loop, false) // loop
      assert.equal(args[0].delay, 0) // extra delay
      assert.equal(args[0].options.useCleanPlayback, true)
      assert.equal(typeof args[0].options.onEnded, 'function')
    })

    test('onEnded chaining bails out if playRequestId changed', async () => {
      await playRandomAmbientMidi([], () => 0)

      const onEnded =
        mockPlayMidiFileInternal.mock.calls[0].arguments[0].options.onEnded

      // Change req id
      mockAudioState.playRequestId = 3

      onEnded()

      assert.ok(
        loggerHistory.some(
          log => log[0] === 'debug' && log[2].includes('chain cancelled')
        )
      )
    })

    test('onEnded chaining calls next track if reqId matches', async () => {
      await playRandomAmbientMidi([], () => 0)

      const onEnded =
        mockPlayMidiFileInternal.mock.calls[0].arguments[0].options.onEnded

      // Do not change reqId
      const prevCalls = mockPlayMidiFileInternal.mock.calls.length
      onEnded()

      // Wait a tick for async execution of playRandomAmbientMidi
      await new Promise(r => setTimeout(r, 0))

      assert.equal(mockPlayMidiFileInternal.mock.calls.length, prevCalls + 1)
      assert.ok(
        loggerHistory.some(
          log => log[0] === 'debug' && log[2].includes('chaining next track')
        )
      )
    })
  })

  describe('playRandomAmbientOgg', () => {
    test('stops current audio before starting unless skipStop is true', async () => {
      await playRandomAmbientOgg()
      assert.equal(mockStopAudio.mock.calls.length, 1)
      assert.equal(capturedReqIds[0], 2)
      assert.equal(mockAudioState.playRequestId, 3) // `ambient.ts` internally increments reqId again in `playRandomAmbientOgg` so it's 3

      mockStopAudio.mock.resetCalls()
      capturedReqIds.length = 0

      await playRandomAmbientOgg(() => 0, { skipStop: true })
      assert.equal(mockStopAudio.mock.calls.length, 0)
      assert.equal(capturedReqIds.length, 0)
    })

    test('warns and returns false if no OGG files available', async () => {
      assetsModule.oggCandidates.length = 0
      const result = await playRandomAmbientOgg()

      assert.equal(result, false)
      assert.ok(
        loggerHistory.some(
          log => log[0] === 'warn' && log[2].includes('No OGG files available')
        )
      )
    })

    test('warns and returns false if OGG selection fails', async () => {
      currentMockSelectRandomItem = () => null
      const result = await playRandomAmbientOgg()

      assert.equal(result, false)
      assert.ok(
        loggerHistory.some(
          log =>
            log[0] === 'warn' &&
            log[2].includes('Random OGG selection returned null')
        )
      )
    })

    test('returns false if buffer fails to load', async () => {
      mockLoadAudioBuffer.mock.mockImplementation(async () => null)
      const result = await playRandomAmbientOgg()

      assert.equal(result, false)
    })

    test('returns false if source creation fails', async () => {
      mockCreateAndConnect.mock.mockImplementation(() => null)
      const result = await playRandomAmbientOgg()

      assert.equal(result, false)
    })

    test('plays the selected OGG file and sets up onended', async () => {
      const result = await playRandomAmbientOgg()

      assert.equal(result, true)
      assert.equal(createdSources.length, 1)
      const source = createdSources[0]
      assert.equal(source.start.mock.calls.length, 1)
      assert.ok(source.onended)
      assert.equal(mockAudioState.ambientSource, source)
    })

    test('onended disconnects the ended source but keeps a replacement on source mismatch', async () => {
      await playRandomAmbientOgg()
      const ended = createdSources[0]
      const onended = ended.onended

      const replacement = { disconnect: mock.fn() }
      mockAudioState.ambientSource = replacement // change source

      if (onended) onended()
      await new Promise(r => setTimeout(r, 0))

      assert.ok(
        loggerHistory.some(
          log => log[0] === 'debug' && log[2].includes('source mismatch')
        )
      )
      assert.equal(ended.disconnect.mock.calls.length, 1)
      assert.equal(ended.onended, null)
      assert.equal(replacement.disconnect.mock.calls.length, 0)
      assert.equal(mockAudioState.ambientSource, replacement)
      assert.equal(createdSources.length, 1)
    })

    test('onended disconnects and clears the ended source without chaining if reqId changed', async () => {
      await playRandomAmbientOgg()
      const ended = createdSources[0]
      const onended = ended.onended

      mockAudioState.playRequestId += 1 // change req

      if (onended) onended()
      await new Promise(r => setTimeout(r, 0))

      assert.ok(
        loggerHistory.some(
          log => log[0] === 'debug' && log[2].includes('chain cancelled')
        )
      )
      assert.equal(ended.disconnect.mock.calls.length, 1)
      assert.equal(ended.onended, null)
      assert.equal(mockAudioState.ambientSource, null)
      assert.equal(createdSources.length, 1)
      assert.equal(ended.start.mock.calls.length, 1)
    })

    test('onended disconnects the ended source and chains next track if correct', async () => {
      await playRandomAmbientOgg()
      const ended = createdSources[0]
      const onended = ended.onended

      if (onended) onended()

      // Wait a tick for async execution of playRandomAmbientOgg
      await new Promise(r => setTimeout(r, 0))

      assert.equal(ended.disconnect.mock.calls.length, 1)
      assert.equal(ended.onended, null)
      assert.equal(createdSources.length, 2)
      const next = createdSources[1]
      assert.equal(next.start.mock.calls.length, 1)
      assert.equal(next.disconnect.mock.calls.length, 0)
      assert.equal(mockAudioState.ambientSource, next)
    })

    test('bails out if playRequestId changes during async ensureAudioContext', async () => {
      let resolveEnsure
      ensureAudioDeferred = {
        promise: new Promise(r => {
          resolveEnsure = r
        })
      }
      const p = playRandomAmbientOgg()

      await new Promise(r => setTimeout(r, 0))

      assert.equal(mockEnsureAudioContext.mock.calls.length, 1)

      mockAudioState.playRequestId += 1 // simulate cancellation
      resolveEnsure(true)

      const result = await p
      assert.equal(result, false)
      assert.equal(mockLoadAudioBuffer.mock.calls.length, 0)
    })

    test('bails out if playRequestId changes during async loadAudioBuffer', async () => {
      let resolveLoad
      loadAudioDeferred = {
        promise: new Promise(r => {
          resolveLoad = r
        })
      }
      const p = playRandomAmbientOgg()

      await new Promise(r => setTimeout(r, 0))

      assert.equal(mockLoadAudioBuffer.mock.calls.length, 1)

      mockAudioState.playRequestId += 1 // simulate cancellation
      resolveLoad({ duration: 60 })

      const result = await p
      assert.equal(result, false)
      assert.equal(mockCreateAndConnect.mock.calls.length, 0)
    })
  })
})
