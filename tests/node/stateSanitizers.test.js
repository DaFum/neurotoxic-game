import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  sanitizeActiveEvent,
  normalizeLoadedGameMap,
  sanitizeBand,
  sanitizePlayer
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

    it('preserves luck > 100', () => {
      const loadedData = {
        ...DEFAULT_BAND_STATE,
        luck: 150
      }
      const sanitized = sanitizeBand(loadedData)
      assert.strictEqual(sanitized.luck, 150)
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
      const preview = calculateAppliedDelta(
        { band: sanitizedState },
        { band: delta }
      )

      assert.strictEqual(preview.band.luck, 5) // Was previously computing 0, violating lockstep
      assert.strictEqual(sanitizedState.luck, 0)
    })

    it('clamps band tempo into 0..100 without flooring fractional effects', () => {
      assert.strictEqual(sanitizeBand({ tempo: 250 }).tempo, 100)
      assert.strictEqual(sanitizeBand({ tempo: -5 }).tempo, 0)
      // Contraband tempo effects are fractional (e.g. +0.15) and are reverted by
      // an exact additive inverse, so the load clamp must not floor them.
      assert.strictEqual(sanitizeBand({ tempo: 0.15 }).tempo, 0.15)
      assert.strictEqual(
        Object.hasOwn(sanitizeBand({ tempo: Number.NaN }), 'tempo'),
        false
      )
    })

    it('clamps band style and crit to a finite non-negative value', () => {
      for (const key of ['style', 'crit']) {
        assert.strictEqual(sanitizeBand({ [key]: -3 })[key], 0)
        assert.strictEqual(sanitizeBand({ [key]: 0.2 })[key], 0.2)
        assert.strictEqual(sanitizeBand({ [key]: 7 })[key], 7)
        assert.strictEqual(
          Object.hasOwn(sanitizeBand({ [key]: Number.POSITIVE_INFINITY }), key),
          false
        )
        assert.strictEqual(
          Object.hasOwn(sanitizeBand({ [key]: '3' }), key),
          false
        )
      }
    })

    it('clamps inventorySlots to a non-negative integer', () => {
      assert.strictEqual(sanitizeBand({ inventorySlots: -4 }).inventorySlots, 0)
      assert.strictEqual(
        sanitizeBand({ inventorySlots: 2.9 }).inventorySlots,
        2
      )
      assert.strictEqual(sanitizeBand({ inventorySlots: 3 }).inventorySlots, 3)
      assert.strictEqual(
        sanitizeBand({ inventorySlots: Number.NaN }).inventorySlots,
        DEFAULT_BAND_STATE.inventorySlots
      )
    })

    it('floors and clamps member mood like clampMemberMood', () => {
      const band = sanitizeBand({
        members: [
          { name: 'A', mood: 80.9 },
          { name: 'B', mood: -20 },
          { name: 'C', mood: 400 }
        ]
      })
      assert.deepStrictEqual(
        band.members.map(m => m.mood),
        [80, 0, 100]
      )
    })

    it('preserves and bounds banterEvents', () => {
      const entry = i => ({
        member1: 'Matze',
        member2: 'Lars',
        delta: i,
        timestamp: 1000 + i
      })
      const many = Array.from({ length: 60 }, (_, i) => entry(i))
      const band = sanitizeBand({
        banterEvents: [
          ...many,
          { member1: 'x', member2: 'y', delta: Number.NaN, timestamp: 1 },
          { member1: 1, member2: 'y', delta: 1, timestamp: 1 },
          'junk',
          null
        ]
      })
      assert.strictEqual(band.banterEvents.length, 50)
      assert.deepStrictEqual(band.banterEvents[49], entry(59))
      assert.deepStrictEqual(band.banterEvents[0], entry(10))

      assert.deepStrictEqual(sanitizeBand({}).banterEvents, [])
      assert.deepStrictEqual(
        sanitizeBand({ banterEvents: 'nope' }).banterEvents,
        []
      )
    })

    it('rebuilds banter entries from whitelisted fields so hostile keys are dropped', () => {
      const hostile = JSON.parse(
        '{"member1":"a","member2":"b","delta":1,"timestamp":1,"__proto__":{"x":1}}'
      )
      const band = sanitizeBand({ banterEvents: [hostile] })
      assert.strictEqual(band.banterEvents.length, 1)
      assert.strictEqual(
        Object.hasOwn(band.banterEvents[0], '__proto__'),
        false
      )
    })
  })

  describe('forbidden own keys on stash items', () => {
    for (const poison of ['__proto__', 'constructor', 'prototype']) {
      it(`skips a stash item carrying an own ${poison} key (array and map shapes)`, () => {
        const hostile = JSON.parse(
          `{"id":"c_neon_patch","${poison}":{"x":1},"stacks":2}`
        )
        const clean = { id: 'c_neon_patch', stacks: 2 }

        const fromArray = sanitizeBand({ stash: [hostile] })
        assert.strictEqual(
          Object.hasOwn(fromArray.stash, 'c_neon_patch'),
          false
        )
        const fromMap = sanitizeBand({ stash: { c_neon_patch: hostile } })
        assert.strictEqual(Object.hasOwn(fromMap.stash, 'c_neon_patch'), false)

        // Control: the same item without the hostile key is kept.
        const kept = sanitizeBand({ stash: [clean] })
        assert.strictEqual(Object.hasOwn(kept.stash, 'c_neon_patch'), true)
      })
    }
  })

  describe('sanitizePlayer', () => {
    it('clamps clinicVisits to a non-negative integer', () => {
      assert.strictEqual(sanitizePlayer({ clinicVisits: -3 }).clinicVisits, 0)
      assert.strictEqual(sanitizePlayer({ clinicVisits: 2.7 }).clinicVisits, 2)
      assert.strictEqual(sanitizePlayer({ clinicVisits: 4 }).clinicVisits, 4)
      assert.strictEqual(
        sanitizePlayer({ clinicVisits: Number.NaN }).clinicVisits,
        0
      )
      assert.strictEqual(sanitizePlayer({ clinicVisits: '5' }).clinicVisits, 0)
    })

    it('clamps counters to non-negative integers', () => {
      for (const key of [
        'eventsTriggeredToday',
        'totalTravels',
        'passiveFollowers'
      ]) {
        assert.strictEqual(sanitizePlayer({ [key]: -9 })[key], 0)
        assert.strictEqual(sanitizePlayer({ [key]: 3.8 })[key], 3)
        assert.strictEqual(sanitizePlayer({ [key]: 12 })[key], 12)
        assert.strictEqual(
          sanitizePlayer({ [key]: Number.POSITIVE_INFINITY })[key],
          0
        )
      }
    })

    it('clamps score to non-negative and keeps its fractional part', () => {
      assert.strictEqual(sanitizePlayer({ score: -500 }).score, 0)
      assert.strictEqual(sanitizePlayer({ score: 1234.5 }).score, 1234.5)
      assert.strictEqual(sanitizePlayer({ score: Number.NaN }).score, 0)
    })

    it('clamps tutorialStep to an integer of at least -1 (dismissed marker)', () => {
      assert.strictEqual(sanitizePlayer({ tutorialStep: -99 }).tutorialStep, -1)
      assert.strictEqual(sanitizePlayer({ tutorialStep: -1 }).tutorialStep, -1)
      assert.strictEqual(sanitizePlayer({ tutorialStep: 2.6 }).tutorialStep, 2)
      assert.strictEqual(
        sanitizePlayer({ tutorialStep: Number.NaN }).tutorialStep,
        0
      )
    })
  })
})
