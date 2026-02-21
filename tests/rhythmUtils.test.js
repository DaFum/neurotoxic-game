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
    test('aligns notes to excerptStartMs window instead of song start', () => {
      const song = {
        id: 'excerpt-test',
        bpm: 120,
        tpb: 480,
        excerptStartMs: 1000,
        excerptDurationMs: 1200,
        notes: [
          { t: 0, lane: 'guitar' },
          { t: 240, lane: 'guitar' },
          { t: 480, lane: 'guitar' },
          { t: 960, lane: 'guitar' },
          { t: 1920, lane: 'drums' }
        ]
      }

      const notes = parseSongNotes(song, 100)
      assert.strictEqual(notes.length, 1)
      assert.strictEqual(notes[0].time, 100 + 1000)
      assert.strictEqual(notes[0].laneIndex, 1)
    })


    test('uses resolved playback window precedence for excerpt filtering', () => {
      const song = {
        id: 'excerpt-priority-test',
        bpm: 120,
        tpb: 480,
        excerptStartMs: 1000,
        excerptEndMs: 3500,
        excerptDurationMs: 400,
        durationMs: 900,
        notes: [
          { t: 0, lane: 'guitar' },
          { t: 240, lane: 'guitar' },
          { t: 480, lane: 'guitar' },
          { t: 960, lane: 'guitar' },
          { t: 1920, lane: 'drums' },
          { t: 2400, lane: 'bass' },
          { t: 2880, lane: 'guitar' },
          { t: 3360, lane: 'drums' },
          { t: 3840, lane: 'bass' },
          { t: 4320, lane: 'guitar' },
          { t: 4800, lane: 'drums' },
          { t: 5280, lane: 'bass' },
          { t: 5760, lane: 'guitar' }
        ]
      }

      const notes = parseSongNotes(song, 100)
      assert.strictEqual(notes.length, 1)
      assert.strictEqual(notes[0].time, 1100)
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
