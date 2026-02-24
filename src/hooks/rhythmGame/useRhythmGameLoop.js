import { useCallback } from 'react'
import {
  trySpawnProjectile,
  updateProjectiles,
  checkCollisions
} from '../../utils/hecklerLogic'
import {
  getGigTimeMs,
  getTransportState,
  pauseAudio,
  resumeAudio,
  stopAudio
} from '../../utils/audioEngine'
import { buildGigStatsSnapshot } from '../../utils/gigStats'

const NOTE_MISS_WINDOW_MS = 300

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
  const { setLastGigStats, endGig } = contextActions

  const handleCollision = useCallback(() => handleMiss(1, false), [handleMiss])

  const finalizeGig = useCallback(
    stateRef => {
      if (stateRef.hasSubmittedResults) return
      stateRef.hasSubmittedResults = true
      setLastGigStats(
        buildGigStatsSnapshot(
          stateRef.score,
          stateRef.stats,
          stateRef.toxicTimeTotal
        )
      )
      stopAudio()
      endGig()
    },
    [endGig, setLastGigStats]
  )

  const update = useCallback(
    deltaMS => {
      const stateRef = gameStateRef.current
      const transportState = getTransportState()
      const isTransportRunning = transportState === 'started'

      if (activeEvent || stateRef.isGameOver || stateRef.songTransitioning) {
        if (isTransportRunning && !stateRef.transportPausedByOverlay) {
          pauseAudio()
          stateRef.transportPausedByOverlay = true
        }
        return
      }

      if (stateRef.transportPausedByOverlay) {
        if (transportState === 'paused') {
          resumeAudio()
        }
        stateRef.transportPausedByOverlay = false
      }

      if (!isTransportRunning) {
        return
      }

      const now = getGigTimeMs()
      const duration = stateRef.totalDuration
      const rawProgress =
        duration > 0 ? Math.min(100, (now / duration) * 100) : 0
      stateRef.progress = Math.max(0, rawProgress)

      if (stateRef.projectiles.length > 0) {
        stateRef.projectiles = updateProjectiles(
          stateRef.projectiles,
          deltaMS,
          window.innerHeight
        )

        stateRef.projectiles = checkCollisions(
          stateRef.projectiles,
          window.innerHeight,
          handleCollision
        )
      }

      const newProjectile = trySpawnProjectile(
        { health: stateRef.health },
        stateRef.rng,
        window.innerWidth
      )
      if (newProjectile) {
        stateRef.projectiles.push(newProjectile)
      }

      if (stateRef.isToxicMode) {
        if (now > stateRef.toxicModeEndTime) {
          setIsToxicMode(false)
          stateRef.isToxicMode = false
        } else {
          stateRef.toxicTimeTotal += deltaMS
        }
      }

      const isNearTrackEnd =
        duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS

      if (stateRef.setlistCompleted && isNearTrackEnd) {
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
