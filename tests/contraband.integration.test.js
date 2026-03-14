import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CONTRABAND_DB,
  CONTRABAND_BY_ID,
  CONTRABAND_BY_RARITY
} from '../src/data/contraband.js'

/**
 * Integration tests for contraband data usage patterns
 * Ensures the removal of imagePrompt doesn't break expected workflows
 */
describe('Contraband Integration Tests', () => {
  describe('Item consumption workflow', () => {
    it('should allow consumable items to be used without imagePrompt field', () => {
      const consumableItem = CONTRABAND_DB.find(
        item => item.type === 'consumable'
      )
      assert.ok(consumableItem, 'Should have at least one consumable item')

      // Simulate using the item - should not require imagePrompt
      const itemData = {
        ...consumableItem,
        quantity: 1
      }

      assert.ok(itemData.id)
      assert.ok(itemData.effectType)
      assert.ok(typeof itemData.value === 'number')
      assert.equal(Object.hasOwn(itemData, 'imagePrompt'), false)
    })

    it('should handle equipment items without imagePrompt field', () => {
      const equipmentItem = CONTRABAND_DB.find(
        item => item.type === 'equipment'
      )
      assert.ok(equipmentItem, 'Should have at least one equipment item')

      // Equipment should have icon instead of imagePrompt
      assert.ok(equipmentItem.icon)
      assert.equal(Object.hasOwn(equipmentItem, 'imagePrompt'), false)
      assert.equal(equipmentItem.applyOnAdd, true)
    })
  })

  describe('Item rendering data', () => {
    it('should use icon field for all visual representation', () => {
      for (const item of CONTRABAND_DB) {
        // Icon should be the source of visual data, not imagePrompt
        assert.ok(
          typeof item.icon === 'string' && item.icon.length > 0,
          `Item ${item.id} should have a valid icon field for rendering`
        )
        assert.equal(
          Object.hasOwn(item, 'imagePrompt'),
          false,
          `Item ${item.id} should not have imagePrompt field`
        )
      }
    })

    it('should provide all necessary data for UI display without imagePrompt', () => {
      const randomItem = CONTRABAND_DB[0]

      // Verify all UI-necessary fields exist without imagePrompt
      const uiFields = {
        id: randomItem.id,
        name: randomItem.name,
        description: randomItem.description,
        icon: randomItem.icon,
        rarity: randomItem.rarity,
        type: randomItem.type
      }

      for (const [field, value] of Object.entries(uiFields)) {
        assert.ok(
          value !== undefined && value !== null,
          `UI field ${field} should be present`
        )
      }

      assert.equal(
        Object.hasOwn(randomItem, 'imagePrompt'),
        false,
        'UI display should not depend on imagePrompt'
      )
    })
  })

  describe('Loot drop system integration', () => {
    it('should support loot generation without imagePrompt', () => {
      // Simulate loot drop from each rarity tier
      for (const rarity of ['common', 'uncommon', 'rare', 'epic']) {
        const items = CONTRABAND_BY_RARITY[rarity]
        assert.ok(items.length > 0, `Should have items for ${rarity}`)

        const droppedItem = items[0]
        // Verify dropped item has all necessary fields without imagePrompt
        assert.ok(droppedItem.id)
        assert.ok(droppedItem.icon)
        assert.ok(droppedItem.name)
        assert.equal(Object.hasOwn(droppedItem, 'imagePrompt'), false)
      }
    })
  })

  describe('Inventory management integration', () => {
    it('should support stacking logic without imagePrompt', () => {
      const stackableItems = CONTRABAND_DB.filter(item => item.stackable)
      assert.ok(stackableItems.length > 0, 'Should have stackable items')

      for (const item of stackableItems) {
        // Verify stacking logic only needs these fields
        assert.ok(item.id, 'Need id for stacking')
        assert.equal(item.stackable, true, 'Need stackable flag')

        // maxStacks can be undefined for unlimited stacking
        if (item.maxStacks !== undefined) {
          assert.ok(item.maxStacks > 0, 'maxStacks should be positive')
        }

        assert.equal(
          Object.hasOwn(item, 'imagePrompt'),
          false,
          'Stacking logic should not need imagePrompt'
        )
      }
    })

    it('should support effect application without imagePrompt', () => {
      const effectItems = CONTRABAND_DB.filter(item => item.applyOnAdd)
      assert.ok(effectItems.length > 0, 'Should have effect items')

      for (const item of effectItems) {
        // Verify effect application only needs these fields
        assert.ok(item.effectType, 'Need effectType')
        assert.ok(typeof item.value === 'number', 'Need value')
        assert.equal(item.applyOnAdd, true, 'Need applyOnAdd flag')

        assert.equal(
          Object.hasOwn(item, 'imagePrompt'),
          false,
          'Effect system should not need imagePrompt'
        )
      }
    })
  })

  describe('Persistence and serialization', () => {
    it('should serialize/deserialize items without imagePrompt', () => {
      const item = CONTRABAND_DB[0]

      // Simulate save/load cycle
      const serialized = JSON.stringify(item)
      const deserialized = JSON.parse(serialized)

      // Verify all important data survives serialization
      assert.equal(deserialized.id, item.id)
      assert.equal(deserialized.name, item.name)
      assert.equal(deserialized.icon, item.icon)
      assert.equal(deserialized.rarity, item.rarity)
      assert.equal(deserialized.type, item.type)

      // Verify imagePrompt is not in serialized data
      assert.equal(Object.hasOwn(deserialized, 'imagePrompt'), false)
    })

    it('should have consistent item structure for all items', () => {
      // Get the first item's keys as reference
      const referenceItem = CONTRABAND_DB[0]
      const baseKeys = Object.keys(referenceItem).sort()

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
          'icon'
        ]

        for (const key of requiredKeys) {
          assert.ok(
            itemKeys.includes(key),
            `Item ${item.id} missing required key: ${key}`
          )
        }

        // imagePrompt should never be present
        assert.ok(
          !itemKeys.includes('imagePrompt'),
          `Item ${item.id} should not have imagePrompt`
        )
      }
    })
  })

  describe('Backward compatibility', () => {
    it('should work with code that checks for icon presence', () => {
      // Old code might check for icon OR imagePrompt
      // Verify all items have icon (new way)
      for (const item of CONTRABAND_DB) {
        const hasVisual = item.icon || item.imagePrompt
        assert.ok(
          hasVisual,
          `Item ${item.id} should have a visual representation`
        )
        assert.ok(item.icon, `Item ${item.id} should specifically have icon`)
      }
    })

    it('should not break lookup by ID after imagePrompt removal', () => {
      // Verify Map lookup still works
      for (const item of CONTRABAND_DB) {
        const lookedUp = CONTRABAND_BY_ID.get(item.id)
        assert.ok(lookedUp, `Should find item ${item.id}`)
        assert.deepEqual(lookedUp, item, 'Looked up item should match')
        assert.equal(
          Object.hasOwn(lookedUp, 'imagePrompt'),
          false,
          'Looked up item should not have imagePrompt'
        )
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