import { describe, expect, test } from 'vitest'
import { hasPrototypePollution } from '../../lib/apiUtils.js'

describe('hasPrototypePollution', () => {
  test.each([
    ['__proto__', '{"a":{"b":{"__proto__":{"polluted":true}}}}'],
    ['constructor', '{"a":{"b":{"constructor":{"prototype":{}}}}}'],
    ['prototype', '{"a":{"b":{"prototype":{"polluted":true}}}}'],
    ['__proto__ in an array', '{"list":[1,{"__proto__":{"x":1}}]}'],
    ['constructor in an array', '{"list":[[{"constructor":1}]]}'],
    ['prototype in an array', '[{"ok":1},{"prototype":1}]']
  ])('detects a nested %s key', (_, json) => {
    expect(hasPrototypePollution(JSON.parse(json))).toBe(true)
  })

  test('accepts a clean nested payload', () => {
    expect(
      hasPrototypePollution(
        JSON.parse('{"playerId":"p1","scores":[1,2,{"x":"y"}]}')
      )
    ).toBe(false)
  })

  test('terminates on cycles and still finds a key behind one', () => {
    /** @type {Record<string, unknown>} */
    const clean = { name: 'loop' }
    clean.self = clean
    clean.list = [clean]
    expect(hasPrototypePollution(clean)).toBe(false)

    /** @type {Record<string, unknown>} */
    const polluted = { name: 'loop' }
    polluted.self = polluted
    polluted.child = JSON.parse('{"__proto__":{"x":1}}')
    expect(hasPrototypePollution(polluted)).toBe(true)
  })

  test('continues through already-frozen parent objects', () => {
    const payload = Object.freeze({
      outer: Object.freeze({ inner: JSON.parse('{"constructor":1}') })
    })
    expect(hasPrototypePollution(payload)).toBe(true)
  })
})
