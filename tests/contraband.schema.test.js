import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CONTRABAND_DB,
  CONTRABAND_BY_ID,
  CONTRABAND_BY_RARITY,
  CONTRABAND_RARITY_WEIGHTS
} from '../src/data/contraband.js'

describe('Contraband Schema (with imagePrompt)', () => {
  describe('CONTRABAND_DB structure', () => {
    it('should have all items with imagePrompt field', () => {
      for (const item of CONTRABAND_DB) {
        assert.equal(
          Object.hasOwn(item, 'imagePrompt'),
          true,
          `Item ${item.id} should have imagePrompt field`
        )
      }
    })

    it('should have all required fields for each item', () => {
      const requiredFields = [
        'id',
        'name',
        'type',
        'effectType',
        'description',
        'rarity',
        'icon'
      ]

      for (const item of CONTRABAND_DB) {
        for (const field of requiredFields) {
          assert.ok(
            Object.hasOwn(item, field),
            `Item ${item.id} is missing required field: ${field}`
          )
          assert.ok(
            item[field] !== undefined && item[field] !== null,
            `Item ${item.id} has null/undefined value for field: ${field}`
          )
        }
      }
    })

    it('should have valid item types', () => {
      const validTypes = ['consumable', 'equipment', 'relic']
      for (const item of CONTRABAND_DB) {
        assert.ok(
          validTypes.includes(item.type),
          `Item ${item.id} has invalid type: ${item.type}`
        )
      }
    })

    it('should have valid rarities matching CONTRABAND_RARITY_WEIGHTS', () => {
      const validRarities = Object.keys(CONTRABAND_RARITY_WEIGHTS)
      for (const item of CONTRABAND_DB) {
        assert.ok(
          validRarities.includes(item.rarity),
          `Item ${item.id} has invalid rarity: ${item.rarity}`
        )
      }
    })

    it('should have unique item IDs', () => {
      const ids = CONTRABAND_DB.map(item => item.id)
      const uniqueIds = new Set(ids)
      assert.equal(
        ids.length,
        uniqueIds.size,
        'Found duplicate item IDs in CONTRABAND_DB'
      )
    })

    it('should have valid value fields for all items', () => {
      for (const item of CONTRABAND_DB) {
        assert.ok(
          typeof item.value === 'number',
          `Item ${item.id} has invalid value type: ${typeof item.value}`
        )
      }
    })

    it('should have icon strings for all items', () => {
      for (const item of CONTRABAND_DB) {
        assert.ok(
          typeof item.icon === 'string' && item.icon.length > 0,
          `Item ${item.id} has invalid icon: ${item.icon}`
        )
      }
    })

    it('should have translation keys for name and description', () => {
      for (const item of CONTRABAND_DB) {
        assert.ok(
          item.name.startsWith('items:contraband.'),
          `Item ${item.id} name is not a translation key: ${item.name}`
        )
        assert.ok(
          item.description.startsWith('items:contraband.'),
          `Item ${item.id} description is not a translation key: ${item.description}`
        )
      }
    })

    it('should have stackable field defined for all items', () => {
      for (const item of CONTRABAND_DB) {
        assert.ok(
          typeof item.stackable === 'boolean',
          `Item ${item.id} has invalid stackable field: ${item.stackable}`
        )
      }
    })

    it('should have maxStacks for stackable items', () => {
      const stackableItems = CONTRABAND_DB.filter(item => item.stackable)
      for (const item of stackableItems) {
        // Some stackable items might not have maxStacks if unlimited
        if (item.maxStacks !== undefined) {
          assert.ok(
            typeof item.maxStacks === 'number' && item.maxStacks > 0,
            `Stackable item ${item.id} has invalid maxStacks: ${item.maxStacks}`
          )
        }
      }
    })

    it('should have applyOnAdd=true for equipment items', () => {
      const equipmentItems = CONTRABAND_DB.filter(
        item => item.type === 'equipment'
      )
      for (const item of equipmentItems) {
        assert.equal(
          item.applyOnAdd,
          true,
          `Equipment item ${item.id} should have applyOnAdd=true`
        )
      }
    })
  })

  describe('CONTRABAND_BY_ID lookup map', () => {
    it('should contain all items from CONTRABAND_DB', () => {
      assert.equal(CONTRABAND_BY_ID.size, CONTRABAND_DB.length)
    })

    it('should allow O(1) lookup by item ID', () => {
      const firstItem = CONTRABAND_DB[0]
      const lookedUpItem = CONTRABAND_BY_ID.get(firstItem.id)
      assert.deepEqual(lookedUpItem, firstItem)
    })

    it('should return undefined for non-existent items', () => {
      assert.equal(CONTRABAND_BY_ID.get('non_existent_item'), undefined)
    })
  })

  describe('CONTRABAND_BY_RARITY categorization', () => {
    it('should have arrays for all rarity levels', () => {
      const rarities = ['common', 'uncommon', 'rare', 'epic']
      for (const rarity of rarities) {
        assert.ok(
          Array.isArray(CONTRABAND_BY_RARITY[rarity]),
          `Missing array for rarity: ${rarity}`
        )
      }
    })

    it('should correctly categorize items by rarity', () => {
      for (const rarity of Object.keys(CONTRABAND_BY_RARITY)) {
        const items = CONTRABAND_BY_RARITY[rarity]
        for (const item of items) {
          assert.equal(
            item.rarity,
            rarity,
            `Item ${item.id} in ${rarity} array has wrong rarity: ${item.rarity}`
          )
        }
      }
    })

    it('should have all items distributed across rarity arrays', () => {
      const totalInRarityArrays = Object.values(CONTRABAND_BY_RARITY).reduce(
        (sum, arr) => sum + arr.length,
        0
      )
      assert.equal(totalInRarityArrays, CONTRABAND_DB.length)
    })

    it('should have at least one item per rarity level', () => {
      for (const [rarity, items] of Object.entries(CONTRABAND_BY_RARITY)) {
        assert.ok(items.length > 0, `No items found for rarity: ${rarity}`)
      }
    })
  })

  describe('Regression: specific items verification', () => {
    it('should have c_void_energy with imagePrompt', () => {
      const item = CONTRABAND_BY_ID.get('c_void_energy')
      assert.ok(item, 'c_void_energy not found')
      assert.equal(Object.hasOwn(item, 'imagePrompt'), true)
      assert.equal(item.icon, 'icon_void_energy')
      assert.equal(item.type, 'consumable')
    })

    it('should have c_cursed_pick with imagePrompt', () => {
      const item = CONTRABAND_BY_ID.get('c_cursed_pick')
      assert.ok(item, 'c_cursed_pick not found')
      assert.equal(Object.hasOwn(item, 'imagePrompt'), true)
      assert.equal(item.icon, 'icon_cursed_pick')
      assert.equal(item.effectType, 'guitar_difficulty')
    })

    it('should have c_broken_compass with imagePrompt', () => {
      const item = CONTRABAND_BY_ID.get('c_broken_compass')
      assert.ok(item, 'c_broken_compass not found')
      assert.equal(Object.hasOwn(item, 'imagePrompt'), true)
      assert.equal(item.icon, 'icon_compass')
      assert.equal(item.type, 'equipment')
    })
  })

  describe('Edge cases and data integrity', () => {
    it('should not have any items with negative values for positive effects', () => {
      const positiveEffects = ['stamina', 'mood', 'harmony', 'luck']
      for (const item of CONTRABAND_DB) {
        if (positiveEffects.includes(item.effectType)) {
          assert.ok(
            item.value > 0,
            `Item ${item.id} with positive effect ${item.effectType} has non-positive value: ${item.value}`
          )
        }
      }
    })

    it('should have all equipment items marked as non-stackable', () => {
      const equipmentItems = CONTRABAND_DB.filter(
        item => item.type === 'equipment'
      )
      for (const item of equipmentItems) {
        // Exception: c_neon_patch is stackable equipment
        if (item.id !== 'c_neon_patch') {
          assert.equal(
            item.stackable,
            false,
            `Equipment item ${item.id} should not be stackable (except c_neon_patch)`
          )
        }
      }
    })

    it('should validate effectType values are valid strings', () => {
      const validEffectTypes = [
        'stamina',
        'luck',
        'guitar_difficulty',
        'mood',
        'harmony',
        'tempo',
        'crit',
        'stamina_max',
        'tour_success',
        'crowd_control',
        'gig_modifier',
        'practice_gain',
        'affinity',
        'style'
      ]

      for (const item of CONTRABAND_DB) {
        assert.ok(
          validEffectTypes.includes(item.effectType),
          `Item ${item.id} has invalid effectType: ${item.effectType}`
        )
      }
    })

    it('should have consistent naming convention for item IDs', () => {
      for (const item of CONTRABAND_DB) {
        assert.ok(
          item.id.startsWith('c_'),
          `Item ${item.id} does not follow naming convention (should start with c_)`
        )
        assert.ok(
          /^c_[a-z_]+$/.test(item.id),
          `Item ${item.id} contains invalid characters (should only have lowercase letters and underscores)`
        )
      }
    })
  })
})
