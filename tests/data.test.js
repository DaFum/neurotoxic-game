import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHARACTERS } from '../src/data/characters.js'
import { SONGS_DB } from '../src/data/songs.js'

import { ALL_VENUES } from '../src/data/venues.js'
// Chatter might be a simple export
// import { CHATTER_DB } from '../src/data/chatter.js';
// Let's check chatter.js content first or just try importing default/named.

test('CHARACTERS data integrity', () => {
  assert.ok(CHARACTERS.MATZE)
  assert.ok(CHARACTERS.MARIUS)
  assert.ok(CHARACTERS.LARS)

  Object.values(CHARACTERS).forEach(char => {
    assert.strictEqual(typeof char.name, 'string')
    assert.strictEqual(typeof char.role, 'string')
    // Add more schema checks as needed
  })
})

test('SONGS_DB data integrity', () => {
  assert.ok(Array.isArray(SONGS_DB))
  SONGS_DB.forEach(song => {
    assert.strictEqual(typeof song.id, 'string')
    assert.strictEqual(typeof song.name, 'string')
    assert.strictEqual(typeof song.bpm, 'number')
    assert.strictEqual(typeof song.duration, 'number')
    assert.strictEqual(typeof song.difficulty, 'number')
    assert.ok(song.energy, 'Song should have energy profile')
    // sourceOgg must be a string or null, never undefined
    assert.ok(
      typeof song.sourceOgg === 'string' || song.sourceOgg === null,
      `Song "${song.name}" sourceOgg should be a string or null, got ${typeof song.sourceOgg}`
    )
    if (typeof song.sourceOgg === 'string') {
      assert.ok(
        song.sourceOgg.endsWith('.ogg'),
        `Song "${song.name}" sourceOgg should end with .ogg`
      )
    }
    if (song.excerptDurationMs !== null) {
      assert.strictEqual(
        typeof song.excerptDurationMs,
        'number',
        `Song "${song.name}" excerptDurationMs should be number or null`
      )
    }
  })
})

test('SONGS_DB sourceOgg field', () => {
  const songsWithMidi = SONGS_DB.filter(s => s.sourceMid)
  assert.ok(songsWithMidi.length > 0, 'Should have songs with sourceMid')

  songsWithMidi.forEach(song => {
    assert.ok(
      typeof song.sourceOgg === 'string',
      `Song "${song.name}" with sourceMid should have a sourceOgg string`
    )
    assert.ok(
      song.sourceOgg.endsWith('.ogg'),
      `Song "${song.name}" sourceOgg should end with .ogg`
    )
    // sourceOgg basename (minus ext) should match sourceMid basename (minus ext)
    const oggBase = song.sourceOgg.replace(/\.ogg$/i, '')
    const midBase = song.sourceMid.replace(/\.mid$/i, '')
    assert.strictEqual(
      oggBase,
      midBase,
      `Song "${song.name}" sourceOgg and sourceMid basenames should match`
    )
  })

  // Songs without sourceMid should have sourceOgg as null
  const songsWithoutMidi = SONGS_DB.filter(s => !s.sourceMid)
  songsWithoutMidi.forEach(song => {
    assert.strictEqual(
      song.sourceOgg,
      null,
      `Song "${song.name}" without sourceMid should have sourceOgg = null`
    )
  })
})



test('ALL_VENUES data integrity', () => {
  assert.ok(Array.isArray(ALL_VENUES))
  ALL_VENUES.forEach(venue => {
    assert.strictEqual(typeof venue.id, 'string')
    assert.strictEqual(typeof venue.name, 'string')
    assert.strictEqual(typeof venue.x, 'number')
    assert.strictEqual(typeof venue.y, 'number')
  })
})
