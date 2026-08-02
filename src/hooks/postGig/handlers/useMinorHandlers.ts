import { useCallback } from 'react'
import type { GameState } from '../../../types'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { formatCurrency } from '../../../utils/numberUtils'
import {
  buildPerGigSocialReconciliation,
  getSpinStoryMoneyUpdate,
  getSpinStorySocialUpdateFactory
} from '../../../utils/postGig'
import type { HandlerDispatchers } from './types'

/** Props for {@link useMinorHandlers}: state slices, the spin-specific one-shot guard, translator, and dispatchers. */
export interface UseMinorHandlersProps {
  player: GameState['player']
  social: GameState['social']
  currentGig: GameState['currentGig']
  postOptionsDerivationError: unknown
  hasSpunRef: React.MutableRefObject<boolean>
  setHasSpun: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
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
  social,
  currentGig,
  postOptionsDerivationError,
  hasSpunRef,
  setHasSpun,
  t,
  dispatchers: { updatePlayer, updateSocial, addToast, setPhase, setPostResult }
}: UseMinorHandlersProps) {
  const handleNextPhase = useCallback(() => {
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
        updateSocial(
          buildPerGigSocialReconciliation({ player, social, currentGig })
        )
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
    setPhase,
    postOptionsDerivationError,
    player,
    social,
    currentGig,
    updateSocial,
    t,
    addToast,
    setPostResult
  ])

  const handleSpinStory = useCallback(() => {
    if (hasSpunRef.current) return

    const updates = getSpinStoryMoneyUpdate({ player })

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

    const socialUpdateFactory = getSpinStorySocialUpdateFactory()
    updateSocial(socialUpdateFactory)

    hasSpunRef.current = true
    setHasSpun(true)

    const moneyText =
      updates.appliedDelta !== 0
        ? ` (${formatCurrency(updates.appliedDelta, i18n.language)})`
        : ''
    addToast(
      t('ui:postGig.storySpunControversyReduced', {
        moneyText,
        defaultValue: `Story Spun. Controversy reduced.${moneyText}`
      }),
      'success'
    )
  }, [player, updatePlayer, updateSocial, addToast, t, hasSpunRef, setHasSpun])

  return { handleNextPhase, handleSpinStory }
}
