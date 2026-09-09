import { useCallback } from 'react'
import i18n from '../../../i18n'
import type { MapNode } from '../../../types'
import { logger } from '../../../utils/logger'
import { handleError } from '../../../utils/errorHandler'
import { audioService } from '../../../utils/audio/audioEngine'
import type { TravelActionsParams } from '../types'

/**
 * Configuration for the start travel sequence action hook.
 */
interface UseStartTravelSequenceParams extends Pick<
  TravelActionsParams,
  'refs' | 'setters' | 'params'
> {
  /** Callback to reset any travel preparations that may have been configured but not finalized. */
  clearPendingTravel: () => void
}

/**
 * Prepares travel initiation and hands off control to the travel minigame.
 *
 * @remarks
 * Applies a local UI lock and asynchronously attempts to emit travel SFX,
 * immediately calling `onStartTravelMinigame` to initiate the actual travel
 * minigame. Note that fuel, cost, and location settlement are strictly handled
 * later by `handleCompleteTravelMinigame`.
 *
 * @param params - Configuration parameters injecting map references, setters, and external callbacks.
 * @returns A callback that triggers the minigame handoff for the specified target node.
 */
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
