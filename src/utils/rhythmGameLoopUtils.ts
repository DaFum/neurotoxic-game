import { trySpawnProjectile, processProjectiles } from './hecklerLogic'
import { buildGigStatsSnapshot } from './gigStats'
import { logger } from './logger'
import type { RhythmGameRefState, SetLastGigStats } from '../types/rhythmGame'
import type {
  AsyncBooleanCallback,
  AsyncVoidCallback,
  CollisionHandler,
  MissHandler,
  ToggleBooleanCallback,
  VoidCallback
} from '../types/callbacks'

const NOTE_MISS_WINDOW_MS = 300

interface RhythmTickArgs {
  stateRef: RhythmGameRefState
  isTransportRunning: boolean
  transportState: string
  activeEvent: unknown
  dimensionsRef: { current: { width: number; height: number } }
  hecklerSessionRef: { current: unknown }
  deltaMS: number
  handleCollision: CollisionHandler
  setIsToxicMode: ToggleBooleanCallback
  handleMiss: MissHandler
  finalizeGigCallback: (stateRef: RhythmGameRefState) => void
  getGigTimeMs: () => number
  pauseAudio: AsyncVoidCallback
  resumeAudio: AsyncBooleanCallback
}

export const finalizeGig = (
  stateRef: RhythmGameRefState,
  setLastGigStats: SetLastGigStats,
  endGig: VoidCallback,
  stopAudio: VoidCallback
): void => {
  if (stateRef.hasSubmittedResults) return
  stateRef.hasSubmittedResults = true
  setLastGigStats(
    buildGigStatsSnapshot(
      stateRef.score,
      stateRef.stats,
      stateRef.toxicTimeTotal,
      stateRef.songStats
    )
  )
  stopAudio()
  endGig()
}

export const processRhythmGameTick = ({
  stateRef,
  isTransportRunning,
  transportState,
  activeEvent,
  dimensionsRef,
  hecklerSessionRef,
  deltaMS,
  handleCollision,
  setIsToxicMode,
  handleMiss,
  finalizeGigCallback,
  getGigTimeMs,
  pauseAudio,
  resumeAudio
}: RhythmTickArgs): void => {
  if (activeEvent || stateRef.isGameOver || stateRef.songTransitioning) {
    if (isTransportRunning && !stateRef.transportPausedByOverlay) {
      try {
        stateRef.transportPausedByOverlay = true
        const res = pauseAudio()
        if (res && typeof res.catch === 'function') {
          res.catch(err => {
            logger.debug(
              'RhythmGameLoop',
              'Failed to pause audio via overlay',
              err
            )
            stateRef.transportPausedByOverlay = false
          })
        }
      } catch (err) {
        logger.debug(
          'RhythmGameLoop',
          'Sync error pausing audio via overlay',
          err
        )
      }
    }
    return
  }

  if (stateRef.transportPausedByOverlay) {
    if (transportState === 'paused') {
      try {
        stateRef.transportPausedByOverlay = false
        const res = resumeAudio()
        if (res instanceof Promise) {
          res.catch(err => {
            logger.debug(
              'RhythmGameLoop',
              'Failed to resume audio via overlay',
              err
            )
            stateRef.transportPausedByOverlay = true
          })
        }
      } catch (err) {
        logger.debug(
          'RhythmGameLoop',
          'Sync error resuming audio via overlay',
          err
        )
      }
    } else {
      stateRef.transportPausedByOverlay = false
    }
  }

  if (!isTransportRunning) {
    return
  }

  const now = getGigTimeMs()
  const duration = stateRef.totalDuration
  const rawProgress = duration > 0 ? Math.min(100, (now / duration) * 100) : 0
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
      const remaining = stateRef.toxicModeEndTime - (now - deltaMS)
      stateRef.toxicTimeTotal += Math.max(0, Math.min(deltaMS, remaining))
      setIsToxicMode(false)
      stateRef.isToxicMode = false
    } else {
      stateRef.toxicTimeTotal += deltaMS
    }
  }

  const isNearTrackEnd = duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS

  if (stateRef.setlistCompleted && isNearTrackEnd) {
    finalizeGigCallback(stateRef)
    return
  }

  let missCount = 0
  const notes = stateRef.notes
  let i = stateRef.nextMissCheckIndex

  while (i < notes.length) {
    const note = notes[i]
    if (!note) {
      logger.error(
        'RhythmGameLoop',
        `Sparse notes invariant violated at index ${i}`
      )
      if (i === stateRef.nextMissCheckIndex) {
        stateRef.nextMissCheckIndex++
      }
      i++
      continue
    }

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
}
