import { logger } from './logger.js'
import { bandHasTrait } from './traitLogic.js'

/**
 * Per-modifier costs used both in the PreGig UI preview and the PostGig expense calculation.
 * Keep this as the single source of truth so both screens always agree.
 */
export const MODIFIER_COSTS = {
  catering: 20,
  promo: 30,
  merch: 30,
  soundcheck: 50,
  guestlist: 60
}

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

const TICKET_SALES_CONSTANTS = {
  BASE_DRAW_RATIO: 0.3,
  FAME_CAPACITY_SCALER: 10,
  FAME_FILL_WEIGHT: 0.7
}

/**
 * Calculates ticket sales revenue and attendance.
 */
const calculateTicketIncome = (
  gigData,
  playerFame,
  modifiers,
  context = {}
) => {
  // Base draw is ~30%. Fame fills the rest.
  const baseDrawRatio = TICKET_SALES_CONSTANTS.BASE_DRAW_RATIO
  // Fame needs to be ~10x capacity to fill it easily
  const fameRatio = Math.min(
    1.0,
    playerFame /
      (gigData.capacity * TICKET_SALES_CONSTANTS.FAME_CAPACITY_SCALER)
  )
  let fillRate =
    baseDrawRatio + fameRatio * TICKET_SALES_CONSTANTS.FAME_FILL_WEIGHT

  // Promo Boost
  if (modifiers.promo) fillRate += 0.15

  // Soundcheck Boost (word-of-mouth from quality prep)
  if (modifiers.soundcheck) fillRate += 0.1

  // Controversy attendance penalty: -1% per point above 40, max -30%
  const controversyLevel = context.controversyLevel || 0
  if (controversyLevel >= 40) {
    fillRate -= Math.min(0.3, (controversyLevel - 40) * 0.01)
  }

  // Regional reputation bonus/penalty
  const regionRep = context.regionRep || 0
  if (regionRep < 0) {
    fillRate -= Math.min(0.2, Math.abs(regionRep) * 0.002) // -2% per -10 rep, max -20%
  } else if (regionRep > 0) {
    fillRate += Math.min(0.2, regionRep * 0.002) // +2% per +10 rep, max +20%
  }

  // Discounted tickets flag: +10% fill
  if (context.discountedTickets) {
    fillRate += 0.1
  }

  // Price Sensitivity: Higher price reduces attendance slightly unless Fame is very high
  if (context.discountedTickets) {
    // skip price penalty if discounted tickets flagged
  } else if (gigData.price > 15) {
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
  bandInventory,
  context = {}
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

  if (modifiers.merch) buyRate += 0.1 // Boosted merch table effect to reward investment

  // Loyalty converts to merch sales during controversy
  if ((context?.controversyLevel || 0) >= 40 && (context?.loyalty || 0) >= 20) {
    const loyaltyBuyBonus = Math.min(0.15, (context.loyalty / 100) * 0.2)
    buyRate = Math.min(0.45, buyRate + loyaltyBuyBonus)
    breakdownItems.push({
      label: 'LOYAL FANS',
      value: 0,
      detail: 'Supporting you despite PR'
    })
  }

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
const calculateDistance = (nodeA, nodeB = null) => {
  const x1 = typeof nodeA?.x === 'number' ? nodeA.x : (nodeA?.venue?.x ?? 50)
  const y1 = typeof nodeA?.y === 'number' ? nodeA.y : (nodeA?.venue?.y ?? 50)

  const x2 =
    nodeB && typeof nodeB.x === 'number' ? nodeB.x : (nodeB?.venue?.x ?? 50)
  const y2 =
    nodeB && typeof nodeB.y === 'number' ? nodeB.y : (nodeB?.venue?.y ?? 50)

  const dx = x1 - x2
  const dy = y1 - y2

  // Distance logic: Relative distance + base cost
  return Math.floor(Math.sqrt(dx * dx + dy * dy) * 5) + 20
}

/**
 * Calculates fuel consumption and cost based on distance and player upgrades.
 * @param {number} dist - The distance in km.
 * @param {object} [playerState=null] - Optional player state for upgrade checks.
 * @param {object} [bandState=null] - Optional band state for trait checks.
 * @returns {object} { fuelLiters, fuelCost }
 */
export const calculateFuelCost = (
  dist,
  playerState = null,
  bandState = null
) => {
  if (dist < 0) return { fuelLiters: 0, fuelCost: 0 }

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

  // Road Warrior Trait: 15% discount on fuel consumption
  if (bandHasTrait(bandState, 'road_warrior')) {
    fuelLiters *= 0.85
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
 * @param {object} [bandState=null] - Optional band state for trait checks.
 */
export const calculateTravelExpenses = (
  node,
  fromNode = null,
  playerState = null,
  bandState = null
) => {
  const dist = calculateDistance(node, fromNode)
  const { fuelLiters } = calculateFuelCost(dist, playerState, bandState)
  const foodCost = 3 * EXPENSE_CONSTANTS.FOOD.FAST_FOOD // Band of 3
  const totalCost = foodCost

  return { dist, fuelLiters, totalCost }
}

/**
 * Calculates the cost to refuel the van to full capacity.
 * @param {number} currentFuel - Current fuel level.
 * @returns {number} Cost in euros.
 */
export const calculateRefuelCost = currentFuel => {
  const missing = Math.max(
    0,
    EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL - currentFuel
  )
  return Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)
}

/**
 * Calculates the cost to repair the van to full condition.
 * @param {number} currentCondition - Current condition (0-100).
 * @returns {number} Cost in euros.
 */
export const calculateRepairCost = currentCondition => {
  const missing = Math.max(0, 100 - currentCondition)
  return Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.REPAIR_COST_PER_UNIT)
}

/**
 * Calculates the effective ticket price, accounting for any discounts or modifiers.
 * @param {object} gigData - The gig data containing the base price.
 * @param {object} context - Context object containing flags like discountedTickets.
 * @returns {number} The effective ticket price.
 */
export const calculateEffectiveTicketPrice = (gigData, context = {}) => {
  if (!gigData) return 0
  let price = gigData.price || 0
  if (context.discountedTickets && price > 10) {
    price = Math.floor(price * 0.5)
  }
  return price
}

/**
 * Calculates expenses for the gig.
 */
const calculateGigExpenses = modifiers => {
  const expenses = { total: 0, breakdown: [] }

  // Operational Expenses (Modifiers)
  // Transport and subsistence are now exclusively handled during travel phase.

  // Modifiers (Budget items)
  if (modifiers.catering) {
    expenses.breakdown.push({
      label: 'Catering / Energy',
      value: MODIFIER_COSTS.catering,
      detail: 'Counters Tired Band Penalty'
    })
    expenses.total += MODIFIER_COSTS.catering
  }

  if (modifiers.promo) {
    expenses.breakdown.push({
      label: 'Social Ads',
      value: MODIFIER_COSTS.promo,
      detail: 'Promo Campaign'
    })
    expenses.total += MODIFIER_COSTS.promo
  }

  if (modifiers.merch) {
    expenses.breakdown.push({
      label: 'Merch Stand',
      value: MODIFIER_COSTS.merch,
      detail: 'Better Display'
    })
    expenses.total += MODIFIER_COSTS.merch
  }

  if (modifiers.soundcheck) {
    expenses.breakdown.push({
      label: 'Soundcheck',
      value: MODIFIER_COSTS.soundcheck,
      detail: 'Prep Time'
    })
    expenses.total += MODIFIER_COSTS.soundcheck
  }

  if (modifiers.guestlist) {
    expenses.breakdown.push({
      label: 'Guest List',
      value: MODIFIER_COSTS.guestlist,
      detail: 'VIP Treatment'
    })
    expenses.total += MODIFIER_COSTS.guestlist
  }

  return expenses
}

/**
 * Calculates the full financial breakdown of a gig with Fame Scaling and Hype bonuses.
 * @param {object} params - Parameters object
 * @param {object} params.gigData - { capacity, price, pay (guarantee), dist, diff }
 * @param {number} params.performanceScore - 0 to 100
 * @param {object} params.modifiers - { merch: bool, promo: bool, catering: bool, soundcheck: bool, guestlist: bool }
 * @param {object} params.bandInventory - { shirts, hoodies, etc }
 * @param {object|number} params.playerStateOrFame - Player state object or just fame (number) for legacy support
 * @param {object} params.gigStats - Detailed gig stats (misses, peakHype, etc)
 */
export const calculateGigFinancials = ({
  gigData,
  performanceScore,
  modifiers,
  bandInventory,
  playerState,
  gigStats,
  context = {}
}) => {
  const playerFame = playerState?.fame || 0

  logger.debug('Economy', 'Calculating Gig Financials', {
    gig: gigData.name,
    score: performanceScore,
    fame: playerFame
  })

  const effectivePrice = calculateEffectiveTicketPrice(gigData, context)
  const effectiveGigData = { ...gigData, price: effectivePrice }

  const report = {
    income: { total: 0, breakdown: [] },
    expenses: { total: 0, breakdown: [] },
    net: 0
  }

  // 1. Ticket Sales
  const tickets = calculateTicketIncome(
    effectiveGigData,
    playerFame,
    modifiers,
    context
  )
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
    bandInventory,
    context
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
  const operationalExpenses = calculateGigExpenses(modifiers)
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

/**
 * Determines whether the run should end due to insolvency.
 * @param {number} newMoney - Player money after applying earnings/losses.
 * @param {number} netIncome - Net income from the gig (optional context).
 * @returns {boolean} True when player is bankrupt.
 * @throws {TypeError} If newMoney is not a finite number.
 */
export const shouldTriggerBankruptcy = (newMoney, netIncome) => {
  const val = Number(newMoney)
  if (!Number.isFinite(val)) {
    throw new TypeError('newMoney must be a finite number')
  }

  // If player has money left, they are not bankrupt.
  if (val > 0) return false

  // If negative balance, instant bankruptcy (debt is fatal)
  // Note: Current callers clamp to >= 0, but this branch protects against
  // future callers that may not clamp.
  if (val < 0) return true

  // If exactly 0, check if we are bleeding money (netIncome < 0)
  // If netIncome is undefined (legacy), default to 0 (assume break-even/safe)
  // This restores the "survive at 0 if not losing money" behavior
  const income = netIncome ?? 0
  return income < 0
}

/**
 * Calculates effects of Travel Minigame results.
 * @param {number} damageTaken - Total damage taken.
 * @param {string[]} itemsCollected - Array of collected item types.
 * @returns {object} { conditionLoss, fuelBonus }
 */
export const calculateTravelMinigameResult = (damageTaken, itemsCollected) => {
  // 50% damage scaling: 100 damage -> 50 condition loss
  const conditionLoss = Math.floor(damageTaken / 2)
  // Fuel bonus disabled per design: fuel only fills via Refuel button
  const fuelBonus = 0
  return { conditionLoss, fuelBonus }
}

/**
 * Calculates effects of Roadie Minigame results.
 * @param {number} equipmentDamage - Total equipment damage.
 * @param {object} bandState - Current band traits/state used by bandHasTrait.
 * @returns {object} { stress, repairCost }
 */
export const calculateRoadieMinigameResult = (equipmentDamage, bandState) => {
  const safeDamage = Math.max(0, equipmentDamage)
  const stress = Math.floor(safeDamage / 5)
  let repairCost = Math.floor(safeDamage * 2)

  // Gear Nerd Trait: 20% discount on repairs
  if (bandHasTrait(bandState, 'gear_nerd')) {
    repairCost = Math.floor(repairCost * 0.8)
  }

  return { stress, repairCost }
}
