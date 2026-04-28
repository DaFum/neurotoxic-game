import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { transformSongsData } from '../../src/data/songs'

const mockRhythmSongs = {
  'Test Song 1': {
    name: 'Test Song 1',
    sourceMid: 'test1.mid',
    sourceOgg: 'test1.ogg',
    bpm: 120,
    tpb: 480,
    durationMs: 30000,
    difficultyRank: 3,
    crowdAppeal: 7,
    staminaDrain: 15,
    notes: [
      { t: 100, lane: 'guitar', p: 60, v: 100 },
      { t: 200, lane: 'drums', p: 38, v: 90 }
    ],
    tempoMap: [{ tick: 0, usPerBeat: 500000 }],
    excerptStartMs: 5000,
    excerptEndMs: 35000,
    excerptDurationMs: 30000,
    tags: ['Metal', 'Fast']
  },
  'Test Song 2 No Ogg': {
    name: 'Test Song 2',
    sourceMid: 'test2.mid',
    bpm: 180,
    tpb: 480,
    difficultyRank: 5,
    notes: [{ t: 500, lane: 'bass', p: 40, v: 80 }]
  },
  'Edge Case Song': {
    name: 'Edge Case',
    bpm: 0,
    tpb: 0,
    difficultyRank: 10,
    crowdAppeal: 15,
    notes: 'invalid'
  },
  'Song With Special-Chars!@#': {
    name: 'Song With Special Chars',
    bpm: 160,
    tpb: 480,
    difficultyRank: 4,
    notes: []
  }
}

describe('songs transform (fixture-focused)', () => {
  const songsDb = transformSongsData(mockRhythmSongs)

  test('transforms input object into SONGS_DB entries', () => {
    assert.ok(Array.isArray(songsDb))
    assert.equal(songsDb.length, 4)
  })

  test('uses JSON key as stable id', () => {
    const song = songsDb.find(entry => entry.name === 'Test Song 1')
    assert.equal(song?.id, 'Test Song 1')
  })

  test('sanitizes leaderboardId from special chars', () => {
    const song = songsDb.find(entry => entry.name === 'Song With Special Chars')
    assert.ok(song)
    assert.ok(/^[a-z0-9_-]+$/.test(song.leaderboardId))
    assert.ok(!song.leaderboardId.includes('__'))
    assert.ok(!song.leaderboardId.startsWith('_'))
    assert.ok(!song.leaderboardId.endsWith('_'))
    assert.ok(song.leaderboardId.length <= 64)
  })

  test('maps difficulty to expected intensity bands', () => {
    const mediumSong = songsDb.find(song => song.name === 'Test Song 1')
    const highSong = songsDb.find(song => song.name === 'Test Song 2')
    assert.equal(mediumSong?.intensity, 'MEDIUM')
    assert.equal(highSong?.intensity, 'HIGH')
  })

  test('clamps invalid difficulty/bpm/tpb/crowdAppeal', () => {
    const clampedSongs = songsDb.filter(
      song => song.difficulty === 7 && song.crowdAppeal === 10
    )
    assert.equal(clampedSongs.length, 1)

    const [edgeSong] = clampedSongs
    assert.ok(Number.isFinite(edgeSong.bpm) && edgeSong.bpm >= 1)
    assert.ok(Number.isFinite(edgeSong.tpb) && edgeSong.tpb >= 1)
  })

  test('uses defaults for missing optional fields', () => {
    const songNoOgg = songsDb.find(song => song.name === 'Test Song 2')
    const edgeSong = songsDb.find(song => song.difficulty === 7)

    assert.ok(songNoOgg)
    assert.equal(songNoOgg.sourceOgg, null)
    assert.equal(songNoOgg.excerptDurationMs, null)

    assert.ok(edgeSong)
    assert.deepEqual(edgeSong.tags, ['Metal', 'Instrumental'])
  })

  test('normalizes malformed notes field into empty notes array', () => {
    const edgeSong = songsDb.find(song => song.difficulty === 7)
    assert.ok(edgeSong)
    assert.ok(Array.isArray(edgeSong.notes))
    assert.equal(edgeSong.notes.length, 0)
  })

  test('preserves note and tempo map payload for valid songs', () => {
    const song = songsDb.find(entry => entry.name === 'Test Song 1')
    assert.ok(song)
    assert.equal(song.notes.length, 2)
    assert.equal(song.notes[0].t, 100)
    assert.equal(song.notes[1].t, 200)
    assert.equal(song.tempoMap.length, 1)
  })

  test('uses source duration and excerpt fields when provided', () => {
    const song = songsDb.find(entry => entry.name === 'Test Song 1')
    assert.ok(song)
    assert.ok(song.duration >= 30)
    assert.equal(song.excerptStartMs, 5000)
    assert.equal(song.excerptEndMs, 35000)
    assert.equal(song.excerptDurationMs, 30000)
  })
})
