import { trySpawnProjectile, processProjectiles } from './hecklerLogic'
import { buildGigStatsSnapshot } from './gigStats'
import { logger } from './logger'
import { disableCorruptionBurstAudio } from './audio/audioEngine'
import { finiteNumberOr } from './finiteNumber'
import type { RhythmGameRefState, SetLastGigStats } from '../types/rhythmGame'
import type { HecklerSession } from './hecklerLogic'
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
  hecklerSessionRef: { current: HecklerSession }
  deltaMS: number
  handleCollision: CollisionHandler
  setIsToxicMode: ToggleBooleanCallback
  setIsCorruptionBurstActive: ToggleBooleanCallback
  handleMiss: MissHandler
  finalizeGigCallback: (stateRef: RhythmGameRefState) => void
  getGigTimeMs: () => number
  pauseAudio: AsyncVoidCallback
  resumeAudio: AsyncBooleanCallback
  setCorruptionState: (level: number, active: boolean) => void
  setCorruptionEffect: (active: boolean) => void
}

/**
 * Finalizes a gig exactly once, snapshots stats, stops audio, and exits the gig.
 *
 * @param stateRef - Mutable rhythm-game state ref.
 * @param setLastGigStats - Callback used to persist the final gig stats snapshot.
 * @param endGig - Callback that leaves the gig flow.
 * @param stopAudio - Callback that stops currently playing gig audio.
 */

/**
 * Handles resuming the audio track via the overlay when the game is unpaused.
 */
export const handleOverlayResume = (
  stateRef: RhythmGameRefState,
  transportState: string,
  resumeAudio: AsyncBooleanCallback
): void => {
  if (stateRef.transportPausedByOverlay) {
    if (transportState === 'paused') {
      try {
        stateRef.transportPausedByOverlay = false
        const res = resumeAudio()
        if (res && typeof res === 'object' && typeof res.catch === 'function') {
          res
            .then(success => {
              if (success === false) {
                stateRef.transportPausedByOverlay = true
              }
            })
            .catch((err: unknown) => {
              logger.debug(
                'RhythmGameLoop',
                'Failed to resume audio via overlay',
                err
              )
              stateRef.transportPausedByOverlay = true
            })
        } else if (res === false) {
          stateRef.transportPausedByOverlay = true
        }
      } catch (err) {
        logger.debug(
          'RhythmGameLoop',
          'Sync error resuming audio via overlay',
          err
        )
        stateRef.transportPausedByOverlay = true
      }
    } else {
      stateRef.transportPausedByOverlay = false
    }
  }
}

/**
 * Handles pausing the audio track via the overlay when the game is paused.
 */
export const handleOverlayPause = (
  stateRef: RhythmGameRefState,
  isTransportRunning: boolean,
  pauseAudio: AsyncVoidCallback
): void => {
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
      } else if ((res as unknown as boolean) === false) {
        stateRef.transportPausedByOverlay = false
      }
    } catch (err) {
      logger.debug(
        'RhythmGameLoop',
        'Sync error pausing audio via overlay',
        err
      )
      stateRef.transportPausedByOverlay = false
    }
  }
}

/**
 * Updates toxic mode state, managing its remaining duration and total accumulated time.
 */
export const processToxicMode = (
  stateRef: RhythmGameRefState,
  now: number,
  deltaMS: number,
  setIsToxicMode: ToggleBooleanCallback
): void => {
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
}

/**
 * Resolves active corruption bursts when their effect duration expires.
 */
export const processCorruptionBurst = (
  stateRef: RhythmGameRefState,
  now: number,
  setIsCorruptionBurstActive: ToggleBooleanCallback,
  setCorruptionState: (level: number, active: boolean) => void,
  setCorruptionEffect: (active: boolean) => void
): void => {
  if (
    stateRef.isCorruptionBurstActive &&
    now > stateRef.corruptionBurstEndTime
  ) {
    stateRef.isCorruptionBurstActive = false
    stateRef.corruptionBurstEndTime = 0
    setIsCorruptionBurstActive(false)
    setCorruptionState(
      finiteNumberOr(stateRef.stats?.corruptionLevel, 0),
      false
    )
    setCorruptionEffect(false)
    disableCorruptionBurstAudio()
  }
}

/**
 * Processes missed notes by sweeping the notes array forward up to the current time window.
 */
export const processMissedNotes = (
  stateRef: RhythmGameRefState,
  now: number,
  handleMiss: MissHandler
): void => {
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

/**
 * Advances one rhythm-game frame for overlay pausing, toxic mode, misses, and hecklers.
 *
 * @param args - Runtime tick inputs and callbacks for state, transport,
 * overlays, dimensions, hecklers, frame timing, audio, misses, finalization,
 * and corruption effects.
 */
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
  setIsCorruptionBurstActive,
  handleMiss,
  finalizeGigCallback,
  getGigTimeMs,
  pauseAudio,
  resumeAudio,
  setCorruptionState,
  setCorruptionEffect
}: RhythmTickArgs): void => {
  if (activeEvent || stateRef.isGameOver || stateRef.songTransitioning) {
    handleOverlayPause(stateRef, isTransportRunning, pauseAudio)
    return
  }

  handleOverlayResume(stateRef, transportState, resumeAudio)

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

  processToxicMode(stateRef, now, deltaMS, setIsToxicMode)

  processCorruptionBurst(
    stateRef,
    now,
    setIsCorruptionBurstActive,
    setCorruptionState,
    setCorruptionEffect
  )

  const isNearTrackEnd = duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS

  if (stateRef.setlistCompleted && isNearTrackEnd) {
    finalizeGigCallback(stateRef)
    return
  }

  processMissedNotes(stateRef, now, handleMiss)
}
