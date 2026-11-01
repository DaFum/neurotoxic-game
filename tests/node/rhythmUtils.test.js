import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  checkHit,
  calculateTimeFromTicks,
  preprocessTempoMap,
  parseSongNotes,
  generateNotesForSong,
  sanitizeTempoMap
} from '../../src/utils/rhythmUtils'

describe('rhythmUtils', () => {
  describe('generateNotesForSong', () => {
    test('generates notes using deterministic random and respects leadIn', () => {
      const song = {
        id: 'test-song',
        duration: 10,
        bpm: 120,
        difficulty: 2
      }

      const options = {
        leadIn: 3000,
        random: () => 0.5
      }

      const notes = generateNotesForSong(song, options)

      // At 120bpm over 10s, 20 beats are checked. Difficulty <= 2 spawns a
      // guaranteed note on every 8th beat (0, 8, 16) plus a thinned note on the
      // intermediate downbeat (4, 12) whenever random() > 0.2. With
      // random() === 0.5 both thinned beats spawn, so 5 notes are generated.
      assert.strictEqual(notes.length, 5)

      assert.strictEqual(notes[0].songId, 'test-song')

      // beatInterval = 60000 / 120 = 500ms, leadIn = 3000ms
      assert.deepStrictEqual(
        notes.map(note => note.time),
        [3000, 5000, 7000, 9000, 11000]
      )
    })

    test('generates more dense notes for higher difficulty', () => {
      const song = { id: 'diff-test', duration: 10, bpm: 120, difficulty: 5 }
      const options = { leadIn: 2000, random: () => 0.5 }

      const notes = generateNotesForSong(song, options)

      // diff > 4: random() > 0.3
      // Since our random() returns 0.5, all 20 beats should spawn a note.
      assert.strictEqual(notes.length, 20)
    })

    test('generates mid density notes for medium difficulty', () => {
      const song = {
        id: 'diff-test-mid',
        duration: 10,
        bpm: 120,
        difficulty: 3
      }

      // If random() < 0.6, only beatInBar 0 and 2 are kept
      const notes1 = generateNotesForSong(song, {
        leadIn: 2000,
        random: () => 0.5
      })
      // For 20 beats, beatInBar 0 and 2 occurs 10 times.
      assert.strictEqual(notes1.length, 10)

      // If random() > 0.6, all beats kept
      const notes2 = generateNotesForSong(song, {
        leadIn: 2000,
        random: () => 0.8
      })
      assert.strictEqual(notes2.length, 20)
    })

    test('respects laneMap and difficulty variation', () => {
      const song = { id: 'lane-test', duration: 2, bpm: 120, difficulty: 5 } // 4 beats total

      // random = 0.9. > 0.7 triggers the variation lane select:
      // laneIndex = Math.floor(random() * 3) = Math.floor(0.9 * 3) = 2
      const notes = generateNotesForSong(song, { leadIn: 0, random: () => 0.9 })

      assert.ok(notes.length > 0)
      notes.forEach(note => {
        assert.strictEqual(note.laneIndex, 2)
      })

      // Using normal lane map (random < 0.7 for variation, > 0.3 for density)
      // Our density check is random() > 0.3, so random=0.5 will spawn, but not trigger lane variation
      const notesNoVar = generateNotesForSong(song, {
        leadIn: 0,
        random: () => 0.5
      })

      // laneMap = [1, 0, 2, 0]
      assert.strictEqual(notesNoVar[0].laneIndex, 1) // beat 0
      assert.strictEqual(notesNoVar[1].laneIndex, 0) // beat 1
      assert.strictEqual(notesNoVar[2].laneIndex, 2) // beat 2
      assert.strictEqual(notesNoVar[3].laneIndex, 0) // beat 3
    })

    test('clamps an out-of-range RNG result to a valid lane', () => {
      const song = { id: 'lane-clamp', duration: 2, bpm: 120, difficulty: 5 }
      const notes = generateNotesForSong(song, { leadIn: 0, random: () => 1 })

      assert.ok(notes.length > 0)
      assert.ok(notes.every(note => note.laneIndex >= 0 && note.laneIndex < 3))
    })
  })

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

    test('should return null for negative elapsed time', () => {
      const result = checkHit(notes, 0, -100, hitWindow)
      assert.strictEqual(result, null, 'Should handle negative elapsed time')
    })

    test('should return null for empty notes array', () => {
      const result = checkHit([], 0, noteTime, hitWindow)
      assert.strictEqual(result, null, 'Should handle empty array')
    })

    test('should correctly skip notes outside window in multiple notes array', () => {
      const multNotes = [
        createNote(noteTime - hitWindow - 10), // before window
        createNote(noteTime), // inside window
        createNote(noteTime + hitWindow + 10) // after window
      ]
      const result = checkHit(multNotes, 0, noteTime, hitWindow)
      assert.ok(result, 'Should find the note inside the window')
      assert.strictEqual(result.time, noteTime)
    })

    test('should return the first valid note if multiple fall within hit window', () => {
      const multNotes = [
        createNote(noteTime - 10), // first valid note
        createNote(noteTime + 10) // second valid note
      ]
      const result = checkHit(multNotes, 0, noteTime, hitWindow)
      assert.ok(result, 'Should find a valid note')
      assert.strictEqual(result.time, noteTime - 10)
    })

    test('should ignore objects that are not type: note', () => {
      const projectile = { ...createNote(noteTime), type: 'projectile' }
      const result = checkHit([projectile], 0, noteTime, hitWindow)
      assert.strictEqual(result, null, 'Should ignore non-note types')
    })

    test('should return null if hitWindow is 0', () => {
      const result = checkHit(notes, 0, noteTime, 0)
      assert.strictEqual(
        result,
        null,
        'Should return null when hit window is 0'
      )
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
          { t: 0, lane: 'guitar' }, // 0 ms   — index 0 (kept by 1-in-4)
          { t: 240, lane: 'guitar' }, // 250 ms  — index 1
          { t: 480, lane: 'guitar' }, // 500 ms  — index 2
          { t: 960, lane: 'guitar' }, // 1000 ms — index 3
          { t: 1920, lane: 'drums' } // 2000 ms — index 4 (> 1200 ms cap → excluded)
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
        durationMs: 900, // overridden by derived cap (2500 ms)
        notes: [
          { t: 0, lane: 'guitar' }, // 0 ms    index 0  ✓ < 2500
          { t: 240, lane: 'guitar' }, // 250 ms   index 1
          { t: 480, lane: 'guitar' }, // 500 ms   index 2
          { t: 960, lane: 'guitar' }, // 1000 ms  index 3
          { t: 1920, lane: 'drums' }, // 2000 ms  index 4  ✓ < 2500
          { t: 2400, lane: 'bass' }, // 2500 ms  index 5
          { t: 2880, lane: 'guitar' }, // 3000 ms  index 6
          { t: 3360, lane: 'drums' }, // 3500 ms  index 7
          { t: 3840, lane: 'bass' }, // 4000 ms  index 8  > 2500 → excluded
          { t: 4320, lane: 'guitar' }, // 4500 ms  index 9
          { t: 4800, lane: 'drums' }, // 5000 ms  index 10
          { t: 5280, lane: 'bass' }, // 5500 ms  index 11
          { t: 5760, lane: 'guitar' } // 6000 ms  index 12 > 2500 → excluded
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

    test('should calculate time for initial segment (ms) (Optimized)', () => {
      const time = calculateTimeFromTicks(240, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 250) < 0.0001, `Expected 250, got ${time}`)
    })

    test('should calculate time crossing segments (ms) (Optimized)', () => {
      const time = calculateTimeFromTicks(720, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 625) < 0.0001, `Expected 625, got ${time}`)
    })

    test('should calculate time crossing segments (seconds) (Optimized)', () => {
      const time = calculateTimeFromTicks(720, tpb, tempoMap, 's')
      assert.ok(Math.abs(time - 0.625) < 0.0001, `Expected 0.625, got ${time}`)
    })

    test('should handle ticks exactly on segment boundary (Optimized)', () => {
      const time = calculateTimeFromTicks(480, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 500) < 0.0001, `Expected 500, got ${time}`)
    })

    test('should handle ticks beyond last segment (Optimized)', () => {
      const time = calculateTimeFromTicks(960, tpb, tempoMap, 'ms')
      assert.ok(Math.abs(time - 750) < 0.0001, `Expected 750, got ${time}`)
    })
  })

  describe('sanitizeTempoMap', () => {
    const VALID = { tick: 0, usPerBeat: 500000 }

    test('returns an empty map for non-arrays', () => {
      for (const raw of [undefined, null, 0, 'map', true, {}, { 0: VALID }]) {
        assert.deepStrictEqual(sanitizeTempoMap(raw), [], String(raw))
      }
    })

    test('rejects entries that are not records', () => {
      const raw = [null, undefined, 0, 'entry', true, [0, 500000]]
      assert.deepStrictEqual(sanitizeTempoMap(raw), [])
    })

    test('rejects entries missing tick or usPerBeat', () => {
      assert.deepStrictEqual(
        sanitizeTempoMap([{ tick: 0 }, { usPerBeat: 500000 }, {}]),
        []
      )
    })

    test('rejects inherited tick and usPerBeat', () => {
      const inheritedBoth = Object.create(VALID)
      const inheritedTick = Object.create({ tick: 0 })
      inheritedTick.usPerBeat = 500000
      const inheritedTempo = Object.create({ usPerBeat: 500000 })
      inheritedTempo.tick = 0
      assert.deepStrictEqual(
        sanitizeTempoMap([inheritedBoth, inheritedTick, inheritedTempo]),
        []
      )
    })

    test('rejects non-finite, non-number and negative ticks', () => {
      for (const tick of [NaN, Infinity, -Infinity, '0', true, null, [0], -1]) {
        assert.deepStrictEqual(
          sanitizeTempoMap([{ tick, usPerBeat: 500000 }]),
          [],
          String(tick)
        )
      }
    })

    test('rejects non-finite, non-number and non-positive usPerBeat', () => {
      for (const usPerBeat of [
        NaN,
        Infinity,
        -Infinity,
        '500000',
        true,
        null,
        [500000],
        0,
        -500000
      ]) {
        assert.deepStrictEqual(
          sanitizeTempoMap([{ tick: 0, usPerBeat }]),
          [],
          String(usPerBeat)
        )
      }
    })

    test('keeps valid entries as new objects in source order', () => {
      const first = { tick: 960, usPerBeat: 250000, extra: 'dropped' }
      const second = { tick: 0, usPerBeat: 500000 }
      const result = sanitizeTempoMap([first, { tick: -1 }, second])
      assert.deepStrictEqual(result, [
        { tick: 960, usPerBeat: 250000 },
        { tick: 0, usPerBeat: 500000 }
      ])
      assert.notStrictEqual(result[0], first)
      assert.notStrictEqual(result[1], second)
    })
  })

  describe('parseSongNotes tempo map sanitization', () => {
    const tpb = 480
    // The 1-in-4 filter keeps indices 0, 4 and 8: ticks 0, 480 and 1440.
    const notes = [0, 120, 240, 360, 480, 600, 720, 840, 1440].map(t => ({
      t,
      lane: 'guitar'
    }))

    test('ignores malformed entries between valid entries', () => {
      const cleanMap = [
        { tick: 0, usPerBeat: 500000 },
        { tick: 960, usPerBeat: 250000 }
      ]
      const song = {
        id: 'tempo-map-malformed-middle',
        bpm: 60,
        tpb,
        notes,
        tempoMap: [
          cleanMap[0],
          { tick: -1, usPerBeat: 1000000 },
          Object.create({ tick: 480, usPerBeat: 1000000 }),
          { tick: 960, usPerBeat: NaN },
          { tick: 960, usPerBeat: 0 },
          null,
          cleanMap[1]
        ]
      }

      const result = parseSongNotes(song, 100)
      assert.deepStrictEqual(
        result.map(note => note.time),
        [0, 480, 1440].map(
          tick => 100 + calculateTimeFromTicks(tick, tpb, cleanMap, 'ms')
        )
      )
    })

    test('falls back to constant BPM when no tempo entry is usable', () => {
      const song = {
        id: 'tempo-map-all-invalid',
        bpm: 60,
        tpb,
        notes,
        tempoMap: [
          { tick: 0, usPerBeat: 0 },
          { tick: -480, usPerBeat: 500000 },
          Object.create({ tick: 0, usPerBeat: 500000 }),
          { tick: 0, usPerBeat: '500000' },
          null
        ]
      }

      // 60 BPM: one beat (480 ticks) per second.
      const result = parseSongNotes(song, 100)
      assert.deepStrictEqual(
        result.map(note => note.time),
        [100, 1100, 3100]
      )
    })
  })
})
