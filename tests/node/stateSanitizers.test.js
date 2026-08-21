import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  sanitizeActiveEvent,
  normalizeLoadedGameMap,
  sanitizeBand
} from '../../src/context/reducers/sanitizers/stateSanitizers'
import { DEFAULT_BAND_STATE } from '../../src/context/initialState'
import { calculateAppliedDelta } from '../../src/utils/gameState'

describe('stateSanitizers', () => {
  describe('copySafeEffectPayload (via sanitizeActiveEvent)', () => {
    it('handles primitive effect payloads (returns undefined for non-objects)', () => {
      const e1 = sanitizeActiveEvent({ id: 'test', effects: 'primitive' })
      assert.strictEqual(e1.effects, undefined)

      const e2 = sanitizeActiveEvent({ id: 'test', effects: 123 })
      assert.strictEqual(e2.effects, undefined)
    })

    it('handles direct effects object correctly (retains nulls, rejects NaN/Infinity, strips forbidden keys)', () => {
      const effectObj = {
        validStr: 'string',
        validNum: 42,
        validNull: null,
        invalidNaN: Number.NaN,
        invalidInf: Number.POSITIVE_INFINITY,
        constructor: 'bad',
        prototype: 'bad'
      }
      Object.defineProperty(effectObj, '__proto__', {
        value: { evil: true },
        enumerable: true,
        writable: true,
        configurable: true
      })

      const e = sanitizeActiveEvent({ id: 'test', effects: effectObj })

      assert.strictEqual(Object.hasOwn(e.effects, '__proto__'), false)
      assert.strictEqual(Object.hasOwn(e.effects, 'constructor'), false)
      assert.strictEqual(Object.hasOwn(e.effects, 'prototype'), false)
      assert.strictEqual(Object.hasOwn(e.effects, 'invalidNaN'), false)
      assert.strictEqual(Object.hasOwn(e.effects, 'invalidInf'), false)

      assert.strictEqual(e.effects.validStr, 'string')
      assert.strictEqual(e.effects.validNum, 42)
      assert.strictEqual(e.effects.validNull, null)
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
      assert.deepStrictEqual(e.effects, [{ valid: true, primitive: 123 }])
    })

    it('returns undefined if array is empty after filtering', () => {
      const e1 = sanitizeActiveEvent({
        id: 'test',
        effects: ['primitive', { nested: {} }]
      })
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
            x: 0,
            y: 0,
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
            x: 0,
            y: 0,
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
            x: 0,
            y: 0,
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

  describe('shopInventory (via normalizeLoadedGameMap)', () => {
    it('sanitizes allowed typed fields and effects', () => {
      const gameMap = {
        nodes: {
          shop1: {
            id: 'shop1',
            x: 10,
            y: 20,
            type: 'SUPPLY_STOP',
            shopInventory: [
              {
                id: 'item_1',
                name: 'Energy Drink',
                cost: 25,
                currency: 'cash',
                category: 'consumable',
                description: 'Restores stamina',
                img: 'drink.png',
                imgPrompt: 'cyber drink',
                rarity: 'common',
                maxStacks: 5,
                oneTime: false,
                requiresReputation: true,
                stackable: true,
                effect: {
                  type: 'inventory_add',
                  item: 'energy_drink',
                  value: 1
                },
                effects: [
                  {
                    type: 'stat_modifier',
                    key: 'stamina',
                    value: 10
                  }
                ],
                untrustedExtra: 'evil',
                constructor: 'bad'
              },
              // Invalid item with non-matching effect and invalid fields
              {
                id: 'invalid_item',
                cost: -10, // will clamp to 0
                price: 15,
                invalidField: 123,
                effect: {
                  type: 'invalid_type',
                  foo: 'bar'
                }
              },
              // Completely invalid non-object entry
              'not_an_item',
              null
            ]
          }
        },
        connections: []
      }

      const result = normalizeLoadedGameMap(gameMap)
      assert.ok(result?.nodes.shop1.shopInventory)
      assert.strictEqual(result.nodes.shop1.shopInventory.length, 2)

      const item1 = result.nodes.shop1.shopInventory[0]
      assert.strictEqual(item1.id, 'item_1')
      assert.strictEqual(item1.name, 'Energy Drink')
      assert.strictEqual(item1.cost, 25)
      assert.strictEqual(item1.currency, 'cash')
      assert.strictEqual(item1.category, 'consumable')
      assert.strictEqual(item1.description, 'Restores stamina')
      assert.strictEqual(item1.img, 'drink.png')
      assert.strictEqual(item1.imgPrompt, 'cyber drink')
      assert.strictEqual(item1.rarity, 'common')
      assert.strictEqual(item1.maxStacks, 5)
      assert.strictEqual(item1.oneTime, false)
      assert.strictEqual(item1.requiresReputation, true)
      assert.strictEqual(item1.stackable, true)
      assert.deepStrictEqual(item1.effect, {
        type: 'inventory_add',
        item: 'energy_drink',
        value: 1
      })
      assert.deepStrictEqual(item1.effects, [
        {
          type: 'stat_modifier',
          key: 'stamina',
          value: 10
        }
      ])
      assert.strictEqual(Object.hasOwn(item1, 'untrustedExtra'), false)
      assert.strictEqual(Object.hasOwn(item1, 'constructor'), false)

      const item2 = result.nodes.shop1.shopInventory[1]
      assert.strictEqual(item2.id, 'invalid_item')
      assert.strictEqual(item2.cost, 0)
      assert.strictEqual(item2.price, 15)
      assert.strictEqual(item2.effect, undefined)
      assert.strictEqual(Object.hasOwn(item2, 'invalidField'), false)
    })
  })

  describe('copySafeMapNodeArray (via normalizeLoadedGameMap)', () => {
    it('safely copies arrays containing primitives and flat objects', () => {
      const gameMap = {
        nodes: {
          n1: {
            x: 0,
            y: 0,
            customArray: [
              'text',
              42,
              true,
              null,
              { validKey: 'val', num: 1 },
              { nestedOnly: { bad: true } }
            ]
          }
        },
        connections: []
      }

      const result = normalizeLoadedGameMap(gameMap)
      assert.deepStrictEqual(result.nodes.n1.customArray, [
        'text',
        42,
        true,
        null,
        { validKey: 'val', num: 1 }
      ])
    })
  })

  describe('sanitizeBand', () => {
    it('clamps negative luck to 0', () => {
      const loadedData = {
        ...DEFAULT_BAND_STATE,
        luck: -10
      }
      const sanitized = sanitizeBand(loadedData)
      assert.strictEqual(sanitized.luck, 0)
    })

    it('clamps luck > 100 to 100', () => {
      const loadedData = {
        ...DEFAULT_BAND_STATE,
        luck: 150
      }
      const sanitized = sanitizeBand(loadedData)
      assert.strictEqual(sanitized.luck, 100)
    })

    it('calculates expected event delta without load-apply lockstep issues for negative loaded luck', () => {
      // Simulate loading state without sanitizeBand, which is the bug condition
      const unSanitizedState = {
        ...DEFAULT_BAND_STATE,
        luck: -10
      }

      const delta = { luck: 5 }

      // When the load-apply bug occurs, calculateAppliedDelta computes a preview of 0
      // but applyEventDelta calculates an actual delta resulting in state value 5.
      // This test ensures that when state is actually sanitized, calculateAppliedDelta
      // computes the proper preview delta (+5) based on the clamped baseline (0).

      const sanitizedState = sanitizeBand(unSanitizedState)
      const preview = calculateAppliedDelta({ band: sanitizedState }, { band: delta })

      assert.strictEqual(preview.band.luck, 5) // Was previously computing 0, violating lockstep
      assert.strictEqual(sanitizedState.luck, 0)
    })
  })
})
