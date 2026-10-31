/**
 * @fileoverview The synthesis fallbacks must anchor the gig clock to the same
 * absolute time the Tone transport starts at. Tone schedules relative to
 * Tone.now(), which runs `lookAhead` ahead of the raw context clock that
 * getGigTimeMs() reads, so a delay-based start drifted by that lookAhead.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const RAW_NOW_SEC = 100
const ADVANCED_NOW_SEC = 105
const LOOK_AHEAD_SEC = 0.15
let rawNowSec = RAW_NOW_SEC

/**
 * Models a backend that prepared successfully: like the real ones it resolves
 * the deferred start time right before starting the transport.
 *
 * @param {unknown} options - Options the strategy passed to the backend.
 * @returns {Promise<boolean>} Always `true`.
 */
const startReadyBackend = async options => {
  const resolve =
    typeof options === 'object' && options !== null
      ? Reflect.get(options, 'resolveStartTimeSec')
      : undefined
  if (typeof resolve === 'function') resolve()
  return true
}

const mockStartGigClock = mock.fn()
const mockPlayMidiFile = mock.fn(async () => false)
const mockPlaySongFromData = mock.fn(
  /** @type {(song: unknown, delay: unknown, options: unknown) => Promise<boolean>} */ (
    (_song, _delay, options) => startReadyBackend(options)
  )
)
const mockStartMetalGenerator = mock.fn(
  /** @type {(song: unknown, delay: unknown, options: unknown, rng: unknown) => Promise<boolean>} */ (
    (_song, _delay, options) => startReadyBackend(options)
  )
)

mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    getAudioContextTimeSec: () => rawNowSec,
    getToneStartTimeSec: rawSec => rawSec + LOOK_AHEAD_SEC
  }
})
mock.module(
  new URL('../../src/utils/audio/gigPlayback.ts', import.meta.url).href,
  {
    namedExports: {
      startGigClock: mockStartGigClock,
      startGigPlayback: mock.fn(async () => false)
    }
  }
)
mock.module(
  new URL('../../src/utils/audio/midiPlayback.ts', import.meta.url).href,
  {
    namedExports: {
      playMidiFile: mockPlayMidiFile,
      playSongFromData: mockPlaySongFromData
    }
  }
)
mock.module(
  new URL('../../src/utils/audio/proceduralMetal.ts', import.meta.url).href,
  { namedExports: { startMetalGenerator: mockStartMetalGenerator } }
)
mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: { hasAudioAsset: () => false }
})
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

const { playAudioForSong } =
  await import('../../src/utils/audio/playbackStrategies')
const { GIG_LEAD_IN_MS } = await import('../../src/utils/audio/rhythmGameTypes')

const expectedStartSec = RAW_NOW_SEC + GIG_LEAD_IN_MS / 1000 + LOOK_AHEAD_SEC
const advancedStartSec =
  ADVANCED_NOW_SEC + GIG_LEAD_IN_MS / 1000 + LOOK_AHEAD_SEC

const reset = () => {
  rawNowSec = RAW_NOW_SEC
  mockStartGigClock.mock.resetCalls()
  mockPlaySongFromData.mock.resetCalls()
  mockPlayMidiFile.mock.resetCalls()
  mockStartMetalGenerator.mock.resetCalls()
}

/**
 * Stands in for a backend whose preparation (audio-context unlock or rebuild)
 * outlasts part of the lead-in before it resolves the start time.
 *
 * @param {unknown} options - Options the strategy passed to the backend.
 * @returns {number} The start time the resolver picked.
 */
const resolveAfterSlowPreparation = options => {
  const resolve =
    typeof options === 'object' && options !== null
      ? Reflect.get(options, 'resolveStartTimeSec')
      : undefined
  assert.equal(typeof resolve, 'function')
  assert.equal(Reflect.get(Object(options), 'startTimeSec'), undefined)
  // Preparation is still running: nothing may be anchored yet.
  assert.equal(mockStartGigClock.mock.callCount(), 0)
  rawNowSec = ADVANCED_NOW_SEC
  const startTimeSec = resolve()
  assert.ok(Math.abs(startTimeSec - advancedStartSec) < 1e-9)
  assert.equal(mockStartGigClock.mock.callCount(), 1)
  assert.strictEqual(
    mockStartGigClock.mock.calls[0].arguments[0].startTimeSec,
    startTimeSec
  )
  return startTimeSec
}

test('note-data synthesis anchors the clock only once the backend is ready (#3459)', async () => {
  reset()
  /** @type {number | null} */
  let resolvedStartSec = null
  mockPlaySongFromData.mock.mockImplementationOnce(
    async (_song, _delay, options) => {
      resolvedStartSec = resolveAfterSlowPreparation(options)
      return true
    }
  )
  const notes = [{ time: 1000, laneIndex: 0, hit: false, visible: true }]
  await playAudioForSong(
    { id: 'song', name: 'Song', bpm: 120, notes },
    notes,
    () => {},
    () => 0.5
  )

  assert.equal(mockPlaySongFromData.mock.callCount(), 1)
  assert.equal(mockStartMetalGenerator.mock.callCount(), 0)
  assert.equal(mockStartGigClock.mock.callCount(), 1)
  assert.strictEqual(
    mockStartGigClock.mock.calls[0].arguments[0].startTimeSec,
    resolvedStartSec
  )
})

test('procedural metal anchors the clock only once the backend is ready (#3459)', async () => {
  reset()
  /** @type {number | null} */
  let resolvedStartSec = null
  mockStartMetalGenerator.mock.mockImplementationOnce(
    async (_song, _delay, options) => {
      resolvedStartSec = resolveAfterSlowPreparation(options)
      return true
    }
  )
  await playAudioForSong(
    { id: 'song', name: 'Song', bpm: 120, duration: 30, difficulty: 2 },
    [],
    () => {},
    () => 0.5
  )

  const [, delay] = mockStartMetalGenerator.mock.calls[0].arguments
  assert.strictEqual(delay, GIG_LEAD_IN_MS / 1000)
  assert.equal(mockStartGigClock.mock.callCount(), 1)
  assert.strictEqual(
    mockStartGigClock.mock.calls[0].arguments[0].startTimeSec,
    resolvedStartSec
  )
})

test('a failed note-data start leaves the anchor to the procedural fallback (#3459)', async () => {
  reset()
  mockPlaySongFromData.mock.mockImplementationOnce(async () => false)
  mockStartMetalGenerator.mock.mockImplementationOnce(
    async (_song, _delay, options) => {
      // The failed note-data attempt never resolved a start time.
      assert.equal(mockStartGigClock.mock.callCount(), 0)
      Reflect.get(Object(options), 'resolveStartTimeSec')()
      return true
    }
  )
  const notes = [{ time: 1000, laneIndex: 0, hit: false, visible: true }]
  await playAudioForSong(
    { id: 'song', name: 'Song', bpm: 120, notes },
    notes,
    () => {},
    () => 0.5
  )

  assert.equal(mockPlaySongFromData.mock.callCount(), 1)
  assert.equal(mockStartMetalGenerator.mock.callCount(), 1)
  assert.equal(mockStartGigClock.mock.callCount(), 1)
  assert.ok(
    Math.abs(
      mockStartGigClock.mock.calls[0].arguments[0].startTimeSec -
        expectedStartSec
    ) < 1e-9
  )
})

test('MIDI synthesis anchors the clock only once the MIDI has loaded (#3376)', async () => {
  reset()
  let loaded = false
  mockPlayMidiFile.mock.mockImplementationOnce(async (_f, _o, _l, _d, opts) => {
    // The fetch is still pending: nothing may be anchored yet.
    assert.equal(mockStartGigClock.mock.callCount(), 0)
    loaded = true
    const startTimeSec = opts.resolveStartTimeSec()
    assert.equal(mockStartGigClock.mock.callCount(), 1)
    assert.strictEqual(
      mockStartGigClock.mock.calls[0].arguments[0].startTimeSec,
      startTimeSec
    )
    assert.ok(Math.abs(startTimeSec - expectedStartSec) < 1e-9)
    return true
  })
  const notes = [{ time: 1000, laneIndex: 0, hit: false, visible: true }]
  const ok = await playAudioForSong(
    { id: 'song', name: 'Song', bpm: 120, notes, sourceMid: 'song.mid' },
    notes,
    () => {},
    () => 0.5
  )
  assert.ok(ok)
  assert.equal(loaded, true)
})

test('a failed MIDI load never starts the gig clock (#3376)', async () => {
  reset()
  const notes = [{ time: 1000, laneIndex: 0, hit: false, visible: true }]
  await playAudioForSong(
    { id: 'song', name: 'Song', bpm: 120, notes, sourceMid: 'song.mid' },
    notes,
    () => {},
    () => 0.5
  )
  // playMidiFile returned false without resolving a start time; the later
  // synthesis fallbacks anchor their own clock, so only one start may exist.
  assert.equal(mockStartGigClock.mock.callCount(), 1)
  assert.ok(
    Number.isFinite(mockStartGigClock.mock.calls[0].arguments[0].startTimeSec)
  )
})
