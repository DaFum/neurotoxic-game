import { logger } from './logger.js'
import { bandHasTrait } from './traitLogic.js'
import { calculateZealotryEffects } from './socialEngine.js'

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

export const BAR_RATE_VIP = 0.3
export const BAR_RATE_NORMAL = 0.15
export const AVG_SPEND_PER_PERSON_AT_BAR = 5
export const ZEALOTRY_PROMO_THRESHOLD = 80

export const EXPENSE_CONSTANTS = {
  DAILY: {
    BASE_COST: 70
  },
  TRANSPORT: {
    FUEL_PER_100KM: 12, // Liters
    FUEL_PRICE: 1.75, // Euro per Liter
    MAX_FUEL: 100, // Liters
    REPAIR_COST_PER_UNIT: 6, // Per 1% condition
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
export const calculateTicketIncome = (
  gigData = {},
  playerFame = 0,
  modifiers = {},
  context = {}
) => {
  gigData = gigData || {}
  modifiers = modifiers || {}
  context = context || {}
  // Base draw is ~30%. Fame fills the rest.
  const baseDrawRatio = TICKET_SALES_CONSTANTS.BASE_DRAW_RATIO
  // Fame needs to be ~8x capacity to fill it easily
  const baseCapacity = Math.max(0, gigData.capacity || 0)
  const safeCapacity = Math.max(1, baseCapacity) // Prevent division by zero or negative

  // Sublinear power scaling for fame to make late-game arenas fill more smoothly
  // Uses Math.pow(playerFame, 0.85) to provide diminishing returns (power-law scaling, not logarithmic)
  const fameRatio = Math.min(
    1.0,
    Math.pow(Math.max(0, playerFame), 0.85) /
      (safeCapacity * TICKET_SALES_CONSTANTS.FAME_CAPACITY_SCALER)
  )
  let fillRate =
    baseDrawRatio + fameRatio * TICKET_SALES_CONSTANTS.FAME_FILL_WEIGHT

  // Promo Boost
  if (modifiers.promo) fillRate += 0.22

  // Soundcheck Boost (word-of-mouth from quality prep)
  if (modifiers.soundcheck) fillRate += 0.2

  const gigDifficulty = gigData.diff ?? gigData.difficulty
  const daysSinceLastGig = context.daysSinceLastGig
  const hasValidDaysSinceLastGig =
    Number.isFinite(daysSinceLastGig) && daysSinceLastGig > 0

  // Gig frequency vs quality gap penalty
  if (
    context.lastGigDifficulty === gigDifficulty &&
    hasValidDaysSinceLastGig &&
    daysSinceLastGig < 4
  ) {
    fillRate -= 0.15
  }

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
  if (!context.discountedTickets && gigData.price > 15) {
    const pricePenalty = (gigData.price - 15) * 0.02 // -2% per Euro over 15
    const mitigation = fameRatio * 0.5
    fillRate -= Math.max(0, pricePenalty - mitigation)
  }

  fillRate = Math.min(1.0, Math.max(0.1, fillRate)) // Clamp 10% - 100%

  const ticketsSold = Math.floor(baseCapacity * fillRate)
  const revenue = Math.max(0, ticketsSold * (Math.max(0, gigData.price) || 0))

  return {
    revenue,
    ticketsSold,
    breakdownItem: {
      labelKey: 'economy:gigIncome.ticketSales.label',
      value: revenue,
      detailKey: 'economy:gigIncome.ticketSales.detail',
      detailParams: { sold: ticketsSold, capacity: baseCapacity }
    }
  }
}

/**
 * Calculates merch sales revenue and costs.
 */
export const calculateMerchIncome = (
  ticketsSold = 0,
  performanceScore = 0,
  gigStats = {},
  modifiers = {},
  bandInventory = {},
  context = {}
) => {
  gigStats = gigStats || {}
  modifiers = modifiers || {}
  bandInventory = bandInventory || {}
  context = context || {}
  // Better baseline merch conversion.
  // Smoothly scales from 10% to 40% based on performance
  let buyRate = 0.1 + (performanceScore / 100) * 0.3
  const breakdownItems = []

  if (performanceScore >= 95) {
    buyRate *= 1.25 // S-Rank Bonus
    breakdownItems.push({
      labelKey: 'economy:gigIncome.hypeBonus.label',
      value: 0,
      detailKey: 'economy:gigIncome.hypeBonus.detail'
    })
  } else if (performanceScore < 40) {
    buyRate *= 0.5 // Poor performance penalty
    breakdownItems.push({
      labelKey: 'economy:gigIncome.badShow.label',
      value: 0,
      detailKey: 'economy:gigIncome.badShow.detail'
    })
  }

  if (modifiers.merch) buyRate += 0.1 // Boosted merch table effect to reward investment

  // Loyalty converts to merch sales during controversy
  if ((context?.controversyLevel || 0) >= 40 && (context?.loyalty || 0) >= 20) {
    const loyaltyBuyBonus = Math.min(0.15, (context.loyalty / 100) * 0.2)
    buyRate = Math.min(0.45, buyRate + loyaltyBuyBonus)
    breakdownItems.push({
      labelKey: 'economy:gigIncome.loyalFans.label',
      value: 0,
      detailKey: 'economy:gigIncome.loyalFans.detail'
    })
  }

  // Penalty: Misses drive people away (scaled penalty)
  if (gigStats && gigStats.misses > 0) {
    const missPenalty = Math.min(buyRate * 0.5, gigStats.misses * 0.015)
    buyRate -= missPenalty
  }

  const totalInventory = Math.max(
    0,
    (bandInventory?.shirts || 0) +
      (bandInventory?.hoodies || 0) +
      (bandInventory?.cds || 0) +
      (bandInventory?.patches || 0) +
      (bandInventory?.vinyl || 0)
  )
  const potentialBuyers = Math.floor(
    Math.max(0, ticketsSold) * Math.max(0, buyRate)
  )
  const buyers = Math.min(potentialBuyers, totalInventory)

  // Average Spend per buyer (simplified mix)
  const merchAvgRevenue = 25 // Shirt + Sticker
  const merchAvgCost = 10
  const merchRevenue = buyers * merchAvgRevenue
  const merchCost = buyers * merchAvgCost

  breakdownItems.push({
    labelKey: 'economy:gigIncome.merchSales.label',
    value: merchRevenue,
    detailKey: 'economy:gigIncome.merchSales.detail',
    detailParams: { buyers }
  })

  return {
    revenue: merchRevenue,
    cost: merchCost,
    breakdownItems,
    costItem: {
      labelKey: 'economy:gigExpenses.merchRestock.label',
      value: merchCost,
      detailKey: 'economy:gigExpenses.merchRestock.detail'
    }
  }
}

/**
 * Calculates distance between two nodes or a node and a fallback point.
 * @param {object} nodeA - The target node.
 * @param {object} [nodeB=null] - The source node.
 * @returns {number} The calculated distance.
 */
export const calculateDistance = (nodeA, nodeB = null) => {
  nodeA = nodeA || {}
  nodeB = nodeB || {}
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

  const bandSize = bandState?.members?.length || 3
  const fameLevel = playerState?.fameLevel || 0

  // Base food cost
  let foodCost = bandSize * EXPENSE_CONSTANTS.FOOD.FAST_FOOD

  // Logistics/Crew scaling with fame and distance (exponential)
  // Adjusted base scalar to 0.15 so early game distances don't drain the bank completely
  const logisticsCost = Math.floor(dist * 0.15 * Math.pow(1.2, fameLevel))
  const totalCost = foodCost + logisticsCost

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
export const calculateEffectiveTicketPrice = (gigData = {}, context = {}) => {
  if (!gigData) return 0
  gigData = gigData || {}
  context = context || {}
  let price = gigData.price || 0
  if (context.discountedTickets && price > 10) {
    price = Math.floor(price * 0.5)
  }
  return price
}

/**
 * Calculates venue split / promoter cut.
 */
const VENUE_SPLIT_RATES = { 3: 0.35, 4: 0.55 }
export const calculateVenueSplit = (ticketsRevenue = 0, gigData = {}) => {
  gigData = gigData || {}
  const splitRate =
    gigData.diff >= 5
      ? 0.7
      : Object.hasOwn(VENUE_SPLIT_RATES, gigData.diff)
        ? VENUE_SPLIT_RATES[gigData.diff]
        : 0

  if (splitRate > 0) {
    const splitAmount = Math.floor(Math.max(0, ticketsRevenue) * splitRate)
    return {
      amount: splitAmount,
      expenseItem: {
        labelKey: 'economy:gigExpenses.venueSplit.label',
        value: splitAmount,
        detailKey: 'economy:gigExpenses.venueSplit.detail',
        detailParams: { rate: splitRate * 100 }
      }
    }
  }
  return { amount: 0, expenseItem: null }
}

/**
 * Calculates guarantee / base pay.
 */
export const calculateGuarantee = (gigData = {}) => {
  gigData = gigData || {}
  const pay = Math.max(0, gigData.pay || 0)
  if (pay > 0) {
    return {
      amount: pay,
      incomeItem: {
        labelKey: 'economy:gigIncome.guarantee.label',
        value: pay,
        detailKey: 'economy:gigIncome.guarantee.detail'
      }
    }
  }
  return { amount: 0, incomeItem: null }
}

/**
 * Calculates bar cut revenue.
 */
export const calculateBarCut = (ticketsSold = 0, modifiers = {}) => {
  modifiers = modifiers || {}
  const barRate = modifiers.guestlist ? BAR_RATE_VIP : BAR_RATE_NORMAL
  const barPercent = Math.round(barRate * 100)
  const barRevenue = Math.max(
    0,
    Math.floor(ticketsSold * AVG_SPEND_PER_PERSON_AT_BAR * barRate)
  )
  return {
    revenue: barRevenue,
    incomeItem: {
      labelKey: modifiers.guestlist
        ? 'economy:gigIncome.vipBarRevenue.label'
        : 'economy:gigIncome.barCut.label',
      value: barRevenue,
      detailKey: modifiers.guestlist
        ? 'economy:gigIncome.vipBarRevenue.detail'
        : 'economy:gigIncome.barCut.detail',
      detailParams: { percent: barPercent }
    }
  }
}

/**
 * Calculates sponsorship bonuses.
 */
export const calculateSponsorshipBonuses = (gigStats = {}) => {
  gigStats = gigStats || {}
  const bonuses = []
  let totalBonus = 0

  if (gigStats) {
    if (gigStats.misses === 0) {
      const bonus = 200
      bonuses.push({
        labelKey: 'economy:gigIncome.techSponsor.label',
        value: bonus,
        detailKey: 'economy:gigIncome.techSponsor.detail'
      })
      totalBonus += bonus
    }
    if (gigStats.peakHype >= 100) {
      const bonus = 150
      bonuses.push({
        labelKey: 'economy:gigIncome.beerSponsor.label',
        value: bonus,
        detailKey: 'economy:gigIncome.beerSponsor.detail'
      })
      totalBonus += bonus
    }
  }

  return { totalBonus, incomeItems: bonuses }
}

/**
 * Calculates expenses for the gig.
 */
export const calculateGigExpenses = (modifiers = {}) => {
  modifiers = modifiers || {}
  const expenses = { total: 0, breakdown: [] }

  // Operational Expenses (Modifiers)
  // Transport and subsistence are now exclusively handled during travel phase.

  // Modifiers (Budget items)
  if (modifiers.catering) {
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.catering.label',
      value: MODIFIER_COSTS.catering,
      detailKey: 'economy:gigExpenses.catering.detail'
    })
    expenses.total += MODIFIER_COSTS.catering
  }

  if (modifiers.promo) {
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.socialAds.label',
      value: MODIFIER_COSTS.promo,
      detailKey: 'economy:gigExpenses.socialAds.detail'
    })
    expenses.total += MODIFIER_COSTS.promo
  }

  if (modifiers.merch) {
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.merchStand.label',
      value: MODIFIER_COSTS.merch,
      detailKey: 'economy:gigExpenses.merchStand.detail'
    })
    expenses.total += MODIFIER_COSTS.merch
  }

  if (modifiers.soundcheck) {
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.soundcheck.label',
      value: MODIFIER_COSTS.soundcheck,
      detailKey: 'economy:gigExpenses.soundcheck.detail'
    })
    expenses.total += MODIFIER_COSTS.soundcheck
  }

  if (modifiers.guestlist) {
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.guestList.label',
      value: MODIFIER_COSTS.guestlist,
      detailKey: 'economy:gigExpenses.guestList.detail'
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
  // Apply automated promo from zealotry to tickets
  const zealotry = context.zealotry || 0
  const effectiveModifiers = { ...modifiers }
  if (zealotry >= ZEALOTRY_PROMO_THRESHOLD) {
    effectiveModifiers.promo = true
  }

  const tickets = calculateTicketIncome(
    effectiveGigData,
    playerFame,
    effectiveModifiers,
    context
  )
  report.income.breakdown.push(tickets.breakdownItem)
  report.income.total += tickets.revenue

  // Venue Split / Promoter Cut
  const venueSplit = calculateVenueSplit(tickets.revenue, gigData)
  if (venueSplit.expenseItem) {
    report.expenses.breakdown.push(venueSplit.expenseItem)
    report.expenses.total += venueSplit.amount
  }

  // 2. Guarantee
  const guarantee = calculateGuarantee(gigData)
  if (guarantee.incomeItem) {
    report.income.breakdown.push(guarantee.incomeItem)
    report.income.total += guarantee.amount
  }

  // 3. Cult Donations (Zealotry)
  const { passiveIncome } = calculateZealotryEffects(zealotry)
  if (passiveIncome > 0) {
    report.income.breakdown.push({
      labelKey: 'economy:cultDonations',
      value: passiveIncome
    })
    report.income.total += passiveIncome
  }

  // 4. Merch Sales
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

  // 5. Bar Cut
  const barCut = calculateBarCut(tickets.ticketsSold, modifiers)
  report.income.breakdown.push(barCut.incomeItem)
  report.income.total += barCut.revenue

  // 6. Expenses (Modifiers)
  const costModifiers = { ...modifiers }
  // If zealotry is high, player does not pay for promo even if they explicitly checked it
  if (zealotry >= ZEALOTRY_PROMO_THRESHOLD) {
    costModifiers.promo = false
  }

  const operationalExpenses = calculateGigExpenses(costModifiers)
  report.expenses.breakdown.push(...operationalExpenses.breakdown)
  report.expenses.total += operationalExpenses.total

  // 6. Sponsorship Bonuses
  const sponsorshipBonuses = calculateSponsorshipBonuses(gigStats)
  if (sponsorshipBonuses.incomeItems.length > 0) {
    report.income.breakdown.push(...sponsorshipBonuses.incomeItems)
    report.income.total += sponsorshipBonuses.totalBonus
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

  // If negative balance, instant bankruptcy (debt is fatal).
  // This explicitly catches un-clamped inputs.
  if (val < 0) return true

  // If exactly 0, check if we are bleeding money (netIncome < 0).
  // If netIncome is undefined, default to 0 (assume break-even/safe).
  const income = netIncome ?? 0

  // Bankrupt if at 0 money and net income was strictly negative.
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
  const conditionLoss = Math.floor(Math.max(0, damageTaken) / 2)

  // Fuel bonus re-enabled: each fuel item grants 0.5 liters of fuel bonus
  let fuelItems = 0
  if (Array.isArray(itemsCollected)) {
    for (const item of itemsCollected) {
      if (item === 'FUEL') fuelItems++
    }
  }
  const fuelBonus = fuelItems * 0.5

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

/**
 * Calculates outcome for Amp Calibration minigame
 * @param {number} score - 0 to 100
 * @param {Object} bandState
 * @returns {Object} { stress, reward }
 */
export const calculateAmpCalibrationResult = (score, bandState) => {
  let numScore = Number(score)
  if (!Number.isFinite(numScore)) {
    numScore = 0
  }
  const safeScore = Math.max(0, Math.min(100, numScore))
  let stress = 0
  let reward = 0

  if (safeScore < 50) {
    // Failure or poor performance
    stress = Math.floor((50 - safeScore) / 2)
  } else {
    // Success
    reward = Math.floor(safeScore)

    // Tech Wizard trait increases rewards
    if (bandHasTrait(bandState, 'tech_wizard')) {
      reward = Math.floor(reward * 1.5)
    }
  }

  return { stress, reward }
}

/**
 * Calculates outcome for Kabelsalat minigame
 * @param {Object} results - { isPoweredOn: boolean, timeLeft: number }
 * @param {Object} bandState
 * @returns {Object} { stress, reward }
 */
export const calculateKabelsalatMinigameResult = (results, bandState) => {
  let stress = 0
  let reward = 0

  if (!results.isPoweredOn) {
    // Failure! Stress for everyone.
    stress = 15
  } else {
    // Success! Reward based on time remaining
    const validTimeLeft = Number.isFinite(results.timeLeft)
      ? results.timeLeft
      : 0
    const timeBonus = Math.max(0, Math.floor(validTimeLeft / 5))
    reward = Math.max(0, 60 + timeBonus * 15) // Base 60, scaling better for quick completion

    // Tech Wizard trait increases rewards
    if (bandHasTrait(bandState, 'tech_wizard')) {
      reward = Math.floor(reward * 1.5)
    }
  }

  return { stress, reward }
}
