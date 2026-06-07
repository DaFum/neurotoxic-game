import { useCallback } from 'react'
import type { BrandDeal } from '../../../types/social'
import type { GameState } from '../../../types'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { formatCurrency } from '../../../utils/numberUtils'
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

export interface UseDealHandlersProps {
  player: GameState['player']
  social: GameState['social']
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

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

        applyQuestEvent(createBrandOfferAcceptedQuestEvent(deal))
        applyQuestEvent(createBrandDealCompletedQuestEvent(deal))
        if (deal.alignment) {
          // Mirror the accept social factory's clamped +5 so the emitted trust
          // delta matches the real reputation change (avoids over-crediting
          // quests when the brand is already near the 100 cap).
          const currentRep = social.brandReputation?.[deal.alignment] ?? 0
          const trustDelta = Math.min(100, currentRep + 5) - currentRep
          if (trustDelta !== 0) {
            applyQuestEvent(
              createBrandTrustChangedQuestEvent({
                brandId: deal.alignment,
                amount: trustDelta
              })
            )
          }
        }
        if (appliedMoneyDelta > 0) {
          applyQuestEvent(
            createMoneyEarnedQuestEvent({
              amount: appliedMoneyDelta,
              reason: 'brand_deal'
            })
          )
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
