import assert from 'node:assert'
import { test, describe } from 'node:test'
import { resolveActiveSetlist } from '../src/utils/rhythmGameAudioUtils.js'

describe('rhythmGameAudioUtils', () => {
  describe('resolveActiveSetlist', () => {
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
  })
})
