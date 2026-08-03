import { calculateGigFinancials } from '../economy'
import { BREAKDOWN_LABEL_KEYS } from '../economy/breakdownLabelKeys'
import { generatePostOptions } from '../socialEngine'
import { applyPostGigPerformancePenalty } from './performanceLogic'
import { BALANCE_CONSTANTS, finiteNumberOr } from '../gameState'
import { getRegionKeyForLocation } from '../mapUtils'
import {
  DEFAULT_BALANCE_TUNING,
  getRepeatDemandMultiplier
} from '../balanceTuning'

import type { GameState } from '../../types'
import type { CityTraitState } from '../../types/game'
import type { AssetModifiers } from '../../types/assets'
import type { BalanceTuning } from '../balanceTuning'
import { FLAGS } from '../../data/flags.registry'

export interface RepeatDemandContext {
  day: number
  regionId: string
  regionalGigHistory?: Readonly<Record<string, readonly number[]>>
  tuning?: Readonly<BalanceTuning>
}

export const applyRepeatDemandAdjustment = (
  financials: NonNullable<ReturnType<typeof calculateGigFinancials>>,
  context: RepeatDemandContext
) => {
  // `Math.max(0, NaN)` is NaN, so an upstream non-finite net would otherwise
  // turn the whole adjustment — and the expense line it writes — into NaN.
  // Normalized before the early returns so no path hands a `NaN`/`Infinity`/`-0`
  // net back to the caller; the identity check keeps the common case
  // allocation-free.
  const safeNet = finiteNumberOr(financials.net, 0)
  const normalized = Object.is(financials.net, safeNet)
    ? financials
    : { ...financials, net: safeNet }

  const tuning = context.tuning ?? DEFAULT_BALANCE_TUNING
  if (
    tuning.touring.repeatDemandPenaltyPerGig <= 0 ||
    tuning.touring.maxRepeatDemandPenalty <= 0 ||
    context.day <= tuning.touring.repeatDemandStartDay
  ) {
    return normalized
  }
  const recentGigCount = (
    context.regionalGigHistory?.[context.regionId] ?? []
  ).filter(
    gigDay =>
      Number.isFinite(gigDay) &&
      gigDay < context.day &&
      context.day - gigDay <= tuning.touring.repeatGigWindowDays
  ).length
  const multiplier = getRepeatDemandMultiplier(
    context.day,
    recentGigCount,
    tuning
  )
  const demandCost = Math.min(
    Math.max(0, safeNet),
    Math.round(Math.max(0, safeNet) * (1 - multiplier))
  )
  if (demandCost <= 0) return normalized
  return {
    ...financials,
    expenses: {
      total: financials.expenses.total + demandCost,
      breakdown: [
        ...financials.expenses.breakdown,
        {
          labelKey: BREAKDOWN_LABEL_KEYS.DEMAND_SATURATION,
          detailKey: 'economy:gigExpenses.demandSaturation.detail',
          value: demandCost
        }
      ]
    },
    net: Math.max(0, safeNet - demandCost)
  }
}

/**
 * Derives the post-gig context for the current venue: gig financials, generated
 * post options, and performance-adjusted state used to seed the post-gig phase.
 */
export const deriveGigContext = (
  currentGig: GameState['currentGig'],
  social: GameState['social'],
  player: GameState['player']
) => {
  if (!currentGig || !social || !player) return null

  return {
    daysSinceLastGig: player.day - (social.lastGigDay ?? player.day),
    lastGigDifficulty: social.lastGigDifficulty ?? null
  }
}

/**
 * Derives reconciled post-gig financials from current gig state and modifiers.
 *
 * @param params - Current gig, stats, modifiers, inventory, player, social, reputation, and asset context.
 * @returns Reconciled post-gig financials, or null when current gig or stats are missing.
 */
export const deriveFinancials = ({
  currentGig,
  lastGigStats,
  perfScore,
  gigModifiers,
  bandInventory,
  bandMerchPrices,
  bandGigModifier,
  player,
  social,
  reputationByRegion,
  activeStoryFlags,
  gigContext,
  cityTraits,
  assetModifiers,
  repeatDemandContext
}: {
  currentGig: GameState['currentGig']
  lastGigStats: GameState['lastGigStats']
  perfScore: number
  gigModifiers: GameState['gigModifiers']
  bandInventory: GameState['band']['inventory']
  bandMerchPrices?: GameState['band']['merchPrices']
  /** Temporary band gig-income bonus fraction (contraband `gig_modifier`). */
  bandGigModifier?: number
  player: GameState['player']
  social: GameState['social']
  reputationByRegion: GameState['reputationByRegion']
  activeStoryFlags: GameState['activeStoryFlags']
  gigContext: {
    daysSinceLastGig: number
    lastGigDifficulty: number | null
  } | null
  cityTraits?: CityTraitState
  assetModifiers?: AssetModifiers
  repeatDemandContext?: RepeatDemandContext
}) => {
  if (!currentGig || !lastGigStats) return null

  const result = calculateGigFinancials(
    {
      gigData: currentGig,
      performanceScore: perfScore,
      modifiers: gigModifiers,
      bandInventory: bandInventory,
      playerState: player,
      gigStats: lastGigStats,
      context: {
        controversyLevel: social.controversyLevel ?? 0,
        regionRep:
          reputationByRegion[
            getRegionKeyForLocation(player.location) ?? 'Unknown'
          ] ?? 0,
        loyalty: social.loyalty ?? 0,
        zealotry: social.zealotry ?? 0,
        discountedTickets: activeStoryFlags.includes(
          FLAGS.DISCOUNTED_TICKETS_ACTIVE
        ),
        daysSinceLastGig: gigContext?.daysSinceLastGig ?? 0,
        lastGigDifficulty: gigContext?.lastGigDifficulty ?? undefined,
        merchPrices: bandMerchPrices,
        bandGigModifier,
        social,
        cityTraits
      }
    },
    assetModifiers
  )

  const performanceAdjusted = applyPostGigPerformancePenalty({
    financials: result,
    misses: lastGigStats.misses ?? 0,
    missTolerance: BALANCE_CONSTANTS.MISS_TOLERANCE,
    missMoneyPenalty: BALANCE_CONSTANTS.MISS_MONEY_PENALTY
  })
  return repeatDemandContext
    ? applyRepeatDemandAdjustment(performanceAdjusted, repeatDemandContext)
    : performanceAdjusted
}

/**
 * Builds available post-gig social options for the completed gig.
 *
 * @param params - Completed gig state and active event context.
 * @returns Available social post options plus any option-derivation error.
 */
export const derivePostOptions = ({
  currentGig,
  lastGigStats,
  player,
  band,
  social,
  activeEvent,
  activeQuests
}: {
  currentGig: GameState['currentGig']
  lastGigStats: GameState['lastGigStats']
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  activeEvent: GameState['activeEvent']
  activeQuests: GameState['activeQuests']
}) => {
  if (!currentGig || !lastGigStats) return { options: [], error: null }

  // Pass the necessary game state to evaluate post conditions
  const gameStateForPosts = {
    player,
    band,
    social,
    lastGigStats,
    activeEvent,
    activeQuests,
    currentGig,
    gigEvents: lastGigStats.events ?? []
  }

  try {
    const options = generatePostOptions(currentGig, gameStateForPosts)
    return { options, error: null }
  } catch (e) {
    return { options: [], error: e }
  }
}
