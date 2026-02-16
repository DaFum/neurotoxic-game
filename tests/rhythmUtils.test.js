import { test, describe } from 'node:test'
import assert from 'node:assert'
import { checkHit } from '../src/utils/rhythmUtils.js'

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
      assert.ok(result, `Should find note inside start boundary (diff: ${Math.abs(elapsed - noteTime)})`)
    })

    test('should return note for hit just inside end boundary', () => {
      const elapsed = noteTime + hitWindow - 0.001
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.ok(result, `Should find note inside end boundary (diff: ${Math.abs(elapsed - noteTime)})`)
    })

    test('should return null for hit exactly at start boundary (exclusive)', () => {
      // diff = hitWindow. hitWindow < hitWindow is false.
      const elapsed = noteTime - hitWindow
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(result, null, 'Should not find note exactly at start boundary')
    })

    test('should return null for hit exactly at end boundary (exclusive)', () => {
      // diff = hitWindow. hitWindow < hitWindow is false.
      const elapsed = noteTime + hitWindow
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(result, null, 'Should not find note exactly at end boundary')
    })

    test('should return null for hit outside start boundary', () => {
      const elapsed = noteTime - hitWindow - 0.001
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(result, null, 'Should not find note outside start boundary')
    })

    test('should return null for hit outside end boundary', () => {
      const elapsed = noteTime + hitWindow + 0.001
      const result = checkHit(notes, 0, elapsed, hitWindow)
      assert.strictEqual(result, null, 'Should not find note outside end boundary')
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
})
