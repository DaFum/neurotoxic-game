import assert from 'node:assert'
import { test } from 'node:test'
import {
  isPercussionTrack,
  isValidMidiNote,
  buildMidiTrackEvents,
  normalizeMidiPitch
} from '../src/utils/midiTrackUtils.js'

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
