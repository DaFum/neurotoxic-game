import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MapGenerator } from '../../src/utils/mapGenerator.js'
import { isItemOwned } from '../../src/utils/purchaseLogicUtils.js'

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
      if (!Object.hasOwn(map.nodes, nodeId)) continue;
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
