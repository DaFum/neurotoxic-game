import { useCallback } from 'react'
import type { GameState } from '../../../types'
import { logger } from '../../../utils/logger'
import i18n from '../../../i18n'
import { formatCurrency } from '../../../utils/numberUtils'
import {
  getSpinStoryMoneyUpdate,
  getSpinStorySocialUpdateFactory
} from '../../../utils/postGigUtils'
import type { HandlerDispatchers } from './types'

export interface UseMinorHandlersProps {
  player: GameState['player']
  postOptionsDerivationError: unknown
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

export function useMinorHandlers({
  player,
  postOptionsDerivationError,
  isProcessingActionRef,
  setIsProcessingAction,
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
  }, [setPhase, postOptionsDerivationError, t, addToast, setPostResult])

  const handleSpinStory = useCallback(() => {
    if (isProcessingActionRef.current) return
    isProcessingActionRef.current = true
    setIsProcessingAction(true)

    try {
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
    } finally {
      isProcessingActionRef.current = false
      setIsProcessingAction(false)
    }
  }, [
    player,
    updatePlayer,
    updateSocial,
    addToast,
    t,
    isProcessingActionRef,
    setIsProcessingAction
  ])

  return { handleNextPhase, handleSpinStory }
}
