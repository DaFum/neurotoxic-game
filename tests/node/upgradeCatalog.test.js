import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HQ_ITEMS } from '../../src/data/hqItems'
import { getUnifiedUpgradeCatalog } from '../../src/data/upgradeCatalog'

test('getUnifiedUpgradeCatalog includes only upgrade-tab sources', () => {
  const catalog = getUnifiedUpgradeCatalog()
  const catalogIds = new Set(catalog.map(item => item.id))

  assert.ok(catalog.length > 0)
  assert.ok(catalog.some(item => item.id === 'hq_van_sound_system'))
  assert.ok(catalog.some(item => item.id === 'hq_room_coffee'))
  assert.ok(catalog.some(item => item.id === 'social_bot'))
  assert.ok(catalog.some(item => item.id === 'label_contact'))

  for (const sourceItem of [...HQ_ITEMS.van, ...HQ_ITEMS.hq]) {
    assert.ok(
      catalogIds.has(sourceItem.id),
      `${sourceItem.id} must be present in the unified catalog`
    )
  }

  const shopIds = new Set(
    [...HQ_ITEMS.gear, ...HQ_ITEMS.instruments].map(item => item.id)
  )
  for (const item of catalog) {
    assert.equal(
      shopIds.has(item.id),
      false,
      `${item.id} belongs in the shop tab, not the upgrades tab`
    )
  }
})

test('getUnifiedUpgradeCatalog keeps van repair consumables repeatable', () => {
  const tapeGlue = getUnifiedUpgradeCatalog().find(
    item => item.id === 'hq_van_tape_glue'
  )

  assert.deepEqual(tapeGlue?.effects, [
    { type: 'inventory_add', item: 'tape_glue', value: 1 }
  ])
})

test('getUnifiedUpgradeCatalog entries contain required purchase fields', () => {
  const catalog = getUnifiedUpgradeCatalog()

  assert.ok(Array.isArray(catalog))
  assert.ok(catalog.length > 0)

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

test('getUnifiedUpgradeCatalog does not duplicate item ids', () => {
  const ids = getUnifiedUpgradeCatalog().map(item => item.id)

  assert.equal(new Set(ids).size, ids.length)
})

test('getUnifiedUpgradeCatalog excludes legacy aliases of canonical HQ upgrades', () => {
  const catalog = getUnifiedUpgradeCatalog()
  const ids = new Set(catalog.map(item => item.id))
  const duplicateLegacyIds = [
    'van_suspension',
    'van_sound_system',
    'van_storage',
    'guitar_custom',
    'drum_trigger',
    'bass_sansamp'
  ]

  for (const id of duplicateLegacyIds) {
    assert.equal(ids.has(id), false, `${id} duplicates a canonical HQ item`)
  }

  const mobileStudio = catalog.find(item => item.id === 'hq_van_sound_system')
  assert.deepStrictEqual(mobileStudio?.effects, [
    { type: 'passive', key: 'harmony_regen_travel' }
  ])
})

test('getUnifiedUpgradeCatalog exposes localized display keys', () => {
  for (const item of getUnifiedUpgradeCatalog()) {
    assert.match(item.name, /^items:/, `${item.id} name must use i18n`)
    assert.match(
      item.description,
      /^items:/,
      `${item.id} description must use i18n`
    )
  }
})
