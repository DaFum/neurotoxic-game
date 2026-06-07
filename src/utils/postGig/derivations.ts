import { calculateGigFinancials } from '../economyEngine'
import { generatePostOptions } from '../socialEngine'
import { applyPostGigPerformancePenalty } from './performanceLogic'
import { BALANCE_CONSTANTS } from '../gameState'

import type { GameState } from '../../types'
import type { CityTraitState } from '../../types/game'
import type { AssetModifiers } from '../../types/assets'

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
  player,
  social,
  reputationByRegion,
  activeStoryFlags,
  gigContext,
  cityTraits,
  assetModifiers
}: {
  currentGig: GameState['currentGig']
  lastGigStats: GameState['lastGigStats']
  perfScore: number
  gigModifiers: GameState['gigModifiers']
  bandInventory: GameState['band']['inventory']
  bandMerchPrices?: GameState['band']['merchPrices']
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
        controversyLevel: social?.controversyLevel ?? 0,
        regionRep: reputationByRegion?.[player?.location] ?? 0,
        loyalty: social?.loyalty ?? 0,
        zealotry: social?.zealotry ?? 0,
        discountedTickets: activeStoryFlags?.includes(
          'discounted_tickets_active'
        ),
        daysSinceLastGig: gigContext?.daysSinceLastGig ?? 0,
        lastGigDifficulty: gigContext?.lastGigDifficulty ?? undefined,
        merchPrices: bandMerchPrices,
        social,
        cityTraits
      }
    },
    assetModifiers
  )

  return applyPostGigPerformancePenalty({
    financials: result,
    misses: lastGigStats.misses ?? 0,
    missTolerance: BALANCE_CONSTANTS.MISS_TOLERANCE,
    missMoneyPenalty: BALANCE_CONSTANTS.MISS_MONEY_PENALTY
  })
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
  activeEvent
}: {
  currentGig: GameState['currentGig']
  lastGigStats: GameState['lastGigStats']
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  activeEvent: GameState['activeEvent']
}) => {
  if (!currentGig || !lastGigStats) return { options: [], error: null }

  // Pass the necessary game state to evaluate post conditions
  const gameStateForPosts = {
    player,
    band,
    social,
    lastGigStats,
    activeEvent,
    currentGig,
    gigEvents: lastGigStats?.events || []
  }

  try {
    const options = generatePostOptions(currentGig, gameStateForPosts)
    return { options, error: null }
  } catch (e) {
    return { options: [], error: e }
  }
}