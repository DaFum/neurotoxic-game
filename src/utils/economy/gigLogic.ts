import { NEUTRAL_ASSET_MODIFIERS } from '../assetSelectors'
import type { AssetModifiers } from '../../types/assets'
import { logger } from '../logger'
import { clamp0to100, finiteNumberOr } from '../gameStateUtils'
import { SPENDING_PROFILE_MERCH_MULTIPLIER } from '../../data/merch'
import type {
  CityGenre,
  SpendingProfile,
  MerchItemProfile
} from '../../data/merch'
import { MERCH_PROFILES } from '../../data/merch'
import type {
  GigEconomyData,
  EconomyContext,
  GigStatsLike,
  BandInventoryLike,
  GigFinancialParams
} from './types'
import type { GigModifiers } from '../../types'
import type {
  FinancialBreakdownItem,
  PostGigFinancials
} from '../../types/economy'
import { calculateZealotryEffects } from '../socialEngine'
import {
  TICKET_SALES_CONSTANTS,
  BAR_RATE_VIP,
  BAR_RATE_NORMAL,
  AVG_SPEND_PER_PERSON_AT_BAR,
  MAX_GIG_NET,
  MANAGEMENT_CUT_RATE,
  GLOBAL_PAYOUT_NERF,
  ZEALOTRY_PROMO_THRESHOLD,
  MERCH_PROFILE_VALUES,
  SORTED_MERCH_KEYS,
  VENUE_SPLIT_RATES,
  calculateGigModifierCost
} from './constants'

/**
 * Calculates ticket sales revenue and attendance.
 */
export const calculateTicketIncome = (
  gigData: GigEconomyData = {},
  playerFame = 0,
  modifiers: Partial<GigModifiers> = {},
  context: EconomyContext = {}
) => {
  gigData = gigData || {}
  modifiers = modifiers || {}
  context = context || {}
  // Base draw is ~30%. Fame fills the rest.
  const baseDrawRatio = TICKET_SALES_CONSTANTS.BASE_DRAW_RATIO
  // Fame needs to be ~8x capacity to fill it easily
  const baseCapacity = Math.max(0, finiteNumberOr(gigData.capacity, 0))
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
  const controversyLevel = finiteNumberOr(context.controversyLevel, 0)
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
  const rawTicketPrice = typeof gigData.price === 'number' ? gigData.price : 0
  const ticketPrice =
    context.discountedTickets && rawTicketPrice > 10
      ? Math.floor(rawTicketPrice * 0.5)
      : rawTicketPrice
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
  modifiers: Partial<GigModifiers> = {},
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
    finiteNumberOr(context?.controversyLevel, 0) >= 40 &&
    finiteNumberOr(context?.loyalty, 0) >= 20
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
  // merchCapacityBonus is a carry-cap modifier (raises restock ceiling),
  // NOT phantom stock. Selling is bounded by actual on-hand inventory.

  for (const key of sortedKeys) {
    const share = (rawShare[key] ?? 0) / totalRawShare
    const desired = Math.floor(effectiveBuyers * share)
    const inventoryCount =
      typeof safeInventory[key] === 'number'
        ? (safeInventory[key] as number)
        : 0
    const sold = Math.min(desired, inventoryCount)
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
      const salePriceBonus = Math.max(
        0,
        finiteNumberOr(assetModifiers.avgMerchSalePriceBonus, 0)
      )
      const limitedEditionBonus = assetModifiers.flags?.enablesLimitedEditions
        ? 0.1
        : 0
      const itemRevenue = Math.floor(
        sold * basePrice * (1 + salePriceBonus + limitedEditionBonus)
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
 * Calculates the effective ticket price after applying ticket discounts.
 * @param {object} gigData - Gig economy data containing the base ticket price.
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
export const calculateVenueSplit = (
  ticketsRevenue = 0,
  gigData: GigEconomyData = {}
) => {
  gigData = gigData || {}
  const diff = gigData.diff ?? gigData.difficulty ?? 0
  const splitRate =
    diff >= 5
      ? 0.7
      : Object.hasOwn(VENUE_SPLIT_RATES, diff)
        ? (VENUE_SPLIT_RATES[diff] ?? 0)
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
  const pay = Math.max(0, finiteNumberOr(gigData.pay, 0))
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
  modifiers: Partial<GigModifiers> = {}
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
export const calculateGigExpenses = (
  modifiers: Partial<GigModifiers> = {},
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
) => {
  modifiers = modifiers || {}
  const expenses: { total: number; breakdown: FinancialBreakdownItem[] } = {
    total: 0,
    breakdown: []
  }

  // Operational Expenses (Modifiers)
  // Transport and subsistence are now exclusively handled during travel phase.

  // Modifiers (Budget items)
  if (modifiers.catering) {
    const cost = calculateGigModifierCost('catering', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.catering.label',
      value: cost,
      detailKey: 'economy:gigExpenses.catering.detail'
    })
    expenses.total += cost
  }

  if (modifiers.promo) {
    const cost = calculateGigModifierCost('promo', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.socialAds.label',
      value: cost,
      detailKey: 'economy:gigExpenses.socialAds.detail'
    })
    expenses.total += cost
  }

  if (modifiers.merch) {
    const cost = calculateGigModifierCost('merch', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.merchStand.label',
      value: cost,
      detailKey: 'economy:gigExpenses.merchStand.detail'
    })
    expenses.total += cost
  }

  if (modifiers.soundcheck) {
    const cost = calculateGigModifierCost('soundcheck', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.soundcheck.label',
      value: cost,
      detailKey: 'economy:gigExpenses.soundcheck.detail'
    })
    expenses.total += cost
  }

  if (modifiers.guestlist) {
    const cost = calculateGigModifierCost('guestlist', assetModifiers)
    expenses.breakdown.push({
      labelKey: 'economy:gigExpenses.guestList.label',
      value: cost,
      detailKey: 'economy:gigExpenses.guestList.detail'
    })
    expenses.total += cost
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
  const totalSongQualityBonus =
    Math.max(0, finiteNumberOr(assetModifiers.songQualityBonus, 0)) +
    (assetModifiers.flags?.enablesReRecording ? 0.2 : 0)
  const effectivePerformanceScore = clamp0to100(
    finiteNumberOr(performanceScore, 0) + totalSongQualityBonus * 100
  )

  logger.debug('Economy', 'Calculating Gig Financials', {
    gig: gigData.name,
    score: performanceScore,
    fame: playerFame
  })

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

  // calculateTicketIncome applies the ticket discount itself (via
  // context.discountedTickets), so pass the original gigData to avoid
  // double-applying the discount.
  const tickets = calculateTicketIncome(
    gigData,
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
    effectivePerformanceScore,
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

  const operationalExpenses = calculateGigExpenses(
    costModifiers,
    assetModifiers
  )
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
