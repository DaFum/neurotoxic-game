/**
 * @fileoverview Contract test for the gig clock.
 *
 * `audioEngine.getGigTimeMs()` is the mandated clock for all gameplay timing, so
 * it must track the expected timeline within `GIG_CLOCK_DRIFT_TOLERANCE_MS` —
 * including across the re-anchor that happens when one song ends and the next
 * begins. Tone.js and the audio context are faked so context time is fully
 * controllable and no real `AudioContext` is constructed.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { GIG_CLOCK_DRIFT_TOLERANCE_MS } from '../../src/utils/audio/constants'

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

// `namedExports` is required for these mocks to link under the CI Node version.
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

const { getGigTimeMs, startGigClock, startGigPlayback } =
  await import('../../src/utils/audio/gigPlayback')
const { audioState, resetGigState } =
  await import('../../src/utils/audio/state')

const resetHarness = (startCtxTimeSec = 10) => {
  resetGigState()
  sources.length = 0
  rawContext.currentTime = startCtxTimeSec
  mockEnsureAudioContext.mock.resetCalls()
  mockLoadAudioBuffer.mock.resetCalls()
  transport.start.mock.resetCalls()
  transport.stop.mock.resetCalls()
}

const assertWithinTolerance = (actualMs, expectedMs, label) => {
  const drift = Math.abs(actualMs - expectedMs)
  assert.ok(
    drift <= GIG_CLOCK_DRIFT_TOLERANCE_MS,
    `${label}: drift ${drift.toFixed(3)}ms exceeds ${GIG_CLOCK_DRIFT_TOLERANCE_MS}ms (got ${actualMs}, expected ${expectedMs})`
  )
}

test('getGigTimeMs derives gig time from the context anchor and seek offset', () => {
  resetHarness(15)
  audioState.gigStartCtxTime = 5
  audioState.gigSeekOffsetMs = 2000

  assert.strictEqual(getGigTimeMs(), 12000)
})

test('getGigTimeMs stays within drift tolerance across a simulated gig', async () => {
  resetHarness(10)

  const started = await startGigPlayback({ filename: 'song1.ogg' })
  assert.strictEqual(started, true)

  const anchorSec = audioState.gigStartCtxTime
  assert.strictEqual(typeof anchorSec, 'number')
  assertWithinTolerance(getGigTimeMs(), 0, 'gig start')

  // Ideal timeline: one second of context time is one second of gig time.
  for (const elapsedSec of [0.5, 1, 2.5, 5, 12, 29]) {
    rawContext.currentTime = anchorSec + elapsedSec
    assertWithinTolerance(getGigTimeMs(), elapsedSec * 1000, `+${elapsedSec}s`)
  }

  // Scheduling jitter inside the tolerance must still pass.
  rawContext.currentTime = anchorSec + 15 + 0.004
  assertWithinTolerance(getGigTimeMs(), 15000, 'with 4ms jitter')

  // A divergence larger than the tolerance must be detectable, otherwise the
  // assertion above proves nothing.
  rawContext.currentTime = anchorSec + 15 + 0.05
  assert.ok(
    Math.abs(getGigTimeMs() - 15000) > GIG_CLOCK_DRIFT_TOLERANCE_MS,
    'a 50ms divergence must exceed the tolerance'
  )
})

test('the gig clock re-anchors continuously across a song transition', async () => {
  resetHarness(10)

  const SONG_LENGTH_MS = 4000
  const SONG_COUNT = 3
  // `handleGigSourceEnded` snapshots the elapsed time into `gigSeekOffsetMs` and
  // clears the anchor before invoking `onEnded`. That instant is the seam: the
  // reported gig time must not jump there.
  const seamReadings = []
  let songIndex = 0

  const chainNextSong = () => {
    seamReadings.push({ song: songIndex, atSeamMs: getGigTimeMs() })
    songIndex++
    if (songIndex >= SONG_COUNT) return
    // Mirrors `playbackStrategies`: each song re-anchors with `offsetMs: 0`, so
    // the gig clock is per-song rather than cumulative across the setlist.
    startGigClock({ offsetMs: 0, startTimeSec: rawContext.currentTime })
    audioState.gigOnEnded = chainNextSong
    audioState.gigSource = sources[sources.length - 1]
  }

  const started = await startGigPlayback({
    filename: 'song1.ogg',
    durationMs: SONG_LENGTH_MS,
    onEnded: chainNextSong
  })
  assert.strictEqual(started, true)
  assert.strictEqual(sources.length, 1)

  for (let song = 0; song < SONG_COUNT; song++) {
    const anchorSec = audioState.gigStartCtxTime
    assert.strictEqual(
      typeof anchorSec,
      'number',
      `song ${song} must be anchored`
    )
    assertWithinTolerance(getGigTimeMs(), 0, `song ${song} start`)

    let previousMs = getGigTimeMs()
    for (const elapsedSec of [0.5, 1.5, 3, SONG_LENGTH_MS / 1000]) {
      rawContext.currentTime = anchorSec + elapsedSec
      const currentMs = getGigTimeMs()
      assertWithinTolerance(
        currentMs,
        elapsedSec * 1000,
        `song ${song} +${elapsedSec}s`
      )
      assert.ok(
        currentMs >= previousMs,
        `song ${song} clock went backwards at +${elapsedSec}s`
      )
      previousMs = currentMs
    }

    const endOfSongMs = getGigTimeMs()

    // The fake source's `onended` is the only way to run the module-private
    // re-anchor path.
    const activeSource = audioState.gigSource
    assert.ok(activeSource, `song ${song} must hold an active source`)
    activeSource.onended()

    assertWithinTolerance(
      seamReadings[song].atSeamMs,
      endOfSongMs,
      `song ${song} → ${song + 1} seam`
    )
  }

  assert.strictEqual(seamReadings.length, SONG_COUNT)
})
