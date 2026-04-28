import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { SONGS_DB, SONGS_BY_ID } from '../../src/data/songs'

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
      assert.ok(song.leaderboardId)
      assert.ok(/^[a-z0-9_-]+$/.test(song.leaderboardId))
      assert.equal(song.leaderboardId, song.leaderboardId.toLowerCase())
      assert.ok(song.leaderboardId.length <= 64)
      assert.ok(!song.leaderboardId.includes('__'))
      assert.ok(!song.leaderboardId.startsWith('_'))
      assert.ok(!song.leaderboardId.endsWith('_'))
    })
  })

  it('keeps core scalar bounds and required fields valid', () => {
    SONGS_DB.forEach(song => {
      assert.ok(song.id)
      assert.ok(song.name)
      assert.equal(song.title, song.name)

      assert.ok(Number.isInteger(song.duration) && song.duration > 0)
      assert.ok(Number.isFinite(song.bpm) && song.bpm >= 1)
      assert.ok(Number.isFinite(song.tpb) && song.tpb >= 1)
      assert.ok(Number.isFinite(song.difficulty))
      assert.ok(song.difficulty >= 1 && song.difficulty <= 7)
      assert.ok(Number.isFinite(song.crowdAppeal))
      assert.ok(song.crowdAppeal >= 1 && song.crowdAppeal <= 10)
      assert.ok(Number.isFinite(song.staminaDrain) && song.staminaDrain > 0)
      assert.ok(song.notePattern)
      assert.ok(song.sourceMid)
    })
  })

  it('keeps structured fields shape-safe for runtime consumers', () => {
    const validIntensities = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME']

    SONGS_DB.forEach(song => {
      assert.ok(validIntensities.includes(song.intensity))
      assert.ok(Array.isArray(song.tags) && song.tags.length > 0)
      assert.ok(Array.isArray(song.notes))
      assert.ok(Array.isArray(song.tempoMap))

      assert.ok(song.energy)
      assert.ok(Number.isFinite(song.energy.peak))
      assert.ok(song.energy.peak > 0 && song.energy.peak <= 100)

      song.notes.forEach(note => {
        assert.ok(Number.isFinite(note.t))
      })
    })
  })

  it('ensures duration can cover the final note timestamp', () => {
    SONGS_DB.forEach(song => {
      if (song.notes.length === 0) return

      const lastNote = song.notes.reduce((maxNote, note) =>
        note.t > maxNote.t ? note : maxNote
      )
      const lastNoteTimeSeconds = (lastNote.t / song.tpb) * (60 / song.bpm)
      assert.ok(song.duration >= Math.floor(lastNoteTimeSeconds))
    })
  })
})
