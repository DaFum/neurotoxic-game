import { useState, useRef, useEffect, useCallback } from 'react'
import { TFunction } from 'i18next'
import { pauseAudio, resumeAudio, stopAudio } from '../utils/audioEngine'
import { buildGigStatsSnapshot } from '../utils/gigStats'
import { handleError } from '../utils/errorHandler'
import type { RhythmGameRefState } from '../types/rhythmGame'

type UseGigSessionProps = {
  addToast: (message: string, type: 'info' | 'error' | 'success') => void
  setLastGigStats: (stats: unknown) => void
  endGig: () => void
  tRef: { current: TFunction }
  gameStateRef: { current: RhythmGameRefState }
}

type UseGigSessionReturn = {
  isPaused: boolean
  handleTogglePause: () => void
  handleQuitGig: () => Promise<void>
}

export const useGigSession = ({
  addToast,
  setLastGigStats,
  endGig,
  tRef,
  gameStateRef
}: UseGigSessionProps): UseGigSessionReturn => {
  const [isPaused, setIsPaused] = useState(false)
  const hasInteractedRef = useRef(false)

  useEffect(() => {
    if (!hasInteractedRef.current) {
      if (!isPaused) {
        hasInteractedRef.current = true
        return
      }
      // If starts paused (unlikely) or quick toggle
      pauseAudio()
      addToast(
        tRef.current('ui:gig.paused', { defaultValue: 'PAUSED' }),
        'info'
      )
      // Focus management delegated to Modal or done here if needed
      hasInteractedRef.current = true
      return
    }

    if (isPaused) {
      pauseAudio()
      addToast(
        tRef.current('ui:gig.paused', { defaultValue: 'PAUSED' }),
        'info'
      )
    } else {
      resumeAudio()
      addToast(
        tRef.current('ui:gig.resumed', { defaultValue: 'RESUMED' }),
        'info'
      )
    }
  }, [isPaused, addToast, tRef])

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
      // Use fallback stats if gameStateRef is unavailable or uninitialized
      const score = gameStateRef.current?.score ?? 0
      // Ensure statsSnapshot has defaults to prevent NaN in buildGigStatsSnapshot
      const rawStats = gameStateRef.current?.stats ?? {}
      const statsSnapshot = {
        perfectHits: rawStats.perfectHits ?? 0,
        perfects: rawStats.perfects ?? 0, // Alias if used
        hits: rawStats.hits ?? 0,
        misses: rawStats.misses ?? 0,
        earlyHits: rawStats.earlyHits ?? 0,
        lateHits: rawStats.lateHits ?? 0,
        maxCombo: rawStats.maxCombo ?? 0,
        peakHype: rawStats.peakHype ?? 0
      }
      const toxicTime = gameStateRef.current?.toxicTimeTotal ?? 0

      const snapshot = buildGigStatsSnapshot(
        score,
        statsSnapshot,
        toxicTime,
        gameStateRef.current?.songStats ?? []
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
