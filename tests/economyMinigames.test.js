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
    // 3 Fuel cans -> 1.5L bonus
    const result = calculateTravelMinigameResult(20, ['FUEL', 'FUEL', 'FUEL'])
    assert.strictEqual(result.conditionLoss, 10)
    assert.strictEqual(result.fuelBonus, 1.5)
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

  await t.test('Kabelsalat Minigame Results', () => {
    // Not powered on -> high stress, no reward
    const resultFail = calculateKabelsalatMinigameResult(
      { isPoweredOn: false, timeLeft: 0 },
      { members: [] }
    )
    assert.strictEqual(resultFail.stress, 15)
    assert.strictEqual(resultFail.reward, 0)

    // Powered on, fast clear (25 seconds left)
    // timeBonus = 25 / 5 = 5. reward = 60 + 5 * 15 = 135
    const resultFast = calculateKabelsalatMinigameResult(
      { isPoweredOn: true, timeLeft: 25 },
      { members: [] }
    )
    assert.strictEqual(resultFast.stress, 0)
    assert.strictEqual(resultFast.reward, 135)
  })

  await t.test('Kabelsalat Minigame Edge Cases', () => {
    // With Matze's Tech Wizard trait -> reward multiplied by 1.5
    const resultTrait = calculateKabelsalatMinigameResult(
      { isPoweredOn: true, timeLeft: 25 }, // Base 135 reward
      {
        members: [
          { name: 'Matze', traits: { tech_wizard: { id: 'tech_wizard' } } }
        ]
      }
    )
    assert.strictEqual(resultTrait.stress, 0)
    assert.strictEqual(resultTrait.reward, 202) // 135 * 1.5 = 202.5 -> floor -> 202
  })
})
