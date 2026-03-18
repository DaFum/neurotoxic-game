import { describe, it } from 'node:test'
import assert from 'node:assert'
import { hashString } from '../../src/utils/stringUtils.js'

describe('hashString', () => {
  it('returns a 32-bit integer hash from a string', () => {
    assert.strictEqual(hashString('test'), 3556498)
  })

  it('returns a stable hash for a given string', () => {
    assert.strictEqual(hashString('hello world'), 1794106052)
  })

  it('handles empty string', () => {
    assert.strictEqual(hashString(''), 0)
  })
})
