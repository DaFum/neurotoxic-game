import { useCallback, useRef, useEffect } from 'react'
import {
  updateGigPerformanceStats,
  buildGigStatsSnapshot
} from '../../utils/gigStats'
import { audioManager } from '../../utils/AudioManager'
import {
  getGigTimeMs,
  getAudioTimeMs,
  playNoteAtTime,
  stopAudio
} from '../../utils/audioEngine'
import { getScheduledHitTimeMs } from '../../utils/audioTimingUtils'
import { checkHit } from '../../utils/rhythmUtils'

/**
 * Handles scoring logic including hits, misses, toxic mode, and game over.
 *
 * @param {Object} params - Hook parameters.
 * @param {Object} params.gameStateRef - Reference to the mutable game state.
 * @param {Object} params.setters - React state setters from useRhythmGameState.
 * @param {Object} params.contextActions - Actions from useGameState (addToast, changeScene, hasUpgrade, setLastGigStats).
 * @returns {Object} Scoring actions: handleHit, handleMiss, activateToxicMode.
 */
export const useRhythmGameScoring = ({
  gameStateRef,
  setters,
  contextActions
}) => {
  const {
    setScore,
    setCombo,
    setHealth,
    setOverload,
    setIsToxicMode,
    setIsGameOver
  } = setters
  const { addToast, changeScene, hasUpgrade, setLastGigStats } = contextActions

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
    addToast('TOXIC OVERLOAD!', 'success')
  }, [addToast, gameStateRef, setIsToxicMode])

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
        addToast('TOXIC MODE LOST!', 'error')
      }

      setCombo(0)
      gameStateRef.current.combo = 0
      setOverload(o => {
        const penalty = isEmptyHit ? 2 : 5
        const next = Math.max(0, o - penalty * count)
        // Side-effect: Updating ref in state setter to prevent stale closure in loop
        gameStateRef.current.overload = next
        const updatedStats = updateGigPerformanceStats(
          {
            ...gameStateRef.current.stats,
            misses: gameStateRef.current.stats.misses + count
          },
          { combo: gameStateRef.current.combo, overload: next }
        )
        gameStateRef.current.stats = updatedStats
        return next
      })

      // Only play miss SFX if it's a real miss
      if (!isEmptyHit) {
        audioManager.playSFX('miss')
      }

      let decayPerMiss = hasUpgrade('bass_sansamp') ? 1 : 2
      if (isEmptyHit) {
        decayPerMiss = 1 // Lower penalty for empty hits
      }

      setHealth(h => {
        const next = Math.max(0, h - decayPerMiss * count)
        if (next <= 0 && !gameStateRef.current.isGameOver) {
          setIsGameOver(true)
          gameStateRef.current.isGameOver = true
          stopAudio() // Immediate stop to prevent stuttering/desync
          addToast('BAND COLLAPSED', 'error')

          // Schedule exit from Gig if failed (Softlock fix)
          if (!gameOverTimerRef.current) {
            gameOverTimerRef.current = setTimeout(() => {
              addToast('Gig Failed! Reviewing impact...', 'info')
              setLastGigStats(
                buildGigStatsSnapshot(
                  gameStateRef.current.score,
                  gameStateRef.current.stats,
                  gameStateRef.current.toxicTimeTotal
                )
              )
              changeScene('POSTGIG')
            }, 4000)
          }
        }
        gameStateRef.current.health = next
        return next
      })
    },
    [
      addToast,
      changeScene,
      hasUpgrade,
      setLastGigStats,
      gameStateRef,
      setCombo,
      setHealth,
      setIsGameOver,
      setIsToxicMode,
      setOverload
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
      if (laneIndex === 0 && hasUpgrade('guitar_custom')) hitWindow += 50

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
        if (laneIndex === 1 && hasUpgrade('drum_trigger')) points = 120
        if (laneIndex === 0) points *= state.modifiers.guitarScoreMult || 1.0

        // Guestlist Effect: +20% score
        if (state.modifiers.guestlist) points *= 1.2

        const comboForScore = state.combo
        let finalScore = points + comboForScore * 10
        if (toxicModeActive) finalScore *= 4

        setScore(s => {
          const next = s + finalScore
          gameStateRef.current.score = next
          return next
        })
        setCombo(c => {
          const next = c + 1
          gameStateRef.current.combo = next
          gameStateRef.current.stats = updateGigPerformanceStats(
            gameStateRef.current.stats,
            { combo: next, overload: gameStateRef.current.overload }
          )
          return next
        })
        setHealth(h => {
          const next = Math.min(100, h + (toxicModeActive ? 1 : 2)) // Reduced regen in Toxic Mode
          gameStateRef.current.health = next
          return next
        })
        gameStateRef.current.stats.perfectHits++

        if (!toxicModeActive) {
          setOverload(o => {
            const gain = 4 // Increased gain to make Toxic Mode reachable
            const next = o + gain
            const peakCandidate = Math.min(next, 100)
            gameStateRef.current.stats = updateGigPerformanceStats(
              gameStateRef.current.stats,
              { combo: gameStateRef.current.combo, overload: peakCandidate }
            )
            if (next >= 100) {
              activateToxicMode()
              gameStateRef.current.overload = 0
              return 0
            }
            gameStateRef.current.overload = next
            return next
          })
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
      hasUpgrade,
      gameStateRef,
      setCombo,
      setHealth,
      setOverload,
      setScore
    ]
  )

  return {
    handleHit,
    handleMiss,
    activateToxicMode,
    gameOverTimerRef // Exposed for cleanup if needed
  }
}
