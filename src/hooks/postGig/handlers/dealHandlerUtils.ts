import type { BrandDeal } from '../../../types/social'
import type { GameState, QuestEvent } from '../../../types'
import { finiteNumberOr } from '../../../utils/gameState'
import {
  createBrandDealCompletedQuestEvent,
  createBrandOfferAcceptedQuestEvent,
  createBrandTrustChangedQuestEvent
} from '../../../quests/producers/brandQuestEvents'
import { createMoneyEarnedQuestEvent } from '../../../quests/producers/economyQuestEvents'

/**
 * Builds the quest events emitted when a brand deal is accepted: offer-accepted,
 * deal-completed, an optional brand-trust change (mirroring the accept social
 * factory's clamped +5 so quests are not over-credited near the 100 cap), and
 * an optional money-earned event (pure).
 * @returns Quest events to dispatch via `applyQuestEvent`.
 */
export function buildAcceptDealQuestEvents(params: {
  deal: BrandDeal
  brandReputation: GameState['social']['brandReputation']
  appliedMoneyDelta: number
}): QuestEvent[] {
  const { deal, brandReputation, appliedMoneyDelta } = params
  const events: QuestEvent[] = [
    createBrandOfferAcceptedQuestEvent(deal),
    createBrandDealCompletedQuestEvent(deal)
  ]

  if (deal.alignment) {
    const currentRep = finiteNumberOr(brandReputation?.[deal.alignment], 0)
    const trustDelta = Math.min(100, currentRep + 5) - currentRep
    if (trustDelta !== 0) {
      events.push(
        createBrandTrustChangedQuestEvent({
          brandId: deal.alignment,
          amount: trustDelta
        })
      )
    }
  }

  if (appliedMoneyDelta > 0) {
    events.push(
      createMoneyEarnedQuestEvent({
        amount: appliedMoneyDelta,
        reason: 'brand_deal'
      })
    )
  }

  return events
}
