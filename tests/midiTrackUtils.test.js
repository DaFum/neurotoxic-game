import assert from 'node:assert'
import { test } from 'node:test'
import {
  isPercussionTrack,
  isValidMidiNote,
  buildMidiTrackEvents,
  normalizeMidiPitch,
  getNoteName
} from '../src/utils/audio/midiUtils.js'

test('isPercussionTrack', async t => {
  await t.test('detects percussion instrument metadata', () => {
    assert.strictEqual(
      isPercussionTrack({ instrument: { percussion: true } }),
      true
    )
  })

  await t.test('detects channel 9 percussion tracks', () => {
    assert.strictEqual(isPercussionTrack({ channel: 9 }), true)
  })

  await t.test('returns false for non-percussion tracks', () => {
    assert.strictEqual(isPercussionTrack({ channel: 2 }), false)
    assert.strictEqual(isPercussionTrack(null), false)
  })
})

test('isValidMidiNote', async t => {
  await t.test('accepts finite MIDI pitches', () => {
    assert.strictEqual(isValidMidiNote({ midi: 64 }), true)
    assert.strictEqual(isValidMidiNote({ midi: '60' }), true)
  })

  await t.test('rejects invalid MIDI pitches', () => {
    assert.strictEqual(isValidMidiNote({ midi: Number.NaN }), false)
    assert.strictEqual(isValidMidiNote({}), false)
    assert.strictEqual(isValidMidiNote(null), false)
    assert.strictEqual(isValidMidiNote({ midi: 140 }), false)
  })
})

test('normalizeMidiPitch', async t => {
  await t.test('normalizes valid MIDI pitches', () => {
    assert.strictEqual(normalizeMidiPitch({ midi: 0 }), 0)
    assert.strictEqual(normalizeMidiPitch({ midi: '127' }), 127)
  })

  await t.test('returns null for invalid MIDI pitches', () => {
    assert.strictEqual(normalizeMidiPitch({ midi: -1 }), null)
    assert.strictEqual(normalizeMidiPitch({ midi: 200 }), null)
    assert.strictEqual(normalizeMidiPitch({ midi: Number.NaN }), null)
    assert.strictEqual(normalizeMidiPitch({}), null)
  })
})

test('buildMidiTrackEvents', async t => {
  await t.test('filters invalid notes and normalizes pitches', () => {
    const events = buildMidiTrackEvents(
      [
        { time: 0, midi: 60, duration: 0.5, velocity: 0.8 },
        { time: -1, midi: 60 },
        { time: 1.2, midi: 140 }
      ],
      false
    )

    assert.deepStrictEqual(events, [
      {
        time: 0,
        midiPitch: 60,
        duration: 0.5,
        velocity: 0.8,
        percussionTrack: false
      }
    ])
  })

  await t.test('returns empty array for invalid input', () => {
    assert.deepStrictEqual(buildMidiTrackEvents(null, true), [])
  })
})

test('getNoteName', async t => {
  await t.test('returns correct note names for valid MIDI pitches', () => {
    assert.strictEqual(getNoteName(0), 'C-1')
    assert.strictEqual(getNoteName(12), 'C0')
    assert.strictEqual(getNoteName(60), 'C4')
    assert.strictEqual(getNoteName(69), 'A4')
    assert.strictEqual(getNoteName(127), 'G9')
  })

  await t.test('returns null for invalid MIDI pitches', () => {
    assert.strictEqual(getNoteName(-1), null)
    assert.strictEqual(getNoteName(128), null)
    assert.strictEqual(getNoteName(Number.NaN), null)
    assert.strictEqual(getNoteName(null), null)
    assert.strictEqual(getNoteName(undefined), null)
  })

  await t.test('handles float inputs by flooring', () => {
    assert.strictEqual(getNoteName(60.5), 'C4')
    assert.strictEqual(getNoteName(69.9), 'A4')
  })
})
