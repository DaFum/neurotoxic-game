import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateGigFinancials,
  calculateTravelExpenses,
  calculateFuelCost,
  EXPENSE_CONSTANTS
} from '../src/utils/economyEngine.js'

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
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
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
    'Net should equal income minus expenses'
  )
})

test('calculateGigFinancials applies fame scaling to fill rate', () => {
  const gigData = buildGigData({ capacity: 100, price: 10 })

  // Low fame scenario
  const lowFameResult = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 10,
    gigStats: buildGigStats()
  })

  // High fame scenario
  const highFameResult = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 1000,
    gigStats: buildGigStats()
  })

  const lowFameTickets = lowFameResult.income.breakdown.find(
    b => b.label === 'Ticket Sales'
  )
  const highFameTickets = highFameResult.income.breakdown.find(
    b => b.label === 'Ticket Sales'
  )

  assert.ok(
    highFameTickets.value > lowFameTickets.value,
    'High fame should result in more ticket sales'
  )
})

test('calculateGigFinancials applies promo boost to fill rate', () => {
  const gigData = buildGigData({ capacity: 200 })

  const noPromo = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ promo: false }),
    bandInventory: buildInventory(),
    playerStateOrFame: 50,
    gigStats: buildGigStats()
  })

  const withPromo = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ promo: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 50,
    gigStats: buildGigStats()
  })

  const noPromoTickets = noPromo.income.breakdown.find(
    b => b.label === 'Ticket Sales'
  )
  const promoTickets = withPromo.income.breakdown.find(
    b => b.label === 'Ticket Sales'
  )

  assert.ok(
    promoTickets.value > noPromoTickets.value,
    'Promo should increase ticket sales'
  )
})

test('calculateGigFinancials applies price sensitivity penalty', () => {
  const gigData = buildGigData({ capacity: 200, price: 25 }) // High price
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 50,
    gigStats: buildGigStats()
  })

  // Should have reduced attendance due to high price
  const ticketItem = result.income.breakdown.find(
    b => b.label === 'Ticket Sales'
  )
  assert.ok(ticketItem, 'Should have ticket sales')
  assert.ok(
    ticketItem.detail.includes('/'),
    'Should show tickets sold vs capacity'
  )
})

test('calculateGigFinancials scales merch sales with performance', () => {
  const gigData = buildGigData()

  const poorPerformance = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 40,
    crowdStats: { hype: 40 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const greatPerformance = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 95,
    crowdStats: { hype: 95 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const poorMerch = poorPerformance.income.breakdown.find(
    b => b.label === 'Merch Sales'
  )
  const greatMerch = greatPerformance.income.breakdown.find(
    b => b.label === 'Merch Sales'
  )

  assert.ok(
    greatMerch.value > poorMerch.value,
    'Better performance should increase merch sales'
  )
})

test('calculateGigFinancials applies S-rank merch bonus', () => {
  const gigData = buildGigData()

  const sRank = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 95,
    crowdStats: { hype: 95 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const bonusItem = sRank.income.breakdown.find(b => b.label === 'HYPE BONUS')
  assert.ok(bonusItem, 'S-rank should trigger hype bonus entry')
})

test('calculateGigFinancials penalizes merch sales for misses', () => {
  const gigData = buildGigData()

  const noMisses = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats({ misses: 0 })
  })

  const manyMisses = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats({ misses: 20 })
  })

  const noMissMerch = noMisses.income.breakdown.find(
    b => b.label === 'Merch Sales'
  )
  const missMerch = manyMisses.income.breakdown.find(
    b => b.label === 'Merch Sales'
  )

  assert.ok(
    noMissMerch.value > missMerch.value,
    'Misses should reduce merch sales'
  )
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
    crowdStats: { hype: 90 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: emptyInventory,
    playerStateOrFame: 200,
    gigStats: buildGigStats()
  })

  const merchItem = result.income.breakdown.find(b => b.label === 'Merch Sales')
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
    crowdStats: { hype: 100 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: inv,
    playerStateOrFame: 200,
    gigStats: buildGigStats()
  })

  const merchItem = result.income.breakdown.find(b => b.label === 'Merch Sales')
  // Should sell something (patches/vinyls) even if shirts/hoodies/cds are 0
  assert.ok(
    merchItem.value > 0,
    'Should sell patches/vinyls if other items out'
  )
})

test('calculateGigFinancials includes transport costs based on distance', () => {
  const gigData = buildGigData({ dist: 200 })
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const fuelItem = result.expenses.breakdown.find(b => b.label === 'Fuel')
  assert.ok(fuelItem, 'Should include fuel costs')
  assert.ok(fuelItem.value > 0, 'Fuel cost should be positive for distance > 0')
})

test('calculateGigFinancials includes catering when enabled', () => {
  // Note: key renamed from 'energy' to 'catering' for standardization
  const gigData = buildGigData()

  const noCatering = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ catering: false }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const withCatering = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ catering: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const noCateringItem = noCatering.expenses.breakdown.find(
    b => b.label && b.label.includes('Catering')
  )
  const cateringItem = withCatering.expenses.breakdown.find(
    b => b.label && b.label.includes('Catering')
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
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ merch: true, merchTable: false }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const merchItem = withMerchKey.expenses.breakdown.find(
    b => b.label === 'Merch Stand'
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
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const ticketItem = result.income.breakdown.find(
    b => b.label === 'Ticket Sales'
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
    crowdStats: { hype: 0 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })
  assert.ok(zeroScore.net !== undefined, 'Should handle zero performance score')

  // Test with 100 score
  const perfectScore = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 100,
    crowdStats: { hype: 100 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
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
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ merchTable: false }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const withTable = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers({ merch: true }),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })

  const noTableMerch = noTable.income.breakdown.find(
    b => b.label === 'Merch Sales'
  )
  const tableMerch = withTable.income.breakdown.find(
    b => b.label === 'Merch Sales'
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
    crowdStats: { hype: 75 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 150,
    gigStats: buildGigStats()
  })

  const calculatedNet = result.income.total - result.expenses.total
  assert.equal(
    result.net,
    calculatedNet,
    'Net should be exactly income minus expenses'
  )
})

test('calculateGigFinancials handles high fame with high price', () => {
  const gigData = buildGigData({ capacity: 500, price: 40 })
  const result = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 85,
    crowdStats: { hype: 85 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 5000,
    gigStats: buildGigStats()
  })

  // High fame should mitigate price penalty
  const ticketItem = result.income.breakdown.find(
    b => b.label === 'Ticket Sales'
  )
  assert.ok(
    ticketItem.value > 0,
    'High fame should still sell tickets at high price'
  )
})

test('calculateTravelExpenses returns correct cost structure', () => {
  // Mock node
  const node = { venue: { x: 50, y: 50, name: 'Center' } }
  // New Logic: relative to center (default fromNode).
  // dx=0, dy=0. Dist = floor(0*5) + 20 = 20.
  // Fuel: (20 / 100) * 12 = 2.4 liters
  // Fuel Cost: floor(2.4 * 1.75) = 4
  // Food Cost: 3 * 8 = 24
  // Total Cost: 4 + 24 = 28

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
  assert.equal(result.totalCost, 28, 'Total cost should be 28')
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

test('calculateGigFinancials applies van tuning upgrade to fuel cost', () => {
  const gigData = buildGigData({ dist: 100 })
  const baseCost = calculateFuelCost(100).fuelCost

  // Without upgrade (passing fame number)
  const res1 = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: 100,
    gigStats: buildGigStats()
  })
  const fuelItem1 = res1.expenses.breakdown.find(b => b.label === 'Fuel')
  assert.equal(fuelItem1.value, baseCost)

  // With upgrade (passing player object)
  const playerState = {
    fame: 100,
    van: {
      upgrades: ['van_tuning']
    }
  }
  const res2 = calculateGigFinancials({
    gigData: gigData,
    performanceScore: 80,
    crowdStats: { hype: 80 },
    modifiers: buildModifiers(),
    bandInventory: buildInventory(),
    playerStateOrFame: playerState,
    gigStats: buildGigStats()
  })
  const fuelItem2 = res2.expenses.breakdown.find(b => b.label === 'Fuel')

  assert.ok(
    fuelItem2.value < fuelItem1.value,
    'Fuel cost should be lower with upgrade'
  )
})
