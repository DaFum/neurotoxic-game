import test from 'node:test'
import assert from 'node:assert'
import { calculateFuelCost, calculateMerchIncome, calculateGigFinancials } from '../../src/utils/economyEngine.ts'
import { NEUTRAL_ASSET_MODIFIERS } from '../../src/utils/assetSelectors.ts'
import { HQ_ITEMS_BY_MERCH_KEY } from '../../src/data/hqItems.ts'

test('Economy Asset Modifiers', async (t) => {
  await t.test('calculateFuelCost halves cost with 0.5 fuelMultiplier', () => {
    const legacy = calculateFuelCost(100, null, null, NEUTRAL_ASSET_MODIFIERS)
    const modified = calculateFuelCost(100, null, null, { ...NEUTRAL_ASSET_MODIFIERS, fuelMultiplier: 0.5 })
    assert.strictEqual(modified.fuelCost, Math.floor(legacy.fuelCost * 0.5))
  })

  await t.test('calculateMerchIncome applies multipliers correctly', () => {
    const inventory = { shirts: 10 }
    const legacy = calculateMerchIncome(100, 100, {}, { merch: true }, inventory, {}, NEUTRAL_ASSET_MODIFIERS)

    const modifiers = {
      ...NEUTRAL_ASSET_MODIFIERS,
      avgMerchSalePriceBonus: 50,
      merchCostMultiplier: 0.5,
      merchCapacityBonus: 5
    }

    const modified = calculateMerchIncome(100, 100, {}, { merch: true }, inventory, {}, modifiers)

    assert.ok(modified.revenue > legacy.revenue, 'Revenue should increase due to sale price bonus')
    assert.ok(modified.soldItems['shirts'] > 0, 'Should sell items')
    assert.ok(modified.expenseItems.length > 0, 'Should return expense items for production costs')

    // Capacity cap extension validation
    const lowInventory = { shirts: 0 }
    const noCap = calculateMerchIncome(100, 100, {}, { merch: true }, lowInventory, {}, NEUTRAL_ASSET_MODIFIERS)
    assert.strictEqual(noCap.soldItems['shirts'] ?? 0, 0, 'Should sell 0 without capacity bonus')

    const withCap = calculateMerchIncome(100, 100, {}, { merch: true }, lowInventory, {}, modifiers)
    assert.ok((withCap.soldItems['shirts'] ?? 0) > 0, 'Should sell >0 with capacity bonus')
  })

  await t.test('calculateGigFinancials applies tip bonus', () => {
    const gigData = { capacity: 100, price: 10, pay: 100, name: 'Test Gig' }
    const legacy = calculateGigFinancials({ gigData, performanceScore: 100, modifiers: {}, bandInventory: {}, gigStats: {} }, NEUTRAL_ASSET_MODIFIERS)

    const modifiers = {
      ...NEUTRAL_ASSET_MODIFIERS,
      tipBonusGigs: 20
    }
    const modified = calculateGigFinancials({ gigData, performanceScore: 100, modifiers: {}, bandInventory: {}, gigStats: {} }, modifiers)

    assert.ok(modified.income.total > legacy.income.total, 'Income should increase with tip bonus')

    const hasTipItem = modified.income.breakdown.some(i => i.labelKey === 'economy:gigIncome.tipBonus.label')
    assert.ok(hasTipItem, 'Should have tip bonus breakdown item')
  })
})
