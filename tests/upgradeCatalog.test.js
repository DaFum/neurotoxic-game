import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getUnifiedUpgradeCatalog } from '../src/data/upgradeCatalog.js'

test('getUnifiedUpgradeCatalog includes upgrades from all active sources', () => {
  const catalog = getUnifiedUpgradeCatalog()

  assert.ok(catalog.length > 0)
  assert.ok(catalog.some(item => item.id === 'hq_van_sound_system'))
  assert.ok(catalog.some(item => item.id === 'van_sound_system'))
  assert.ok(catalog.some(item => item.id === 'social_bot'))
})

test('getUnifiedUpgradeCatalog entries contain required purchase fields', () => {
  const catalog = getUnifiedUpgradeCatalog()

  catalog.forEach(item => {
    assert.strictEqual(typeof item.id, 'string')
    assert.strictEqual(typeof item.name, 'string')
    assert.strictEqual(typeof item.cost, 'number')
    assert.strictEqual(typeof item.currency, 'string')
    assert.ok(Array.isArray(item.effects))
    assert.ok(item.effects.length > 0)
    assert.strictEqual(typeof item.effects[0].type, 'string')
  })
})
