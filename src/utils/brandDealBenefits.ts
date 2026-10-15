import { BRAND_DEALS_BY_ID } from '../data/brandDeals'
import { isFiniteNumber } from './finiteNumber'
import type { BrandDeal } from '../types/social'

/**
 * Upper bound on the summed record-label revenue share, so a malformed or
 * future catalog entry can never take more than half of merch income.
 */
const MAX_REVENUE_SHARE = 0.5

/**
 * Aggregated perks and costs of the band's active brand deals.
 */
interface ActiveDealBenefits {
  /** Loyalty added after every gig played under the deal(s). */
  loyaltyPerGig: number
  /** Multiplier on positive post-gig fame gains (1 = none). */
  fameMultiplier: number
  /** Stamina each member recovers per day while the deal(s) run. */
  staminaRegenPerDay: number
  /** Fraction of gig merch revenue a record label takes (0..0.5). */
  revenueShare: number
}

/** Identity value: no active deal grants or costs anything. */
const NO_DEAL_BENEFITS: Readonly<ActiveDealBenefits> = Object.freeze({
  loyaltyPerGig: 0,
  fameMultiplier: 1,
  staminaRegenPerDay: 0,
  revenueShare: 0
})

const readBenefit = (deal: BrandDeal, key: string): number | undefined => {
  const benefit = deal.benefit
  if (!benefit || !Object.hasOwn(benefit, key)) return undefined
  const value = benefit[key]
  return isFiniteNumber(value) ? value : undefined
}

/**
 * Aggregates the `benefit` block and `offer.revenueShare` of every active
 * deal.
 *
 * @param activeDeals - Active deals from `social.activeDeals`.
 * @returns Summed loyalty/stamina perks, the product of fame multipliers and
 * the summed (capped) revenue share.
 *
 * @remarks
 * Terms are read from the static registry (`BRAND_DEALS_BY_ID`), never from
 * the deal object, so a tampered save or a negotiated offer cannot inflate a
 * perk. Unknown ids contribute nothing.
 */
export const getActiveDealBenefits = (
  activeDeals: readonly unknown[] | null | undefined
): ActiveDealBenefits => {
  if (!Array.isArray(activeDeals) || activeDeals.length === 0) {
    return { ...NO_DEAL_BENEFITS }
  }
  const result: ActiveDealBenefits = { ...NO_DEAL_BENEFITS }
  for (const entry of activeDeals) {
    if (!entry || typeof entry !== 'object') continue
    const id = (entry as { id?: unknown }).id
    if (typeof id !== 'string') continue
    const deal = BRAND_DEALS_BY_ID.get(id)
    if (!deal) continue

    result.loyaltyPerGig += readBenefit(deal, 'loyalty') ?? 0
    result.staminaRegenPerDay += Math.max(
      0,
      readBenefit(deal, 'staminaRegen') ?? 0
    )
    const fameMultiplier = readBenefit(deal, 'fameMultiplier')
    if (fameMultiplier !== undefined && fameMultiplier > 0) {
      result.fameMultiplier *= fameMultiplier
    }
    const share = deal.offer.revenueShare
    if (isFiniteNumber(share) && share > 0) {
      result.revenueShare += share
    }
  }
  result.revenueShare = Math.min(MAX_REVENUE_SHARE, result.revenueShare)
  return result
}
