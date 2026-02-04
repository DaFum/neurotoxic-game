import assert from 'assert'
import { test } from 'node:test'
import { parseSongNotes, calculateTimeFromTicks } from '../src/utils/rhythmUtils.js'
import songsData from '../src/assets/rhythm_songs.json' with { type: 'json' }

test('rhythm_songs.json integration', async (t) => {
  await t.test('all songs can be parsed without error', () => {
    // The JSON is an object with song IDs as keys
    const songsArray = Object.values(songsData)

    // We iterate over the REAL data file to ensure no crashes
    songsArray.forEach(song => {
      // Mock the structure if needed, but the file is imported directly.
      // We need to ensure the structure matches what parseSongNotes expects.

      // parseSongNotes applies a 1-in-4 filter.
      // We just want to make sure it doesn't throw.
      try {
        // Mock ID if missing in raw object (logic usually adds it)
        if (!song.id) song.id = song.name

        const notes = parseSongNotes(song)
        assert.ok(Array.isArray(notes), `Song ${song.name} produced invalid notes array`)

        // Verify notes have correct type
        if (notes.length > 0) {
            assert.strictEqual(notes[0].type, 'note', `Song ${song.name} notes missing type`)
            assert.ok(typeof notes[0].time === 'number', `Song ${song.name} notes missing time`)
        }
      } catch (e) {
        assert.fail(`Song ${song.name} failed to parse: ${e.message}`)
      }
    })
  })
})

test('calculateTimeFromTicks logic', async (t) => {
  await t.test('calculates correct time with constant tempo', () => {
    const tempoMap = [{ tick: 0, usPerBeat: 500000 }] // 120 BPM
    const tpb = 480

    // 1 beat = 480 ticks = 0.5s = 500ms
    const ms = calculateTimeFromTicks(480, tpb, tempoMap, 'ms')
    assert.strictEqual(Math.round(ms), 500)

    const ms2 = calculateTimeFromTicks(960, tpb, tempoMap, 'ms')
    assert.strictEqual(Math.round(ms2), 1000)
  })

  await t.test('calculates correct time with tempo change', () => {
    const tempoMap = [
      { tick: 0, usPerBeat: 500000 },    // 120 BPM (0 - 480 ticks)
      { tick: 480, usPerBeat: 1000000 }  // 60 BPM (480+ ticks)
    ]
    const tpb = 480

    // First 480 ticks = 500ms
    // Next 480 ticks = 1000ms
    // Total for 960 ticks should be 1500ms

    const ms = calculateTimeFromTicks(960, tpb, tempoMap, 'ms')
    assert.strictEqual(Math.round(ms), 1500)
  })

  await t.test('handles empty map gracefully', () => {
      const ms = calculateTimeFromTicks(100, 480, [], 'ms')
      assert.strictEqual(ms, 0)
  })
})
