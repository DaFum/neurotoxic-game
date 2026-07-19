import { useCallback } from 'react'
import type { GameState, PostGigSummary, Venue } from '../../../types'
import type { SocialPostOption } from '../../../types/social'
import { logger } from '../../../utils/logger'
import { calculatePostGigStateUpdates } from '../../../utils/postGigUtils'
import { secureRandom } from '../../../utils/crypto'
import { applySocialPostResult } from './socialPostHandlerUtils'
import type { HandlerDispatchers } from './types'

/** Props for {@link useSocialPostHandler}: state slices, gig context, the processing guard, translator, and dispatchers. */
export interface UseSocialPostHandlerProps {
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  currentGig: Venue | null
  perfScore: number
  lastGigStats: PostGigSummary | null
  isProcessingActionRef: React.MutableRefObject<boolean>
  setIsProcessingAction: React.Dispatch<React.SetStateAction<boolean>>
  t: import('i18next').TFunction
  dispatchers: HandlerDispatchers
}

/**
 * Builds the social-post selection handler: computes the post outcome via
 * `calculatePostGigStateUpdates`, applies it through {@link applySocialPostResult},
 * and routes to the DEALS or COMPLETE phase. Guarded against re-entrancy.
 */
export function useSocialPostHandler({
  player,
  band,
  social,
  currentGig,
  perfScore,
  lastGigStats,
  isProcessingActionRef,
  setIsProcessingAction,
  t,
  dispatchers: {
    updateSocial,
    updateBand,
    updatePlayer,
    unlockTrait,
    applyQuestEvent,
    addToast,
    setPostResult,
    setBrandOffers,
    setPhase
  }
}: UseSocialPostHandlerProps) {
  const handlePostSelection = useCallback(
    (option: SocialPostOption) => {
      if (isProcessingActionRef.current) return
      isProcessingActionRef.current = true
      setIsProcessingAction(true)
      let updates: ReturnType<typeof calculatePostGigStateUpdates>
      try {
        updates = calculatePostGigStateUpdates({
          option,
          player,
          band,
          social,
          lastGigStats,
          currentGig,
          perfScore,
          secureRandomValue: secureRandom()
        })
      } catch (e) {
        logger.error('PostGig', 'Failed to resolve selected post', e)
        addToast(t('ui:postGig.postResolutionFailed'), 'error')
        isProcessingActionRef.current = false
        setIsProcessingAction(false)
        return
      }

      try {
        applySocialPostResult({
          option,
          updates,
          player,
          band,
          social,
          t,
          dispatchers: {
            updateBand,
            updatePlayer,
            updateSocial,
            unlockTrait,
            applyQuestEvent,
            addToast,
            setPostResult,
            setBrandOffers,
            setPhase
          }
        })
        // Guard intentionally NOT reset here: the phase transition owns the
        // lifecycle. Resetting before it runs would re-open the settlement
        // window for rapid double-clicks.
      } catch (e) {
        logger.error('PostGig', 'Failed to apply selected post result', e)
        addToast(t('ui:postGig.postResolutionFailed'), 'error')
        isProcessingActionRef.current = false
        setIsProcessingAction(false)
      }
    },
    [
      lastGigStats,
      perfScore,
      social,
      player,
      band,
      updateSocial,
      updateBand,
      updatePlayer,
      unlockTrait,
      applyQuestEvent,
      addToast,
      currentGig,
      t,
      setPostResult,
      setBrandOffers,
      setPhase,
      isProcessingActionRef,
      setIsProcessingAction
    ]
  )

  return handlePostSelection
}
