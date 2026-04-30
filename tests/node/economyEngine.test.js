import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateGigFinancials,
  calculateTicketIncome,
  calculateEffectiveTicketPrice,
  calculateTravelExpenses,
  calculateFuelCost,
  calculateRefuelCost,
  calculateRepairCost,
  EXPENSE_CONSTANTS,
  calculateMerchIncome,
  calculateVenueSplit,
  calculateGuarantee,
  calculateBarCut,
  calculateSponsorshipBonuses,
  calculateGigExpenses
} from '../../src/utils/economyEngine'

const buildGigData = (overrides = {}) => ({
  capacity: 300,
  price: 15,
  pay: 500,
  dist: 100,
  diff: 3,
  ...overrides
})

const buildModifiers = (overrides = {}) => ({
  merch: false,
  promo: false,
  catering: false,
  ...overrides
})

const buildInventory = (overrides = {}) => ({
  shirts: 50,
  hoodies: 20,
  patches: 100,
  cds: 30,
  vinyl: 10,
  ...overrides
})

const buildGigStats = (overrides = {}) => ({
  misses: 0,
  perfectHits: 20,
  maxCombo: 15,
  peakHype: 80,
  toxicTimeTotal: 5000,
  ...overrides
})

test('calculateGigFinancials handles base case with ticket sales and guarantee', () => {
  const gigData = buildGigData()
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  assert.ok(result.income.total > 0, 'Should have positive income')
  assert.ok(result.expenses.total > 0, 'Should have expenses')
  assert.ok(result.income.breakdown.length > 0, 'Should have income breakdown')
  assert.ok(
    result.expenses.breakdown.length > 0,
    'Should have expense breakdown'
  )
  assert.equal(
    result.net,
    result.income.total - result.expenses.total,
    'Net should equal displayed income minus displayed expenses'
  )
  assert.ok(
    result.expenses.breakdown.some(
      item => item.labelKey === 'economy:gigExpenses.payoutDampener.label'
    ),
    'Payout dampener must be visible in the expense breakdown'
  )
})

// Parametrized: fame and promo modifier comparisons
const famePromoVariants = [
  {
    label: 'fame scaling [low vs high]',
    gigData: { capacity: 100, price: 10 },
    scenario1: {
      label: 'low fame',
      playerState: { fame: 10 }
    },
    scenario2: {
      label: 'high fame',
      playerState: { fame: 1000 }
    },
    expectedField: 'economy:gigIncome.ticketSales.label',
    assertion: (val1, val2) => val2 > val1
  },
  {
    label: 'promo boost [no promo vs with promo]',
    gigData: { capacity: 200 },
    scenario1: {
      label: 'no promo',
      modifiers: buildModifiers({ promo: false })
    },
    scenario2: {
      label: 'with promo',
      modifiers: buildModifiers({ promo: true })
    },
    expectedField: 'economy:gigIncome.ticketSales.label',
    assertion: (val1, val2) => val2 > val1
  }
]

famePromoVariants.forEach(variant => {
  test(`calculateGigFinancials applies ${variant.label}`, () => {
    const gigData = buildGigData(variant.gigData)

    const result1 = calculateGigFinancials({
      gigData: gigData,
      performanceScore: 80,
      modifiers: variant.scenario1.modifiers || buildModifiers(),
      bandInventory: buildInventory(),
      playerState: variant.scenario1.playerState || { fame: 50 },
      gigStats: buildGigStats()
    })

    const result2 = calculateGigFinancials({
      gigData: gigData,
      performanceScore: 80,
      modifiers: variant.scenario2.modifiers || buildModifiers(),
      bandInventory: buildInventory(),
      playerState: variant.scenario2.playerState || { fame: 50 },
      gigStats: buildGigStats()
    })

    const item1 = result1.income.breakdown.find(
      b => b.labelKey === variant.expectedField
    )
    const item2 = result2.income.breakdown.find(
      b => b.labelKey === variant.expectedField
    )

    assert.ok(
      variant.assertion(item1.value, item2.value),
      `${variant.label}: scenario2 (${variant.scenario2.label}) should have higher value than scenario1 (${variant.scenario1.label})`
    )
  })
})

test('calculateGigFinancials applies price sensitivity penalty', () => {
  const gigData = buildGigData({ capacity: 200, price: 25 }) // High price
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 50 },
    gigStats: buildGigStats()
  })

  // Should have reduced attendance due to high price
  const ticketItem = result.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.ticketSales.label'
  )
  assert.ok(ticketItem, 'Should have ticket sales')
  assert.ok(
    ticketItem.detailKey === 'economy:gigIncome.ticketSales.detail' &&
      ticketItem.detailParams?.sold !== undefined &&
      ticketItem.detailParams?.capacity !== undefined,
    'Should expose sold/capacity params for i18n interpolation'
  )
})

// Parametrized: merch sales scaling and performance effects
const merchVariants = [
  {
    label: 'merch scaling with performance [poor vs great]',
    performanceVariants: [
      { score: 40, label: 'poor' },
      { score: 95, label: 'great' }
    ],
    expectedField: 'economy:gigIncome.merchSales.label',
    assertion: (poorVal, greatVal) => greatVal > poorVal
  },
  {
    label: 'merch penalties for misses [no misses vs many misses]',
    gigStats: true,
    gigStatsVariants: [
      { misses: 0, label: 'no misses' },
      { misses: 20, label: 'many misses' }
    ],
    expectedField: 'economy:gigIncome.merchSales.label',
    assertion: (noMissVal, manyMissVal) => noMissVal > manyMissVal
  }
]

merchVariants.forEach(variant => {
  test(`calculateGigFinancials ${variant.label}`, () => {
    const gigData = buildGigData()

    if (variant.performanceVariants) {
      const result1 = calculateGigFinancials({
        gigData: gigData,
        performanceScore: variant.performanceVariants[0].score,
        modifiers: buildModifiers({ merch: true }),
        bandInventory: buildInventory(),
        playerState: { fame: 100 },
        gigStats: buildGigStats()
      })

      const result2 = calculateGigFinancials({
        gigData: gigData,
        performanceScore: variant.performanceVariants[1].score,
        modifiers: buildModifiers({ merch: true }),
        bandInventory: buildInventory(),
        playerState: { fame: 100 },
        gigStats: buildGigStats()
      })

      const item1 = result1.income.breakdown.find(
        b => b.labelKey === variant.expectedField
      )
      const item2 = result2.income.breakdown.find(
        b => b.labelKey === variant.expectedField
      )

      assert.ok(
        variant.assertion(item1.value, item2.value),
        `${variant.label}: ${variant.performanceVariants[1].label} should have higher value`
      )
    } else if (variant.gigStats) {
      const result1 = calculateGigFinancials({
        gigData: gigData,
        performanceScore: 80,
        modifiers: buildModifiers({ merch: true }),
        bandInventory: buildInventory(),
        playerState: { fame: 100 },
        gigStats: buildGigStats(variant.gigStatsVariants[0])
      })

      const result2 = calculateGigFinancials({
        gigData: gigData,
        performanceScore: 80,
        modifiers: buildModifiers({ merch: true }),
        bandInventory: buildInventory(),
        playerState: { fame: 100 },
        gigStats: buildGigStats(variant.gigStatsVariants[1])
      })

      const item1 = result1.income.breakdown.find(
        b => b.labelKey === variant.expectedField
      )
      const item2 = result2.income.breakdown.find(
        b => b.labelKey === variant.expectedField
      )

      assert.ok(
        variant.assertion(item1.value, item2.value),
        `${variant.label}: ${variant.gigStatsVariants[0].label} should have higher value`
      )
    }
  })
})

test('calculateGigFinancials applies S-rank merch bonus', () => {
  const gigData = buildGigData()

  const sRank = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 95,
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const bonusItem = sRank.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.hypeBonus.label'
  )
  assert.ok(bonusItem, 'S-rank should trigger hype bonus entry')
})

test('calculateGigFinancials handles sold out merch gracefully', () => {
  const gigData = buildGigData({ capacity: 500 })
  const emptyInventory = buildInventory({
    shirts: 0,
    hoodies: 0,
    patches: 0,
    cds: 0,
    vinyl: 0
  })

  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 90,
    modifiers: buildModifiers({ merch: true }),
    bandInventory: emptyInventory,
    playerState: { fame: 200 },
    gigStats: buildGigStats()
  })

  const merchItem = result.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.merchSales.label'
  )
  assert.equal(
    merchItem.value,
    0,
    'Sold out inventory should result in zero merch sales'
  )
})

test('calculateGigFinancials uses all inventory types for sales limit', () => {
  const gigData = buildGigData()
  // Only patches and vinyls available
  const inv = buildInventory({
    shirts: 0,
    hoodies: 0,
    cds: 0,
    patches: 50,
    vinyl: 50
  })

  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 100,
    modifiers: buildModifiers({ merch: true }),
    bandInventory: inv,
    playerState: { fame: 200 },
    gigStats: buildGigStats()
  })

  const merchItem = result.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.merchSales.label'
  )
  // Should sell something (patches/vinyls) even if shirts/hoodies/cds are 0
  assert.ok(
    merchItem.value > 0,
    'Should sell patches/vinyls if other items out'
  )
})

test('calculateGigFinancials no longer includes transport/food in gig report (handled via Travel phase)', () => {
  const gigData = buildGigData({ dist: 200 })
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const travelExpenseItems = result.expenses.breakdown.filter(b =>
    b.labelKey?.startsWith('economy:travelExpenses')
  )
  assert.equal(
    travelExpenseItems.length,
    0,
    'Travel-phase expenses (fuel, food) must NOT appear in gig report'
  )
})

test('calculateGigFinancials includes catering when enabled', () => {
  // Note: key renamed from 'energy' to 'catering' for standardization
  const gigData = buildGigData()

  const noCatering = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers({ catering: false }),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const withCatering = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers({ catering: true }),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const noCateringItem = noCatering.expenses.breakdown.find(
    b => b.labelKey === 'economy:gigExpenses.catering.label'
  )
  const cateringItem = withCatering.expenses.breakdown.find(
    b => b.labelKey === 'economy:gigExpenses.catering.label'
  )

  assert.ok(!noCateringItem, 'Should NOT charge for Catering when disabled')
  assert.ok(
    cateringItem && cateringItem.value > 0,
    'Should charge for Catering/Energy when enabled'
  )
})

test('calculateGigFinancials supports new merch key', () => {
  const gigData = buildGigData()

  const withMerchKey = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers({ merch: true, merchTable: false }),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const merchItem = withMerchKey.expenses.breakdown.find(
    b => b.labelKey === 'economy:gigExpenses.merchStand.label'
  )
  assert.ok(
    merchItem && merchItem.value > 0,
    'Should charge for Merch Stand using "merch" key'
  )
})

test('calculateGigFinancials handles zero capacity venue', () => {
  const gigData = buildGigData({ capacity: 0, price: 0 })
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const ticketItem = result.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.ticketSales.label'
  )
  assert.equal(
    ticketItem.value,
    0,
    'Zero capacity should result in zero ticket sales'
  )
})

test('calculateGigFinancials handles extreme performance scores', () => {
  const gigData = buildGigData()

  // Test with 0 score
  const zeroScore = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 0,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })
  assert.ok(zeroScore.net !== undefined, 'Should handle zero performance score')

  // Test with 100 score
  const perfectScore = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 100,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })
  assert.ok(
    perfectScore.net !== undefined,
    'Should handle perfect performance score'
  )
  assert.ok(
    perfectScore.income.total > zeroScore.income.total,
    'Perfect score should yield more income'
  )
})

test('calculateGigFinancials merch table modifier increases sales', () => {
  const gigData = buildGigData()

  const noTable = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers({ merchTable: false }),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const withTable = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerState: { fame: 100 },
    gigStats: buildGigStats()
  })

  const noTableMerch = noTable.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.merchSales.label'
  )
  const tableMerch = withTable.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.merchSales.label'
  )

  assert.ok(
    tableMerch.value > noTableMerch.value,
    'Merch table should increase sales'
  )
})

test('EXPENSE_CONSTANTS are properly defined', () => {
  assert.ok(EXPENSE_CONSTANTS.TRANSPORT, 'Should have TRANSPORT constants')
  assert.ok(EXPENSE_CONSTANTS.FOOD, 'Should have FOOD constants')
  assert.ok(
    EXPENSE_CONSTANTS.ACCOMMODATION,
    'Should have ACCOMMODATION constants'
  )
  assert.ok(
    EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE > 0,
    'Fuel price should be positive'
  )
})

test('calculateGigFinancials net profit matches income minus expenses', () => {
  const gigData = buildGigData()
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 75,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 150 },
    gigStats: buildGigStats()
  })

  assert.equal(
    result.net,
    result.income.total - result.expenses.total,
    'Net should be exactly income minus expenses'
  )
})

test('calculateGigFinancials handles high fame with high price', () => {
  const gigData = buildGigData({ capacity: 500, price: 40 })
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 85,
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerState: { fame: 5000 },
    gigStats: buildGigStats()
  })

  // High fame should mitigate price penalty
  const ticketItem = result.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.ticketSales.label'
  )
  assert.ok(
    ticketItem.value > 0,
    'High fame should still sell tickets at high price'
  )
})

test('calculateTravelExpenses returns correct cost structure', () => {
  // Mock node
  const node = { venue: { x: 50, y: 50, name: 'Center' } }
  // Relative to center (default fromNode):
  // dist = 20 (base minimum)
  // fuelLiters = 2.4 (reported separately)
  // foodCost = 24 (3 * 8)
  // logisticsCost = 18 base + 0 distance + 0 fame + 0 cash reserve = 18
  // totalCost = food + logistics = 42

  const result = calculateTravelExpenses(node)

  assert.equal(
    result.dist,
    20,
    'Distance should be 20 (base cost) for center node'
  )
  assert.ok(
    Math.abs(result.fuelLiters - 2.4) < 0.001,
    'Fuel liters should be approx 2.4'
  )
  assert.equal(
    result.totalCost,
    42,
    'Total cost should be 42 (Food + Logistics)'
  )
})

test('calculateTravelExpenses computes distance consistently across node coordinates', () => {
  const nodeA = { x: 50, y: 50 }
  const nodeB = { x: 50, y: 50 }
  const dist = calculateTravelExpenses(nodeA, nodeB).dist
  assert.equal(dist, 20, 'Distance should be 20 for same point')

  const nodeC = { x: 53, y: 54 } // dx=3, dy=4. sqrt(25)=5. dist = 5*5 + 20 = 45.
  const dist2 = calculateTravelExpenses(nodeA, nodeC).dist
  assert.equal(dist2, 45, 'Distance should be 45 for 3-4-5 triangle')
})

test('calculateFuelCost applies van tuning upgrade', () => {
  const dist = 100
  // Without upgrade
  const res1 = calculateFuelCost(dist, null)
  assert.equal(res1.fuelLiters, 12)

  // With upgrade
  const playerState = {
    van: {
      upgrades: ['van_tuning']
    }
  }
  const res2 = calculateFuelCost(dist, playerState)
  assert.equal(res2.fuelLiters, 12 * 0.8)
})

// Note: calculateGigFinancials no longer applies upgrades to fuel because fuel is not in the gig report.
// Upgrade testing is handled in calculateFuelCost tests.

test('calculateRefuelCost calculates correctly', () => {
  // Max fuel = 100, Price = 1.75
  // Current fuel = 50. Missing = 50. Cost = 50 * 1.75 = 87.5 -> 88
  const cost = calculateRefuelCost(50)
  const expected = Math.ceil(50 * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)
  assert.equal(cost, expected)

  // Current fuel = 120 (overfilled). Missing = 0. Cost = 0.
  assert.equal(calculateRefuelCost(120), 0)
})

test('calculateRepairCost calculates correctly', () => {
  // Max condition = 100, Cost = 3
  // Current condition = 80. Missing = 20. Cost = 20 * 3 = 60
  const cost = calculateRepairCost(80)
  const expected = Math.ceil(
    20 * EXPENSE_CONSTANTS.TRANSPORT.REPAIR_COST_PER_UNIT
  )
  assert.equal(cost, expected)

  // Current condition = 100. Cost = 0.
  assert.equal(calculateRepairCost(100), 0)
})

test('calculateFuelCost applies road_warrior trait discount', () => {
  const dist = 100
  // Without trait
  const res1 = calculateFuelCost(dist, null, null)
  assert.equal(res1.fuelLiters, 12)

  // With trait (object map format required by hasTrait)
  const bandState = {
    members: [
      {
        traits: { road_warrior: { id: 'road_warrior' } }
      }
    ]
  }
  const res2 = calculateFuelCost(dist, null, bandState)
  // 12 * 0.85 = 10.2
  assert.ok(
    Math.abs(res2.fuelLiters - 10.2) < 1e-6,
    'fuelLiters within tolerance'
  )
})

test('calculateTicketIncome gig frequency penalty', async t => {
  await t.test('applies penalty if gig is same diff and within 4 days', () => {
    const gigData = { capacity: 100, price: 10, diff: 3 }
    const playerFame = 500
    const modifiers = {}

    // Valid context triggering penalty
    const contextPenalty = {
      lastGigDifficulty: 3,
      daysSinceLastGig: 2
    }
    const resultPenalty = calculateTicketIncome(
      gigData,
      playerFame,
      modifiers,
      contextPenalty
    )

    // Context bypassing penalty (different diff)
    const contextDifferentDiff = {
      lastGigDifficulty: 2,
      daysSinceLastGig: 2
    }
    const resultDifferentDiff = calculateTicketIncome(
      gigData,
      playerFame,
      modifiers,
      contextDifferentDiff
    )

    // Context bypassing penalty (days >= 4)
    const contextOldGig = {
      lastGigDifficulty: 3,
      daysSinceLastGig: 5
    }
    const resultOldGig = calculateTicketIncome(
      gigData,
      playerFame,
      modifiers,
      contextOldGig
    )

    // Context bypassing penalty (invalid daysSinceLastGig)
    const contextInvalidDays = {
      lastGigDifficulty: 3,
      daysSinceLastGig: 0
    }
    const resultInvalidDays = calculateTicketIncome(
      gigData,
      playerFame,
      modifiers,
      contextInvalidDays
    )

    assert.ok(
      resultPenalty.ticketsSold < resultDifferentDiff.ticketsSold,
      'Penalty should reduce tickets sold compared to different difficulty'
    )
    assert.ok(
      resultPenalty.ticketsSold < resultOldGig.ticketsSold,
      'Penalty should reduce tickets sold compared to an old gig'
    )
    assert.ok(
      resultPenalty.ticketsSold < resultInvalidDays.ticketsSold,
      'Penalty should not apply if daysSinceLastGig is 0'
    )
    assert.strictEqual(
      resultDifferentDiff.ticketsSold,
      resultOldGig.ticketsSold,
      'Bypassing penalty by diff or days should yield same result'
    )
  })
})

test('calculateEffectiveTicketPrice handles discounts correctly', async t => {
  await t.test('returns 0 if no gig data', () => {
    assert.equal(calculateEffectiveTicketPrice(null, {}), 0)
  })

  await t.test('returns original price if not discounted', () => {
    const gig = { price: 20 }
    assert.equal(
      calculateEffectiveTicketPrice(gig, { discountedTickets: false }),
      20
    )
  })

  await t.test('returns original price if price <= 10', () => {
    const gig = { price: 10 }
    assert.equal(
      calculateEffectiveTicketPrice(gig, { discountedTickets: true }),
      10
    )

    const gig2 = { price: 8 }
    assert.equal(
      calculateEffectiveTicketPrice(gig2, { discountedTickets: true }),
      8
    )
  })

  await t.test(
    'applies 50% discount if price > 10 and discountedTickets is true',
    () => {
      const gig = { price: 20 }
      assert.equal(
        calculateEffectiveTicketPrice(gig, { discountedTickets: true }),
        10
      )

      const gig2 = { price: 15 }
      assert.equal(
        calculateEffectiveTicketPrice(gig2, { discountedTickets: true }),
        7
      ) // Math.floor(7.5)
    }
  )
})

test('calculateGigFinancials handles zero capacity venue with zero fame safely', () => {
  // Verifies the specific regression case where capacity=0 and fame=0 creates 0/0 NaN cascades
  const result = calculateGigFinancials({
    gigData: { capacity: 0, price: 10, pay: 0 },
    performanceScore: 100,
    modifiers: {},
    bandInventory: { shirts: 50 },
    playerState: { fame: 0 }
  })

  // We should have 0 tickets, 0 revenue, and no NaNs
  assert.equal(result.income.total, 0)
  assert.equal(result.net, 0)
  assert.equal(result.expenses.total, 0)
  const ticketItem = result.income.breakdown.find(
    i => i.labelKey === 'economy:gigIncome.ticketSales.label'
  )
  assert.equal(ticketItem.value, 0)
  assert.equal(ticketItem.detailParams.sold, 0)
})

test('calculateGigFinancials uses effective price', () => {
  const gigData = buildGigData({ price: 20 })
  const score = 100
  const fame = 100

  const financialsNormal = calculateGigFinancials({
    gigData: gigData,
    performanceScore: score,
    playerState: { fame },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    context: { discountedTickets: false }
  })

  const financialsDiscount = calculateGigFinancials({
    gigData: gigData,
    performanceScore: score,
    playerState: { fame },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    context: { discountedTickets: true }
  })

  // Discounted tickets should increase attendance (due to +10% fill bonus and avoided price penalty)
  const normalTickets = financialsNormal.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.ticketSales.label'
  )
  const discountTickets = financialsDiscount.income.breakdown.find(
    b => b.labelKey === 'economy:gigIncome.ticketSales.label'
  )

  const normalSold = normalTickets.detailParams.sold
  const discountSold = discountTickets.detailParams.sold

  assert.ok(
    discountSold > normalSold,
    'Discounted tickets should result in higher attendance'
  )

  // Verify effective price was reduced (Revenue / Sold approx Price)
  const normalAvgPrice = normalTickets.value / normalSold
  const discountAvgPrice = discountTickets.value / discountSold

  // Normal price 20, Discount price 10
  assert.ok(Math.abs(normalAvgPrice - 20) < 0.1, 'Normal price should be ~20')
  assert.ok(
    Math.abs(discountAvgPrice - 10) < 0.1,
    'Discount price should be ~10'
  )
})

test('calculateTicketIncome gracefully handles missing/undefined params', () => {
  const result = calculateTicketIncome(
    undefined,
    undefined,
    undefined,
    undefined
  )
  assert.ok(result.revenue >= 0)
  assert.ok(result.ticketsSold >= 0)
})

test('calculateMerchIncome gracefully handles missing/undefined params', () => {
  const result = calculateMerchIncome(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  )
  assert.ok(result.revenue >= 0)
  assert.ok(result.cost >= 0)
})

test('calculateVenueSplit gracefully handles missing/undefined params', () => {
  const result = calculateVenueSplit(undefined, undefined)
  assert.ok(result.amount >= 0)
})

test('calculateGuarantee gracefully handles missing/undefined params', () => {
  const result = calculateGuarantee(undefined)
  assert.ok(result.amount >= 0)
})

test('calculateBarCut gracefully handles missing/undefined params', () => {
  const result = calculateBarCut(undefined, undefined)
  assert.ok(result.revenue >= 0)
})

test('calculateSponsorshipBonuses gracefully handles missing/undefined params', () => {
  const result = calculateSponsorshipBonuses(undefined)
  assert.ok(result.totalBonus >= 0)
})

test('calculateGigExpenses gracefully handles missing/undefined params', () => {
  const result = calculateGigExpenses(undefined)
  assert.ok(result.total >= 0)
})
