import { trySpawnProjectile, processProjectiles } from './hecklerLogic'
import { buildGigStatsSnapshot } from './gigStats'
import { logger } from './logger'
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
  /** Effective lane hit window; a note stays hittable until it elapses. */
  getLaneHitWindow?: (laneIndex: number) => number
  finalizeGigCallback: (stateRef: RhythmGameRefState) => void
  getGigTimeMs: () => number
  pauseAudio: AsyncVoidCallback
  resumeAudio: AsyncBooleanCallback
  setCorruptionState: (level: number, active: boolean) => void
  disableCorruptionBurstAudio: () => void
}

/**
 * Handles resuming the audio track via the overlay when the game is unpaused.
 */
const handleOverlayResume = (
  stateRef: RhythmGameRefState,
  transportState: string,
  resumeAudio: AsyncBooleanCallback
): void => {
  // The player's pause menu outranks the overlay: keep the overlay flag so the
  // loop resumes once the player unpauses, not while the menu is still open.
  if (stateRef.userPaused) return
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
        } else if ((res as unknown as boolean) === false) {
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
const handleOverlayPause = (
  stateRef: RhythmGameRefState,
  isTransportRunning: boolean,
  pauseAudio: AsyncVoidCallback
): void => {
  if (isTransportRunning && !stateRef.transportPausedByOverlay) {
    try {
      stateRef.transportPausedByOverlay = true
      const res = pauseAudio()
      if (res && typeof res === 'object' && typeof res.catch === 'function') {
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
const processToxicMode = (
  stateRef: RhythmGameRefState,
  now: number,
  deltaMS: number,
  setIsToxicMode: ToggleBooleanCallback,
  clockReset: boolean
): void => {
  if (stateRef.isToxicMode) {
    if (clockReset || now > stateRef.toxicModeEndTime) {
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
const processCorruptionBurst = (
  stateRef: RhythmGameRefState,
  now: number,
  setIsCorruptionBurstActive: ToggleBooleanCallback,
  setCorruptionState: (level: number, active: boolean) => void,
  disableCorruptionBurstAudio: () => void,
  clockReset: boolean
): void => {
  if (
    stateRef.isCorruptionBurstActive &&
    (clockReset || now > stateRef.corruptionBurstEndTime)
  ) {
    stateRef.isCorruptionBurstActive = false
    stateRef.corruptionBurstEndTime = 0
    setIsCorruptionBurstActive(false)
    setCorruptionState(
      finiteNumberOr(stateRef.stats?.corruptionLevel, 0),
      false
    )
    disableCorruptionBurstAudio()
  }
}

/**
 * Processes missed notes by sweeping the notes array forward up to the current time window.
 */
const processMissedNotes = (
  stateRef: RhythmGameRefState,
  now: number,
  handleMiss: MissHandler,
  getLaneHitWindow?: (laneIndex: number) => number
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

    // A boosted window outlives the fixed grace: expiring earlier would hide a
    // note the player can still legitimately hit.
    const missWindowMs = Math.max(
      NOTE_MISS_WINDOW_MS,
      getLaneHitWindow?.(note.laneIndex) ?? 0
    )
    if (now > note.time + missWindowMs) {
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

/**
 * Fires the in-gig narrative events (`gig_intro`, then `gig_mid`) off gig
 * progress, limited to at most one shown event per setlist song: only a
 * successful `triggerEvent` consumes the song's slot, so a missed chance roll
 * does not block the other event from attempting in the same song. Nothing
 * fires during song transitions (progress is stale from the previous song
 * there), after the last song, or after the gig has been finalized.
 *
 * @param stateRef - High-frequency rhythm game state carrying progress and guards.
 * @param triggerEvent - Event-system dispatcher for the `gig` category.
 */
export const maybeFireGigProgressEvent = (
  stateRef: RhythmGameRefState,
  triggerEvent: (category: string, triggerPoint?: string | null) => boolean
): void => {
  if (
    stateRef.hasSubmittedResults ||
    stateRef.songTransitioning ||
    stateRef.setlistCompleted
  )
    return
  const currentSongIndex = finiteNumberOr(stateRef.lastEndedSongIndex, -1) + 1
  if (stateRef.lastGigEventSongIndex === currentSongIndex) return
  if (!stateRef.gigIntroFired && stateRef.progress > 0) {
    stateRef.gigIntroFired = true
    if (triggerEvent('gig', 'gig_intro')) {
      stateRef.lastGigEventSongIndex = currentSongIndex
    }
  } else if (!stateRef.gigMidFired && stateRef.progress >= 50) {
    stateRef.gigMidFired = true
    if (triggerEvent('gig', 'gig_mid')) {
      stateRef.lastGigEventSongIndex = currentSongIndex
    }
  }
}

/**
 * Finalizes the active gig session, submits performance results, and stops audio playback.
 *
 * @param stateRef - High-frequency rhythm game state carrying current score and statistics.
 * @param setLastGigStats - Callback to persist the finalized gig performance metrics.
 * @param endGig - Callback to cleanly terminate the rhythm game sequence.
 * @param stopAudio - Callback to halt the underlying audio engine playback.
 */
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
      stateRef.songStats,
      false
    )
  )
  // `hasSubmittedResults` is already set, so a Quit can no longer end the gig:
  // a failing audio stop must not skip `endGig` and leave the scene stuck.
  try {
    stopAudio()
  } finally {
    endGig()
  }
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
  getLaneHitWindow,
  finalizeGigCallback,
  getGigTimeMs,
  pauseAudio,
  resumeAudio,
  setCorruptionState,
  disableCorruptionBurstAudio
}: RhythmTickArgs): void => {
  // The player's pause menu stops the tick too. A playback start that was
  // still loading when Pause opened lands on a running transport afterwards;
  // without this guard notes would advance and miss under the open menu, and
  // the stray transport is paused again through the same overlay path.
  if (
    activeEvent ||
    stateRef.isGameOver ||
    stateRef.songTransitioning ||
    stateRef.userPaused
  ) {
    handleOverlayPause(stateRef, isTransportRunning, pauseAudio)
    return
  }

  handleOverlayResume(stateRef, transportState, resumeAudio)

  // A zero-length final song never starts the transport, so the near-end
  // check below is unreachable (the gig clock is reset and `totalDuration`
  // still holds the previous song); finalize here (idempotent via
  // `hasSubmittedResults`) instead of leaving the gig soft-locked. Only for a
  // stopped transport: `paused` also covers an overlay pause or a deferred
  // start that is about to resume, where the near-end check below still decides.
  if (
    stateRef.setlistCompleted &&
    !isTransportRunning &&
    transportState === 'stopped'
  ) {
    finalizeGigCallback(stateRef)
    return
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

  // ⚡ BOLT OPTIMIZATION: Pass `stateRef` directly to avoid frame-by-frame object allocation
  // What: Replaced `{ health: stateRef.health, combo: stateRef.combo }` wrapper allocation with `stateRef`.
  // Why: Prevents creating ~3,600 temporary object allocations per minute in the 60 FPS rhythm game update loop.
  // Impact: Eliminates GC allocation pressure and reduces stutter risk during active rhythm minigames.
  const newProjectile = trySpawnProjectile(
    hecklerSessionRef.current,
    stateRef,
    stateRef.rng,
    currentInnerWidth
  )
  if (newProjectile) {
    stateRef.projectiles.push(newProjectile)
  }

  const clockReset =
    stateRef.lastTickTimeMs !== undefined && now < stateRef.lastTickTimeMs
  stateRef.lastTickTimeMs = now

  processToxicMode(stateRef, now, deltaMS, setIsToxicMode, clockReset)

  processCorruptionBurst(
    stateRef,
    now,
    setIsCorruptionBurstActive,
    setCorruptionState,
    disableCorruptionBurstAudio,
    clockReset
  )

  const isNearTrackEnd = duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS

  if (stateRef.setlistCompleted && isNearTrackEnd) {
    finalizeGigCallback(stateRef)
    return
  }

  processMissedNotes(stateRef, now, handleMiss, getLaneHitWindow)
}
