import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const rawContext = { currentTime: 10 }
const mockEnsureAudioContext = mock.fn(async () => true)
const mockLoadAudioBuffer = mock.fn(async () => ({
  duration: 30,
  length: 30000,
  numberOfChannels: 2,
  sampleRate: 44100
}))
const transport = {
  start: mock.fn(),
  stop: mock.fn(),
  pause: mock.fn(),
  clear: mock.fn(),
  cancel: mock.fn(),
  position: 0
}

mock.module('tone', {
  namedExports: {
    getTransport: () => transport,
    getContext: () => ({ rawContext }),
    context: { state: 'running', resume: mock.fn(async () => {}) }
  }
})

mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    ensureAudioContext: mockEnsureAudioContext,
    getRawAudioContext: () => rawContext,
    getAudioContextTimeSec: () => rawContext.currentTime,
    getToneStartTimeSec: time => time
  }
})

mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: {
    loadAudioBuffer: mockLoadAudioBuffer,
    hasAudioAsset: () => true
  }
})

const sources = []

mock.module(
  new URL('../../src/utils/audio/sharedBufferUtils.ts', import.meta.url).href,
  {
    namedExports: {
      createAndConnectBufferSource: mock.fn((_buffer, onEnded) => {
        const source = {
          buffer: null,
          connect: mock.fn(),
          disconnect: mock.fn(),
          start: mock.fn(),
          stop: mock.fn(),
          onended: null
        }
        source.onended = () => onEnded(source)
        sources.push(source)
        return source
      })
    }
  }
)

mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: {
    logger: {
      debug: mock.fn(),
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn()
    }
  }
})

const mockMidi = mock.fn(async () => true)
const mockNotes = mock.fn(async () => true)
const mockMetal = mock.fn(async () => true)
mock.module(
  new URL('../../src/utils/audio/midiPlayback.ts', import.meta.url).href,
  {
    namedExports: { playMidiFile: mockMidi, playSongFromData: mockNotes }
  }
)
mock.module(
  new URL('../../src/utils/audio/proceduralMetal.ts', import.meta.url).href,
  {
    namedExports: { startMetalGenerator: mockMetal }
  }
)
const { playAudioForSong } =
  await import('../../src/utils/audio/playbackStrategies')

const { startGigClock, startGigPlayback, stopGigPlayback } =
  await import('../../src/utils/audio/gigPlayback')
const { audioState, resetGigState } =
  await import('../../src/utils/audio/state')

test('gig source onended keeps synchronous next-song clock state', async () => {
  resetGigState()
  sources.length = 0
  mockEnsureAudioContext.mock.resetCalls()
  mockLoadAudioBuffer.mock.resetCalls()
  transport.start.mock.resetCalls()
  transport.stop.mock.resetCalls()

  const firstStarted = await startGigPlayback({
    filename: 'song1.ogg',
    durationMs: 1000,
    onEnded: () => {
      startGigClock({ startTimeSec: 42, offsetMs: 0 })
    }
  })

  assert.strictEqual(firstStarted, true)
  assert.strictEqual(sources.length, 1)

  sources[0].onended()

  assert.strictEqual(audioState.gigStartCtxTime, 42)
})

test('gig playback aborts when stopped while audio context unlock is pending', async () => {
  resetGigState()
  sources.length = 0
  mockEnsureAudioContext.mock.resetCalls()
  mockLoadAudioBuffer.mock.resetCalls()

  let resolveContext
  mockEnsureAudioContext.mock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveContext = resolve
      })
  )

  const pendingPlayback = startGigPlayback({ filename: 'cancelled.ogg' })
  await Promise.resolve()
  stopGigPlayback()
  resolveContext(true)

  assert.strictEqual(await pendingPlayback, false)
  assert.strictEqual(mockLoadAudioBuffer.mock.calls.length, 0)
  assert.strictEqual(sources.length, 0)
})

test('gig playback aborts when stopped while its buffer is loading', async () => {
  resetGigState()
  sources.length = 0
  mockEnsureAudioContext.mock.resetCalls()
  mockLoadAudioBuffer.mock.resetCalls()

  let signalBufferLoad
  const bufferLoadStarted = new Promise(resolve => {
    signalBufferLoad = resolve
  })
  let resolveBuffer
  mockLoadAudioBuffer.mock.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveBuffer = resolve
        signalBufferLoad()
      })
  )

  const pendingPlayback = startGigPlayback({ filename: 'cancelled.ogg' })
  // The watchdog stays referenced so it can actually fire if loadAudioBuffer is
  // never reached, and is cleared once the race settles so it never holds the
  // event loop open for the full timeout on the happy path.
  let watchdog
  try {
    await Promise.race([
      bufferLoadStarted,
      new Promise((_resolve, reject) => {
        watchdog = setTimeout(
          () => reject(new Error('loadAudioBuffer was never called')),
          5000
        )
      })
    ])
  } finally {
    clearTimeout(watchdog)
  }
  stopGigPlayback()
  resolveBuffer({
    duration: 30,
    length: 30000,
    numberOfChannels: 2,
    sampleRate: 44100
  })

  assert.strictEqual(await pendingPlayback, false)
  assert.strictEqual(sources.length, 0)
})

const authoredSong = {
  id: 'test',
  name: 'Test',
  bpm: 120,
  duration: 30,
  difficulty: 1,
  sourceOgg: 'test.ogg',
  sourceMid: 'test.mid'
}
const authoredNotes = [{ time: 1000, lane: 0 }]

for (const phase of ['context', 'buffer', 'midi', 'notes']) {
  test(`stopping a pending ${phase} start prevents every later fallback`, async () => {
    resetGigState()
    sources.length = 0
    for (const fn of [mockMidi, mockNotes, mockMetal]) fn.mock.resetCalls()
    let release
    let signal
    const entered = new Promise(resolve => {
      signal = resolve
    })
    const deferred = () =>
      new Promise(resolve => {
        release = resolve
        signal()
      })
    if (phase === 'context')
      mockEnsureAudioContext.mock.mockImplementationOnce(deferred)
    if (phase === 'buffer')
      mockLoadAudioBuffer.mock.mockImplementationOnce(deferred)
    if (phase === 'midi') {
      mockLoadAudioBuffer.mock.mockImplementationOnce(async () => null)
      mockMidi.mock.mockImplementationOnce(() => {
        audioState.playRequestId++
        return deferred()
      })
    }
    if (phase === 'notes')
      mockNotes.mock.mockImplementationOnce(() => {
        audioState.playRequestId++
        return deferred()
      })
    const song =
      phase === 'notes'
        ? { ...authoredSong, sourceOgg: undefined, sourceMid: undefined }
        : authoredSong
    const pending = playAudioForSong(
      song,
      authoredNotes,
      () => {},
      () => 0.5
    )
    let watchdog
    try {
      await Promise.race([
        entered,
        new Promise((_, reject) => {
          watchdog = setTimeout(
            () => reject(new Error('strategy never started')),
            5000
          )
        })
      ])
    } finally {
      clearTimeout(watchdog)
    }
    stopGigPlayback()
    release(
      phase === 'buffer'
        ? {
            duration: 30,
            length: 30000,
            numberOfChannels: 2,
            sampleRate: 44100
          }
        : false
    )
    await pending
    assert.equal(mockMidi.mock.callCount(), phase === 'midi' ? 1 : 0)
    assert.equal(mockNotes.mock.callCount(), phase === 'notes' ? 1 : 0)
    assert.equal(mockMetal.mock.callCount(), 0)
    assert.equal(sources.length, 0)
  })
}

test('an unavailable OGG still falls back to MIDI when the request is current', async () => {
  resetGigState()
  mockMidi.mock.resetCalls()
  mockLoadAudioBuffer.mock.mockImplementationOnce(async () => null)
  await playAudioForSong(
    authoredSong,
    authoredNotes,
    () => {},
    () => 0.5
  )
  assert.equal(mockMidi.mock.callCount(), 1)
  stopGigPlayback()
})
