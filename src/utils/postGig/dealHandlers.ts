import { applyClampedMoneyDelta } from './socialResolution'
import {
  clampControversyLevel,
  clampLoyalty,
  finiteNumberOr
} from '../gameState'
import { BRAND_ALIGNMENTS } from '../../context/initialState'

import type { GameState } from '../../types'
import type { BrandDeal } from '../../types/social'
import type { BrandAlignment } from '../../types'

const OPPOSING_ALIGNMENT_MAP = {
  [BRAND_ALIGNMENTS.EVIL]: BRAND_ALIGNMENTS.GOOD, // EVIL opposes GOOD (was SUSTAINABLE)
  [BRAND_ALIGNMENTS.SUSTAINABLE]: BRAND_ALIGNMENTS.EVIL, // SUSTAINABLE still opposes EVIL
  [BRAND_ALIGNMENTS.CORPORATE]: BRAND_ALIGNMENTS.INDIE,
  [BRAND_ALIGNMENTS.INDIE]: BRAND_ALIGNMENTS.CORPORATE,
  [BRAND_ALIGNMENTS.GOOD]: BRAND_ALIGNMENTS.EVIL,
  [BRAND_ALIGNMENTS.NEUTRAL]: BRAND_ALIGNMENTS.NEUTRAL
} as const satisfies Record<BrandAlignment, BrandAlignment>

/**
 * Calculates the money change from accepting a brand deal.
 *
 * @param params - Brand deal and current player state.
 * @returns Next money total and the clamped applied delta.
 */
export const getAcceptDealMoneyUpdate = ({
  deal,
  player
}: {
  deal: BrandDeal
  player: GameState['player']
}) => {
  let appliedMoneyDelta = 0
  let nextMoney = player.money ?? 0

  if (deal.offer.upfront) {
    const applied = applyClampedMoneyDelta(
      player.money ?? 0,
      deal.offer.upfront
    )
    nextMoney = applied.nextMoney
    appliedMoneyDelta = applied.appliedDelta
  }

  return { nextMoney, appliedMoneyDelta }
}

/**
 * Builds the band updater for item rewards from an accepted brand deal.
 *
 * @param deal - Accepted brand deal that may grant an inventory item.
 * @returns Functional band updater for the accepted deal reward.
 */
export const getAcceptDealBandUpdateFactory = (deal: BrandDeal) => {
  return (prevBand: GameState['band']): GameState['band'] => {
    if (!deal.offer.item) return prevBand
    return {
      ...prevBand,
      inventory: { ...prevBand.inventory, [deal.offer.item]: true }
    }
  }
}

/**
 * Builds the social updater for accepting a brand deal.
 *
 * @param deal - Accepted brand deal whose penalties, reputation, and duration should be applied.
 * @returns Functional social updater for active deals and brand reputation.
 */
export const getAcceptDealSocialUpdateFactory = (deal: BrandDeal) => {
  return (prevSocial: GameState['social']): Partial<GameState['social']> => {
    const updates: Partial<GameState['social']> = {}

    if (deal.penalty) {
      if (deal.penalty.loyalty) {
        updates.loyalty = clampLoyalty(
          (prevSocial.loyalty ?? 0) + deal.penalty.loyalty
        )
      }
      if (deal.penalty.controversy) {
        updates.controversyLevel = clampControversyLevel(
          finiteNumberOr(prevSocial.controversyLevel, 0) +
            deal.penalty.controversy
        )
      }
    }

    if (deal.alignment) {
      updates.brandReputation = { ...(prevSocial.brandReputation ?? {}) }
      const currentRep = finiteNumberOr(
        updates.brandReputation[deal.alignment],
        0
      )
      updates.brandReputation[deal.alignment] = Math.min(100, currentRep + 5)

      const opposing = OPPOSING_ALIGNMENT_MAP[deal.alignment]
      if (opposing !== deal.alignment) {
        const oppRep = finiteNumberOr(updates.brandReputation[opposing], 0)
        updates.brandReputation[opposing] = Math.max(0, oppRep - 3)
      }
    }

    updates.activeDeals = [{ ...deal, remainingGigs: deal.offer.duration }]

    return updates
  }
}
