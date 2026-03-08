import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SONGS_DB } from '../src/data/songs.js'

test('SONGS_DB is a non-empty array', () => {
  assert.ok(Array.isArray(SONGS_DB), 'SONGS_DB should be an array')
  assert.ok(SONGS_DB.length > 0, 'SONGS_DB should not be empty')
})

test('Every song in SONGS_DB has the correct structure and valid derived fields', () => {
  const intensities = ['EXTREME', 'HIGH', 'MEDIUM', 'LOW']

  SONGS_DB.forEach(song => {
    // 1. Required fields existence
    const requiredFields = [
      'id', 'leaderboardId', 'name', 'title', 'duration', 'difficulty',
      'intensity', 'bpm', 'tags', 'notePattern', 'crowdAppeal',
      'staminaDrain', 'energy', 'notes', 'tempoMap', 'tpb', 'sourceMid'
    ]
    requiredFields.forEach(field => {
      assert.ok(Object.hasOwn(song, field), `Song ${song.id} is missing field: ${field}`)
    })

    // 2. leaderboardId validation
    assert.match(song.leaderboardId, /^[a-z0-9_-]+$/, `Song ${song.id} leaderboardId contains invalid characters: ${song.leaderboardId}`)
    assert.ok(song.leaderboardId.length <= 64, `Song ${song.id} leaderboardId too long: ${song.leaderboardId.length}`)
    assert.strictEqual(song.leaderboardId, song.leaderboardId.toLowerCase(), `Song ${song.id} leaderboardId should be lowercase`)
    assert.ok(!song.leaderboardId.startsWith('_') && !song.leaderboardId.endsWith('_'), `Song ${song.id} leaderboardId should not start or end with underscores`)

    // 3. difficulty validation (clamped 1-7)
    assert.ok(Number.isInteger(song.difficulty), `Song ${song.id} difficulty should be an integer`)
    assert.ok(song.difficulty >= 1 && song.difficulty <= 7, `Song ${song.id} difficulty out of range: ${song.difficulty}`)

    // 4. intensity validation
    assert.ok(intensities.includes(song.intensity), `Song ${song.id} has invalid intensity: ${song.intensity}`)
    // Check mapping logic: >5: EXTREME, >3: HIGH, >2: MEDIUM, else LOW
    if (song.difficulty > 5) {
      assert.strictEqual(song.intensity, 'EXTREME', `Song ${song.id} with difficulty ${song.difficulty} should be EXTREME`)
    } else if (song.difficulty > 3) {
      assert.strictEqual(song.intensity, 'HIGH', `Song ${song.id} with difficulty ${song.difficulty} should be HIGH`)
    } else if (song.difficulty > 2) {
      assert.strictEqual(song.intensity, 'MEDIUM', `Song ${song.id} with difficulty ${song.difficulty} should be MEDIUM`)
    } else {
      assert.strictEqual(song.intensity, 'LOW', `Song ${song.id} with difficulty ${song.difficulty} should be LOW`)
    }

    // 5. crowdAppeal validation (clamped 1-10)
    assert.ok(song.crowdAppeal >= 1 && song.crowdAppeal <= 10, `Song ${song.id} crowdAppeal out of range: ${song.crowdAppeal}`)

    // 6. duration validation (positive integer)
    assert.ok(Number.isInteger(song.duration), `Song ${song.id} duration should be an integer`)
    assert.ok(song.duration > 0, `Song ${song.id} duration should be positive`)

    // 7. energy validation
    assert.ok(typeof song.energy === 'object' && song.energy !== null, `Song ${song.id} energy should be an object`)
    assert.ok(song.energy.peak <= 100, `Song ${song.id} energy.peak should be <= 100`)

    // 8. bpm and tpb validation
    assert.ok(song.bpm >= 1, `Song ${song.id} bpm should be at least 1`)
    assert.ok(song.tpb >= 1, `Song ${song.id} tpb should be at least 1`)

    // 9. notes validation
    assert.ok(Array.isArray(song.notes), `Song ${song.id} notes should be an array`)
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

test('All song IDs and leaderboardIds are unique', () => {
  const ids = SONGS_DB.map(s => s.id)
  const leaderboardIds = SONGS_DB.map(s => s.leaderboardId)

  const uniqueIds = new Set(ids)
  const uniqueLeaderboardIds = new Set(leaderboardIds)

  assert.strictEqual(uniqueIds.size, ids.length, 'Duplicate song IDs found')
  assert.strictEqual(uniqueLeaderboardIds.size, leaderboardIds.length, 'Duplicate leaderboardIds found')
})
