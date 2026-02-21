import { test, describe } from 'node:test'
import assert from 'node:assert'
import {
  checkHit,
  calculateTimeFromTicks,
  preprocessTempoMap,
  parseSongNotes
} from '../src/utils/rhythmUtils.js'

describe('rhythmUtils', () => {
  describe('checkHit', () => {
    const hitWindow = 50
    const noteTime = 1000
    // Create a standard note object for testing
    const createNote = (time, laneIndex = 0) => ({
      time,
      laneIndex,
      visible: true,
      hit: false,
      type: 'note',
      id: `note-${time}`
    })

    const notes = [createNote(noteTime)]

    test('should return note for exact hit', () => {
      const result = checkHit(notes, 0, noteTime, hitWindow)
      assert.ok(result, 'Should find note at exact time')
      assert.strictEqual(result.time, noteTime)
    })

    test('should return note for hit just inside start boundary (inclusive/exclusive check)', () => {
      // The condition is Math.abs(diff) < hitWindow
      // So diff must be strictly less than hitWindow.
      // effective window: (noteTime - hitWindow, noteTime + hitWindow)

      const elapsed = noteTime - hitWindow + 0.001
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.ok(
        result,
        `Should find note inside start boundary (diff: ${Math.abs(elapsed - noteTime)})`
      )
    })

    test('should return note for hit just inside end boundary', () => {
      const elapsed = noteTime + hitWindow - 0.001
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.ok(
        result,
        `Should find note inside end boundary (diff: ${Math.abs(elapsed - noteTime)})`
      )
    })

    test('should return null for hit exactly at start boundary (exclusive)', () => {
      // diff = hitWindow. hitWindow < hitWindow is false.
      const elapsed = noteTime - hitWindow
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(
        result,
        null,
        'Should not find note exactly at start boundary'
      )
    })

    test('should return null for hit exactly at end boundary (exclusive)', () => {
      // diff = hitWindow. hitWindow < hitWindow is false.
      const elapsed = noteTime + hitWindow
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(
        result,
        null,
        'Should not find note exactly at end boundary'
      )
    })

    test('should return null for hit outside start boundary', () => {
      const elapsed = noteTime - hitWindow - 0.001
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(
        result,
        null,
        'Should not find note outside start boundary'
      )
    })

    test('should return null for hit outside end boundary', () => {
      const elapsed = noteTime + hitWindow + 0.001
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(
        result,
        null,
        'Should not find note outside end boundary'
      )
    })

    test('should respect lane index', () => {
      const result = checkHit(notes, 1, noteTime, hitWindow)
      assert.strictEqual(result, null, 'Should not match wrong lane')
    })

    test('should ignore invisible notes', () => {
      const invisibleNote = { ...createNote(noteTime), visible: false }
      const result = checkHit([invisibleNote], 0, noteTime, hitWindow)
      assert.strictEqual(result, null, 'Should ignore invisible notes')
    })

    test('should ignore already hit notes', () => {
      const hitNote = { ...createNote(noteTime), hit: true }
      const result = checkHit([hitNote], 0, noteTime, hitWindow)
      assert.strictEqual(result, null, 'Should ignore already hit notes')
    })

    test('should handle floating point precision robustly', () => {
      // e.g. 1/3
      const oddTime = 1000.3333333333333
      const oddElapsed = 1000.3333333333334
      const notesOdd = [createNote(oddTime)]
      const result = checkHit(notesOdd, 0, oddElapsed, hitWindow)
      assert.ok(result)
    })

    test('should return null if elapsed is not finite', () => {
      const result = checkHit(notes, 0, Infinity, hitWindow)
      assert.strictEqual(result, null)
      const result2 = checkHit(notes, 0, NaN, hitWindow)
      assert.strictEqual(result2, null)
    })
  })

  describe('calculateTimeFromTicks', () => {
    const tpb = 480
    const tempoMap = [
      { tick: 0, usPerBeat: 500000 }, // 120 BPM
      { tick: 480, usPerBeat: 250000 } // 240 BPM at beat 1
    ]

    test('should handle empty tempo map', () => {
      assert.strictEqual(calculateTimeFromTicks(100, tpb, [], 'ms'), 0)
    })

    test('should calculate time for initial segment (ms)', () => {
      // 240 ticks = 0.5 beats. 120 BPM = 500ms/beat. So 250ms.
      const time = calculateTimeFromTicks(240, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 250) < 0.0001, `Expected 250, got ${time}`)
    })

    test('should calculate time crossing segments (ms)', () => {
      // 480 ticks = 1 beat @ 120 BPM = 500ms
      // + 240 ticks = 0.5 beats @ 240 BPM = 250ms/beat * 0.5 = 125ms
      // Total 625ms
      const time = calculateTimeFromTicks(720, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 625) < 0.0001, `Expected 625, got ${time}`)
    })

    test('should calculate time crossing segments (seconds)', () => {
      // Total 625ms = 0.625s
      const time = calculateTimeFromTicks(720, tpb, tempoMap, 's')
      assert.ok(Math.abs(time - 0.625) < 0.0001, `Expected 0.625, got ${time}`)
    })

    test('should handle ticks exactly on segment boundary', () => {
      // 480 ticks = 500ms
      const time = calculateTimeFromTicks(480, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 500) < 0.0001, `Expected 500, got ${time}`)
    })

    test('should handle ticks beyond last segment', () => {
      // 960 ticks = 480 (1st) + 480 (2nd)
      // 1st: 500ms. 2nd: 250ms/beat * 1 beat = 250ms.
      // Total 750ms.
      const time = calculateTimeFromTicks(960, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 750) < 0.0001, `Expected 750, got ${time}`)
    })
  })



  describe('parseSongNotes excerpt alignment', () => {
    // Notes in rhythm_songs.json are pre-extracted from the excerpt window:
    // tick 0 in the note array corresponds to the start of the excerpt, NOT
    // the start of the full MIDI file. excerptStartMs is therefore NOT
    // subtracted from calculated note times — it only tells the audio engine
    // where to seek in the OGG buffer. excerptDurationMs still caps notes so
    // we don't schedule anything past the end of the playback window.

    test('uses note tick times directly without subtracting excerptStartMs', () => {
      // All notes are relative to excerpt start (tick 0 = excerpt start).
      // excerptStartMs is for OGG seek only and must not shift note times.
      const song = {
        id: 'excerpt-test',
        bpm: 120,
        tpb: 480,
        excerptStartMs: 36000, // Large value — must NOT shift note times
        excerptDurationMs: 1200,
        notes: [
          { t: 0, lane: 'guitar' },   // 0 ms   — index 0 (kept by 1-in-4)
          { t: 240, lane: 'guitar' }, // 250 ms  — index 1
          { t: 480, lane: 'guitar' }, // 500 ms  — index 2
          { t: 960, lane: 'guitar' }, // 1000 ms — index 3
          { t: 1920, lane: 'drums' }  // 2000 ms — index 4 (> 1200 ms cap → excluded)
        ]
      }

      // 1-in-4 filter keeps indices 0 and 4.
      // index 0 → 0 ms   < 1200 ms cap → included. time = leadIn(100) + 0 = 100.
      // index 4 → 2000 ms > 1200 ms cap → excluded.
      const notes = parseSongNotes(song, 100)
      assert.strictEqual(notes.length, 1)
      assert.strictEqual(notes[0].time, 100)
      assert.strictEqual(notes[0].laneIndex, 0) // guitar
    })


    test('uses resolved playback window (excerptEndMs priority) to cap note duration', () => {
      // excerptEndMs - excerptStartMs = 3500 - 1000 = 2500 ms cap (highest priority).
      // Note times are NOT shifted by excerptStartMs.
      const song = {
        id: 'excerpt-priority-test',
        bpm: 120,
        tpb: 480,
        excerptStartMs: 1000,
        excerptEndMs: 3500,
        excerptDurationMs: 400, // overridden by derived cap (2500 ms)
        durationMs: 900,        // overridden by derived cap (2500 ms)
        notes: [
          { t: 0, lane: 'guitar' },    // 0 ms    index 0  ✓ < 2500
          { t: 240, lane: 'guitar' },  // 250 ms   index 1
          { t: 480, lane: 'guitar' },  // 500 ms   index 2
          { t: 960, lane: 'guitar' },  // 1000 ms  index 3
          { t: 1920, lane: 'drums' },  // 2000 ms  index 4  ✓ < 2500
          { t: 2400, lane: 'bass' },   // 2500 ms  index 5
          { t: 2880, lane: 'guitar' }, // 3000 ms  index 6
          { t: 3360, lane: 'drums' },  // 3500 ms  index 7
          { t: 3840, lane: 'bass' },   // 4000 ms  index 8  > 2500 → excluded
          { t: 4320, lane: 'guitar' }, // 4500 ms  index 9
          { t: 4800, lane: 'drums' },  // 5000 ms  index 10
          { t: 5280, lane: 'bass' },   // 5500 ms  index 11
          { t: 5760, lane: 'guitar' }  // 6000 ms  index 12 > 2500 → excluded
        ]
      }

      // 1-in-4 filter keeps indices 0, 4, 8, 12.
      // index 0  → 0 ms    ✓  time = 100 + 0    = 100
      // index 4  → 2000 ms ✓  time = 100 + 2000 = 2100
      // index 8  → 4000 ms ✗  > 2500 ms cap
      // index 12 → 6000 ms ✗  > 2500 ms cap
      const notes = parseSongNotes(song, 100)
      assert.strictEqual(notes.length, 2)
      assert.strictEqual(notes[0].time, 100)
      assert.strictEqual(notes[0].laneIndex, 0) // guitar
      assert.strictEqual(notes[1].time, 2100)
      assert.strictEqual(notes[1].laneIndex, 1) // drums
    })


    test('does not impose a synthetic 30s excerpt cap when excerpt metadata is missing', () => {
      const song = {
        id: 'no-excerpt-metadata',
        bpm: 120,
        tpb: 480,
        notes: [
          { t: 0, lane: 'guitar' },
          { t: 240, lane: 'guitar' },
          { t: 480, lane: 'guitar' },
          { t: 960, lane: 'guitar' },
          { t: 34560, lane: 'drums' }
        ]
      }

      const notes = parseSongNotes(song, 100)
      assert.strictEqual(notes.length, 2)
      assert.strictEqual(notes[0].time, 100)
      assert.strictEqual(notes[1].time, 36100)
    })
  })

  describe('calculateTimeFromTicks (Optimized)', () => {
    const tpb = 480
    const rawTempoMap = [
      { tick: 0, usPerBeat: 500000 }, // 120 BPM
      { tick: 480, usPerBeat: 250000 } // 240 BPM at beat 1
    ]
    const tempoMap = preprocessTempoMap(rawTempoMap, tpb)

    test('should have preprocessed data', () => {
      assert.strictEqual(typeof tempoMap[0]._accumulatedMicros, 'number')
    })

    test('should calculate time for initial segment (ms)', () => {
      const time = calculateTimeFromTicks(240, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 250) < 0.0001, `Expected 250, got ${time}`)
    })

    test('should calculate time crossing segments (ms)', () => {
      const time = calculateTimeFromTicks(720, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 625) < 0.0001, `Expected 625, got ${time}`)
    })

    test('should calculate time crossing segments (seconds)', () => {
      const time = calculateTimeFromTicks(720, tpb, tempoMap, 's')
      assert.ok(Math.abs(time - 0.625) < 0.0001, `Expected 0.625, got ${time}`)
    })

    test('should handle ticks exactly on segment boundary', () => {
      const time = calculateTimeFromTicks(480, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 500) < 0.0001, `Expected 500, got ${time}`)
    })

    test('should handle ticks beyond last segment', () => {
      const time = calculateTimeFromTicks(960, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 750) < 0.0001, `Expected 750, got ${time}`)
    })
  })
})
