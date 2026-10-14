/**
 * @fileoverview `playSongSequence` resets per-song progress.
 *
 * `gig_mid` fires off `progress`, which only advances once the transport runs.
 * A value left from the previous song fired the event during the next song's
 * lead-in, so each song has to start from zero.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

const playAudioForSong = mock.fn(async () => [])

mock.module(
  new URL('../../src/utils/audio/playbackStrategies.ts', import.meta.url).href,
  { namedExports: { playAudioForSong } }
)

mock.module(
  new URL('../../src/utils/audio/gigPlayback.ts', import.meta.url).href,
  { namedExports: { getGigTimeMs: () => 0 } }
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

const { playSongSequence } =
  await import('../../src/utils/audio/songSequencer.ts')

test('starting the next song resets progress left from the previous one', async () => {
  const gameStateRef = {
    current: {
      progress: 89,
      lastEndedSongIndex: 0,
      songTransitioning: true,
      hasSubmittedResults: false,
      isGameOver: false,
      setlistCompleted: false,
      notes: [],
      nextMissCheckIndex: 0,
      notesVersion: 0,
      totalDuration: 0
    }
  }
  const setlist = [
    { id: 'song_a', name: 'Song A' },
    { id: 'song_b', name: 'Song B' }
  ]

  await playSongSequence(1, setlist, gameStateRef, () => {}, undefined)

  assert.strictEqual(gameStateRef.current.progress, 0)
  assert.strictEqual(gameStateRef.current.songTransitioning, false)
})

test('per-song accuracy includes ordinary hits and resets their baseline between songs', async () => {
  const state = {
    progress: 0,
    lastEndedSongIndex: -1,
    songTransitioning: false,
    hasSubmittedResults: false,
    isGameOver: false,
    setlistCompleted: false,
    notes: [],
    nextMissCheckIndex: 0,
    notesVersion: 0,
    totalDuration: 0,
    score: 100,
    stats: { perfectHits: 1, hits: 8, misses: 1 },
    songStats: [],
    currentSongStartScore: 0,
    currentSongStartPerfectHits: 0,
    currentSongStartHits: 0,
    currentSongStartMisses: 0
  }
  const ref = { current: state }
  const setlist = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' }
  ]
  await playSongSequence(0, setlist, ref, () => {}, undefined)
  await playAudioForSong.mock.calls.at(-1).arguments[2]()
  assert.equal(state.songStats[0].accuracy, 90)
  assert.equal(state.currentSongStartHits, 8)
  state.stats = { perfectHits: 1, hits: 9, misses: 2 }
  await playAudioForSong.mock.calls.at(-1).arguments[2]()
  assert.equal(state.songStats[1].accuracy, 50)
})
