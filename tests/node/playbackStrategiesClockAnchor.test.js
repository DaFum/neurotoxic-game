/**
 * @fileoverview The synthesis fallbacks must anchor the gig clock to the same
 * absolute time the Tone transport starts at. Tone schedules relative to
 * Tone.now(), which runs `lookAhead` ahead of the raw context clock that
 * getGigTimeMs() reads, so a delay-based start drifted by that lookAhead.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const RAW_NOW_SEC = 100
const LOOK_AHEAD_SEC = 0.15

const mockStartGigClock = mock.fn()
const mockPlaySongFromData = mock.fn(async () => true)
const mockStartMetalGenerator = mock.fn(async () => true)

mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    getAudioContextTimeSec: () => RAW_NOW_SEC,
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
      playMidiFile: mock.fn(async () => false),
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

const reset = () => {
  mockStartGigClock.mock.resetCalls()
  mockPlaySongFromData.mock.resetCalls()
  mockStartMetalGenerator.mock.resetCalls()
}

test('note-data synthesis starts the transport where the gig clock is anchored', async () => {
  reset()
  const notes = [{ time: 1000, laneIndex: 0, hit: false, visible: true }]
  await playAudioForSong(
    { id: 'song', name: 'Song', bpm: 120, notes },
    notes,
    () => {},
    () => 0.5
  )

  const clockStart = mockStartGigClock.mock.calls[0].arguments[0].startTimeSec
  const options = mockPlaySongFromData.mock.calls[0].arguments[2]
  assert.ok(Math.abs(clockStart - expectedStartSec) < 1e-9)
  assert.strictEqual(options.startTimeSec, clockStart)
})

test('procedural metal starts the transport where the gig clock is anchored', async () => {
  reset()
  await playAudioForSong(
    { id: 'song', name: 'Song', bpm: 120, duration: 30, difficulty: 2 },
    [],
    () => {},
    () => 0.5
  )

  const clockStart = mockStartGigClock.mock.calls[0].arguments[0].startTimeSec
  const options = mockStartMetalGenerator.mock.calls[0].arguments[2]
  assert.ok(Math.abs(clockStart - expectedStartSec) < 1e-9)
  assert.strictEqual(options.startTimeSec, clockStart)
})
