import { useCallback } from 'react'
import type React from 'react'
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
import { buildAcceptDealQuestEvents } from './dealHandlerUtils'
import type { HandlerDispatchers } from './types'

/** Props for {@link useDealHandlers}: player/social state, the processing guard, translator, and dispatchers. */
export interface UseDealHandlersProps {
  player: GameState['player']
  social: GameState['social']
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

/**
 * Builds the brand-deal handlers: `handleAcceptDeal` (applies money/band/social
 * effects + quest events, then completes the phase) and `handleRejectDeals`
 * (clears offers and completes the phase). `handleAcceptDeal` is guarded against
 * re-entrancy; the lock is held until the phase transition (not reset after dispatch).
 */
export function useDealHandlers({
  player,
  social,
  isProcessingActionRef,
  setIsProcessingAction,
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
      if (isProcessingActionRef.current) return
      isProcessingActionRef.current = true
      setIsProcessingAction(true)
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
        // Guard intentionally NOT reset here: the phase transition owns the
        // lifecycle. Resetting before it runs would re-open the settlement
        // window for rapid double-clicks.
      } catch (e) {
        logger.error('PostGig', 'Failed to accept deal', e)
        addToast(
          t('ui:postGig.dealFailed', {
            defaultValue: 'Deal failed'
          }),
          'error'
        )
        isProcessingActionRef.current = false
        setIsProcessingAction(false)
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
      setPhase,
      isProcessingActionRef,
      setIsProcessingAction
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
