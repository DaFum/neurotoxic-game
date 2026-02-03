import { describe, it } from 'node:test'
import assert from 'node:assert'
import { HQ_ITEMS } from '../src/data/hqItems.js'

describe('HQ Items Data Integrity', () => {
  const itemIds = new Set()

  // Helper to validate a single item
  const validateItem = (item, category) => {
    // 1. ID Uniqueness & Namespace
    assert.ok(item.id, `Item in ${category} missing ID`)
    assert.ok(
      !itemIds.has(item.id),
      `Duplicate ID found: ${item.id} in ${category}`
    )
    itemIds.add(item.id)

    // 2. Required Fields
    assert.ok(item.name, `Item ${item.id} missing name`)
    assert.ok(typeof item.cost === 'number', `Item ${item.id} invalid cost`)
    assert.ok(
      item.cost % 10 === 0,
      `Item ${item.id} cost ${item.cost} is not a multiple of 10`
    )
    assert.ok(
      ['money', 'fame'].includes(item.currency),
      `Item ${item.id} invalid currency`
    )
    assert.ok(item.description, `Item ${item.id} missing description`)
    assert.ok(item.img, `Item ${item.id} missing img key`)

    // 3. Effect Structure
    assert.ok(item.effect, `Item ${item.id} missing effect`)
    assert.ok(item.effect.type, `Item ${item.id} effect missing type`)

    const validTypes = [
      'inventory_set',
      'inventory_add',
      'stat_modifier',
      'unlock_upgrade',
      'unlock_hq'
    ]
    assert.ok(
      validTypes.includes(item.effect.type),
      `Item ${item.id} has invalid effect type: ${item.effect.type}`
    )

    // 4. Effect Specifics
    if (item.effect.type === 'stat_modifier') {
      assert.ok(item.effect.stat, `Item ${item.id} stat_modifier missing stat`)
      assert.ok(
        typeof item.effect.value === 'number',
        `Item ${item.id} stat_modifier missing value`
      )
    }
  }

  it('validates all gear items', () => {
    HQ_ITEMS.gear.forEach(item => validateItem(item, 'gear'))
  })

  it('validates all instrument items', () => {
    HQ_ITEMS.instruments.forEach(item => validateItem(item, 'instruments'))
  })

  it('validates all van items', () => {
    HQ_ITEMS.van.forEach(item => validateItem(item, 'van'))
  })

  it('validates all hq items', () => {
    HQ_ITEMS.hq.forEach(item => validateItem(item, 'hq'))
  })
})
