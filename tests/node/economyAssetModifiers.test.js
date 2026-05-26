import test from 'node:test'
import assert from 'node:assert'
import {
  calculateFuelCost,
  calculateMerchIncome,
  calculateGigFinancials,
  calculateRefuelCost
} from '../../src/utils/economyEngine.ts'
import { NEUTRAL_ASSET_MODIFIERS } from '../../src/utils/assetSelectors.ts'

test('Economy Asset Modifiers', async t => {
  await t.test('calculateFuelCost halves cost with 0.5 fuelMultiplier', () => {
    const legacy = calculateFuelCost(100, null, null, NEUTRAL_ASSET_MODIFIERS)
    const modified = calculateFuelCost(100, null, null, {
      ...NEUTRAL_ASSET_MODIFIERS,
      fuelMultiplier: 0.5
    })
    assert.strictEqual(modified.fuelCost, Math.floor(legacy.fuelCost * 0.5))
  })

  await t.test(
    'calculateRefuelCost halves cost with 0.5 fuelMultiplier',
    () => {
      const legacy = calculateRefuelCost(0)
      const modified = calculateRefuelCost(0, {
        ...NEUTRAL_ASSET_MODIFIERS,
        fuelMultiplier: 0.5
      })
      assert.strictEqual(modified, Math.ceil(legacy * 0.5))
    }
  )

  await t.test(
    'calculateMerchIncome applies avgMerchSalePriceBonus and merchCapacityBonus',
    () => {
      const inventory = { shirts: 10 }
      const legacy = calculateMerchIncome(
        100,
        100,
        {},
        { merch: true },
        inventory,
        {},
        NEUTRAL_ASSET_MODIFIERS
      )

      // avgMerchSalePriceBonus is a decimal fraction (0.50 = +50%).
      const priceBonusMod = {
        ...NEUTRAL_ASSET_MODIFIERS,
        avgMerchSalePriceBonus: 0.5
      }
      const modified = calculateMerchIncome(
        100,
        100,
        {},
        { merch: true },
        inventory,
        {},
        priceBonusMod
      )
      assert.ok(
        modified.revenue > legacy.revenue,
        'Revenue should rise with +50% sale price bonus'
      )
      // No expenseItems field on the return — production cost is out of scope
      // for the modifier surface; only sale-side bonuses apply here.
      assert.strictEqual(
        modified.expenseItems,
        undefined,
        'calculateMerchIncome should not expose expenseItems'
      )

      // merchCapacityBonus is a carry-cap modifier (raises restock ceiling),
      // NOT phantom stock. Selling at gig time is bounded by actual
      // on-hand inventory, so a 0-stock asset must sell 0 even with a
      // capacity bonus stacked on top.
      const lowInventory = { shirts: 0 }
      const noCap = calculateMerchIncome(
        100,
        100,
        {},
        { merch: true },
        lowInventory,
        {},
        NEUTRAL_ASSET_MODIFIERS
      )
      assert.strictEqual(
        noCap.soldItems.shirts ?? 0,
        0,
        'Should sell 0 with zero stock and no capacity bonus'
      )

      const capMod = {
        ...NEUTRAL_ASSET_MODIFIERS,
        merchCapacityBonus: 5
      }
      const withCap = calculateMerchIncome(
        100,
        100,
        {},
        { merch: true },
        lowInventory,
        {},
        capMod
      )
      assert.strictEqual(
        withCap.soldItems.shirts ?? 0,
        0,
        'merchCapacityBonus must NOT fabricate sellable stock when inventory is 0'
      )
    }
  )

  await t.test('calculateGigFinancials applies tipBonusGigs as decimal', () => {
    const gigData = { capacity: 100, price: 10, pay: 100, name: 'Test Gig' }
    const params = {
      gigData,
      performanceScore: 100,
      modifiers: {},
      bandInventory: {},
      gigStats: {}
    }
    const legacy = calculateGigFinancials(params, NEUTRAL_ASSET_MODIFIERS)

    // tipBonusGigs is a decimal (0.20 = +20%).
    const modifiers = {
      ...NEUTRAL_ASSET_MODIFIERS,
      tipBonusGigs: 0.2
    }
    const modified = calculateGigFinancials(params, modifiers)

    assert.ok(
      modified.income.total > legacy.income.total,
      'Income should increase with tip bonus'
    )

    const hasTipItem = modified.income.breakdown.some(
      i => i.labelKey === 'economy:gigIncome.tipBonus.label'
    )
    assert.ok(hasTipItem, 'Should have tip bonus breakdown item')
  })
})
