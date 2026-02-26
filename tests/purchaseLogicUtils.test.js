import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getPrimaryEffect,
  getAdjustedCost,
  buildVanWithUpgrade,
  isItemOwned,
  canAfford,
  applyInventorySet,
  applyInventoryAdd,
  applyStatModifier,
  applyUnlockUpgrade,
  applyUnlockHQ,
  applyPassive
} from '../src/utils/purchaseLogicUtils.js'

describe('purchaseLogicUtils', () => {
  describe('getPrimaryEffect', () => {
    test('returns first effect from effects array', () => {
      const item = { effects: [{ type: 'test' }] }
      assert.deepStrictEqual(getPrimaryEffect(item), { type: 'test' })
    })

    test('returns effect object if present', () => {
      const item = { effect: { type: 'test' } }
      assert.deepStrictEqual(getPrimaryEffect(item), { type: 'test' })
    })

    test('returns undefined if no effect', () => {
      assert.equal(getPrimaryEffect({}), undefined)
    })
  })

  describe('getAdjustedCost', () => {
    test('returns cost without modification if no gear_nerd', () => {
      const item = { cost: 100, category: 'GEAR', currency: 'money' }
      const band = { members: [] }
      assert.equal(getAdjustedCost(item, band), 100)
    })

    test('returns discounted cost with gear_nerd for GEAR money items', () => {
      const item = { cost: 100, category: 'GEAR', currency: 'money' }
      const band = { members: [{ traits: [{ id: 'gear_nerd' }] }] }
      assert.equal(getAdjustedCost(item, band), 80)
    })

    test('does not discount if currency is fame', () => {
      const item = { cost: 100, category: 'GEAR', currency: 'fame' }
      const band = { members: [{ traits: [{ id: 'gear_nerd' }] }] }
      assert.equal(getAdjustedCost(item, band), 100)
    })
  })

  describe('buildVanWithUpgrade', () => {
    test('adds upgrade if not present', () => {
      const van = { upgrades: ['a'] }
      const result = buildVanWithUpgrade(van, 'b')
      assert.deepStrictEqual(result.upgrades, ['a', 'b'])
    })

    test('does not duplicate upgrade', () => {
      const van = { upgrades: ['a', 'b'] }
      const result = buildVanWithUpgrade(van, 'b')
      assert.deepStrictEqual(result.upgrades, ['a', 'b'])
    })

    test('handles undefined van', () => {
      const result = buildVanWithUpgrade(undefined, 'a')
      assert.deepStrictEqual(result.upgrades, ['a'])
    })
  })

  describe('isItemOwned', () => {
    test('returns true if item id is in van upgrades', () => {
      const item = { id: 'upgrade1', effect: { type: 'passive' } }
      const player = { van: { upgrades: ['upgrade1'] } }
      const band = {}
      assert.equal(isItemOwned(item, player, band), true)
    })

    test('returns true if item id is in hq upgrades', () => {
      const item = { id: 'hq1', effect: { type: 'unlock_hq' } }
      const player = { hqUpgrades: ['hq1'] }
      const band = {}
      assert.equal(isItemOwned(item, player, band), true)
    })

    test('returns true if inventory item is true for inventory_set', () => {
      const item = { id: 'inv1', effect: { type: 'inventory_set', item: 'pass' } }
      const player = {}
      const band = { inventory: { pass: true } }
      assert.equal(isItemOwned(item, player, band), true)
    })
  })

  describe('canAfford', () => {
    test('returns true if money >= adjustedCost', () => {
      const item = { currency: 'money' }
      const player = { money: 100 }
      assert.equal(canAfford(item, player, 100), true)
      assert.equal(canAfford(item, player, 50), true)
    })

    test('returns false if money < adjustedCost', () => {
      const item = { currency: 'money' }
      const player = { money: 99 }
      assert.equal(canAfford(item, player, 100), false)
    })

    test('returns true if fame >= adjustedCost', () => {
      const item = { currency: 'fame' }
      const player = { fame: 100 }
      assert.equal(canAfford(item, player, 100), true)
    })
  })

  describe('applyStatModifier', () => {
    test('applies to player stat', () => {
      const effect = { target: 'player', stat: 'fame', value: 10 }
      const playerPatch = {}
      const player = { fame: 50 }
      const band = {}
      const result = applyStatModifier(effect, playerPatch, player, band)
      assert.equal(result.playerPatch.fame, 60)
    })

    test('applies to van stat', () => {
      const effect = { target: 'van', stat: 'speed', value: 5 }
      const playerPatch = {}
      const player = { van: { speed: 10 } }
      const band = {}
      const result = applyStatModifier(effect, playerPatch, player, band)
      assert.equal(result.playerPatch.van.speed, 15)
    })

    test('applies to band stat', () => {
        const effect = { target: 'band', stat: 'harmony', value: 5 }
        const playerPatch = {}
        const player = {}
        const band = { harmony: 10 }
        const result = applyStatModifier(effect, playerPatch, player, band)
        assert.equal(result.bandPatch.harmony, 15)
    })

    test('applies to performance stat by default', () => {
      const effect = { stat: 'guitarDifficulty', value: -0.1 }
      const playerPatch = {}
      const player = {}
      const band = { performance: { guitarDifficulty: 1.0 } }
      const result = applyStatModifier(effect, playerPatch, player, band)
      assert.ok(Math.abs(result.bandPatch.performance.guitarDifficulty - 0.9) < 0.0001)
    })
  })

  describe('applyUnlockHQ', () => {
    test('returns correct messages for special items', () => {
        const item = { id: 'hq_room_poster_wall' }
        const playerPatch = {}
        const player = {}
        const band = {}
        const result = applyUnlockHQ(item, playerPatch, player, band)
        assert.ok(result.messages.length > 0)
        assert.equal(result.messages[0].type, 'success')
    })
  })
})
