import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SONGS_DB } from '../src/data/songs.js'

describe('songs.js - SONGS_DB structure', () => {
  describe('SONGS_DB transformation', () => {
    it('exports SONGS_DB as an array', () => {
      assert.ok(Array.isArray(SONGS_DB))
      assert.ok(SONGS_DB.length > 0)
    })

    it('all songs have required ID field', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.id, 'Song must have id')
        assert.strictEqual(typeof song.id, 'string')
      })
    })
  })

  describe('leaderboardId generation', () => {
    it('generates valid API-safe leaderboardId for all songs', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.leaderboardId, 'Song must have leaderboardId')
        assert.ok(
          /^[a-z0-9_-]+$/.test(song.leaderboardId),
          `leaderboardId "${song.leaderboardId}" contains invalid characters`
        )
      })
    })

    it('leaderboardId is lowercase', () => {
      SONGS_DB.forEach(song => {
        assert.strictEqual(
          song.leaderboardId,
          song.leaderboardId.toLowerCase(),
          `leaderboardId should be lowercase: ${song.leaderboardId}`
        )
      })
    })

    it('limits leaderboardId to 64 characters', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          song.leaderboardId.length <= 64,
          `leaderboardId too long (${song.leaderboardId.length}): ${song.leaderboardId}`
        )
      })
    })

    it('no consecutive underscores in leaderboardId', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          !song.leaderboardId.includes('__'),
          `leaderboardId has consecutive underscores: ${song.leaderboardId}`
        )
      })
    })

    it('no leading or trailing underscores', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          !song.leaderboardId.startsWith('_'),
          `leaderboardId starts with underscore: ${song.leaderboardId}`
        )
        assert.ok(
          !song.leaderboardId.endsWith('_'),
          `leaderboardId ends with underscore: ${song.leaderboardId}`
        )
      })
    })
  })

  describe('difficulty and intensity mapping', () => {
    it('clamps difficulty to 1-7 range', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          song.difficulty >= 1,
          `Difficulty too low: ${song.difficulty}`
        )
        assert.ok(
          song.difficulty <= 7,
          `Difficulty too high: ${song.difficulty}`
        )
      })
    })

    it('intensity is one of valid values', () => {
      const validIntensities = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME']
      SONGS_DB.forEach(song => {
        assert.ok(
          validIntensities.includes(song.intensity),
          `Invalid intensity: ${song.intensity}`
        )
      })
    })

    it('intensity matches difficulty level', () => {
      SONGS_DB.forEach(song => {
        if (song.difficulty <= 2) {
          assert.strictEqual(song.intensity, 'LOW')
        } else if (song.difficulty === 3) {
          assert.strictEqual(song.intensity, 'MEDIUM')
        } else if (song.difficulty <= 5) {
          assert.strictEqual(song.intensity, 'HIGH')
        } else {
          assert.strictEqual(song.intensity, 'EXTREME')
        }
      })
    })
  })

  describe('field mapping and defaults', () => {
    it('all songs have name field', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.name, 'Song must have name')
        assert.strictEqual(typeof song.name, 'string')
      })
    })

    it('all songs have title alias matching name', () => {
      SONGS_DB.forEach(song => {
        assert.strictEqual(song.title, song.name)
      })
    })

    it('bpm is at least 1', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.bpm >= 1, `BPM too low: ${song.bpm}`)
      })
    })

    it('tpb is at least 1', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.tpb >= 1, `TPB too low: ${song.tpb}`)
      })
    })

    it('tags is an array', () => {
      SONGS_DB.forEach(song => {
        assert.ok(Array.isArray(song.tags), 'Tags must be an array')
        assert.ok(song.tags.length > 0, 'Tags array must not be empty')
      })
    })

    it('notePattern has a value', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.notePattern, 'Song must have notePattern')
      })
    })

    it('crowdAppeal is clamped to 1-10', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          song.crowdAppeal >= 1,
          `crowdAppeal too low: ${song.crowdAppeal}`
        )
        assert.ok(
          song.crowdAppeal <= 10,
          `crowdAppeal too high: ${song.crowdAppeal}`
        )
      })
    })

    it('staminaDrain is a positive number', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          Number.isFinite(song.staminaDrain),
          'staminaDrain must be a number'
        )
        assert.ok(song.staminaDrain > 0, 'staminaDrain must be positive')
      })
    })
  })

  describe('raw data preservation', () => {
    it('notes is an array', () => {
      SONGS_DB.forEach(song => {
        assert.ok(Array.isArray(song.notes), 'Notes must be an array')
      })
    })

    it('all notes have valid tick values', () => {
      SONGS_DB.forEach(song => {
        song.notes.forEach((note, idx) => {
          assert.ok(
            Number.isFinite(note.t),
            `Note ${idx} in ${song.id} has invalid tick: ${note.t}`
          )
        })
      })
    })

    it('tempoMap is an array', () => {
      SONGS_DB.forEach(song => {
        assert.ok(Array.isArray(song.tempoMap), 'tempoMap must be an array')
      })
    })

    it('sourceMid is present', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.sourceMid, 'Song must have sourceMid')
      })
    })

    it('excerptStartMs defaults to 0 if not provided', () => {
      SONGS_DB.forEach(song => {
        assert.ok(Number.isFinite(song.excerptStartMs))
      })
    })
  })

  describe('energy curve', () => {
    it('energy object exists', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.energy, 'Song must have energy object')
        assert.ok('peak' in song.energy, 'Energy must have peak property')
      })
    })

    it('energy peak is clamped to maximum of 100', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          song.energy.peak <= 100,
          `Energy peak too high: ${song.energy.peak}`
        )
        assert.ok(
          song.energy.peak > 0,
          `Energy peak too low: ${song.energy.peak}`
        )
      })
    })
  })

  describe('data consistency', () => {
    it('all song IDs are unique', () => {
      const ids = SONGS_DB.map(s => s.id)
      const uniqueIds = new Set(ids)
      assert.strictEqual(uniqueIds.size, ids.length, 'Song IDs must be unique')
    })

    it('all songs have required fields', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.id, 'Missing id')
        assert.ok(song.leaderboardId, 'Missing leaderboardId')
        assert.ok(song.name, 'Missing name')
        assert.ok(song.title, 'Missing title')
        assert.ok(Number.isFinite(song.duration), 'Missing duration')
        assert.ok(Number.isFinite(song.difficulty), 'Missing difficulty')
        assert.ok(song.intensity, 'Missing intensity')
        assert.ok(Number.isFinite(song.bpm), 'Missing bpm')
        assert.ok(Array.isArray(song.tags), 'Missing tags')
        assert.ok(song.notePattern, 'Missing notePattern')
        assert.ok(Number.isFinite(song.crowdAppeal), 'Missing crowdAppeal')
        assert.ok(Number.isFinite(song.staminaDrain), 'Missing staminaDrain')
        assert.ok(song.energy, 'Missing energy')
        assert.ok(Array.isArray(song.notes), 'Missing notes')
        assert.ok(Array.isArray(song.tempoMap), 'Missing tempoMap')
        assert.ok(Number.isFinite(song.tpb), 'Missing tpb')
        assert.ok(song.sourceMid, 'Missing sourceMid')
      })
    })

    it('all durations are positive', () => {
      SONGS_DB.forEach(song => {
        assert.ok(
          song.duration > 0,
          `Duration must be positive: ${song.duration}`
        )
      })
    })

    it('all BPM values are positive', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.bpm > 0, `BPM must be positive: ${song.bpm}`)
      })
    })

    it('all TPB values are positive', () => {
      SONGS_DB.forEach(song => {
        assert.ok(song.tpb > 0, `TPB must be positive: ${song.tpb}`)
      })
    })
  })

  describe('duration calculation', () => {
    it('duration includes buffer time', () => {
      // Duration should be calculated from last note + 4s buffer
      SONGS_DB.forEach(song => {
        if (song.notes.length > 0) {
          // Find last note
          const lastNote = song.notes.reduce((max, note) =>
            note.t > max.t ? note : max
          )
          // Calculate minimum expected duration
          // lastNoteTime = (lastNote.t / song.tpb) * (60 / song.bpm)
          const lastNoteTime = (lastNote.t / song.tpb) * (60 / song.bpm)
          // Duration should be at least lastNoteTime (with buffer already added)
          assert.ok(
            song.duration >= Math.floor(lastNoteTime),
            `Duration ${song.duration}s seems too short for last note at ${lastNoteTime}s in ${song.id}`
          )
        }
      })
    })
  })
})
