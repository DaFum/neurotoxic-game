import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SONGS_DB, SONGS_BY_ID } from '../../src/data/songs'
import { NOTE_TAIL_MS } from '../../src/utils/audio/rhythmGameAudioUtils'

const SONG_TAIL_SECONDS = NOTE_TAIL_MS / 1000

describe('songs real dataset contracts', () => {
  it('exports SONGS_DB and SONGS_BY_ID with consistent cardinality', () => {
    assert.ok(Array.isArray(SONGS_DB))
    assert.ok(SONGS_DB.length > 0)
    assert.equal(SONGS_BY_ID.size, SONGS_DB.length)
  })

  it('contains unique ids and map entries point to the same objects', () => {
    const ids = SONGS_DB.map(song => song.id)
    assert.equal(new Set(ids).size, ids.length)

    SONGS_DB.forEach(song => {
      assert.equal(SONGS_BY_ID.get(song.id), song)
    })
  })

  it('maintains leaderboardId contract for API submissions', () => {
    SONGS_DB.forEach(song => {
      assert.ok(song.leaderboardId, `Missing leaderboardId for ${song.id}`)
      assert.ok(
        /^[a-z0-9_-]+$/.test(song.leaderboardId),
        `Invalid leaderboardId format for ${song.id}: ${song.leaderboardId}`
      )
      assert.equal(
        song.leaderboardId,
        song.leaderboardId.toLowerCase(),
        `leaderboardId must be lowercase for ${song.id}`
      )
      assert.ok(
        song.leaderboardId.length <= 64,
        `leaderboardId too long for ${song.id}`
      )
      assert.ok(
        !song.leaderboardId.includes('__'),
        `leaderboardId has consecutive underscores for ${song.id}`
      )
      assert.ok(
        !song.leaderboardId.startsWith('_'),
        `leaderboardId starts with underscore for ${song.id}`
      )
      assert.ok(
        !song.leaderboardId.endsWith('_'),
        `leaderboardId ends with underscore for ${song.id}`
      )
    })
  })

  it('keeps core scalar bounds and required fields valid', () => {
    SONGS_DB.forEach(song => {
      assert.ok(song.id, 'Song must have an id')
      assert.ok(song.name, `Missing name for ${song.id}`)
      assert.equal(song.title, song.name, `Title mismatch for ${song.id}`)

      assert.ok(
        Number.isInteger(song.duration) && song.duration > 0,
        `Invalid duration for ${song.id}`
      )
      assert.ok(
        Number.isFinite(song.bpm) && song.bpm >= 1,
        `Invalid bpm for ${song.id}`
      )
      assert.ok(
        Number.isFinite(song.tpb) && song.tpb >= 1,
        `Invalid tpb for ${song.id}`
      )
      assert.ok(
        Number.isFinite(song.difficulty),
        `Invalid difficulty for ${song.id}`
      )
      assert.ok(
        song.difficulty >= 1 && song.difficulty <= 7,
        `Difficulty out of bounds for ${song.id}`
      )
      assert.ok(
        Number.isFinite(song.crowdAppeal),
        `Invalid crowdAppeal for ${song.id}`
      )
      assert.ok(
        song.crowdAppeal >= 1 && song.crowdAppeal <= 10,
        `crowdAppeal out of bounds for ${song.id}`
      )
      assert.ok(
        Number.isFinite(song.staminaDrain) && song.staminaDrain > 0,
        `Invalid staminaDrain for ${song.id}`
      )
      assert.ok(song.notePattern, `Missing notePattern for ${song.id}`)
      assert.ok(song.sourceMid, `Missing sourceMid for ${song.id}`)
    })
  })

  it('keeps structured fields shape-safe for runtime consumers', () => {
    const validIntensities = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME']

    SONGS_DB.forEach(song => {
      assert.ok(
        validIntensities.includes(song.intensity),
        `Invalid intensity for ${song.id}: ${song.intensity}`
      )
      assert.ok(
        Array.isArray(song.tags) && song.tags.length > 0,
        `Invalid tags for ${song.id}`
      )
      assert.ok(Array.isArray(song.notes), `Invalid notes array for ${song.id}`)
      assert.ok(Array.isArray(song.tempoMap), `Invalid tempoMap for ${song.id}`)

      assert.ok(song.energy, `Missing energy object for ${song.id}`)
      assert.ok(
        Number.isFinite(song.energy.peak),
        `Invalid energy peak for ${song.id}`
      )
      assert.ok(
        song.energy.peak > 0 && song.energy.peak <= 100,
        `Energy peak out of bounds for ${song.id}`
      )

      song.notes.forEach(note => {
        assert.ok(Number.isFinite(note.t), `Invalid note tick for ${song.id}`)
      })
    })
  })

  it('maps intensity consistently from difficulty in production data', () => {
    SONGS_DB.forEach(song => {
      if (song.difficulty <= 2) {
        assert.equal(
          song.intensity,
          'LOW',
          `Expected LOW intensity for ${song.id}`
        )
      } else if (song.difficulty === 3) {
        assert.equal(
          song.intensity,
          'MEDIUM',
          `Expected MEDIUM intensity for ${song.id}`
        )
      } else if (song.difficulty <= 5) {
        assert.equal(
          song.intensity,
          'HIGH',
          `Expected HIGH intensity for ${song.id}`
        )
      } else {
        assert.equal(
          song.intensity,
          'EXTREME',
          `Expected EXTREME intensity for ${song.id}`
        )
      }
    })
  })

  it('ensures duration can cover the final note timestamp', () => {
    SONGS_DB.forEach(song => {
      if (song.notes.length === 0) return

      const lastNote = song.notes.reduce((maxNote, note) =>
        note.t > maxNote.t ? note : maxNote
      )
      const lastNoteTimeSeconds = (lastNote.t / song.tpb) * (60 / song.bpm)
      assert.ok(
        song.duration >= Math.ceil(lastNoteTimeSeconds + SONG_TAIL_SECONDS),
        `Duration ${song.duration}s too short for last note+tail at ${lastNoteTimeSeconds + SONG_TAIL_SECONDS}s in ${song.id}`
      )
    })
  })
})
