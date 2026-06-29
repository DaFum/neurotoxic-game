import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { BRAND_COLOR_HEX, HEX_COLOR_PATTERN } from '../../src/utils/brandColors'

describe('BRAND_COLOR_HEX', () => {
  it('is frozen', () => {
    assert.equal(Object.isFrozen(BRAND_COLOR_HEX), true)
  })

  it('contains color definitions', () => {
    const keys = Object.keys(BRAND_COLOR_HEX)
    assert.ok(keys.length > 0)

    // Check specific known keys
    assert.ok(keys.includes('void-black'))
    assert.ok(keys.includes('toxic-green'))
    assert.ok(keys.includes('star-white'))
  })

  it('all values are valid hex colors', () => {
    for (const [key, value] of Object.entries(BRAND_COLOR_HEX)) {
      assert.match(value, HEX_COLOR_PATTERN, `Color ${key} has invalid hex value: ${value}`)
    }
  })
})

describe('HEX_COLOR_PATTERN', () => {
  it('matches 3-character hex colors', () => {
    assert.match('#abc', HEX_COLOR_PATTERN)
    assert.match('#123', HEX_COLOR_PATTERN)
    assert.match('#FFF', HEX_COLOR_PATTERN)
  })

  it('matches 6-character hex colors', () => {
    assert.match('#abcdef', HEX_COLOR_PATTERN)
    assert.match('#123456', HEX_COLOR_PATTERN)
    assert.match('#FFFFFF', HEX_COLOR_PATTERN)
    assert.match('#000000', HEX_COLOR_PATTERN)
  })

  it('matches 8-character hex colors (with alpha channel)', () => {
    assert.match('#abcdef12', HEX_COLOR_PATTERN)
    assert.match('#12345678', HEX_COLOR_PATTERN)
    assert.match('#FFFFFFFF', HEX_COLOR_PATTERN)
  })

  it('does not match strings missing the # prefix', () => {
    assert.doesNotMatch('abcdef', HEX_COLOR_PATTERN)
    assert.doesNotMatch('123', HEX_COLOR_PATTERN)
  })

  it('does not match hex colors with invalid lengths', () => {
    assert.doesNotMatch('#a', HEX_COLOR_PATTERN)
    assert.doesNotMatch('#ab', HEX_COLOR_PATTERN)
    assert.doesNotMatch('#abcd', HEX_COLOR_PATTERN) // 4 chars not allowed
    assert.doesNotMatch('#abcde', HEX_COLOR_PATTERN) // 5 chars not allowed
    assert.doesNotMatch('#abcdef1', HEX_COLOR_PATTERN) // 7 chars not allowed
    assert.doesNotMatch('#abcdef123', HEX_COLOR_PATTERN) // 9 chars not allowed
  })

  it('does not match invalid characters', () => {
    assert.doesNotMatch('#abcdeg', HEX_COLOR_PATTERN) // 'g' is invalid
    assert.doesNotMatch('#xyz', HEX_COLOR_PATTERN)
    assert.doesNotMatch('#12345z', HEX_COLOR_PATTERN)
  })
})
