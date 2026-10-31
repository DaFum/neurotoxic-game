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

const { playSongSequence, resetGigStateTracking } =
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

test('a gig that ended while the next song loaded neither writes state nor toasts', async () => {
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
  const toasts = []
  // The band collapses while the audio of the next song is still loading.
  playAudioForSong.mock.mockImplementationOnce(async () => {
    gameStateRef.current.isGameOver = true
    return [{ time: 1000 }]
  })

  await playSongSequence(1, setlist, gameStateRef, text => toasts.push(text))

  assert.deepStrictEqual(toasts, [])
  assert.strictEqual(gameStateRef.current.notesVersion, 0)
  assert.deepStrictEqual(gameStateRef.current.notes, [])
})

test('natural song end settles pending misses before stats and honors a collapse (#3387)', async () => {
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
    score: 0,
    stats: { perfectHits: 0, hits: 0, misses: 0 },
    songStats: [],
    currentSongStartScore: 0,
    currentSongStartPerfectHits: 0,
    currentSongStartHits: 0,
    currentSongStartMisses: 0,
    // Stands in for the scoring owner: 4 unhit notes cost 4 misses and, on the
    // last one, the band collapses.
    settleUnhitNotes: () => {
      state.stats.misses += 4
      state.isGameOver = true
    }
  }
  const ref = { current: state }
  const setlist = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' }
  ]
  await playSongSequence(0, setlist, ref, () => {}, undefined)
  const callsBefore = playAudioForSong.mock.calls.length
  await playAudioForSong.mock.calls.at(-1).arguments[2]()
  // The collapse stops the chain: no next song is started.
  assert.equal(playAudioForSong.mock.calls.length, callsBefore)
  assert.equal(state.stats.misses, 4)
})

test('a gig already stopped or submitted settles no misses at source end', async () => {
  let settled = 0
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
    score: 0,
    stats: { perfectHits: 0, hits: 0, misses: 0 },
    songStats: [],
    settleUnhitNotes: () => {
      settled++
    }
  }
  const ref = { current: state }
  const setlist = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' }
  ]
  await playSongSequence(0, setlist, ref, () => {}, undefined)
  state.hasSubmittedResults = true
  await playAudioForSong.mock.calls.at(-1).arguments[2]()
  assert.equal(settled, 0)
})

/**
 * A rhythm state fixture for the zero-length-window re-entrancy cases (#3458).
 *
 * @param {Record<string, unknown>} [overrides] - Fields to replace.
 */
const makeSequencerState = (overrides = {}) => ({
  progress: 0,
  lastEndedSongIndex: -1,
  sequenceAttemptId: 0,
  songTransitioning: false,
  hasSubmittedResults: false,
  isGameOver: false,
  setlistCompleted: false,
  notes: [],
  nextMissCheckIndex: 0,
  notesVersion: 0,
  totalDuration: 0,
  score: 0,
  stats: { perfectHits: 0, hits: 0, misses: 0 },
  songStats: [],
  currentSongStartScore: 0,
  currentSongStartPerfectHits: 0,
  currentSongStartHits: 0,
  currentSongStartMisses: 0,
  ...overrides
})

// A zero-length playback window ends the source while `playAudioForSong` is
// still running, so the song-end callback fires before the playback resolves.
const SONG_A_NOTES = [{ time: 1000 }, { time: 9000 }]
const endsSynchronously = async (_song, _notes, onSongEnded) => {
  onSongEnded()
  return SONG_A_NOTES
}

test('a synchronous song end does not let the ended song overwrite the next song (#3458)', async () => {
  const state = makeSequencerState()
  const ref = { current: state }
  const setlist = [
    { id: 'song_a', name: 'Song A' },
    { id: 'song_b', name: 'Song B' }
  ]
  /** @type {(notes: unknown[]) => void} */
  let resolveSongB = () => {}
  const songBPlayback = new Promise(resolve => {
    resolveSongB = resolve
  })
  const firstCall = playAudioForSong.mock.callCount()
  // Song B starts inside song A's mock call, before the mock records call A,
  // so a per-call `mockImplementationOnce` cannot target it; dispatch by id.
  playAudioForSong.mock.mockImplementation((song, notes, onSongEnded) =>
    song?.id === 'song_a'
      ? endsSynchronously(song, notes, onSongEnded)
      : songBPlayback
  )
  /** @type {string[]} */
  const toasts = []

  try {
    await playSongSequence(0, setlist, ref, text => toasts.push(text))

    const startedIds = playAudioForSong.mock.calls
      .slice(firstCall)
      .map(call => call.arguments[0]?.id)
      .sort()
    assert.deepStrictEqual(startedIds, ['song_a', 'song_b'])
    assert.notStrictEqual(state.notes, SONG_A_NOTES)
    assert.deepStrictEqual(state.notes, [])
    assert.strictEqual(state.songTransitioning, true)
    assert.strictEqual(state.notesVersion, 0)
    assert.strictEqual(state.totalDuration, 0)
    assert.deepStrictEqual(toasts, [])
  } finally {
    playAudioForSong.mock.restore()
    resolveSongB([])
  }
})

test('a synchronous end of the final song keeps the setlist completed (#3458)', async () => {
  const state = makeSequencerState({ lastEndedSongIndex: 0 })
  const ref = { current: state }
  const setlist = [
    { id: 'song_a', name: 'Song A' },
    { id: 'song_b', name: 'Song B' }
  ]
  playAudioForSong.mock.mockImplementationOnce(endsSynchronously)
  /** @type {string[]} */
  const toasts = []

  await playSongSequence(1, setlist, ref, text => toasts.push(text))

  assert.strictEqual(state.setlistCompleted, true)
  assert.strictEqual(state.songTransitioning, false)
  assert.deepStrictEqual(state.notes, [])
  assert.strictEqual(state.notesVersion, 0)
  assert.strictEqual(state.totalDuration, 0)
  assert.deepStrictEqual(toasts, [])
})

test('a song end from a previous gig session neither settles nor chains (#3458)', async () => {
  let settled = 0
  const state = makeSequencerState({
    settleUnhitNotes: () => {
      settled++
    }
  })
  const ref = { current: state }
  const setlist = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' }
  ]
  await playSongSequence(0, setlist, ref, () => {}, undefined)
  const staleOnSongEnded = playAudioForSong.mock.calls.at(-1)?.arguments[2]
  assert.equal(typeof staleOnSongEnded, 'function')

  resetGigStateTracking(ref)
  const callsBefore = playAudioForSong.mock.callCount()
  await staleOnSongEnded?.()

  assert.equal(settled, 0)
  assert.equal(playAudioForSong.mock.callCount(), callsBefore)
  assert.deepStrictEqual(state.songStats, [])
  assert.strictEqual(state.lastEndedSongIndex, -1)
})
