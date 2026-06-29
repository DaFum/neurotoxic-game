import { describe, it, expect } from 'vitest'
import { BRAND_COLOR_HEX, HEX_COLOR_PATTERN } from '../../src/utils/brandColors'

describe('BRAND_COLOR_HEX', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(BRAND_COLOR_HEX)).toBe(true)
  })

  it('contains color definitions', () => {
    const keys = Object.keys(BRAND_COLOR_HEX)
    expect(keys.length).toBeGreaterThan(0)

    // Check specific known keys
    expect(keys).toContain('void-black')
    expect(keys).toContain('toxic-green')
    expect(keys).toContain('star-white')
  })

  it('all values are valid hex colors', () => {
    for (const [key, value] of Object.entries(BRAND_COLOR_HEX)) {
      expect(value).toMatch(HEX_COLOR_PATTERN)
    }
  })
})

describe('HEX_COLOR_PATTERN', () => {
  it('matches 3-character hex colors', () => {
    expect('#abc').toMatch(HEX_COLOR_PATTERN)
    expect('#123').toMatch(HEX_COLOR_PATTERN)
    expect('#FFF').toMatch(HEX_COLOR_PATTERN)
  })

  it('matches 6-character hex colors', () => {
    expect('#abcdef').toMatch(HEX_COLOR_PATTERN)
    expect('#123456').toMatch(HEX_COLOR_PATTERN)
    expect('#FFFFFF').toMatch(HEX_COLOR_PATTERN)
    expect('#000000').toMatch(HEX_COLOR_PATTERN)
  })

  it('matches 8-character hex colors (with alpha channel)', () => {
    expect('#abcdef12').toMatch(HEX_COLOR_PATTERN)
    expect('#12345678').toMatch(HEX_COLOR_PATTERN)
    expect('#FFFFFFFF').toMatch(HEX_COLOR_PATTERN)
  })

  it('does not match strings missing the # prefix', () => {
    expect('abcdef').not.toMatch(HEX_COLOR_PATTERN)
    expect('123').not.toMatch(HEX_COLOR_PATTERN)
  })

  it('does not match hex colors with invalid lengths', () => {
    expect('#a').not.toMatch(HEX_COLOR_PATTERN)
    expect('#ab').not.toMatch(HEX_COLOR_PATTERN)
    expect('#abcd').not.toMatch(HEX_COLOR_PATTERN) // 4 chars not allowed
    expect('#abcde').not.toMatch(HEX_COLOR_PATTERN) // 5 chars not allowed
    expect('#abcdef1').not.toMatch(HEX_COLOR_PATTERN) // 7 chars not allowed
    expect('#abcdef123').not.toMatch(HEX_COLOR_PATTERN) // 9 chars not allowed
  })

  it('does not match invalid characters', () => {
    expect('#abcdeg').not.toMatch(HEX_COLOR_PATTERN) // 'g' is invalid
    expect('#xyz').not.toMatch(HEX_COLOR_PATTERN)
    expect('#12345z').not.toMatch(HEX_COLOR_PATTERN)
  })
})
