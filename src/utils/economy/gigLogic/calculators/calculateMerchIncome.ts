import { clamp0to100, finiteNumberOr } from '../../../gameState'
import { SPENDING_PROFILE_MERCH_MULTIPLIER } from '../../../../data/merch'
import type {
  CityGenre,
  SpendingProfile,
  MerchItemProfile
} from '../../../../data/merch'
import { MERCH_PROFILES } from '../../../../data/merch'
import type {
  EconomyContext,
  GigStatsLike,
  BandInventoryLike
} from '../../types'
import type { GigModifiers } from '../../../../types'
import type { FinancialBreakdownItem } from '../../../../types/economy'
import { MERCH_PROFILE_VALUES, SORTED_MERCH_KEYS } from '../../constants'
import { NEUTRAL_ASSET_MODIFIERS } from '../../../assetSelectors'
import type { AssetModifiers } from '../../../../types/assets'
/**
 * Calculates merch sales revenue and costs.
 *
 * @param ticketsSold - Number of attendees eligible to buy merch.
 * @param performanceScore - Post-gig performance score used for demand.
 * @param gigStats - Detailed rhythm stats that influence demand.
 * @param modifiers - Active pre-gig modifiers.
 * @param bandInventory - Current merch inventory by item key.
 * @param context - Social, price, and city-trait context for merch demand.
 * @param assetModifiers - Active asset modifiers that can affect sale price.
 * @returns Merch revenue, itemized income lines, and units sold by merch key.
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
  let totalRawShare = 0

  // Compute raw share for every item regardless of inventory. Out-of-stock
  // items still contribute to totalRawShare so their portion of demand is
  // lost (capped at 0 in the allocation loop) rather than redistributed to
  // in-stock items.
  for (let i = 0; i < MERCH_PROFILE_VALUES.length; i++) {
    const profile = MERCH_PROFILE_VALUES[i]
    if (!profile) continue
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

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i]
    if (!key) continue
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
