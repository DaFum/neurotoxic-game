import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { transformSongsData } from '../src/data/songs.js'

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
    bpm: 0, // invalid
    tpb: 0, // invalid
    difficultyRank: 10, // out of range
    crowdAppeal: 15, // out of range
    notes: 'invalid' // not array
  },
  'Song With Special-Chars!@#': {
    name: 'Song With Special Chars',
    bpm: 160,
    tpb: 480,
    difficultyRank: 4,
    notes: []
  }
}

describe('songs.js', () => {
  const SONGS_DB = transformSongsData(mockRhythmSongs)

  test('transforms JSON to SONGS_DB array', () => {
    assert.ok(Array.isArray(SONGS_DB))
    assert.ok(SONGS_DB.length > 0)
  })

  test('each song has required fields', () => {
    SONGS_DB.forEach(song => {
      assert.ok(song.id, 'song should have id')
      assert.ok(song.leaderboardId, 'song should have leaderboardId')
      assert.ok(song.name, 'song should have name')
      assert.ok(song.title, 'song should have title')
      assert.ok(typeof song.duration === 'number', 'song should have duration')
      assert.ok(
        typeof song.difficulty === 'number',
        'song should have difficulty'
      )
      assert.ok(song.intensity, 'song should have intensity')
      assert.ok(typeof song.bpm === 'number', 'song should have bpm')
      assert.ok(Array.isArray(song.tags), 'song should have tags array')
      assert.ok(Array.isArray(song.notes), 'song should have notes array')
      assert.ok(Array.isArray(song.tempoMap), 'song should have tempoMap')
      assert.ok(typeof song.tpb === 'number', 'song should have tpb')
    })
  })

  test('uses JSON key as stable ID', () => {
    const song1 = SONGS_DB.find(s => s.name === 'Test Song 1')
    assert.equal(song1.id, 'Test Song 1')
  })

  test('creates API-safe leaderboardId from key', () => {
    const specialSong = SONGS_DB.find(s => s.name === 'Song With Special Chars')
    assert.ok(specialSong)
    // Should replace special chars with underscores
    assert.ok(/^[a-z0-9_-]+$/.test(specialSong.leaderboardId))
    assert.ok(specialSong.leaderboardId.length <= 64)
    // Should not have consecutive underscores or leading/trailing underscores
    assert.ok(!specialSong.leaderboardId.includes('__'))
    assert.ok(!specialSong.leaderboardId.startsWith('_'))
    assert.ok(!specialSong.leaderboardId.endsWith('_'))
  })

  test('calculates duration from last note time if needed', () => {
    const song1 = SONGS_DB.find(s => s.name === 'Test Song 1')
    // Should use durationMs (30000ms = 30s) or calculated from last note + buffer
    assert.ok(song1.duration >= 30)
  })

  test('clamps difficulty to 1-7 range', () => {
    SONGS_DB.forEach(song => {
      assert.ok(song.difficulty >= 1, `${song.name} difficulty should be >= 1`)
      assert.ok(song.difficulty <= 7, `${song.name} difficulty should be <= 7`)
    })
  })

  test('derives intensity from difficulty', () => {
    const song1 = SONGS_DB.find(s => s.difficulty === 3)
    assert.equal(song1?.intensity, 'MEDIUM')

    const song2 = SONGS_DB.find(s => s.difficulty === 5)
    assert.equal(song2?.intensity, 'HIGH')
  })

  test('handles missing optional fields gracefully', () => {
    const songNoOgg = SONGS_DB.find(s => s.name === 'Test Song 2')
    assert.ok(songNoOgg)
    assert.equal(songNoOgg.sourceOgg, null)
  })

  test('filters out invalid notes (non-finite tick values)', () => {
    SONGS_DB.forEach(song => {
      song.notes.forEach(note => {
        assert.ok(
          Number.isFinite(note.t),
          `Note tick should be finite in ${song.name}`
        )
      })
    })
  })

  test('handles invalid BPM by clamping to minimum 1', () => {
    const edgeSong = SONGS_DB.find(s => s.name === 'Edge Case')
    assert.ok(edgeSong, 'Edge Case fixture missing')
    assert.ok(edgeSong.bpm >= 1)
  })

  test('handles invalid TPB by clamping to minimum 1', () => {
    const edgeSong = SONGS_DB.find(s => s.name === 'Edge Case')
    assert.ok(edgeSong, 'Edge Case fixture missing')
    assert.ok(edgeSong.tpb >= 1)
  })

  test('clamps crowdAppeal to 1-10 range', () => {
    SONGS_DB.forEach(song => {
      assert.ok(
        song.crowdAppeal >= 1,
        `Song ${song.id} crowdAppeal should be >= 1`
      )
      assert.ok(
        song.crowdAppeal <= 10,
        `Song ${song.id} crowdAppeal should be <= 10`
      )
    })
  })

  test('validates song duration', () => {
    SONGS_DB.forEach(song => {
      assert.ok(
        Number.isInteger(song.duration),
        `Song ${song.id} duration should be an integer`
      )
      assert.ok(
        song.duration > 0,
        `Song ${song.id} duration should be positive`
      )
    })
  })

  test('validates song energy', () => {
    SONGS_DB.forEach(song => {
      assert.ok(
        typeof song.energy === 'object' && song.energy !== null,
        `Song ${song.id} energy should be an object`
      )
      assert.ok(
        Number.isFinite(song.energy.peak),
        `Song ${song.id} energy.peak should be a finite number`
      )
      assert.ok(
        song.energy.peak <= 100,
        `Song ${song.id} energy.peak should be <= 100`
      )
    })
  })

  test('validates song tempo fields', () => {
    SONGS_DB.forEach(song => {
      assert.ok(
        Number.isFinite(song.bpm) && song.bpm >= 1,
        `Song ${song.id} bpm should be at least 1`
      )
      assert.ok(
        Number.isFinite(song.tpb) && song.tpb >= 1,
        `Song ${song.id} tpb should be at least 1`
      )
    })
  })

  test('validates song notes', () => {
    SONGS_DB.forEach(song => {
      assert.ok(
        Array.isArray(song.notes),
        `Song ${song.id} notes should be an array`
      )
      song.notes.forEach((note, index) => {
        assert.ok(
          Number.isFinite(note.t),
          `Song ${song.id} note ${index} missing or invalid t`
        )
        assert.strictEqual(
          typeof note.lane,
          'string',
          `Song ${song.id} note ${index} missing or invalid lane`
        )
        assert.ok(
          Number.isFinite(note.p),
          `Song ${song.id} note ${index} missing or invalid p`
        )
        assert.ok(
          Number.isFinite(note.v),
          `Song ${song.id} note ${index} missing or invalid v`
        )
      })
    })
  })

  test('calculates staminaDrain based on difficulty', () => {
    SONGS_DB.forEach(song => {
      assert.ok(typeof song.staminaDrain === 'number')
      assert.ok(song.staminaDrain > 0)
    })
  })

  test('provides default tags if missing', () => {
    const edgeSong = SONGS_DB.find(s => s.name === 'Edge Case')
    assert.ok(edgeSong, 'Edge Case fixture missing')
    assert.ok(Array.isArray(edgeSong.tags))
    assert.ok(edgeSong.tags.includes('Metal'))
    assert.ok(edgeSong.tags.includes('Instrumental'))
  })

  test('preserves original notes array', () => {
    const song1 = SONGS_DB.find(s => s.name === 'Test Song 1')
    assert.equal(song1.notes.length, 2)
    assert.equal(song1.notes[0].t, 100)
    assert.equal(song1.notes[1].t, 200)
  })

  test('preserves tempoMap', () => {
    const song1 = SONGS_DB.find(s => s.name === 'Test Song 1')
    assert.ok(Array.isArray(song1.tempoMap))
    assert.equal(song1.tempoMap.length, 1)
  })

  test('includes sourceMid and sourceOgg fields', () => {
    const song1 = SONGS_DB.find(s => s.name === 'Test Song 1')
    assert.equal(song1.sourceMid, 'test1.mid')
    assert.equal(song1.sourceOgg, 'test1.ogg')
  })

  test('includes excerpt timing fields', () => {
    const song1 = SONGS_DB.find(s => s.name === 'Test Song 1')
    assert.equal(song1.excerptStartMs, 5000)
    assert.equal(song1.excerptEndMs, 35000)
    assert.equal(song1.excerptDurationMs, 30000)
  })

  test('calculates excerptDurationMs from durationMs if not provided', () => {
    const songNoExcerpt = SONGS_DB.find(s => s.name === 'Test Song 2')
    assert.ok(songNoExcerpt, 'Test Song 2 fixture missing')
    assert.equal(songNoExcerpt.excerptDurationMs, null)
  })

  test('handles array-like notes field that is not an array', () => {
    const edgeSong = SONGS_DB.find(s => s.name === 'Edge Case')
    assert.ok(edgeSong, 'Edge Case fixture missing')
    assert.ok(Array.isArray(edgeSong.notes))
    assert.equal(edgeSong.notes.length, 0)
  })

  test('creates energy curve from difficulty', () => {
    SONGS_DB.forEach(song => {
      assert.ok(song.energy)
      assert.ok(typeof song.energy.peak === 'number')
      assert.ok(song.energy.peak >= 60)
      assert.ok(song.energy.peak <= 100)
    })
  })

  test('name and title are both populated', () => {
    SONGS_DB.forEach(song => {
      assert.ok(song.name)
      assert.ok(song.title)
      assert.equal(song.name, song.title)
    })
  })

  test('calculates last note time correctly for duration', () => {
    const song1 = SONGS_DB.find(s => s.name === 'Test Song 1')
    // Last note at tick 200, tpb 480, bpm 120
    // duration in seconds = (200 / 480) * (60 / 120) = 0.208s
    // With 4s buffer, should be at least 4s
    assert.ok(song1.duration >= 4)
  })

  test('handles negative or zero difficulty gracefully', () => {
    SONGS_DB.forEach(song => {
      // Difficulty should be clamped to at least 1
      assert.ok(song.difficulty >= 1)
    })
  })

  test('leaderboardId is lowercase', () => {
    SONGS_DB.forEach(song => {
      assert.equal(song.leaderboardId, song.leaderboardId.toLowerCase())
    })
  })

  test('leaderboardId contains only allowed characters', () => {
    SONGS_DB.forEach(song => {
      assert.ok(
        /^[a-z0-9_-]+$/.test(song.leaderboardId),
        `leaderboardId "${song.leaderboardId}" should only contain a-z, 0-9, _, -`
      )
    })
  })

  test('leaderboardId max length is 64 characters', () => {
    SONGS_DB.forEach(song => {
      assert.ok(
        song.leaderboardId.length <= 64,
        `leaderboardId "${song.leaderboardId}" should be <= 64 chars`
      )
    })
  })
})
