
import { test } from 'node:test'
import assert from 'node:assert'
import { calculateTravelMinigameResult, calculateRoadieMinigameResult } from '../src/utils/economyEngine.js'

test('Minigame Economy Calculations', async (t) => {
  await t.test('Travel Minigame Results', () => {
    // 20 damage -> 2% condition loss
    // 3 Fuel cans -> 30L bonus
    const result = calculateTravelMinigameResult(20, ['FUEL', 'FUEL', 'FUEL'])
    assert.strictEqual(result.conditionLoss, 2)
    assert.strictEqual(result.fuelBonus, 30)
  })

  await t.test('Roadie Minigame Results', () => {
    // 50 damage -> 10 stress, 100 cost
    const result = calculateRoadieMinigameResult(50)
    assert.strictEqual(result.stress, 10)
    assert.strictEqual(result.repairCost, 100)
  })
})
