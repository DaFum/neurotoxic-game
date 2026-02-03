import { logger } from './logger.js'

// Constants for the Economic System
export const INCOME_CONSTANTS = {
  MERCH: {
    SHIRT: { price: 20, cost: 8, profit: 12 },
    HOODIE: { price: 40, cost: 18, profit: 22 },
    PATCH: { price: 3, cost: 0.5, profit: 2.5 },
    CD: { price: 10, cost: 2, profit: 8 },
    VINYL: { price: 25, cost: 12, profit: 13 }
  },
  STREAMING_PER_VIEW: 0.002 // Euro per view
}

export const EXPENSE_CONSTANTS = {
  TRANSPORT: {
    FUEL_PER_100KM: 12, // Liters
    FUEL_PRICE: 1.75, // Euro per Liter
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

/**
 * Calculates ticket sales revenue and attendance.
 */
const calculateTicketIncome = (gigData, playerFame, modifiers) => {
  // Base draw is ~30%. Fame fills the rest.
  const baseDrawRatio = 0.3
  const fameRatio = Math.min(1.0, playerFame / (gigData.capacity * 10)) // Fame needs to be ~10x capacity to fill it easily
  let fillRate = baseDrawRatio + fameRatio * 0.7

  // Promo Boost
  if (modifiers.promo) fillRate += 0.15

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
  let buyRate = 0.1 + (performanceScore / 100) * 0.2 // 10% - 30%
  const breakdownItems = []

  if (performanceScore >= 95) {
    buyRate *= 2.0 // S-Rank Bonus
    breakdownItems.push({
      label: 'HYPE BONUS',
      value: 0,
      detail: 'Merch frenzy (S-Rank)!'
    })
  }

  const hasMerch = modifiers.merch || modifiers.merchTable
  if (hasMerch) buyRate += 0.1 // Boost from table

  // Penalty: Misses drive people away
  if (gigStats && gigStats.misses > 0) {
    const missPenalty = Math.min(buyRate, gigStats.misses * 0.01)
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
 * Calculates travel expenses.
 * @param {object} node - The target node.
 * @param {object} [fromNode=null] - The source node.
 */
export const calculateTravelExpenses = (
  node,
  fromNode = null,
  playerState = null
) => {
  const x = typeof node?.x === 'number' ? node.x : (node.venue?.x ?? 50)
  const y = typeof node?.y === 'number' ? node.y : (node.venue?.y ?? 50)

  const startX =
    fromNode && typeof fromNode.x === 'number'
      ? fromNode.x
      : (fromNode?.venue?.x ?? 50)
  const startY =
    fromNode && typeof fromNode.y === 'number'
      ? fromNode.y
      : (fromNode?.venue?.y ?? 50)

  const dx = x - startX
  const dy = y - startY

  // Distance logic: Relative distance + base cost
  const dist = Math.floor(Math.sqrt(dx * dx + dy * dy) * 5) + 20

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
  const foodCost = 3 * EXPENSE_CONSTANTS.FOOD.FAST_FOOD // Band of 3
  const totalCost = fuelCost + foodCost
  return { dist, fuelLiters, totalCost }
}

/**
 * Calculates expenses for the gig.
 */
const calculateGigExpenses = (gigData, modifiers) => {
  const expenses = { total: 0, breakdown: [] }

  // Transport
  const fuelLiters =
    ((gigData.dist || 100) / 100) * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PER_100KM
  const fuelCost = Math.floor(
    fuelLiters * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE
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
    const merchTableCost = 40
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
 * @param {number} playerFame - Total player fame
 * @param {object} gigStats - Detailed gig stats (misses, peakHype, etc)
 */
export const calculateGigFinancials = (
  gigData,
  performanceScore,
  crowdStats,
  modifiers,
  bandInventory,
  playerFame,
  gigStats
) => {
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
  const operationalExpenses = calculateGigExpenses(gigData, modifiers)
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
