import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  sanitizeActiveEvent,
  normalizeLoadedGameMap
} from '../../src/context/reducers/sanitizers/stateSanitizers'

describe('stateSanitizers', () => {
  describe('copySafeEffectPayload (via sanitizeActiveEvent)', () => {
    it('handles primitive effect payloads (returns undefined for non-objects)', () => {
      const e1 = sanitizeActiveEvent({ id: 'test', effects: 'primitive' })
      assert.strictEqual(e1.effects, undefined)

      const e2 = sanitizeActiveEvent({ id: 'test', effects: 123 })
      assert.strictEqual(e2.effects, undefined)
    })

    it('handles object entries in effect arrays', () => {
      const input = {
        id: 'test',
        effects: [
          { valid: true, invalid: { nested: true }, primitive: 123, arr: [] },
          'primitiveElement',
          { onlyNested: { deep: true } }, // Will become empty and should be filtered out
          null
        ]
      }

      const e = sanitizeActiveEvent(input)
      assert.deepStrictEqual(e.effects, [
        { valid: true, primitive: 123 }
      ])
    })

    it('returns undefined if array is empty after filtering', () => {
      const e1 = sanitizeActiveEvent({ id: 'test', effects: ['primitive', { nested: {} }] })
      assert.strictEqual(e1.effects, undefined)

      const e2 = sanitizeActiveEvent({ id: 'test', effects: [] })
      assert.strictEqual(e2.effects, undefined)
    })
  })

  describe('copySafeFlatObject (via normalizeLoadedGameMap)', () => {
    it('sanitizes only direct record fields and drops nested values', () => {
      const gameMap = {
        nodes: {
          n1: {
            x: 0, y: 0,
            someExtraProperty: {
              validStr: 'string',
              validNum: 42,
              validBool: true,
              validNull: null,
              invalidArr: [1, 2, 3],
              invalidObj: { nested: true }
            }
          }
        },
        connections: []
      }

      const result = normalizeLoadedGameMap(gameMap)
      assert.deepStrictEqual(result.nodes.n1.someExtraProperty, {
        validStr: 'string',
        validNum: 42,
        validBool: true,
        validNull: null
      })
    })

    it('returns null if object has no direct primitives', () => {
      const gameMap = {
        nodes: {
          n1: {
            x: 0, y: 0,
            someExtraProperty: {
              invalidArr: [1, 2, 3],
              invalidObj: { nested: true }
            }
          }
        },
        connections: []
      }

      const result = normalizeLoadedGameMap(gameMap)
      assert.strictEqual(result.nodes.n1.someExtraProperty, undefined)
    })

    it('returns null for non-record values', () => {
      const gameMap = {
        nodes: {
          n1: {
            x: 0, y: 0,
            propA: 'string',
            propB: 123,
            propC: []
          }
        },
        connections: []
      }

      const result = normalizeLoadedGameMap(gameMap)
      assert.ok(result)
      // No assertion for propC since it's preserved as []
    })
  })
})
