import assert from 'node:assert'
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
    assert.equal(typeof item.id, 'string')
    assert.equal(typeof item.name, 'string')
    assert.equal(typeof item.cost, 'number')
    assert.equal(typeof item.currency, 'string')
    assert.ok(item.effect)
  })
})
