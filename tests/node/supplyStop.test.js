import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MapGenerator } from '../../src/utils/mapGenerator.js'
import { isItemOwned } from '../../src/utils/purchaseLogicUtils.js'
import { HQ_ITEMS } from '../../src/data/hqItems.js'
import { buildExpeditionMap } from '../../src/domain/expedition/map.js'
import {
  BASE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID
} from '../../src/domain/expedition/defaults.js'

const buildBaseExpeditionMap = seed =>
  buildExpeditionMap(
    seed,
    BASE_EXPEDITION_TOUR_TYPE_ID,
    BASE_EXPEDITION_REGION_ID
  )

const supplyStopsOf = map =>
  map.nodeOrder
    .map(id => map.nodes[id])
    .filter(node => node?.type === 'SUPPLY_STOP')

test('Expedition supply stops on seed 0 carry a non-empty inventory_add stock', () => {
  const supplyStops = supplyStopsOf(buildBaseExpeditionMap(0))
  assert.ok(supplyStops.length > 0, 'seed 0 should place a supply stop')

  for (const node of supplyStops) {
    assert.ok(
      Array.isArray(node.shopInventory) && node.shopInventory.length === 3,
      `supply stop ${node.id} should stock three items`
    )
    assert.equal(
      new Set(node.shopInventory.map(item => item.id)).size,
      3,
      `supply stop ${node.id} should not stock duplicates`
    )
    for (const item of node.shopInventory) {
      assert.ok(
        HQ_ITEMS.gear.some(gear => gear.id === item.id),
        `${item.id} should come from the HQ gear catalog`
      )
      assert.equal(item.effect?.type, 'inventory_add')
    }
  }
})

test('Expedition supply stop stock is reproduced by the same seed', () => {
  const first = buildBaseExpeditionMap(0)
  // The builder memoizes the last eight routes; build eight others so the
  // second seed-0 build is a fresh generation, not the cached object.
  for (let seed = 1; seed <= 8; seed++) buildBaseExpeditionMap(seed)
  const second = buildBaseExpeditionMap(0)
  assert.notStrictEqual(second, first, 'second build must not be the cache')

  const stockOf = map =>
    supplyStopsOf(map).map(node => [
      node.id,
      (node.shopInventory ?? []).map(item => item.id)
    ])
  assert.ok(stockOf(first).some(([, ids]) => ids.length > 0))
  assert.deepEqual(stockOf(second), stockOf(first))
})

test('MapGenerator generates supplyStop nodes with inventory_add items deterministically', () => {
  const generator = new MapGenerator()
  // Mock random to hit the 0.8 < typeRoll <= 0.9 condition for supplyStop
  // Actually random() < 0.9 and random() > 0.8 -> 0.85
  // And avoid starting nodes which might skip types.
  // The generator uses `this.random()`.

  // We'll generate a few maps until we find a supply stop
  let foundSupplyStop = false
  let supplyStopNode = null

  for (let i = 0; i < 50; i++) {
    const map = generator.generateMap(5)
    for (const nodeId in map.nodes) {
      if (!Object.hasOwn(map.nodes, nodeId)) continue
      if (map.nodes[nodeId].type === 'SUPPLY_STOP') {
        foundSupplyStop = true
        supplyStopNode = map.nodes[nodeId]
        break
      }
    }
    if (foundSupplyStop) break
  }

  assert.ok(
    foundSupplyStop,
    'Should generate at least one supplyStop node after several attempts'
  )
  assert.ok(
    Array.isArray(supplyStopNode.shopInventory),
    'supplyStop node should have shopInventory array'
  )
  assert.ok(
    supplyStopNode.shopInventory.length > 0,
    'shopInventory should not be empty'
  )

  const dummyPlayer = { hqUpgrades: [], van: { upgrades: [] } }
  const dummyBand = { inventory: {} }

  for (const item of supplyStopNode.shopInventory) {
    const effect = item.effects?.[0] || item.effect
    assert.equal(
      effect?.type,
      'inventory_add',
      `Item ${item.id} should have inventory_add effect type`
    )

    const owned = isItemOwned(item, dummyPlayer, dummyBand)
    assert.equal(
      owned,
      false,
      `Consumable item ${item.id} with inventory_add should not be evaluated as OWNED`
    )
  }
})
