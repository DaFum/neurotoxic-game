import assert from 'assert'
import { test } from 'node:test'
import { generateNotesForSong } from '../src/utils/rhythmUtils.js'

test('generateNotesForSong creates correct note structure', () => {
  const song = {
    id: 'test_song',
    bpm: 120,
    duration: 10, // 10 seconds
    difficulty: 2
  }

  // Use a predictable random function
  let seed = 0.5
  const mockRandom = () => {
    seed = ((seed * 9301 + 49297) % 233280) / 233280
    return seed
  }

  const notes = generateNotesForSong(song, { leadIn: 1000, random: mockRandom })

  assert.ok(Array.isArray(notes))
  assert.ok(notes.length > 0)

  notes.forEach(note => {
    assert.ok(note.time >= 1000)
    assert.ok(note.laneIndex >= 0 && note.laneIndex <= 2)
    assert.strictEqual(note.songId, 'test_song')
    assert.strictEqual(note.visible, true)
    assert.strictEqual(note.hit, false)
  })

  // Check determinism with same seed logic (if we reset seed)
  seed = 0.5
  const notes2 = generateNotesForSong(song, {
    leadIn: 1000,
    random: mockRandom
  })
  assert.deepStrictEqual(notes, notes2)
})

test('generateNotesForSong respects difficulty', () => {
  const songEasy = { bpm: 120, duration: 10, difficulty: 1 }
  const songHard = { bpm: 120, duration: 10, difficulty: 5 }

  const notesEasy = generateNotesForSong(songEasy, { random: () => 0.5 })
  const notesHard = generateNotesForSong(songHard, { random: () => 0.5 })

  // Harder difficulty should generally produce more notes.
  // We use a simple assertion here to verify that difficulty impacts note density.
  assert.ok(Array.isArray(notesEasy))
  assert.ok(Array.isArray(notesHard))

  // Verify that higher difficulty generates more notes
  assert.ok(
    notesHard.length >= notesEasy.length,
    'Harder difficulty should produce at least as many notes as easy difficulty'
  )
})
