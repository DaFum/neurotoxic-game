import { NEUTRAL_ASSET_MODIFIERS } from './assetSelectors'
import type { AssetModifiers } from '../types/assets'
import { logger } from './logger'
import { clamp0to100 } from './gameStateUtils'
import { toFiniteNumber } from './numberUtils'
import { bandHasTrait } from './traitUtils'
import { calculateZealotryEffects } from './socialEngine'
import {
  DEFAULT_MERCH_PRICES,
  MERCH_PROFILES,
  SPENDING_PROFILE_MERCH_MULTIPLIER,
  type MerchItemProfile,
  type CityGenre,
  type SpendingProfile
} from '../data/merch'
import type { BandState, PlayerState, SocialState, Venue } from '../types'
import type { CityTraitState } from '../types/game'
import type {
  FinancialBreakdownItem,
  PostGigFinancials
} from '../types/economy'

const SORTED_MERCH_KEYS = Object.freeze(Object.keys(MERCH_PROFILES).sort())
const MERCH_PROFILE_VALUES = Object.freeze(
  Object.values(MERCH_PROFILES)
) as ReadonlyArray<MerchItemProfile>

/**
 * Per-modifier costs used both in the PreGig UI preview and the PostGig expense calculation.
 * Keep this as the single source of truth so both screens always agree.
 */
export const MODIFIER_COSTS = {
  catering: 18,
  promo: 26,
  merch: 26,
  soundcheck: 42,
  guestlist: 50
}

const BAR_RATE_VIP = 0.3

export { DEFAULT_MERCH_PRICES }

const BAR_RATE_NORMAL = 0.15
const AVG_SPEND_PER_PERSON_AT_BAR = 5
export const ZEALOTRY_PROMO_THRESHOLD = 80

type EconomyRecord = Record<string, unknown>

type GigEconomyData = Partial<
  Pick<Venue, 'capacity' | 'diff' | 'difficulty' | 'name'>
> & {
  price?: number
  pay?: number
  [key: string]: unknown
}

type GigModifiers = Partial<Record<keyof typeof MODIFIER_COSTS, boolean>> &
  EconomyRecord

type EconomyContext = {
  daysSinceLastGig?: number
  lastGigDifficulty?: number
  controversyLevel?: number
  loyalty?: number
  zealotry?: number
  regionRep?: number
  discountedTickets?: boolean
  merchPrices?: Record<string, number>
  cityTraits?: CityTraitState
  social?: {
    zealotry?: number
    activeDeals?: Array<{
      type?: unknown
      offer?: { perGig?: number }
    }>
    [key: string]: unknown
  }
  [key: string]: unknown
}

type GigStatsLike = {
  misses?: number
  peakHype?: number
  [key: string]: unknown
}

type BandInventoryLike = {
  shirts?: number
  hoodies?: number
  cds?: number
  patches?: number
  vinyl?: number
  [key: string]: unknown
}

type MapPoint = {
  x?: number
  y?: number
  venue?: {
    x?: number
    y?: number
  }
  [key: string]: unknown
}

type GigFinancialParams = {
  gigData: GigEconomyData
  performanceScore: number
  modifiers: GigModifiers
  bandInventory: BandInventoryLike
  playerState?: Pick<PlayerState, 'fame'> | null
  gigStats: GigStatsLike
  context?: EconomyContext
}

type KabelsalatResults = {
  isPoweredOn?: boolean
  timeLeft?: number
  voidSurgesPurged?: number
}

export const EXPENSE_CONSTANTS = {
  DAILY: {
    BASE_COST: 62
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

const TICKET_SALES_CONSTANTS = {
  BASE_DRAW_RATIO: 0.4,
  FAME_CAPACITY_SCALER: 10,
  FAME_FILL_WEIGHT: 0.55
}

export const MANAGEMENT_CUT_RATE = 0.15
export const MAX_GIG_NET = 7500
const GLOBAL_PAYOUT_NERF = 0.5
const TRAVEL_LOGISTICS_BASE = 18
const TRAVEL_LOGISTICS_PER_100KM = 4
const TRAVEL_LOGISTICS_PER_FAME_LEVEL = 1.5
const TRAVEL_LOGISTICS_CASH_CAP = 45

/**
 * Calculates ticket sales revenue and attendance.
 */
export const calculateTicketIncome = (
  gigData: GigEconomyData = {},
  playerFame = 0,
  modifiers: GigModifiers = {},
  context: EconomyContext = {}
) => {
  gigData = gigData || {}
  modifiers = modifiers || {}
  context = context || {}
  // Base draw is ~30%. Fame fills the rest.
  const baseDrawRatio = TICKET_SALES_CONSTANTS.BASE_DRAW_RATIO
  // Fame needs to be ~8x capacity to fill it easily
  const baseCapacity = Math.max(0, toFiniteNumber(gigData.capacity, 0))
  const safeCapacity = Math.max(1, baseCapacity) // Prevent division by zero or negative

  // Logarithmic fame scaling: fame matters more at low levels, flattens at high levels.
  // Denominator scales with venue capacity so large venues require proportionally more fame.
  const fameRatio = Math.min(
    1.0,
    Math.log(Math.max(0, playerFame) + 1) /
      Math.log(safeCapacity * TICKET_SALES_CONSTANTS.FAME_CAPACITY_SCALER + 1)
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
    typeof daysSinceLastGig === 'number' &&
    Number.isFinite(daysSinceLastGig) &&
    daysSinceLastGig > 0

  // Gig frequency vs quality gap penalty
  if (
    context.lastGigDifficulty === gigDifficulty &&
    hasValidDaysSinceLastGig &&
    daysSinceLastGig < 4
  ) {
    fillRate -= 0.15
  }

  // Controversy attendance penalty: -1% per point above 40, max -30%
  const controversyLevel = toFiniteNumber(context.controversyLevel, 0)
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
  const ticketPrice = typeof gigData.price === 'number' ? gigData.price : 0
  if (!context.discountedTickets && ticketPrice > 15) {
    const pricePenalty = (ticketPrice - 15) * 0.02 // -2% per Euro over 15
    const mitigation = fameRatio * 0.5
    fillRate -= Math.max(0, pricePenalty - mitigation)
  }

  fillRate = Math.min(1.0, Math.max(0.1, fillRate)) // Clamp 10% - 100%

  const ticketsSold = Math.floor(baseCapacity * fillRate)
  const revenue = Math.max(0, ticketsSold * (Math.max(0, ticketPrice) || 0))

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
  gigStats: GigStatsLike = {},
  modifiers: GigModifiers = {},
  bandInventory: BandInventoryLike = {},
  context: EconomyContext = {},
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  gigStats = gigStats || {}
  modifiers = modifiers || {}
  bandInventory = bandInventory || {}
  context = context || {}
  // Better baseline merch conversion.
  // Smoothly scales from 10% to 40% based on performance
  let buyRate = 0.1 + (performanceScore / 100) * 0.3
  const breakdownItems: FinancialBreakdownItem[] = []

  if (performanceScore >= 95) {
    buyRate += 0.2
    breakdownItems.push({
      labelKey: 'economy:gigIncome.sRankShow.label',
      value: 0,
      detailKey: 'economy:gigIncome.sRankShow.detail'
    })
  } else if (performanceScore <= 30) {
    buyRate -= 0.15
    breakdownItems.push({
      labelKey: 'economy:gigIncome.badShow.label',
      value: 0,
      detailKey: 'economy:gigIncome.badShow.detail'
    })
  }

  if (modifiers.merch) buyRate += 0.1 // Boosted merch table effect to reward investment

  // Loyalty converts to merch sales during controversy
  if (
    toFiniteNumber(context?.controversyLevel, 0) >= 40 &&
    toFiniteNumber(context?.loyalty, 0) >= 20
  ) {
    const loyalty = typeof context.loyalty === 'number' ? context.loyalty : 0
    const loyaltyBuyBonus = Math.min(0.15, (loyalty / 100) * 0.2)
    buyRate = Math.min(0.45, buyRate + loyaltyBuyBonus)
    breakdownItems.push({
      labelKey: 'economy:gigIncome.scandalSupport.label',
      value: 0,
      detailKey: 'economy:gigIncome.scandalSupport.detail'
    })
  }

  // Calculate missed notes penalty from gigStats
  const maxHypePenalty = gigStats.peakHype
    ? Math.max(0, 1 - gigStats.peakHype / 100) * 0.1
    : 0
  const missesPenalty = gigStats.misses
    ? Math.min(0.2, (gigStats.misses / 100) * 0.15)
    : 0
  buyRate -= maxHypePenalty + missesPenalty

  // Calculate total sold based on tickets and buy rate
  const potentialBuyers = Math.floor(
    Math.max(0, ticketsSold) * Math.max(0, buyRate)
  )

  const customPrices = context.merchPrices ?? {}
  const safeInventory = bandInventory || {}
  const cityTraits = context.cityTraits

  const genreBias = (cityTraits?.genreBias ?? '') as CityGenre
  const spendingProfile = (cityTraits?.barSpendingProfile ??
    'average') as SpendingProfile
  const spendingMult = SPENDING_PROFILE_MERCH_MULTIPLIER[spendingProfile] ?? 1.0

  const peakHype =
    typeof gigStats?.peakHype === 'number' ? gigStats.peakHype : 0
  const misses = typeof gigStats?.misses === 'number' ? gigStats.misses : 0
  const hypeNorm = clamp0to100(peakHype) / 100
  const missNorm = clamp0to100(misses) / 100

  const priceModifierFor = (
    price: number,
    defaultPrice: number,
    elasticity: number
  ): number => {
    if (price > defaultPrice) {
      return Math.max(
        0.2,
        1 - ((price - defaultPrice) / defaultPrice) * 1.5 * elasticity
      )
    }
    if (price < defaultPrice) {
      return Math.min(2.0, 1 + ((defaultPrice - price) / defaultPrice) * 1.0)
    }
    return 1.0
  }

  const rawShare: Record<string, number> = {}
  const priceByKey: Record<string, number> = {}
  // Bolt Optimization: Calculate totalRawShare cumulatively to avoid an extra
  // Object.values().reduce() call and its associated intermediate array allocation.
  let totalRawShare = 0

  // Compute raw share for every item regardless of inventory. Out-of-stock
  // items still contribute to totalRawShare so their portion of demand is
  // lost (capped at 0 in the allocation loop) rather than redistributed to
  // in-stock items.
  for (const profile of MERCH_PROFILE_VALUES) {
    const genreMult = profile.genreAffinity[genreBias] ?? 1.0
    const perfLift =
      1 +
      (hypeNorm - 0.5) * profile.performanceSensitivity -
      missNorm * profile.missSensitivity
    const perfMult = Math.max(0.1, perfLift)

    const price = customPrices[profile.key] ?? profile.defaultPrice
    priceByKey[profile.key] = price
    const priceMult = priceModifierFor(
      price,
      profile.defaultPrice,
      profile.priceElasticity
    )

    const share =
      profile.baseAppeal * genreMult * spendingMult * perfMult * priceMult
    rawShare[profile.key] = share
    totalRawShare += share
  }

  if (totalRawShare <= 0) {
    return { revenue: 0, breakdownItems, soldItems: {} }
  }

  const demandLiftRaw = spendingMult * (0.5 + hypeNorm * 0.8 - missNorm * 0.4)
  const demandLift = Math.max(0.3, Math.min(1.8, demandLiftRaw))
  const effectiveBuyers = Math.floor(Math.max(0, potentialBuyers) * demandLift)

  const soldItems: Record<string, number> = {}
  let totalRevenue = 0
  const sortedKeys = SORTED_MERCH_KEYS
  const capacityBonus = assetModifiers.merchCapacityBonus ?? 0

  for (const key of sortedKeys) {
    const share = (rawShare[key] ?? 0) / totalRawShare
    const desired = Math.floor(effectiveBuyers * share)
    const inventoryCount =
      typeof safeInventory[key] === 'number'
        ? (safeInventory[key] as number)
        : 0
    const effectiveInventory = inventoryCount + capacityBonus
    const sold = Math.min(desired, effectiveInventory)
    if (sold > 0) {
      soldItems[key] = sold
      const basePrice =
        priceByKey[key] ??
        (MERCH_PROFILES as Record<string, MerchItemProfile>)[key]
          ?.defaultPrice ??
        0

      // assetModifiers.avgMerchSalePriceBonus is a multiplicative bonus
      // expressed as +X (e.g. 0.10 = +10%). Apply at the line-item level,
      // then floor — multiplying sold × modifiedPrice and flooring once
      // preserves precision better than flooring per-unit.
      const itemRevenue = Math.floor(
        sold * basePrice * (1 + (assetModifiers.avgMerchSalePriceBonus ?? 0))
      )
      totalRevenue += itemRevenue

      breakdownItems.push({
        labelKey: `economy:gigIncome.merchSales.${key}.label`,
        value: itemRevenue,
        detailKey: 'economy:gigIncome.merchSales.detail',
        detailParams: { buyers: sold }
      })
    }
  }

  return {
    revenue: totalRevenue,
    breakdownItems,
    soldItems
  }
}

/**
 * Calculates distance between two nodes or a node and a fallback point.
 * @param {object} nodeA - The target node.
 * @param {object} [nodeB=null] - The source node.
 * @returns {number} The calculated distance.
 */
const calculateDistance = (nodeA: unknown, nodeB: unknown = null) => {
  const pointA = (nodeA && typeof nodeA === 'object' ? nodeA : {}) as MapPoint
  const pointB = (nodeB && typeof nodeB === 'object' ? nodeB : {}) as MapPoint
  const x1 = typeof pointA.x === 'number' ? pointA.x : (pointA.venue?.x ?? 50)
  const y1 = typeof pointA.y === 'number' ? pointA.y : (pointA.venue?.y ?? 50)

  const x2 = typeof pointB.x === 'number' ? pointB.x : (pointB.venue?.x ?? 50)
  const y2 = typeof pointB.y === 'number' ? pointB.y : (pointB.venue?.y ?? 50)

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
  dist: number,
  playerState: Pick<PlayerState, 'van'> | null = null,
  bandState: Pick<BandState, 'members'> | null = null,
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
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
    fuelLiters *
      EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE *
      (assetModifiers.fuelMultiplier ?? 1.0)
  )

  return { fuelLiters, fuelCost }
}

/**
 * Calculates the guaranteed daily cost for the player, including lifestyle inflation
 * and potential offsets from social media revenue.
 * @param {object} player - Player state containing fame level.
 * @param {object} band - Band state containing members.
 * @param {object} [social={}] - Social state containing YouTube followers.
 * @returns {number} The calculated daily cost.
 */
export const calculateGuaranteedDailyCost = (
  player: Pick<PlayerState, 'fameLevel'>,
  band: Pick<BandState, 'members'>,
  social: Partial<Pick<SocialState, 'youtube'>> = {}
) => {
  const bandSize = Array.isArray(band.members) ? band.members.length : 3
  const fameLevel = player.fameLevel || 0
  const lifestyleInflation = Math.floor(Math.pow(fameLevel, 1.4) * 15)
  let dailyCost =
    EXPENSE_CONSTANTS.DAILY.BASE_COST + bandSize * 8 + lifestyleInflation

  if ((social.youtube || 0) >= 10000) {
    const adRevenue = Math.floor((social.youtube || 0) / 10000) * 10
    dailyCost -= adRevenue
  }

  return dailyCost
}

/**
 * Calculates travel expenses.
 * @param {object} node - The target node.
 * @param {object} [fromNode=null] - The source node.
 * @param {object} [playerState=null] - Optional player state for upgrade-aware costs.
 * @param {object} [bandState=null] - Optional band state for trait checks.
 */
export const calculateTravelExpenses = (
  node: unknown,
  fromNode: unknown = null,
  playerState: Pick<PlayerState, 'fameLevel' | 'money' | 'van'> | null = null,
  bandState: Pick<BandState, 'members'> | null = null,
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  const dist = calculateDistance(node, fromNode)
  const { fuelLiters } = calculateFuelCost(
    dist,
    playerState,
    bandState,
    assetModifiers
  )

  const bandSize = bandState?.members?.length || 3
  const fameLevel = playerState?.fameLevel || 0

  // Base food cost
  const foodCost = bandSize * EXPENSE_CONSTANTS.FOOD.FAST_FOOD

  // Keep travel scaling predictable: mild distance pressure, mild fame pressure,
  // and at most a small reserve fee for travelling with a large cash buffer.
  const distanceLogistics = Math.floor(
    (dist / 100) * TRAVEL_LOGISTICS_PER_100KM
  )
  const fameLogistics = Math.floor(fameLevel * TRAVEL_LOGISTICS_PER_FAME_LEVEL)
  const cashReserveFee = Math.min(
    TRAVEL_LOGISTICS_CASH_CAP,
    Math.floor(toFiniteNumber(playerState?.money, 0) / 1000) * 5
  )
  const logisticsCost =
    TRAVEL_LOGISTICS_BASE + distanceLogistics + fameLogistics + cashReserveFee
  const totalCost = foodCost + logisticsCost

  return { dist, fuelLiters, totalCost }
}

/**
 * Calculates the cost to refuel the van to full capacity.
 * @param {number} currentFuel - Current fuel level.
 * @returns {number} Cost in euros.
 */
export const calculateRefuelCost = (
  currentFuel: number,
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  const missing = Math.max(
    0,
    EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL - currentFuel
  )
  return Math.ceil(
    missing *
      EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE *
      // Nullish fallback (not truthy) so a legitimate fuelMultiplier === 0
      // applies as zero rather than collapsing to 1.
      (assetModifiers.fuelMultiplier ?? 1)
  )
}

/**
 * Calculates the cost to repair the van to full condition.
 * @param {number} currentCondition - Current condition (0-100).
 * @returns {number} Cost in euros.
 */
export const calculateRepairCost = (currentCondition: number) => {
  const missing = Math.max(0, 100 - currentCondition)
  return Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.REPAIR_COST_PER_UNIT)
}

/**
 * Calculates the effective ticket price, accounting for any discounts or modifiers.
 * @param {object} gigData - The gig data containing the base price.
 * @param {object} context - Context object containing flags like discountedTickets.
 * @returns {number} The effective ticket price.
 */
export const calculateEffectiveTicketPrice = (
  gigData: GigEconomyData = {},
  context: EconomyContext = {}
) => {
  if (!gigData) return 0
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
const VENUE_SPLIT_RATES: Record<number, number> = { 3: 0.35, 4: 0.55 }
export const calculateVenueSplit = (
  ticketsRevenue = 0,
  gigData: GigEconomyData = {}
) => {
  gigData = gigData || {}
  const splitRate =
    (gigData.diff ?? 0) >= 5
      ? 0.7
      : Object.hasOwn(VENUE_SPLIT_RATES, gigData.diff ?? 0)
        ? (VENUE_SPLIT_RATES[gigData.diff as number] ?? 0)
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
export const calculateGuarantee = (gigData: GigEconomyData = {}) => {
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
export const calculateBarCut = (
  ticketsSold = 0,
  modifiers: GigModifiers = {}
) => {
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
export const calculateSponsorshipBonuses = (gigStats: GigStatsLike = {}) => {
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
    if ((gigStats.peakHype ?? 0) >= 100) {
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
export const calculateGigExpenses = (modifiers: GigModifiers = {}) => {
  modifiers = modifiers || {}
  const expenses: { total: number; breakdown: FinancialBreakdownItem[] } = {
    total: 0,
    breakdown: []
  }

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
export const calculateGigFinancials = (
  {
    gigData,
    performanceScore,
    modifiers,
    bandInventory,
    playerState,
    gigStats,
    context = {}
  }: GigFinancialParams,
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  const playerFame = playerState?.fame ?? 0

  logger.debug('Economy', 'Calculating Gig Financials', {
    gig: gigData.name,
    score: performanceScore,
    fame: playerFame
  })

  const effectivePrice = calculateEffectiveTicketPrice(gigData, context)
  const effectiveGigData = { ...gigData, price: effectivePrice }

  const report: PostGigFinancials = {
    income: { total: 0, breakdown: [] },
    expenses: { total: 0, breakdown: [] },
    net: 0
  }

  // Normalize context: some callers flatten social fields to top-level while
  // also passing the full social sub-object. Support both shapes defensively.
  const ctxSocial = context?.social ?? {}

  // 1. Ticket Sales
  // Apply automated promo from zealotry to tickets
  const zealotry = context.zealotry ?? ctxSocial.zealotry ?? 0
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
    context,
    assetModifiers
  )
  report.income.breakdown.push(...merch.breakdownItems)
  report.income.total += merch.revenue
  report.soldMerch = merch.soldItems

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

  // Active Deal Per-Gig Payout
  const activeDeals = ctxSocial.activeDeals ?? []
  for (let i = 0; i < activeDeals.length; i++) {
    const activeDeal = activeDeals[i]
    if (!activeDeal) continue
    if (
      activeDeal.type === 'SPONSORSHIP' &&
      activeDeal.offer &&
      activeDeal.offer.perGig
    ) {
      const perGig = activeDeal.offer.perGig as unknown
      if (typeof perGig === 'number' && Number.isFinite(perGig)) {
        report.income.breakdown.push({
          labelKey: 'economy:gigIncome.brandSponsor.label',
          value: perGig,
          detailKey: 'economy:gigIncome.brandSponsor.detail'
        })
        report.income.total += perGig
      }
    }
  }

  // 6. Sponsorship Bonuses
  const sponsorshipBonuses = calculateSponsorshipBonuses(gigStats)
  if (sponsorshipBonuses.incomeItems.length > 0) {
    report.income.breakdown.push(...sponsorshipBonuses.incomeItems)
    report.income.total += sponsorshipBonuses.totalBonus
  }

  if (assetModifiers.tipBonusGigs && assetModifiers.tipBonusGigs > 0) {
    // tipBonusGigs is a decimal fraction (0.10 = 10%); apply directly to
    // income.total.
    const tipBonus = Math.floor(
      report.income.total * assetModifiers.tipBonusGigs
    )
    if (tipBonus > 0) {
      report.income.breakdown.push({
        labelKey: 'economy:gigIncome.tipBonus.label',
        value: tipBonus,
        detailKey: 'economy:gigIncome.tipBonus.detail'
      })
      report.income.total += tipBonus
    }
  }

  // 7. Management Cut (fame-progressive: 0% at fame=0, full 15% at fame≥200)
  const effectiveCutRate = MANAGEMENT_CUT_RATE * Math.min(1, playerFame / 200)
  const managementCut = Math.floor(report.income.total * effectiveCutRate)
  if (managementCut > 0) {
    report.expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.managementFee.label',
      value: managementCut,
      detailKey: 'economy:gigExpenses.managementFee.detail',
      detailParams: { rate: Math.round(effectiveCutRate * 100) }
    })
    report.expenses.total += managementCut
  }

  const grossNet = report.income.total - report.expenses.total
  if (grossNet > 0 && GLOBAL_PAYOUT_NERF < 1) {
    const adjustedNet = Math.floor(grossNet * GLOBAL_PAYOUT_NERF)
    const payoutDampener = grossNet - adjustedNet
    if (payoutDampener > 0) {
      report.expenses.breakdown.push({
        labelKey: 'economy:gigExpenses.payoutDampener.label',
        value: payoutDampener,
        detailKey: 'economy:gigExpenses.payoutDampener.detail',
        detailParams: { rate: Math.round((1 - GLOBAL_PAYOUT_NERF) * 100) }
      })
      report.expenses.total += payoutDampener
    }
  }

  report.net = report.income.total - report.expenses.total

  // 8. Hard gig net cap — prevents single large-venue outlier from breaking economy
  if (report.net > MAX_GIG_NET) {
    const overageFee = report.net - MAX_GIG_NET
    report.expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.overageFee.label',
      value: overageFee,
      detailKey: 'economy:gigExpenses.overageFee.detail'
    })
    report.expenses.total += overageFee
    report.net = report.income.total - report.expenses.total
  }

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
export const shouldTriggerBankruptcy = (
  newMoney: unknown,
  netIncome: number | null | undefined
) => {
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
export const calculateTravelMinigameResult = (
  damageTaken: number,
  itemsCollected: unknown
) => {
  // 50% damage scaling: 100 damage -> 50 condition loss
  const conditionLoss = Math.floor(Math.max(0, damageTaken) / 2)

  // Fuel bonus re-enabled: each fuel item grants 0.5 liters of fuel bonus
  let fuelItems = 0
  let voidHazardHits = 0
  if (Array.isArray(itemsCollected)) {
    for (const item of itemsCollected) {
      if (item === 'FUEL') fuelItems++
      if (item === 'VOID_HAZARD') voidHazardHits++
    }
  }
  const fuelBonus = fuelItems * 0.5

  return { conditionLoss, fuelBonus, voidHazardHits }
}

/**
 * Calculates effects of Roadie Minigame results.
 * @param {number} equipmentDamage - Total equipment damage.
 * @param {object} bandState - Current band traits/state used by bandHasTrait.
 * @returns {object} { stress, repairCost }
 */
export const calculateRoadieMinigameResult = (
  equipmentDamage: number,
  bandState: Pick<BandState, 'members'> | null | undefined,
  contrabandDelivered: number = 0
) => {
  const safeDamage = Math.max(0, equipmentDamage)
  const stress = Math.floor(safeDamage / 5)
  let repairCost = Math.floor(safeDamage * 2)

  // Gear Nerd Trait: 20% discount on repairs
  if (bandHasTrait(bandState, 'gear_nerd')) {
    repairCost = Math.floor(repairCost * 0.8)
  }

  // Brutalist neurotoxic payout
  const safeContraband = Math.max(0, Number(contrabandDelivered) || 0)
  const contrabandBonus = safeContraband * 50

  return { stress, repairCost, contrabandBonus }
}

/**
 * Calculates outcome for Amp Calibration minigame
 * @param {number} score - 0 to 100
 * @param {Object} bandState
 * @returns {Object} { stress, reward }
 */
export const calculateAmpCalibrationResult = (
  score: unknown,
  bandState: Pick<BandState, 'members'> | null | undefined,
  voidResonance: number = 0,
  purgesUsed: number = 0,
  hijacksOverridden: number = 0
) => {
  let numScore = Number(score)
  if (!Number.isFinite(numScore)) {
    numScore = 0
  }
  let numResonance = Number(voidResonance)
  if (!Number.isFinite(numResonance)) {
    numResonance = 0
  }
  const safeScore = clamp0to100(numScore)
  const safeResonance = clamp0to100(numResonance)
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

    // Void Resonance converts to pure money at a 2x rate only on success
    reward += Math.floor(safeResonance * 2)
  }

  // Stress penalty for relying on neurotoxic purges
  const safePurgesUsed = Math.max(0, Number(purgesUsed) || 0)
  stress += Math.floor(safePurgesUsed * 5)

  // Kranker Schrank Hijack bonuses/mitigations
  const safeHijacksOverridden = Math.max(0, Number(hijacksOverridden) || 0)
  reward += safeHijacksOverridden * 10
  stress = Math.max(0, stress - safeHijacksOverridden * 2)

  return { stress, reward }
}

/**
 * Calculates outcome for Kabelsalat minigame
 * @param {Object} results - { isPoweredOn: boolean, timeLeft: number }
 * @param {Object} bandState
 * @returns {Object} { stress, reward }
 */
export const calculateKabelsalatMinigameResult = (
  results: unknown,
  bandState: Pick<BandState, 'members'> | null | undefined
) => {
  const safeResults =
    results && typeof results === 'object' ? (results as KabelsalatResults) : {}
  let stress = 0
  let reward = 0

  if (!safeResults.isPoweredOn) {
    // Failure! Stress for everyone.
    stress = 15
  } else {
    // Success! Reward based on time remaining
    const validTimeLeft =
      typeof safeResults.timeLeft === 'number' &&
      Number.isFinite(safeResults.timeLeft)
        ? safeResults.timeLeft
        : 0
    const timeBonus = Math.max(0, Math.floor(validTimeLeft / 5))
    reward = Math.max(0, 60 + timeBonus * 15) // Base 60, scaling better for quick completion

    // Tech Wizard trait increases rewards
    if (bandHasTrait(bandState, 'tech_wizard')) {
      reward = Math.floor(reward * 1.5)
    }
  }

  // Stress penalty for relying on neurotoxic purges
  const rawPurged = safeResults.voidSurgesPurged
  let safePurgesUsed = Number(rawPurged)
  if (!Number.isFinite(safePurgesUsed) || safePurgesUsed < 0) {
    safePurgesUsed = 0
  }
  // Clamp to prevent overflow when multiplying by 5
  safePurgesUsed = Math.min(
    Math.floor(safePurgesUsed),
    Math.floor(Number.MAX_SAFE_INTEGER / 5)
  )
  stress += safePurgesUsed * 5

  return { stress, reward }
}
