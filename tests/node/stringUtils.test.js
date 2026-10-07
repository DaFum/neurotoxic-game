import test from 'node:test'
import assert from 'node:assert/strict'
import { escapeHtml, fnv1a32, hash31 } from '../../src/utils/stringUtils'

test('hash31 calculates correct 32-bit integer hashes', async t => {
  await t.test('returns 0 for empty string', () => {
    assert.equal(hash31(''), 0)
  })

  await t.test('returns deterministic hash for same string', () => {
    const hash1 = hash31('hello world')
    const hash2 = hash31('hello world')
    assert.equal(hash1, hash2)
  })

  await t.test('returns different hashes for different strings', () => {
    const hash1 = hash31('hello world')
    const hash2 = hash31('hello worle')
    assert.notEqual(hash1, hash2)
  })

  await t.test('returns 32-bit integers', () => {
    const hash1 = hash31(
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
    assert.equal(hash31('a'), 97)

    // 'ab' -> 97 * 31 + 98 = 3007 + 98 = 3105
    assert.equal(hash31('ab'), 3105)

    assert.equal(hash31('test'), 3556498)
    assert.equal(hash31('hello world'), 1794106052)
  })
})

test('hash31 >>> 0 equals the unsigned accumulation used by expedition defects', () => {
  const unsignedLegacy = str => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0
    }
    return hash
  }
  const pinned = {
    '': 0,
    berlin: 2902435746,
    defects_x: 2890969243,
    field_repair: 236932722,
    'a very long string that might overflow 32 bits if not truncated properly': 2298957700
  }
  for (const [input, expected] of Object.entries(pinned)) {
    assert.equal(hash31(input) >>> 0, expected, input)
    assert.equal(unsignedLegacy(input), expected, input)
  }
  // Signed callers keep the signed value.
  assert.equal(hash31('berlin'), -1392531550)
})

test('fnv1a32 reproduces the three retired FNV-1a copies byte for byte', () => {
  const pinned = {
    '': 2166136261,
    a: 3826002220,
    'hello world': 3582672807,
    berlin: 1093807985,
    defects_x: 208791250
  }
  for (const [input, expected] of Object.entries(pinned)) {
    assert.equal(fnv1a32(input), expected, input)
  }
  // Seeded variant (expedition run drafts): the seed replaces the basis.
  assert.equal(fnv1a32('', 12345), 12345)
  assert.equal(fnv1a32('a', 12345), 1481382536)
  assert.equal(fnv1a32('hello world', 12345), 816770563)
  assert.equal(fnv1a32('a', -7), 2550094920)
  assert.equal(fnv1a32('a', 4294967295), 2650760634)
})

test('escapeHtml escapes the five markup characters and leaves other text alone', () => {
  assert.equal(
    escapeHtml(`<a href="x">Tom & 'Jerry'</a>`),
    '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;'
  )
  assert.equal(escapeHtml('plain text 123'), 'plain text 123')
  assert.equal(escapeHtml(''), '')
})

test('escapeHtml escapes ampersands first-pass only (no double escaping of its own output)', () => {
  assert.equal(escapeHtml('&amp;'), '&amp;amp;')
})

test('escapeHtml matches the retired SVG and trade-context escapers for every special character', () => {
  const legacySvg = value =>
    value.replace(/[&<>"']/g, char => {
      switch (char) {
        case '&':
          return '&amp;'
        case '<':
          return '&lt;'
        case '>':
          return '&gt;'
        case '"':
          return '&quot;'
        default:
          return '&#39;'
      }
    })
  for (const sample of [
    '&',
    '<',
    '>',
    '"',
    "'",
    '<&>"\'',
    'a&b<c>d"e\'f',
    'ünï & çøde'
  ]) {
    assert.equal(escapeHtml(sample), legacySvg(sample), sample)
  }
})
