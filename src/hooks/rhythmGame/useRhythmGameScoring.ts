import { useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  updateGigPerformanceStats,
  buildGigStatsSnapshot,
  calculateAccuracy
} from '../../utils/gigStats'
import { audioManager } from '../../utils/AudioManager'
import {
  getGigTimeMs,
  getAudioTimeMs,
  playNoteAtTime,
  stopAudio,
  getPlayRequestId
} from '../../utils/audioEngine'
import { getScheduledHitTimeMs } from '../../utils/audio/timingUtils'
import { checkHit } from '../../utils/rhythmUtils'
import {
  calculateDynamicHitWindow,
  calculatePoints,
  calculateFinalScore,
  calculateMissImpact
} from '../../utils/rhythmGameScoringUtils'
import type {
  RhythmGameRefState,
  RhythmStateSetters
} from './useRhythmGameState'

type RhythmPerformance = {
  crowdDecay?: number
  guitarDifficulty?: number
  drumMultiplier?: number
}

type RhythmGameScoringParams = {
  gameStateRef: { current: RhythmGameRefState }
  setters: Pick<
    RhythmStateSetters,
    | 'setScore'
    | 'setCombo'
    | 'setHealth'
    | 'setOverload'
    | 'setIsToxicMode'
    | 'setIsGameOver'
    | 'setAccuracy'
  >
  performance: RhythmPerformance
  contextActions: {
    addToast: (message: string, type?: string) => void
    setLastGigStats: (stats: unknown) => void
    endGig: () => void
  }
}

/**
 * Handles scoring logic including hits, misses, toxic mode, and game over.
 *
 * @param {Object} params - Hook parameters.
 * @param {Object} params.gameStateRef - Reference to the mutable game state.
 * @param {Object} params.setters - React state setters from useRhythmGameState.
 * @param {Object} params.performance - Band performance stats (modifiers).
 * @param {Object} params.contextActions - Actions from useGameState (addToast, setLastGigStats, endGig).
 * @returns {Object} Scoring actions: handleHit, handleMiss, activateToxicMode.
 */
export const useRhythmGameScoring = ({
  gameStateRef,
  setters,
  performance,
  contextActions
}: RhythmGameScoringParams) => {
  const { t } = useTranslation('ui')
  const {
    setScore,
    setCombo,
    setHealth,
    setOverload,
    setIsToxicMode,
    setIsGameOver,
    setAccuracy
  } = setters
  const { addToast, setLastGigStats, endGig } = contextActions

  // Extract primitives from performance to stabilise callback dependency arrays
  const crowdDecay = performance?.crowdDecay ?? 1.0
  const guitarDifficulty = performance?.guitarDifficulty ?? 1.0
  const drumMultiplier = performance?.drumMultiplier ?? 1.0

  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup game over timer on unmount
  useEffect(() => {
    return () => {
      if (gameOverTimerRef.current) {
        clearTimeout(gameOverTimerRef.current)
        gameOverTimerRef.current = null
      }
    }
  }, [])

  /**
   * Triggers toxic mode and schedules its end.
   */
  const activateToxicMode = useCallback(() => {
    setIsToxicMode(true)
    gameStateRef.current.isToxicMode = true
    gameStateRef.current.toxicModeEndTime = getGigTimeMs() + 10000
    addToast(t('ui:gig.toasts.toxicOverload', 'TOXIC OVERLOAD!'), 'success')
  }, [addToast, gameStateRef, setIsToxicMode, t])

  /**
   * Applies a miss penalty and updates state/refs.
   * @param {number} count - Number of misses to process (default 1)
   * @param {boolean} isEmptyHit - Whether this was an empty hit (hitting without a note).
   */
  const handleMiss = useCallback(
    (count = 1, isEmptyHit = false) => {
      if (count <= 0) return

      // Immediate deactivation of Toxic Mode on real miss (not empty hits)
      if (gameStateRef.current.isToxicMode && !isEmptyHit) {
        setIsToxicMode(false)
        gameStateRef.current.isToxicMode = false
        addToast(t('ui:gig.toasts.toxicModeLost', 'TOXIC MODE LOST!'), 'error')
      }

      setCombo(0)
      gameStateRef.current.combo = 0

      const currentHealth = gameStateRef.current.health
      const currentOverload = gameStateRef.current.overload

      // Calculate new overload and stats outside the setState callback
      const { nextOverload, nextHealth } = calculateMissImpact(
        count,
        isEmptyHit,
        currentOverload,
        currentHealth,
        crowdDecay
      )

      gameStateRef.current.overload = nextOverload
      const updatedStats = updateGigPerformanceStats(
        {
          ...gameStateRef.current.stats,
          misses: gameStateRef.current.stats.misses + count
        },
        { combo: 0, overload: nextOverload }
      )
      gameStateRef.current.stats = updatedStats

      const newAccuracy = calculateAccuracy(
        updatedStats.perfectHits,
        updatedStats.misses
      )

      setOverload(nextOverload)
      if (typeof setAccuracy === 'function') {
        setAccuracy(newAccuracy)
      }

      // Only play miss SFX if it's a real miss
      if (!isEmptyHit) {
        audioManager.playSFX('miss')
      }

      gameStateRef.current.health = nextHealth
      setHealth(nextHealth)

      if (nextHealth > 0 || gameStateRef.current.isGameOver) return

      setIsGameOver(true)
      gameStateRef.current.isGameOver = true
      // Stop audio immediately to prevent further hit processing after collapse
      stopAudio()
      const failReqId = getPlayRequestId()
      addToast(t('ui:gig.toasts.bandCollapsed', 'BAND COLLAPSED'), 'error')

      // Schedule exit from Gig if failed (prevents softlock)
      if (gameOverTimerRef.current) return

      gameOverTimerRef.current = setTimeout(() => {
        // Bail if another audio session started in the 4s window (e.g. external endGig call)
        if (getPlayRequestId() !== failReqId) return
        addToast(
          t('ui:gig.toasts.gigFailed', 'Gig Failed! Reviewing impact...'),
          'info'
        )
        setLastGigStats(
          buildGigStatsSnapshot(
            gameStateRef.current.score,
            gameStateRef.current.stats,
            gameStateRef.current.toxicTimeTotal,
            (gameStateRef.current.songStats || []) as Parameters<
              typeof buildGigStatsSnapshot
            >[3]
          )
        )
        endGig()
      }, 4000)
    },
    [
      addToast,
      endGig,
      setLastGigStats,
      gameStateRef,
      setCombo,
      setHealth,
      setIsGameOver,
      setIsToxicMode,
      setOverload,
      setAccuracy,
      crowdDecay,
      t
    ]
  )

  /**
   * Attempts to register a hit for the active lane.
   * @param {number} laneIndex - Index of the lane to check.
   * @returns {boolean} True when the hit registers.
   */
  const handleHit = useCallback(
    (laneIndex: number) => {
      const state = gameStateRef.current
      if (laneIndex < 0 || laneIndex >= state.lanes.length) return false
      // Use Tone.js AudioContext clock for hit detection
      const elapsed = getGigTimeMs()
      const toxicModeActive = state.isToxicMode

      const hitWindow = calculateDynamicHitWindow(
        state.lanes[laneIndex].hitWindow,
        (state.modifiers.hitWindowBonus as number | undefined) || 0,
        laneIndex,
        guitarDifficulty
      )

      const note = checkHit(
        state.notes as unknown as Parameters<typeof checkHit>[0],
        laneIndex,
        elapsed,
        hitWindow
      )

      if (note) {
        note.hit = true
        note.visible = false // consumed

        // Play the specific note pitch
        const originalNote = note.originalNote as
          | ({ p?: number; v?: number } & Record<string, unknown>)
          | undefined
        if (
          originalNote &&
          typeof originalNote.p === 'number' &&
          Number.isFinite(originalNote.p)
        ) {
          const velocity =
            typeof originalNote.v === 'number' &&
            Number.isFinite(originalNote.v)
              ? originalNote.v
              : 127
          const toneNowMs = getAudioTimeMs()
          const scheduledMs = getScheduledHitTimeMs({
            noteTimeMs: note.time,
            gigTimeMs: elapsed,
            audioTimeMs: toneNowMs,
            maxLeadMs: 30
          })
          playNoteAtTime(
            originalNote.p,
            state.lanes[laneIndex].id,
            scheduledMs / 1000,
            velocity
          )
        } else {
          audioManager.playSFX('hit') // Fallback
        }

        // Prefer the value written into modifiers by audio init (physics-aware), fall back to
        // the static performance value if audio hasn't initialized yet.
        const activeDrumMultiplier =
          (state.modifiers.drumMultiplier as number | undefined) ||
          drumMultiplier
        const basePoints = calculatePoints(
          laneIndex,
          activeDrumMultiplier,
          (state.modifiers.guitarScoreMult as number | undefined) || 1.0,
          (state.modifiers.bassScoreMult as number | undefined) || 1.0,
          Boolean(state.modifiers.guestlist)
        )

        // Update hits immediately for accuracy calculation
        gameStateRef.current.stats.perfectHits++

        const currentAccuracy = calculateAccuracy(
          gameStateRef.current.stats.perfectHits,
          gameStateRef.current.stats.misses
        )
        setAccuracy(currentAccuracy)

        const finalScore = calculateFinalScore(
          basePoints,
          state.combo,
          toxicModeActive,
          Boolean(state.modifiers.hasPerfektionist),
          currentAccuracy
        )

        // Extract calculations outside state callbacks
        const nextScore = gameStateRef.current.score + finalScore
        const nextCombo = gameStateRef.current.combo + 1
        const nextHealth = Math.max(
          0,
          Math.min(100, gameStateRef.current.health + (toxicModeActive ? 1 : 2))
        )

        gameStateRef.current.score = nextScore
        gameStateRef.current.combo = nextCombo
        gameStateRef.current.health = nextHealth

        setScore(nextScore)
        setCombo(nextCombo)
        setHealth(nextHealth)

        if (!toxicModeActive) {
          const gain = 4 // Increased gain to make Toxic Mode reachable
          const currentOverload = gameStateRef.current.overload || 0
          const next = currentOverload + gain
          const peakCandidate = Math.min(next, 100)

          gameStateRef.current.stats = updateGigPerformanceStats(
            gameStateRef.current.stats,
            { combo: gameStateRef.current.combo, overload: peakCandidate }
          )

          if (next >= 100) {
            activateToxicMode()
            gameStateRef.current.overload = 0
            setOverload(0)
          } else {
            gameStateRef.current.overload = next
            setOverload(next)
          }
        }

        return true
      } else {
        handleMiss(1, true) // Pass true for isEmptyHit
        return false
      }
    },
    [
      activateToxicMode,
      handleMiss,
      gameStateRef,
      setCombo,
      setHealth,
      setOverload,
      setScore,
      setAccuracy,
      guitarDifficulty,
      drumMultiplier
    ]
  )

  return {
    handleHit,
    handleMiss,
    activateToxicMode,
    gameOverTimerRef // Exposed for cleanup if needed
  }
}
