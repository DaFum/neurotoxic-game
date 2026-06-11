import test from 'node:test'
import assert from 'node:assert'
import {
  calculateFuelCost,
  calculateGigModifierCost,
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

  await t.test(
    'calculateGigFinancials applies context.bandGigModifier as income line',
    () => {
      const gigData = { capacity: 100, price: 10, pay: 100, name: 'Test Gig' }
      const baseParams = {
        gigData,
        performanceScore: 100,
        modifiers: {},
        bandInventory: {},
        gigStats: {}
      }
      const legacy = calculateGigFinancials(baseParams, NEUTRAL_ASSET_MODIFIERS)

      const modified = calculateGigFinancials(
        { ...baseParams, context: { bandGigModifier: 0.12 } },
        NEUTRAL_ASSET_MODIFIERS
      )

      assert.ok(
        modified.income.total > legacy.income.total,
        'Income should increase with band gig modifier'
      )
      const bonusItem = modified.income.breakdown.find(
        i => i.labelKey === 'economy:gigIncome.bandBonus.label'
      )
      assert.ok(bonusItem, 'Should have band bonus breakdown item')
      // Net must stay reconciled: income - expenses === net
      assert.strictEqual(
        modified.net,
        modified.income.total - modified.expenses.total
      )

      // Non-finite modifiers are ignored
      const hostile = calculateGigFinancials(
        { ...baseParams, context: { bandGigModifier: Infinity } },
        NEUTRAL_ASSET_MODIFIERS
      )
      assert.strictEqual(hostile.income.total, legacy.income.total)
    }
  )

  await t.test('calculateGigFinancials applies songQualityBonus', () => {
    const params = {
      gigData: { capacity: 150, price: 12, pay: 100, name: 'Test Gig' },
      performanceScore: 45,
      modifiers: { merch: true },
      bandInventory: {
        shirts: 50,
        hoodies: 25,
        cds: 30,
        patches: 80,
        vinyl: 20
      },
      gigStats: { peakHype: 50, misses: 0 }
    }
    const legacy = calculateGigFinancials(params, NEUTRAL_ASSET_MODIFIERS)
    const modified = calculateGigFinancials(params, {
      ...NEUTRAL_ASSET_MODIFIERS,
      songQualityBonus: 0.25
    })

    assert.ok(
      modified.income.total > legacy.income.total,
      'Song quality bonus should improve performance-sensitive income'
    )
  })

  await t.test(
    'calculateGigModifierCost applies songCostMultiplier to soundcheck',
    () => {
      const legacy = calculateGigModifierCost(
        'soundcheck',
        NEUTRAL_ASSET_MODIFIERS
      )
      const modified = calculateGigModifierCost('soundcheck', {
        ...NEUTRAL_ASSET_MODIFIERS,
        songCostMultiplier: 0.5
      })

      assert.strictEqual(modified, Math.ceil(legacy * 0.5))
      assert.strictEqual(
        calculateGigModifierCost('promo', {
          ...NEUTRAL_ASSET_MODIFIERS,
          songCostMultiplier: 0.5
        }),
        calculateGigModifierCost('promo', NEUTRAL_ASSET_MODIFIERS),
        'Song cost multiplier should only affect song-prep costs'
      )
    }
  )

  await t.test('calculateGigFinancials applies enablesReRecording', () => {
    const params = {
      gigData: { capacity: 150, price: 12, pay: 100, name: 'Test Gig' },
      performanceScore: 45,
      modifiers: { merch: true },
      bandInventory: {
        shirts: 50,
        hoodies: 25,
        cds: 30,
        patches: 80,
        vinyl: 20
      },
      gigStats: { peakHype: 50, misses: 0 }
    }
    const legacy = calculateGigFinancials(params, NEUTRAL_ASSET_MODIFIERS)
    const modified = calculateGigFinancials(params, {
      ...NEUTRAL_ASSET_MODIFIERS,
      flags: {
        ...NEUTRAL_ASSET_MODIFIERS.flags,
        enablesReRecording: true
      }
    })

    assert.ok(
      modified.income.total > legacy.income.total,
      'Re-recording should improve the existing quality-sensitive income path'
    )
  })

  await t.test(
    'calculateMerchIncome applies enablesLimitedEditions as a merch price lift',
    () => {
      const inventory = {
        shirts: 50,
        hoodies: 25,
        cds: 30,
        patches: 80,
        vinyl: 20
      }
      const legacy = calculateMerchIncome(
        120,
        80,
        { peakHype: 70, misses: 0 },
        { merch: true },
        inventory,
        {},
        NEUTRAL_ASSET_MODIFIERS
      )
      const modified = calculateMerchIncome(
        120,
        80,
        { peakHype: 70, misses: 0 },
        { merch: true },
        inventory,
        {},
        {
          ...NEUTRAL_ASSET_MODIFIERS,
          flags: {
            ...NEUTRAL_ASSET_MODIFIERS.flags,
            enablesLimitedEditions: true
          }
        }
      )

      assert.ok(
        modified.revenue > legacy.revenue,
        'Limited editions should raise merch revenue'
      )
    }
  )
})
