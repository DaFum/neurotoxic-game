// TODO: Implement this
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

/**
 * Handles scoring logic including hits, misses, toxic mode, and game over.
 *
 * @param {Object} params - Hook parameters.
 * @param {Object} params.gameStateRef - Reference to the mutable game state.
 * @param {Object} params.setters - React state setters from useRhythmGameState.
 * @param {Object} params.performance - Band performance stats (modifiers).
 * @param {Object} params.contextActions - Actions from useGameState (addToast, changeScene, setLastGigStats).
 * @returns {Object} Scoring actions: handleHit, handleMiss, activateToxicMode.
 */
export const useRhythmGameScoring = ({
  gameStateRef,
  setters,
  performance,
  contextActions
}) => {
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

  const gameOverTimerRef = useRef(null)

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

      // Calculate new overload and stats outside the setState callback
      const penalty = isEmptyHit ? 2 : 5
      const currentOverload = gameStateRef.current.overload
      const nextOverload = Math.max(0, currentOverload - penalty * count)

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

      // Dynamic decay based on stats (e.g. crowdDecay 1.0 -> 0.9 means 10% slower decay)
      // Base decay is 2 for real misses, 1 for empty hits. Multiplier comes from state (default 1.0)
      const basePenalty = isEmptyHit ? 1 : 2
      const decayPerMiss = basePenalty * Math.max(0.1, crowdDecay)

      const currentHealth = gameStateRef.current.health
      const nextHealth = Math.max(
        0,
        Math.min(100, currentHealth - decayPerMiss * count)
      )

      if (nextHealth <= 0 && !gameStateRef.current.isGameOver) {
        setIsGameOver(true)
        gameStateRef.current.isGameOver = true
        // Stop audio immediately to prevent further hit processing after collapse
        stopAudio()
        const failReqId = getPlayRequestId()
        addToast(t('ui:gig.toasts.bandCollapsed', 'BAND COLLAPSED'), 'error')

        // Schedule exit from Gig if failed (prevents softlock)
        if (!gameOverTimerRef.current) {
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
                gameStateRef.current.songStats || []
              )
            )
            endGig()
          }, 4000)
        }
      }

      gameStateRef.current.health = nextHealth
      setHealth(nextHealth)
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
    laneIndex => {
      const state = gameStateRef.current
      if (laneIndex < 0 || laneIndex >= state.lanes.length) return false
      // Use Tone.js AudioContext clock for hit detection
      const elapsed = getGigTimeMs()
      const toxicModeActive = state.isToxicMode

      let hitWindow = state.lanes[laneIndex].hitWindow
      if (state.modifiers.hitWindowBonus)
        hitWindow += state.modifiers.hitWindowBonus

      // Dynamic Hit Window (Guitar Custom: easier to hit = larger window)
      // e.g. guitarDifficulty 0.85 (15% reduction) -> Window / 0.85 (~1.17x larger)
      if (laneIndex === 0) {
        const difficultyFactor = Math.max(0.1, guitarDifficulty)
        hitWindow /= difficultyFactor
      }

      const note = checkHit(state.notes, laneIndex, elapsed, hitWindow)

      if (note) {
        note.hit = true
        note.visible = false // consumed

        // Play the specific note pitch
        if (note.originalNote && Number.isFinite(note.originalNote.p)) {
          const velocity = Number.isFinite(note.originalNote.v)
            ? note.originalNote.v
            : 127
          const toneNowMs = getAudioTimeMs()
          const scheduledMs = getScheduledHitTimeMs({
            noteTimeMs: note.time,
            gigTimeMs: elapsed,
            audioTimeMs: toneNowMs,
            maxLeadMs: 30
          })
          playNoteAtTime(
            note.originalNote.p,
            state.lanes[laneIndex].id,
            scheduledMs / 1000,
            velocity
          )
        } else {
          audioManager.playSFX('hit') // Fallback
        }

        let points = 100
        // Dynamic Score Multiplier (Drum Trigger: physics.multipliers.drums, e.g. 1.5x for blast_machine trait)
        // Prefer the value written into modifiers by audio init (physics-aware), fall back to
        // the static performance value if audio hasn't initialized yet.
        if (laneIndex === 1) {
          points *= state.modifiers.drumMultiplier || drumMultiplier
        }
        if (laneIndex === 0) points *= state.modifiers.guitarScoreMult || 1.0
        if (laneIndex === 2) points *= state.modifiers.bassScoreMult || 1.0

        // Guestlist Effect: +20% score
        if (state.modifiers.guestlist) points *= 1.2

        const comboForScore = state.combo
        let finalScore = points + comboForScore * 10
        if (toxicModeActive) finalScore *= 4

        // Update hits immediately for accuracy calculation
        gameStateRef.current.stats.perfectHits++

        // Perfektionist Trait (Matze): +15% score if accuracy > 85%
        const currentAccuracy = calculateAccuracy(
          gameStateRef.current.stats.perfectHits,
          gameStateRef.current.stats.misses
        )
        setAccuracy(currentAccuracy)

        if (state.modifiers.hasPerfektionist && currentAccuracy > 85) {
          finalScore *= 1.15
        }

        finalScore = Math.floor(finalScore)

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
