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
    getAudioContextTimeSec: () => rawContext.currentTime
  }
})

mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: {
    loadAudioBuffer: mockLoadAudioBuffer
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
  await Promise.race([
    bufferLoadStarted,
    new Promise((_resolve, reject) =>
      setTimeout(
        () => reject(new Error('loadAudioBuffer was never called')),
        5000
      ).unref()
    )
  ])
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
