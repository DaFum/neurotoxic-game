import assert from 'node:assert'
import { test, describe, beforeEach, afterEach } from 'node:test'
import { resolveActiveSetlist } from '../../src/utils/rhythmGameAudioUtils.js'
import { SONGS_BY_ID } from '../../src/data/songs.js'

describe('rhythmGameAudioUtils', () => {
  describe('resolveActiveSetlist', () => {
    let originalSongs

    beforeEach(() => {
      // Save original map state
      originalSongs = new Map(SONGS_BY_ID)
      SONGS_BY_ID.clear()
    })

    afterEach(() => {
      // Restore original map state
      SONGS_BY_ID.clear()
      originalSongs.forEach((value, key) => SONGS_BY_ID.set(key, value))
    })

    test('should return default jam if setlist is empty', () => {
      const setlist = []
      const result = resolveActiveSetlist(setlist)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'jam')
      assert.strictEqual(result[0].name, 'Jam')
    })

    test('should fallback to string ref if not found in SONGS_BY_ID', () => {
      const setlist = ['unknown']
      const result = resolveActiveSetlist(setlist)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'unknown')
      assert.strictEqual(result[0].name, 'unknown')
    })

    test('should pass through objects with notes', () => {
      const setlist = [{ id: 'custom', notes: [1, 2, 3] }]
      const result = resolveActiveSetlist(setlist)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'custom')
      assert.deepStrictEqual(result[0].notes, [1, 2, 3])
    })

    test('should resolve string ref to known song in SONGS_BY_ID', () => {
      SONGS_BY_ID.set('known', {
        id: 'known',
        name: 'Known Song',
        notes: [1, 2]
      })
      const setlist = ['known']
      const result = resolveActiveSetlist(setlist)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'known')
      assert.strictEqual(result[0].name, 'Known Song')
      assert.deepStrictEqual(result[0].notes, [1, 2])
    })

    test('should resolve partial object to known song in SONGS_BY_ID', () => {
      SONGS_BY_ID.set('partial', {
        id: 'partial',
        name: 'Partial Song',
        notes: [4, 5]
      })
      const setlist = [{ id: 'partial' }]
      const result = resolveActiveSetlist(setlist)
      assert.strictEqual(result.length, 1)
      assert.strictEqual(result[0].id, 'partial')
      assert.strictEqual(result[0].name, 'Partial Song')
      assert.deepStrictEqual(result[0].notes, [4, 5])
    })
  })
})
