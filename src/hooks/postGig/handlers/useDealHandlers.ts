import { useCallback } from 'react'
import type { BrandDeal } from '../../../types/social'
import type { GameState } from '../../../types'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { formatCurrency } from '../../../utils/numberUtils'
import { finiteNumberOr } from '../../../utils/gameState'
import {
  getAcceptDealMoneyUpdate,
  getAcceptDealBandUpdateFactory,
  getAcceptDealSocialUpdateFactory
} from '../../../utils/postGigUtils'
import { getTranslatedBrandDealDisplay } from '../../../utils/brandDealI18n'
import {
  createBrandDealCompletedQuestEvent,
  createBrandOfferAcceptedQuestEvent,
  createBrandTrustChangedQuestEvent
} from '../../../quests/producers/brandQuestEvents'
import { createMoneyEarnedQuestEvent } from '../../../quests/producers/economyQuestEvents'
import type { HandlerDispatchers } from './types'

type QuestEvent = Parameters<HandlerDispatchers['applyQuestEvent']>[0]

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

/** Props for {@link useDealHandlers}: player/social state, translator, and dispatchers. */
export interface UseDealHandlersProps {
  player: GameState['player']
  social: GameState['social']
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

/**
 * Builds the brand-deal handlers: `handleAcceptDeal` (applies money/band/social
 * effects + quest events, then completes the phase) and `handleRejectDeals`
 * (clears offers and completes the phase).
 */
export function useDealHandlers({
  player,
  social,
  t,
  dispatchers: {
    updatePlayer,
    updateBand,
    updateSocial,
    applyQuestEvent,
    addToast,
    setPhase,
    setBrandOffers
  }
}: UseDealHandlersProps) {
  const handleAcceptDeal = useCallback(
    (deal: BrandDeal) => {
      try {
        const { nextMoney, appliedMoneyDelta } = getAcceptDealMoneyUpdate({
          deal,
          player
        })

        if (appliedMoneyDelta !== 0) {
          updatePlayer({ money: nextMoney })
        }

        if (deal.offer.item) {
          const bandUpdateFactory = getAcceptDealBandUpdateFactory(deal)
          updateBand(bandUpdateFactory)
        }

        const socialUpdateFactory = getAcceptDealSocialUpdateFactory(deal)
        updateSocial(socialUpdateFactory)

        for (const questEvent of buildAcceptDealQuestEvents({
          deal,
          brandReputation: social.brandReputation,
          appliedMoneyDelta
        })) {
          applyQuestEvent(questEvent)
        }

        const moneyText =
          appliedMoneyDelta === 0
            ? ''
            : ` (${formatCurrency(appliedMoneyDelta, i18n.language, 'always')})`
        const localizedDealName =
          getTranslatedBrandDealDisplay(deal, t)?.name ?? deal.name
        addToast(
          t('ui:postGig.acceptedDeal', {
            dealName: localizedDealName,
            moneyText,
            defaultValue: 'Accepted deal: {{dealName}}{{moneyText}}'
          }),
          'success'
        )

        // Exclusivity: clear all offers and go to complete
        setBrandOffers([])
        setPhase('COMPLETE')
      } catch (e) {
        logger.error('PostGig', 'Failed to accept deal', e)
        addToast(
          t('ui:postGig.dealFailed', {
            defaultValue: 'Deal failed'
          }),
          'error'
        )
      }
    },
    [
      player,
      social.brandReputation,
      updatePlayer,
      updateBand,
      updateSocial,
      applyQuestEvent,
      addToast,
      t,
      setBrandOffers,
      setPhase
    ]
  )

  const handleRejectDeals = useCallback(() => {
    // Clears all remaining offers (Reject All / Skip Phase)
    setBrandOffers([])
    setPhase('COMPLETE')
    addToast(
      t('ui:postGig.skippedBrandDeals', {
        defaultValue: 'Skipped brand deals.'
      }),
      'info'
    )
  }, [addToast, t, setBrandOffers, setPhase])

  return { handleAcceptDeal, handleRejectDeals }
}
