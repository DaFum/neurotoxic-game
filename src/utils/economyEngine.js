import { logger } from './logger.js'

export const EXPENSE_CONSTANTS = {
  DAILY: {
    BASE_COST: 25
  },
  TRANSPORT: {
    FUEL_PER_100KM: 12, // Liters
    FUEL_PRICE: 1.75, // Euro per Liter
    MAX_FUEL: 100, // Liters
    REPAIR_COST_PER_UNIT: 3, // Per 1% condition
    INSURANCE_MONTHLY: 80,
    MAINTENANCE_30DAYS: 200
  },
  FOOD: {
    FAST_FOOD: 8, // Per person per day
    RESTAURANT: 15, // Per person per day
    ENERGY_DRINK: 3,
    ALCOHOL: 15
  },
  ACCOMMODATION: {
    HOSTEL: 25, // Per person
    HOTEL: 60 // Per person
  },
  EQUIPMENT: {
    STRINGS: 15,
    STICKS: 12,
    CABLE: 25,
    TUBES: 80
  },
  ADMIN: {
    PROBERAUM: 180, // Monthly
    INSURANCE_EQUIP: 150 // Monthly
  }
}

export const TICKET_SALES_CONSTANTS = {
  BASE_DRAW_RATIO: 0.3,
  FAME_CAPACITY_SCALER: 10,
  FAME_FILL_WEIGHT: 0.7
}

/**
 * Calculates ticket sales revenue and attendance.
 */
const calculateTicketIncome = (gigData, playerFame, modifiers) => {
  // Base draw is ~30%. Fame fills the rest.
  const baseDrawRatio = TICKET_SALES_CONSTANTS.BASE_DRAW_RATIO
  // Fame needs to be ~10x capacity to fill it easily
  const fameRatio = Math.min(
    1.0,
    playerFame / (gigData.capacity * TICKET_SALES_CONSTANTS.FAME_CAPACITY_SCALER)
  )
  let fillRate = baseDrawRatio + fameRatio * TICKET_SALES_CONSTANTS.FAME_FILL_WEIGHT

  // Promo Boost
  if (modifiers.promo) fillRate += 0.15

  // Soundcheck Boost (word-of-mouth from quality prep)
  if (modifiers.soundcheck) fillRate += 0.1

  // Price Sensitivity: Higher price reduces attendance slightly unless Fame is very high
  if (gigData.price > 15) {
    const pricePenalty = (gigData.price - 15) * 0.02 // -2% per Euro over 15
    const mitigation = fameRatio * 0.5
    fillRate -= Math.max(0, pricePenalty - mitigation)
  }

  fillRate = Math.min(1.0, Math.max(0.1, fillRate)) // Clamp 10% - 100%

  const ticketsSold = Math.floor(gigData.capacity * fillRate)
  const revenue = ticketsSold * gigData.price

  return {
    revenue,
    ticketsSold,
    breakdownItem: {
      label: 'Ticket Sales',
      value: revenue,
      detail: `${ticketsSold} / ${gigData.capacity} sold`
    }
  }
}

/**
 * Calculates merch sales revenue and costs.
 */
const calculateMerchIncome = (
  ticketsSold,
  performanceScore,
  gigStats,
  modifiers,
  bandInventory
) => {
  let buyRate = 0.15 + (performanceScore / 100) * 0.2 // 15% - 35%
  const breakdownItems = []

  if (performanceScore >= 95) {
    buyRate *= 1.5 // S-Rank Bonus
    breakdownItems.push({
      label: 'HYPE BONUS',
      value: 0,
      detail: 'Merch frenzy (S-Rank)!'
    })
  } else if (performanceScore < 40) {
    buyRate *= 0.5 // Poor performance penalty
    breakdownItems.push({
      label: 'BAD SHOW',
      value: 0,
      detail: 'Crowd left early...'
    })
  }

  const hasMerch = modifiers.merch || modifiers.merchTable
  if (hasMerch) buyRate += 0.1 // Boosted merch table effect to reward investment

  // Penalty: Misses drive people away (scaled penalty)
  if (gigStats && gigStats.misses > 0) {
    const missPenalty = Math.min(buyRate * 0.5, gigStats.misses * 0.015)
    buyRate -= missPenalty
  }

  const totalInventory =
    (bandInventory?.shirts || 0) +
    (bandInventory?.hoodies || 0) +
    (bandInventory?.cds || 0) +
    (bandInventory?.patches || 0) +
    (bandInventory?.vinyl || 0)
  const potentialBuyers = Math.floor(ticketsSold * Math.max(0, buyRate))
  const buyers = Math.min(potentialBuyers, totalInventory)

  // Average Spend per buyer (simplified mix)
  const merchAvgRevenue = 25 // Shirt + Sticker
  const merchAvgCost = 10
  const merchRevenue = buyers * merchAvgRevenue
  const merchCost = buyers * merchAvgCost

  breakdownItems.push({
    label: 'Merch Sales',
    value: merchRevenue,
    detail: `${buyers} buyers`
  })

  return {
    revenue: merchRevenue,
    cost: merchCost,
    breakdownItems,
    costItem: { label: 'Merch Restock', value: merchCost, detail: 'COGS' }
  }
}

/**
 * Calculates distance between two nodes or a node and a fallback point.
 * @param {object} nodeA - The target node.
 * @param {object} [nodeB=null] - The source node.
 * @returns {number} The calculated distance.
 */
export const calculateDistance = (nodeA, nodeB = null) => {
  const x1 = typeof nodeA?.x === 'number' ? nodeA.x : (nodeA?.venue?.x ?? 50)
  const y1 = typeof nodeA?.y === 'number' ? nodeA.y : (nodeA?.venue?.y ?? 50)

  const x2 =
    nodeB && typeof nodeB.x === 'number'
      ? nodeB.x
      : (nodeB?.venue?.x ?? 50)
  const y2 =
    nodeB && typeof nodeB.y === 'number'
      ? nodeB.y
      : (nodeB?.venue?.y ?? 50)

  const dx = x1 - x2
  const dy = y1 - y2

  // Distance logic: Relative distance + base cost
  return Math.floor(Math.sqrt(dx * dx + dy * dy) * 5) + 20
}

/**
 * Calculates fuel consumption and cost based on distance and player upgrades.
 * @param {number} dist - The distance in km.
 * @param {object} [playerState=null] - Optional player state for upgrade checks.
 * @returns {object} { fuelLiters, fuelCost }
 */
export const calculateFuelCost = (dist, playerState = null) => {
  let fuelLiters = (dist / 100) * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PER_100KM

  // Check for 'van_tuning' upgrade
  if (
    playerState &&
    playerState.van &&
    playerState.van.upgrades &&
    playerState.van.upgrades.includes('van_tuning')
  ) {
    fuelLiters *= 0.8 // 20% reduction
  }

  const fuelCost = Math.floor(
    fuelLiters * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE
  )

  return { fuelLiters, fuelCost }
}

/**
 * Calculates travel expenses.
 * @param {object} node - The target node.
 * @param {object} [fromNode=null] - The source node.
 * @param {object} [playerState=null] - Optional player state for upgrade-aware costs.
 */
export const calculateTravelExpenses = (
  node,
  fromNode = null,
  playerState = null
) => {
  const dist = calculateDistance(node, fromNode)
  const { fuelLiters, fuelCost } = calculateFuelCost(dist, playerState)
  const foodCost = 3 * EXPENSE_CONSTANTS.FOOD.FAST_FOOD // Band of 3
  const totalCost = fuelCost + foodCost

  return { dist, fuelLiters, totalCost }
}

/**
 * Calculates expenses for the gig.
 */
const calculateGigExpenses = (gigData, modifiers, playerState = null) => {
  const expenses = { total: 0, breakdown: [] }

  // Transport
  const { fuelCost } = calculateFuelCost(
    gigData.dist || 100,
    playerState
  )

  expenses.breakdown.push({
    label: 'Fuel',
    value: fuelCost,
    detail: `${gigData.dist || 100}km`
  })
  expenses.total += fuelCost

  // Food & Drink
  const bandSize = 3
  const foodCost = bandSize * EXPENSE_CONSTANTS.FOOD.FAST_FOOD
  expenses.breakdown.push({
    label: 'Food & Drinks',
    value: foodCost,
    detail: 'Subsistence'
  })
  expenses.total += foodCost

  // Modifiers (Budget items)
  if (modifiers.catering) {
    const cateringCost = 20
    expenses.breakdown.push({
      label: 'Catering / Energy',
      value: cateringCost,
      detail: 'Stamina Boost'
    })
    expenses.total += cateringCost
  }

  if (modifiers.promo) {
    const promoCost = 30
    expenses.breakdown.push({
      label: 'Social Ads',
      value: promoCost,
      detail: 'Promo Campaign'
    })
    expenses.total += promoCost
  }

  const hasMerch = modifiers.merch || modifiers.merchTable
  if (hasMerch) {
    const merchTableCost = 30
    expenses.breakdown.push({
      label: 'Merch Stand',
      value: merchTableCost,
      detail: 'Better Display'
    })
    expenses.total += merchTableCost
  }

  if (modifiers.soundcheck) {
    const soundcheckCost = 50
    expenses.breakdown.push({
      label: 'Soundcheck',
      value: soundcheckCost,
      detail: 'Prep Time'
    })
    expenses.total += soundcheckCost
  }

  if (modifiers.guestlist) {
    const guestlistCost = 60
    expenses.breakdown.push({
      label: 'Guest List',
      value: guestlistCost,
      detail: 'VIP Treatment'
    })
    expenses.total += guestlistCost
  }

  return expenses
}

/**
 * Calculates the full financial breakdown of a gig with Fame Scaling and Hype bonuses.
 * @param {object} gigData - { capacity, price, pay (guarantee), dist, diff }
 * @param {number} performanceScore - 0 to 100
 * @param {object} crowdStats - { hype (0-100) }
 * @param {object} modifiers - { merch: bool, promo: bool, catering: bool, soundcheck: bool, guestlist: bool }
 * @param {object} bandInventory - { shirts, hoodies, etc }
 * @param {object|number} playerStateOrFame - Player state object or just fame (number) for legacy support
 * @param {object} gigStats - Detailed gig stats (misses, peakHype, etc)
 */
export const calculateGigFinancials = (
  gigData,
  performanceScore,
  crowdStats,
  modifiers,
  bandInventory,
  playerStateOrFame,
  gigStats
) => {
  // Determine if we have a full player object or just fame (legacy/test support)
  const playerState =
    typeof playerStateOrFame === 'object' ? playerStateOrFame : null
  const playerFame = playerState ? playerState.fame : playerStateOrFame

  logger.debug('Economy', 'Calculating Gig Financials', {
    gig: gigData.name,
    score: performanceScore,
    fame: playerFame
  })

  const report = {
    income: { total: 0, breakdown: [] },
    expenses: { total: 0, breakdown: [] },
    net: 0
  }

  // 1. Ticket Sales
  const tickets = calculateTicketIncome(gigData, playerFame, modifiers)
  report.income.breakdown.push(tickets.breakdownItem)
  report.income.total += tickets.revenue

  // Venue Split / Promoter Cut
  const splitRate =
    gigData.diff >= 5 ? 0.7 : { 3: 0.2, 4: 0.4 }[gigData.diff] || 0

  if (splitRate > 0) {
    const splitAmount = Math.floor(tickets.revenue * splitRate)
    report.expenses.breakdown.push({
      label: 'Venue Split',
      value: splitAmount,
      detail: `${splitRate * 100}% of Door`
    })
    report.expenses.total += splitAmount
  }

  // 2. Guarantee
  if (gigData.pay > 0) {
    report.income.breakdown.push({
      label: 'Guarantee',
      value: gigData.pay,
      detail: 'Fixed fee'
    })
    report.income.total += gigData.pay
  }

  // 3. Merch Sales
  const merch = calculateMerchIncome(
    tickets.ticketsSold,
    performanceScore,
    gigStats,
    modifiers,
    bandInventory
  )
  report.income.breakdown.push(...merch.breakdownItems)
  report.income.total += merch.revenue
  report.expenses.breakdown.push(merch.costItem)
  report.expenses.total += merch.cost

  // 4. Bar Cut
  const barRevenue = Math.floor(tickets.ticketsSold * 5 * 0.15)
  report.income.breakdown.push({
    label: 'Bar Cut',
    value: barRevenue,
    detail: '15% of Bar'
  })
  report.income.total += barRevenue

  // 5. Expenses (Transport, Food, Modifiers)
  const operationalExpenses = calculateGigExpenses(
    gigData,
    modifiers,
    playerState
  )
  report.expenses.breakdown.push(...operationalExpenses.breakdown)
  report.expenses.total += operationalExpenses.total

  // 6. Sponsorship Bonuses
  if (gigStats) {
    if (gigStats.misses === 0) {
      const bonus = 200
      report.income.breakdown.push({
        label: 'Tech Sponsor',
        value: bonus,
        detail: 'Perfect Set (0 Misses)'
      })
      report.income.total += bonus
    }
    if (gigStats.peakHype >= 100) {
      const bonus = 150
      report.income.breakdown.push({
        label: 'Beer Sponsor',
        value: bonus,
        detail: 'Max Hype Reached'
      })
      report.income.total += bonus
    }
  }

  report.net = report.income.total - report.expenses.total

  logger.info('Economy', 'Gig Report Generated', {
    net: report.net,
    income: report.income.total,
    expenses: report.expenses.total
  })
  return report
}
