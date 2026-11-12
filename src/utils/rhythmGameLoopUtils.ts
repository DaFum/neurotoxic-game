import { trySpawnProjectile, processProjectiles } from './hecklerLogic'
import { buildGigStatsSnapshot } from './gigStats'
import { logger } from './logger'
import { finiteNumberOr } from './finiteNumber'
import type {
  GigStats,
  RhythmGameRefState,
  SetLastGigStats
} from '../types/rhythmGame'
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
// At most 100 ms of 60 Hz spawn rolls may settle together after a render stall.
const MAX_HECKLER_SPAWN_ATTEMPTS_PER_TICK = 6

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
  endCorruptionBurst?: (level: number) => void
  setIsCorruptionBurstActive?: ToggleBooleanCallback
  handleMiss: MissHandler
  /** Effective lane hit window; a note stays hittable until it elapses. */
  getLaneHitWindow?: (laneIndex: number) => number
  finalizeGigCallback: (stateRef: RhythmGameRefState) => void
  getGigTimeMs: () => number
  pauseAudio: AsyncVoidCallback
  resumeAudio: AsyncBooleanCallback
  setCorruptionState?: (level: number, active: boolean) => void
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
  disableCorruptionBurstAudio: () => void,
  clockReset: boolean,
  endCorruptionBurst?: (level: number) => void,
  setIsCorruptionBurstActive?: ToggleBooleanCallback,
  setCorruptionState?: (level: number, active: boolean) => void
): void => {
  if (
    stateRef.isCorruptionBurstActive &&
    (clockReset || now > stateRef.corruptionBurstEndTime)
  ) {
    stateRef.isCorruptionBurstActive = false
    stateRef.corruptionBurstEndTime = 0
    const level = finiteNumberOr(stateRef.stats?.corruptionLevel, 0)
    endCorruptionBurst?.(level)
    setIsCorruptionBurstActive?.(false)
    setCorruptionState?.(level, false)
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
 * One-shot publisher held by the winner of {@link claimGigResultSubmission}.
 * Builds the result snapshot once and publishes that same snapshot once;
 * any later call returns `null` without building or publishing.
 */
export type SubmitGigResult = (buildSnapshot: () => GigStats) => GigStats | null

/**
 * Arbitrates gig-result submission between normal completion, Quit and the
 * delayed collapse timer: the first caller claims the gig and receives the
 * only publisher, every later caller receives `null` and must not end the gig.
 *
 * @remarks
 * `hasSubmittedResults` means "claimed": it covers a submitted result and a
 * failed submission alike. A failed submission (the builder or the publisher
 * throws) keeps the claim, so no other path or retry can resubmit; the error
 * propagates to the owner, whose cleanup and error policy stay local. The
 * claim is taken synchronously before any callback runs, so a re-entrant
 * completion path started from the publisher already sees it.
 *
 * @param claimTarget - Rhythm state (or an owner-local stand-in) holding the latch.
 * @param publish - Persists the snapshot, e.g. `setLastGigStats`.
 * @returns The one-shot publisher, or `null` when results were already claimed.
 */
export const claimGigResultSubmission = (
  claimTarget: Pick<RhythmGameRefState, 'hasSubmittedResults'>,
  publish: SetLastGigStats
): SubmitGigResult | null => {
  if (claimTarget.hasSubmittedResults) return null
  claimTarget.hasSubmittedResults = true
  let used = false
  return buildSnapshot => {
    if (used) return null
    used = true
    const snapshot = buildSnapshot()
    publish(snapshot)
    return snapshot
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
  const submit = claimGigResultSubmission(stateRef, setLastGigStats)
  if (!submit) return
  // `hasSubmittedResults` is already set, so a Quit can no longer end the gig:
  // a failing snapshot, publish or audio stop must not skip `endGig`.
  try {
    try {
      submit(() =>
        buildGigStatsSnapshot(
          stateRef.score,
          stateRef.stats,
          stateRef.toxicTimeTotal,
          stateRef.songStats,
          false
        )
      )
    } finally {
      stopAudio()
    }
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
  endCorruptionBurst,
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

  const clockReset =
    stateRef.lastTickTimeMs !== undefined && now < stateRef.lastTickTimeMs
  const previousTime = clockReset ? 0 : (stateRef.lastTickTimeMs ?? 0)
  stateRef.lastTickTimeMs = now

  // Preserve the original 60 FPS spawn rate, sampling on gameplay-clock
  // boundaries so render frequency and frozen audio cannot add hazard rolls.
  // Discard excess catch-up after a stall: replaying seconds of opportunities
  // now would spawn a burst at one position and block the main thread.
  const spawnAttempts = Math.min(
    MAX_HECKLER_SPAWN_ATTEMPTS_PER_TICK,
    Math.max(
      0,
      Math.floor((now * 60) / 1000) - Math.floor((previousTime * 60) / 1000)
    )
  )
  for (let attempt = 0; attempt < spawnAttempts; attempt++) {
    const newProjectile = trySpawnProjectile(
      hecklerSessionRef.current,
      stateRef,
      stateRef.rng,
      currentInnerWidth
    )
    if (newProjectile) {
      stateRef.projectiles.push(newProjectile)
    }
  }

  processToxicMode(stateRef, now, deltaMS, setIsToxicMode, clockReset)

  processCorruptionBurst(
    stateRef,
    now,
    disableCorruptionBurstAudio,
    clockReset,
    endCorruptionBurst,
    setIsCorruptionBurstActive,
    setCorruptionState
  )

  // A projectile hit above can collapse the band in this very tick. Collapse
  // wins over completion: stop here so the collapse timer publishes the
  // `failed: true` result and ends the gig (#3592).
  if (stateRef.isGameOver) return

  const isNearTrackEnd = duration <= 0 || now >= duration - NOTE_MISS_WINDOW_MS

  if (stateRef.setlistCompleted && isNearTrackEnd) {
    finalizeGigCallback(stateRef)
    return
  }

  processMissedNotes(stateRef, now, handleMiss, getLaneHitWindow)
}
