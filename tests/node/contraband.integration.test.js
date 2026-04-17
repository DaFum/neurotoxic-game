import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  _CONTRABAND_DB_FOR_TESTING as CONTRABAND_DB,
  CONTRABAND_BY_ID,
  CONTRABAND_BY_RARITY
} from '../../src/data/contraband'

/**
 * Integration tests for contraband data usage patterns
 * Ensures the presence of imagePrompt and that related workflows behave as expected
 */
describe('Contraband Integration Tests', () => {
  describe('Item consumption workflow', () => {
    it('should allow consumable items to be used with imagePrompt field', () => {
      const consumableItem = CONTRABAND_DB.find(
        item => item.type === 'consumable'
      )
      assert.ok(consumableItem, 'Should have at least one consumable item')

      const itemData = {
        ...consumableItem,
        quantity: 1
      }

      assert.ok(itemData.id)
      assert.ok(itemData.effectType)
      assert.ok(typeof itemData.value === 'number')
      assert.equal(Object.hasOwn(itemData, 'imagePrompt'), true)
    })

    it('should handle equipment items with imagePrompt field', () => {
      const equipmentItem = CONTRABAND_DB.find(
        item => item.type === 'equipment'
      )
      assert.ok(equipmentItem, 'Should have at least one equipment item')

      assert.ok(equipmentItem.icon)
      assert.equal(Object.hasOwn(equipmentItem, 'imagePrompt'), true)
      assert.equal(equipmentItem.applyOnAdd, true)
    })
  })

  describe('Item rendering data', () => {
    it('should have imagePrompt for all visual representation alongside icon', () => {
      for (const item of CONTRABAND_DB) {
        assert.ok(
          typeof item.icon === 'string' && item.icon.length > 0,
          `Item ${item.id} should have a valid icon field for rendering`
        )
        assert.equal(
          Object.hasOwn(item, 'imagePrompt'),
          true,
          `Item ${item.id} should have imagePrompt field`
        )
      }
    })

    it('should provide all necessary data for UI display with imagePrompt', () => {
      const randomItem = CONTRABAND_DB[0]

      const uiFields = {
        id: randomItem.id,
        name: randomItem.name,
        description: randomItem.description,
        icon: randomItem.icon,
        rarity: randomItem.rarity,
        type: randomItem.type,
        imagePrompt: randomItem.imagePrompt
      }

      for (const [field, value] of Object.entries(uiFields)) {
        assert.ok(
          value !== undefined && value !== null,
          `UI field ${field} should be present`
        )
      }
    })
  })

  describe('Loot drop system integration', () => {
    it('should support loot generation with imagePrompt', () => {
      for (const rarity of ['common', 'uncommon', 'rare', 'epic']) {
        const items = CONTRABAND_BY_RARITY[rarity]
        assert.ok(items.length > 0, `Should have items for ${rarity}`)

        const droppedItem = items[0]
        assert.ok(droppedItem.id)
        assert.ok(droppedItem.icon)
        assert.ok(droppedItem.name)
        assert.equal(Object.hasOwn(droppedItem, 'imagePrompt'), true)
      }
    })
  })

  describe('Inventory management integration', () => {
    it('should support stacking logic with imagePrompt intact', () => {
      const stackableItems = CONTRABAND_DB.filter(item => item.stackable)
      assert.ok(stackableItems.length > 0, 'Should have stackable items')

      for (const item of stackableItems) {
        assert.ok(item.id, 'Need id for stacking')
        assert.equal(item.stackable, true, 'Need stackable flag')

        if (item.maxStacks !== undefined) {
          assert.ok(item.maxStacks > 0, 'maxStacks should be positive')
        }

        assert.equal(Object.hasOwn(item, 'imagePrompt'), true)
      }
    })

    it('should support effect application with imagePrompt intact', () => {
      const effectItems = CONTRABAND_DB.filter(item => item.applyOnAdd)
      assert.ok(effectItems.length > 0, 'Should have effect items')

      for (const item of effectItems) {
        assert.ok(item.effectType, 'Need effectType')
        assert.ok(typeof item.value === 'number', 'Need value')
        assert.equal(item.applyOnAdd, true, 'Need applyOnAdd flag')
        assert.equal(Object.hasOwn(item, 'imagePrompt'), true)
      }
    })
  })

  describe('Persistence and serialization', () => {
    it('should serialize/deserialize items with imagePrompt', () => {
      const item = CONTRABAND_DB[0]

      const serialized = JSON.stringify(item)
      const deserialized = JSON.parse(serialized)

      assert.equal(deserialized.id, item.id)
      assert.equal(deserialized.name, item.name)
      assert.equal(deserialized.icon, item.icon)
      assert.equal(deserialized.rarity, item.rarity)
      assert.equal(deserialized.type, item.type)
      assert.equal(deserialized.imagePrompt, item.imagePrompt)
    })

    it('should have consistent item structure for all items', () => {
      // All items should have similar structure (allowing for optional fields)
      for (const item of CONTRABAND_DB) {
        const itemKeys = Object.keys(item)

        // Required keys should be present
        const requiredKeys = [
          'id',
          'name',
          'type',
          'effectType',
          'description',
          'rarity',
          'icon',
          'value',
          'stackable'
        ]

        for (const key of requiredKeys) {
          assert.ok(
            itemKeys.includes(key),
            `Item ${item.id} missing required key: ${key}`
          )
        }

        assert.ok(
          Object.hasOwn(item, 'imagePrompt'),
          `Item ${item.id} should have imagePrompt`
        )
      }
    })
  })

  describe('Backward compatibility', () => {
    it('should not break lookup by ID', () => {
      for (const item of CONTRABAND_DB) {
        const lookedUp = CONTRABAND_BY_ID.get(item.id)
        assert.ok(lookedUp, `Should find item ${item.id}`)
        assert.deepEqual(lookedUp, item, 'Looked up item should match')
        assert.equal(Object.hasOwn(lookedUp, 'imagePrompt'), true)
      }
    })
  })

  describe('Effect value validation', () => {
    it('should have reasonable effect values for game balance', () => {
      for (const item of CONTRABAND_DB) {
        const { effectType, value } = item

        // Validate value ranges make sense
        switch (effectType) {
          case 'stamina':
          case 'mood':
            assert.ok(
              value >= 1 && value <= 100,
              `${item.id} stamina/mood value should be 1-100, got ${value}`
            )
            break
          case 'guitar_difficulty':
            assert.ok(
              value >= -1 && value <= 1,
              `${item.id} difficulty modifier should be -1 to 1, got ${value}`
            )
            break
          case 'luck':
          case 'crit':
            assert.ok(
              value >= 0 && value <= 100,
              `${item.id} luck/crit should be 0-100, got ${value}`
            )
            break
          case 'tour_success':
          case 'tempo':
          case 'crowd_control':
          case 'gig_modifier':
            assert.ok(
              value >= 0 && value <= 1,
              `${item.id} multiplier should be 0-1, got ${value}`
            )
            break
        }
      }
    })
  })
})
