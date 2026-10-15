import { useState, useRef, useEffect, useCallback } from 'react'
import { TFunction } from 'i18next'
import { pauseAudio, resumeAudio, stopAudio } from '../utils/audio/audioEngine'
import { buildGigStatsSnapshot } from '../utils/gigStats'
import { handleError } from '../utils/errorHandler'
import type { RhythmGameRefState } from '../types/rhythmGame'
import type { PostGigSummary } from '../types'
import type { ToastCallback } from '../types/callbacks'

type UseGigSessionProps = {
  addToast: ToastCallback
  setLastGigStats: (stats: PostGigSummary | null) => void
  endGig: () => void
  tRef: { current: TFunction }
  gameStateRef: { current: RhythmGameRefState }
}

type UseGigSessionReturn = {
  isPaused: boolean
  handleTogglePause: () => void
  handleQuitGig: () => Promise<void>
}

/**
 * Manages gig pause/resume and explicit quit behavior for the rhythm game scene.
 *
 * @param props - Toast, post-gig stat, scene-exit, translation, and rhythm-state dependencies.
 * @returns Pause state plus pause-toggle and quit handlers.
 */
export const useGigSession = ({
  addToast,
  setLastGigStats,
  endGig,
  tRef,
  gameStateRef
}: UseGigSessionProps): UseGigSessionReturn => {
  const [isPaused, setIsPaused] = useState(false)
  // The pause state the effect last acted on. StrictMode replays the mount
  // effect, so "not paused" alone must not resume audio or toast RESUMED.
  const appliedPausedRef = useRef(false)
  // Set when a failed resume re-pauses, so that re-pause doesn't stack a
  // PAUSED toast on top of the resume-failed error.
  const silentRepauseRef = useRef(false)

  useEffect(() => {
    // The game loop reads this so an event overlay does not resume audio
    // underneath the pause menu.
    if (gameStateRef.current) {
      gameStateRef.current.userPaused = isPaused
    }
    if (appliedPausedRef.current === isPaused) return
    appliedPausedRef.current = isPaused

    if (isPaused) {
      pauseAudio()
      if (silentRepauseRef.current) {
        silentRepauseRef.current = false
        return
      }
      addToast(
        tRef.current('ui:gig.paused', { defaultValue: 'PAUSED' }),
        'info'
      )
    } else {
      if (gameStateRef.current?.transportPausedByOverlay) {
        // An event overlay still owns the transport pause; the game loop
        // resumes audio once the overlay clears.
        addToast(
          tRef.current('ui:gig.resumed', { defaultValue: 'RESUMED' }),
          'info'
        )
        return
      }
      let cancelled = false
      void resumeAudio().then(resumed => {
        if (cancelled) return
        if (resumed) {
          addToast(
            tRef.current('ui:gig.resumed', { defaultValue: 'RESUMED' }),
            'info'
          )
          return
        }
        // The audio context refused to resume: stay paused instead of
        // showing a running gig over a stopped transport.
        addToast(
          tRef.current('ui:gig.resumeFailed', {
            defaultValue: 'Audio could not resume. Try again.'
          }),
          'error'
        )
        silentRepauseRef.current = true
        setIsPaused(true)
      })
      return () => {
        cancelled = true
      }
    }
  }, [isPaused, addToast, tRef, gameStateRef])

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  const handleQuitGig = useCallback(async () => {
    if (gameStateRef.current) {
      gameStateRef.current.hasSubmittedResults = true
    }
    try {
      stopAudio()
    } catch (e) {
      handleError(e, {
        addToast,
        fallbackMessage: tRef.current('ui:errors.audio_cleanup_failed', {
          defaultValue: 'Audio cleanup failed.'
        })
      })
    } finally {
      // Use fallback values if gameStateRef is unavailable or uninitialized.
      // buildGigStatsSnapshot defaults missing stats counters and songStats.
      const score = gameStateRef.current?.score ?? 0
      const toxicTime = gameStateRef.current?.toxicTimeTotal ?? 0

      const snapshot = buildGigStatsSnapshot(
        score,
        gameStateRef.current?.stats,
        toxicTime,
        gameStateRef.current?.songStats,
        true
      )
      setLastGigStats(snapshot)
      endGig()
    }
  }, [endGig, setLastGigStats, addToast, gameStateRef, tRef])

  return {
    isPaused,
    handleTogglePause,
    handleQuitGig
  }
}
