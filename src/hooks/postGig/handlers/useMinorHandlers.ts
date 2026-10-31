import { useCallback } from 'react'
import type { GameState } from '../../../types'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { formatCurrency } from '../../../utils/numberUtils'
import {
  buildPerGigSocialReconciliation,
  getSpinStoryMoneyUpdate,
  getSpinStorySocialUpdate
} from '../../../utils/postGig'
import type { HandlerDispatchers } from './types'

/** Props for {@link useMinorHandlers}: state slices, the shared processing guard, the spin-specific one-shot guard, translator, and dispatchers. */
interface UseMinorHandlersProps {
  player: GameState['player']
  expedition: GameState['expedition']
  social: GameState['social']
  currentGig: GameState['currentGig']
  postOptionsDerivationError: unknown
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  hasSpunRef: React.MutableRefObject<boolean>
  setHasSpun: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
  pendingSettlementId?: string | null
  dispatchers: HandlerDispatchers
}

/**
 * Builds the smaller post-gig handlers (spin-story and next-phase advancement),
 * applying the spin-story money/controversy effects through the dispatchers.
 *
 * Spin-story uses its own one-shot guard (`hasSpunRef`/`setHasSpun`) so it
 * cannot block the shared continue guard (`isProcessingActionRef`).
 */
export function useMinorHandlers({
  player,
  expedition,
  social,
  currentGig,
  postOptionsDerivationError,
  isProcessingActionRef,
  setIsProcessingAction,
  hasSpunRef,
  setHasSpun,
  t,
  pendingSettlementId,
  dispatchers: {
    updatePlayer,
    updateSocial,
    applyGigSocialReconciliation,
    addToast,
    setPhase,
    setPostResult,
    saveGameAfterStateCommit
  }
}: UseMinorHandlersProps) {
  const handleNextPhase = useCallback(() => {
    // Guard intentionally NOT reset here: the phase change releases it, so a
    // second "Next" before that commits cannot reconcile or save twice.
    if (isProcessingActionRef.current) return
    isProcessingActionRef.current = true
    setIsProcessingAction(true)
    if (postOptionsDerivationError) {
      logger.error(
        'PostGig',
        'Failed to generate post options',
        postOptionsDerivationError
      )
      const fallbackMsg = t('ui:postGig.socialOptionsUnavailable')

      // The gig still happened: apply the per-gig social bookkeeping the
      // social-post path would otherwise own, so a failed option generation
      // does not freeze deal countdowns or the gig-history markers.
      try {
        const patch = buildPerGigSocialReconciliation({
          player,
          social,
          currentGig
        })
        // Always the atomic action: a plain `updateSocial` would land the patch
        // without marking the settlement reconciled, and a reload would then
        // apply the deal countdown and gig history a second time.
        applyGigSocialReconciliation(patch, pendingSettlementId)
        saveGameAfterStateCommit?.()
      } catch (e) {
        logger.error('PostGig', 'Failed to reconcile per-gig social state', e)
      }

      setPostResult({
        type: 'ERROR',
        success: false,
        totalFollowers: 0,
        followers: 0,
        moneyChange: 0,
        message: fallbackMsg
      })
      setPhase('COMPLETE')
      addToast(fallbackMsg, 'error')
    } else {
      setPhase('SOCIAL')
    }
  }, [
    isProcessingActionRef,
    setIsProcessingAction,
    setPhase,
    postOptionsDerivationError,
    player,
    social,
    currentGig,
    applyGigSocialReconciliation,
    pendingSettlementId,
    saveGameAfterStateCommit,
    t,
    addToast,
    setPostResult
  ])

  const handleSpinStory = useCallback(() => {
    if (hasSpunRef.current) return

    const updates = getSpinStoryMoneyUpdate({ player, expedition })

    if (!updates.success) {
      addToast(
        t('ui:postGig.notEnoughCashForPr', {
          defaultValue: 'Not enough cash for PR!'
        }),
        'error'
      )
      return
    }

    updatePlayer({ money: updates.nextMoney })

    updateSocial(getSpinStorySocialUpdate)

    hasSpunRef.current = true
    setHasSpun(true)

    const moneyText =
      updates.appliedDelta !== 0
        ? ` (${formatCurrency(updates.appliedDelta, i18n.language, 'always')})`
        : ''
    addToast(
      t('ui:postGig.storySpunControversyReduced', {
        moneyText,
        defaultValue: 'Story Spun. Controversy reduced.{{moneyText}}'
      }),
      'success'
    )
  }, [
    player,
    expedition,
    updatePlayer,
    updateSocial,
    addToast,
    t,
    hasSpunRef,
    setHasSpun
  ])

  return { handleNextPhase, handleSpinStory }
}
