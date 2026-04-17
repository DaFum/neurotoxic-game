import test from 'node:test'
import assert from 'node:assert/strict'
import { hashString } from '../../src/utils/stringUtils'

test('hashString calculates correct 32-bit integer hashes', async t => {
  await t.test('returns 0 for empty string', () => {
    assert.equal(hashString(''), 0)
  })

  await t.test('returns deterministic hash for same string', () => {
    const hash1 = hashString('hello world')
    const hash2 = hashString('hello world')
    assert.equal(hash1, hash2)
  })

  await t.test('returns different hashes for different strings', () => {
    const hash1 = hashString('hello world')
    const hash2 = hashString('hello worle')
    assert.notEqual(hash1, hash2)
  })

  await t.test('returns 32-bit integers', () => {
    const hash1 = hashString(
      'a very long string that might overflow 32 bits if not truncated properly'
    )
    // Should be a number, not a bigint, and within 32-bit signed integer range
    assert.equal(typeof hash1, 'number')
    assert.equal(Math.floor(hash1), hash1)
    assert.ok(hash1 >= -2147483648 && hash1 <= 2147483647)
  })

  await t.test('matches standard djb2-like algorithm output', () => {
    // hash = (hash * 31) + charCode
    // 'a' = 97. 0 * 31 + 97 = 97
    assert.equal(hashString('a'), 97)

    // 'ab' -> 97 * 31 + 98 = 3007 + 98 = 3105
    assert.equal(hashString('ab'), 3105)
  })
})
