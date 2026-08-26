import { useCallback } from 'react'
import i18n from '../../../i18n'
import type { MapNode } from '../../../types'
import { logger } from '../../../utils/logger'
import { handleError } from '../../../utils/errorHandler'
import { audioService } from '../../../utils/audio/audioEngine'
import type { TravelActionsParams } from '../types'

interface UseStartTravelSequenceParams extends Pick<
  TravelActionsParams,
  'refs' | 'setters' | 'params'
> {
  clearPendingTravel: () => void
}

export const useStartTravelSequence = ({
  refs,
  setters,
  params,
  clearPendingTravel
}: UseStartTravelSequenceParams) => {
  const { onStartTravelMinigame, addToast } = params

  return useCallback(
    (node: MapNode) => {
      clearPendingTravel()

      if (!refs.gameMapRef.current) return

      try {
        setters.setIsTraveling(true)

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

        onStartTravelMinigame(node.id)
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:travel.errors.startFailed', {
            defaultValue: 'Failed to start travel sequence.'
          }),
          context: { node }
        })
        setters.setIsTraveling(false)
      }
    },
    [clearPendingTravel, setters, refs, onStartTravelMinigame, addToast]
  )
}
