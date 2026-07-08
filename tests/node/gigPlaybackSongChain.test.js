import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const rawContext = { currentTime: 10 }
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
    ensureAudioContext: mock.fn(async () => true),
    getRawAudioContext: () => rawContext,
    getAudioContextTimeSec: () => rawContext.currentTime
  }
})

mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: {
    loadAudioBuffer: mock.fn(async () => ({
      duration: 30,
      length: 30000,
      numberOfChannels: 2,
      sampleRate: 44100
    }))
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

const { startGigClock, startGigPlayback } =
  await import('../../src/utils/audio/gigPlayback')
const { audioState, resetGigState } =
  await import('../../src/utils/audio/state')

test('gig source onended keeps synchronous next-song clock state', async () => {
  resetGigState()
  sources.length = 0
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
