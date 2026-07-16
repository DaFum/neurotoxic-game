import { logger } from '../../logger'
import { clamp0to100, finiteNumberOr } from '../../gameState'
import { clampUnit } from '../../numberUtils'
import type { GigFinancialParams } from '../types'
import type { PostGigFinancials } from '../../../types/economy'
import { calculateZealotryEffects } from '../../socialEngine'
import {
  MAX_GIG_NET,
  MANAGEMENT_CUT_RATE,
  GLOBAL_PAYOUT_NERF,
  ZEALOTRY_PROMO_THRESHOLD
} from '../constants'
import { NEUTRAL_ASSET_MODIFIERS } from '../../assetSelectors'
import type { AssetModifiers } from '../../../types/assets'
import {
  calculateTicketIncome,
  calculateMerchIncome,
  calculateVenueSplit,
  calculateGuarantee,
  calculateBarCut,
  calculateSponsorshipBonuses,
  calculateGigExpenses
} from './calculators'
export * from './calculators'
/**
 * Calculates the full financial breakdown of a gig with Fame Scaling and Hype bonuses.
 * @param params - Parameters object
 * - `params.gigData` - `capacity, price, pay (guarantee), dist, diff`
 * - `params.performanceScore` - 0 to 100
 * - `params.modifiers` - `merch: bool, promo: bool, catering: bool, soundcheck: bool, guestlist: bool`
 * - `params.bandInventory` - `shirts, hoodies, etc`
 * - `params.playerStateOrFame` - Player state object or just fame (number) for legacy support
 * - `params.gigStats` - Detailed gig stats (misses, peakHype, etc)
 * @param assetModifiers - Active asset modifiers that affect gig finances.
 * @returns Reconciled post-gig financial report with income, expenses, net, and sold merch.
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
  const playerFame = finiteNumberOr(playerState?.fame, 0)
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
    if (activeDeal.type === 'SPONSORSHIP') {
      const perGig = finiteNumberOr(activeDeal.offer?.perGig, 0)
      if (perGig > 0) {
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

  // Temporary band effect bonus (contraband `gig_modifier`): decimal fraction
  // applied to income.total as its own line so net stays reconciled.
  const bandGigModifier = Math.max(
    0,
    finiteNumberOr(context.bandGigModifier, 0)
  )
  if (bandGigModifier > 0) {
    const bandBonus = Math.floor(report.income.total * bandGigModifier)
    if (bandBonus > 0) {
      report.income.breakdown.push({
        labelKey: 'economy:gigIncome.bandBonus.label',
        value: bandBonus,
        detailKey: 'economy:gigIncome.bandBonus.detail'
      })
      report.income.total += bandBonus
    }
  }

  // 7. Management Cut (fame-progressive: 0% at fame=0, full 15% at fame≥200)
  const effectiveCutRate = MANAGEMENT_CUT_RATE * clampUnit(playerFame / 200)
  const managementCut = Math.floor(report.income.total * effectiveCutRate)
  if (managementCut > 0 || report.income.total > 0) {
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
    const payoutNerf =
      1 -
      Math.min(1 - GLOBAL_PAYOUT_NERF, Math.max(0, (playerFame - 10) / 1200))
    const adjustedNet = Math.floor(grossNet * payoutNerf)
    const payoutDampener = grossNet - adjustedNet
    if (payoutDampener > 0) {
      report.expenses.breakdown.push({
        labelKey: 'economy:gigExpenses.payoutDampener.label',
        value: payoutDampener,
        detailKey: 'economy:gigExpenses.payoutDampener.detail',
        detailParams: { rate: Math.round((1 - payoutNerf) * 100) }
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
