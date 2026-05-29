import { useCallback, MutableRefObject } from 'react'
import type { TFunction } from 'i18next'
import { handleError } from '../../../utils/errorHandler'
import { audioService } from '../../../utils/audio/audioEngine'

export const useMainMenuAudio = (
  isMountedRef: React.MutableRefObject<boolean>,
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
