import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import type { TFunction } from 'i18next'
import { handleError } from '../../../utils/errorHandler'
import { audioService } from '../../../utils/audio/audioEngine'

/**
 * Creates the fire-and-forget audio initialization handler for the main menu.
 * @param isMountedRef - Mount-state ref used to avoid side effects after unmount.
 * @param addToast - Toast callback used to report user-facing failures.
 * @param tRef - Translation callback ref used by delayed effects.
 * @returns Audio initialization callback.
 */
export const useMainMenuAudio = (
  isMountedRef: MutableRefObject<boolean>,
  addToast: (message: string, type?: 'info' | 'error' | 'success') => void,
  tRef: MutableRefObject<TFunction>
) => {
  const reportAudioIssue = useCallback(
    (error: unknown, fallbackMessage: string) => {
      if (!isMountedRef.current) return
      try {
        handleError(error, { addToast, fallbackMessage })
      } catch {
        // Never block scene transitions on toast/reporting failures.
      }
    },
    [addToast, isMountedRef]
  )

  const startAmbientSafely = useCallback(() => {
    void audioService.startAmbient().catch(err => {
      reportAudioIssue(
        err,
        tRef.current('ui:errors.ambient_start_failed', {
          defaultValue: 'Failed to start ambient audio'
        })
      )
    })
  }, [reportAudioIssue, tRef])

  const initializeAudio = useCallback(() => {
    void audioService
      .ensureAudioContext()
      .then(success => {
        if (success) {
          startAmbientSafely()
        } else {
          reportAudioIssue(
            new Error('Audio unlock failed'),
            tRef.current('ui:errors.audio_init_failed', {
              defaultValue: 'Audio initialization failed'
            })
          )
        }
      })
      .catch(err =>
        reportAudioIssue(
          err,
          tRef.current('ui:errors.audio_init_failed', {
            defaultValue: 'Audio initialization failed'
          })
        )
      )
  }, [reportAudioIssue, startAmbientSafely, tRef])

  return { initializeAudio }
}
