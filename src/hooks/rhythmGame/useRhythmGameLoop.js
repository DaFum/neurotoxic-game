import { useCallback } from 'react'
import {
  trySpawnProjectile,
  updateProjectiles,
  checkCollisions
} from '../../utils/hecklerLogic'
import {
  getGigTimeMs,
  pauseAudio,
  resumeAudio,
  stopAudio
} from '../../utils/audioEngine'
import { buildGigStatsSnapshot } from '../../utils/gigStats'

const NOTE_MISS_WINDOW_MS = 300

/**
 * Manages the high-frequency game loop update.
 *
 * @param {Object} params - Hook parameters.
 * @param {Object} params.gameStateRef - Game state reference.
 * @param {Object} params.scoringActions - Scoring actions (handleMiss).
 * @param {Object} params.setters - Setters (setIsToxicMode).
 * @param {Object} params.state - React state (isGameOver, isToxicMode).
 * @param {Object} params.contextState - Context state (activeEvent).
 * @param {Object} params.contextActions - Context actions (setLastGigStats, changeScene).
 * @returns {Object} Loop actions (update).
 */
export const useRhythmGameLoop = ({
  gameStateRef,
  scoringActions,
  setters,
  contextState,
  contextActions
}) => {
  const { handleMiss } = scoringActions
  const { setIsToxicMode } = setters
  const { activeEvent } = contextState
  const { setLastGigStats, changeScene } = contextActions

  const handleCollision = useCallback(
    () => handleMiss(1, false),
    [handleMiss]
  )

  /**
   * Finalizes gig results and transitions exactly once.
   * @param {object} stateRef - Mutable rhythm game state.
   */
  const finalizeGig = useCallback(
    stateRef => {
      if (stateRef.hasSubmittedResults) return
      stateRef.hasSubmittedResults = true
      stateRef.running = false
      setLastGigStats(
        buildGigStatsSnapshot(
          stateRef.score,
          stateRef.stats,
          stateRef.toxicTimeTotal
        )
      )
      stopAudio()
      changeScene('POSTGIG')
    },
    [changeScene, setLastGigStats]
  )

  /**
   * Advances the gig logic by one frame.
   * @param {number} deltaMS - Milliseconds elapsed since last frame.
   */
  const update = useCallback(
    deltaMS => {
      const stateRef = gameStateRef.current
      if (stateRef.paused) return

      // Use Ref values instead of React state
      const isGameOver = stateRef.isGameOver
      const isToxicMode = stateRef.isToxicMode

      // Heckler Logic
      if (stateRef.running && !activeEvent && !isGameOver) {
        const newProjectile = trySpawnProjectile(
          { health: stateRef.health },
          stateRef.rng,
          window.innerWidth
        )
        if (newProjectile) {
          stateRef.projectiles.push(newProjectile)
        }
      }

      // Update Projectiles
      if (stateRef.projectiles.length > 0) {
        stateRef.projectiles = updateProjectiles(
          stateRef.projectiles,
          deltaMS,
          window.innerHeight
        )

        if (!activeEvent && !isGameOver) {
          stateRef.projectiles = checkCollisions(
            stateRef.projectiles,
            window.innerHeight,
            handleCollision
          )
        }
      }

      if (!stateRef.running || activeEvent || isGameOver) {
        if (!stateRef.pauseTime) {
          stateRef.pauseTime = getGigTimeMs()
          if (!isGameOver) {
            pauseAudio()
          }
        }
        return
      }

      if (stateRef.pauseTime) {
        stateRef.pauseTime = null
        resumeAudio()
      }

      const now = getGigTimeMs()
      stateRef.elapsed = now
      const duration = stateRef.totalDuration
      const rawProgress =
        duration > 0 ? Math.min(100, (now / duration) * 100) : 0
      stateRef.progress = Math.max(0, rawProgress)

      if (isToxicMode) {
        if (now > stateRef.toxicModeEndTime) {
          setIsToxicMode(false)
          stateRef.isToxicMode = false
        } else {
          stateRef.toxicTimeTotal += deltaMS
        }
      }

      const didReachSongEnd = now >= duration
      const hasParsedNotes = stateRef.notes.length > 0
      const hasPassedAllNotes =
        hasParsedNotes && stateRef.nextMissCheckIndex >= stateRef.notes.length
      const didAudioPlaybackEnd =
        stateRef.audioPlaybackEnded &&
        (duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS)
      const shouldFinalizeForNotes =
        hasPassedAllNotes &&
        (duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS)

      if (didReachSongEnd || didAudioPlaybackEnd || shouldFinalizeForNotes) {
        finalizeGig(stateRef)
        return
      }

      let missCount = 0
      const notes = stateRef.notes
      let i = stateRef.nextMissCheckIndex

      while (i < notes.length) {
        const note = notes[i]

        if (!note.visible || note.hit) {
          if (i === stateRef.nextMissCheckIndex) {
            stateRef.nextMissCheckIndex++
          }
          i++
          continue
        }

        if (note.time > now + NOTE_MISS_WINDOW_MS) {
          break
        }

        if (now > note.time + NOTE_MISS_WINDOW_MS) {
          note.visible = false
          missCount++
          if (i === stateRef.nextMissCheckIndex) {
            stateRef.nextMissCheckIndex++
          }
        }

        i++
      }

      if (missCount > 0) {
        handleMiss(missCount, false)
      }
    },
    [
      activeEvent,
      finalizeGig,
      gameStateRef,
      handleCollision,
      handleMiss,
      setIsToxicMode
    ]
  )

  return { update }
}
