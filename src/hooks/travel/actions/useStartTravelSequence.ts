import { useCallback } from 'react'
import i18n from '../../../i18n'
import type { MapNode } from '../../../types'
import { logger } from '../../../utils/logger'
import { handleError } from '../../../utils/errorHandler'
import { audioService } from '../../../utils/audio/audioEngine'
import type { TravelActionsParams } from '../types'

const TRAVEL_ANIMATION_TIMEOUT_MS = 1510

interface UseStartTravelSequenceParams extends Pick<TravelActionsParams, 'refs' | 'setters' | 'params'> {
  clearPendingTravel: () => void
  onTravelComplete: (node?: MapNode | null) => void
}

export const useStartTravelSequence = ({
  refs,
  setters,
  params,
  clearPendingTravel,
  onTravelComplete
}: UseStartTravelSequenceParams) => {
  const { onStartTravelMinigame, addToast } = params

  return useCallback(
    (node: MapNode) => {
      clearPendingTravel()

      if (!refs.gameMapRef.current) return

      try {
        refs.travelCompletedRef.current = false
        setters.setIsTraveling(true)
        setters.setTravelTarget(node)

        audioService
          .ensureAudioContext()
          .then(isReady => {
            if (!isReady) {
              logger.warn('TravelLogic', 'Travel audio context unavailable')
              return
            }
            try {
              audioService.playSFX('travel')
            } catch (error) {
              logger.warn('TravelLogic', 'Travel SFX playback failed', error)
            }
          })
          .catch(error => {
            logger.warn('TravelLogic', 'ensureAudioContext failed', error)
          })

        if (onStartTravelMinigame) {
          onStartTravelMinigame(node.id)
          return
        }

        refs.failsafeTimeoutRef.current = setTimeout(() => {
          if (!refs.travelCompletedRef.current) {
            logger.warn(
              'TravelLogic',
              'Travel animation failsafe triggered. Forcing completion.'
            )
            onTravelComplete(node)
          }
        }, TRAVEL_ANIMATION_TIMEOUT_MS)
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:travel.errors.startFailed', {
            defaultValue: 'Failed to start travel sequence.'
          }),
          context: { node }
        })
        setters.setIsTraveling(false)
        setters.setTravelTarget(null)
      }
    },
    [
      clearPendingTravel,
      setters,
      refs,
      onStartTravelMinigame,
      addToast,
      onTravelComplete
    ]
  )
}
