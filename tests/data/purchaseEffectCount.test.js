import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { getUnifiedUpgradeCatalog } from '../../src/data/upgradeCatalog'
import { ALL_HQ_ITEMS } from '../../src/data/hqItems'

// A purchase applies one effect (`getPrimaryEffect` reads `effects[0]`),
// so band patches never chain across effects. This pins that decision: a
// catalog item with a second effect would silently drop it, and chaining
// several band effects in one purchase is a separate, deliberate change.
describe('purchase catalog effect count', () => {
  it('gives every upgrade-tab item at most one effect', () => {
    for (const item of getUnifiedUpgradeCatalog()) {
      assert.ok(
        item.effects.length <= 1,
        `${item.id} declares ${item.effects.length} effects`
      )
    }
  })

  it('gives every shop item a single effect object, not a list', () => {
    for (const item of ALL_HQ_ITEMS) {
      assert.ok(
        !Array.isArray(item.effect),
        `${item.id} declares an effect list`
      )
    }
  })
})
