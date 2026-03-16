// TODO: Implement this
import { useCallback, useRef, useEffect } from 'react'
import {
  trySpawnProjectile,
  processProjectiles,
  createHecklerSession
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

  const hecklerSessionRef = useRef(createHecklerSession())
  const dimensionsRef = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  })
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      dimensionsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [])

  const handleCollision = useCallback(() => handleMiss(1, false), [handleMiss])

  const finalizeGig = useCallback(
    stateRef => {
      if (stateRef.hasSubmittedResults) return
      stateRef.hasSubmittedResults = true
      setLastGigStats(
        buildGigStatsSnapshot(
          stateRef.score,
          stateRef.stats,
          stateRef.toxicTimeTotal,
          stateRef.songStats || []
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

      const currentInnerHeight = dimensionsRef.current.height
      const currentInnerWidth = dimensionsRef.current.width

      if (stateRef.projectiles.length > 0) {
        stateRef.projectiles = processProjectiles(
          hecklerSessionRef.current,
          stateRef.projectiles,
          deltaMS,
          currentInnerHeight,
          handleCollision
        )
      }

      const newProjectile = trySpawnProjectile(
        hecklerSessionRef.current,
        { health: stateRef.health, combo: stateRef.combo },
        stateRef.rng,
        currentInnerWidth
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

        if (note.time > now + NOTE_MISS_WINDOW_MS) {
          break
        }

        if (!note.visible || note.hit) {
          if (i === stateRef.nextMissCheckIndex) {
            stateRef.nextMissCheckIndex++
          }
          i++
          continue
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
