import { test } from 'node:test'
import assert from 'node:assert'
import {
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult,
  calculateKabelsalatMinigameResult
} from '../src/utils/economyEngine.js'

test('Minigame Economy Calculations', async t => {
  await t.test('Travel Minigame Results', () => {
    // 20 damage -> 10% condition loss (50% scaling)
    // 3 Fuel cans -> 0L bonus (disabled)
    const result = calculateTravelMinigameResult(20, ['FUEL', 'FUEL', 'FUEL'])
    assert.strictEqual(result.conditionLoss, 10)
    assert.strictEqual(result.fuelBonus, 0)
  })

  await t.test('Travel Minigame Edge Cases', () => {
    // Null items
    // 10 damage -> 5 condition loss
    const resultNull = calculateTravelMinigameResult(10, null)
    assert.strictEqual(resultNull.conditionLoss, 5)
    assert.strictEqual(resultNull.fuelBonus, 0)

    // Undefined items
    const resultUndef = calculateTravelMinigameResult(10, undefined)
    assert.strictEqual(resultUndef.fuelBonus, 0)
  })

  await t.test('Roadie Minigame Results', () => {
    // 50 damage -> 10 stress, 100 cost
    const result = calculateRoadieMinigameResult(50)
    assert.strictEqual(result.stress, 10)
    assert.strictEqual(result.repairCost, 100)
  })

  await t.test('Roadie Minigame Edge Cases', () => {
    // Negative damage should be clamped to 0
    const resultNeg = calculateRoadieMinigameResult(-10)
    assert.strictEqual(resultNeg.stress, 0)
    assert.strictEqual(resultNeg.repairCost, 0)

    // Undefined/Null damage
    const resultNull = calculateRoadieMinigameResult(null)
    assert.strictEqual(resultNull.stress, 0)
  })

  await t.test('Kabelsalat Minigame Results - Success', () => {
    // 20 time left -> 4 bonus * 10 = 40 + 50 base = 90 reward, 0 stress
    const result = calculateKabelsalatMinigameResult({ isPoweredOn: true, timeLeft: 20 }, {})
    assert.strictEqual(result.reward, 90)
    assert.strictEqual(result.stress, 0)
  })

  await t.test('Kabelsalat Minigame Results - Failure', () => {
    // isPoweredOn: false -> 10 stress, 0 reward
    const result = calculateKabelsalatMinigameResult({ isPoweredOn: false, timeLeft: 5 }, {})
    assert.strictEqual(result.reward, 0)
    assert.strictEqual(result.stress, 10)
  })

  await t.test('Kabelsalat Minigame Results - Trait: tech_wizard', () => {
    // 20 time left -> 90 base reward -> tech_wizard applies 1.5x -> 135
    const bandState = {
      members: [
        { name: 'Alice', traits: [{ id: 'tech_wizard' }] }
      ]
    }
    const result = calculateKabelsalatMinigameResult({ isPoweredOn: true, timeLeft: 20 }, bandState)
    assert.strictEqual(result.reward, 135)
    assert.strictEqual(result.stress, 0)
  })
})
