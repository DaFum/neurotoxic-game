import { useCallback, useRef, useEffect } from 'react'
import type { TFunction } from 'i18next'
import {
  setupGigPhysics,
  resolveActiveSetlist,
  resetGigStateTracking,
  invalidateSongSequence
} from '../../utils/audio/audioEngine'
import { useAudioEngine } from '../../context/AudioEngineContext'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { clampBandHarmony } from '../../utils/gameState'
import { buildGigStatsSnapshot } from '../../utils/gigStats'
import { claimGigResultSubmission } from '../../utils/rhythmGameLoopUtils'
import type { GameMap, GameState, GigModifiers, PlayerState } from '../../types'
import type {
  RhythmGameRefState,
  RhythmLane,
  RhythmSetlistEntry,
  SetLastGigStats
} from '../../types/rhythmGame'
import type { GigAudioStatus, GigInitStatus } from '../../types/gigAudioStatus'
import type { ExpeditionConditionPerformanceProfile } from '../../types/expedition'

import type { RhythmStateSetters } from './useRhythmGameState'
import type { OptionalToastCallback } from '../../types/callbacks'

type RhythmGameAudioParams = {
  gameStateRef: { current: RhythmGameRefState }
  resetGameplayState: () => void
  setters: Pick<
    RhythmStateSetters,
    'setAudioStatus' | 'setIsGameOver' | 'setFailureKind' | 'setInitStatus'
  >
  contextState: {
    band: GameState['band']
    gameMap: GameMap | null
    player: PlayerState
    setlist: RhythmSetlistEntry[]
    gigModifiers: GigModifiers
    currentGig: GameState['currentGig']
    conditionProfile: ExpeditionConditionPerformanceProfile | null
  }
  contextActions: {
    addToast: OptionalToastCallback
    setLastGigStats: SetLastGigStats
    endGig: () => void
    t: TFunction
  }
}

type HarmonyGuardParams = {
  currentHarmony: number
  hasResolvedLowHarmonyRef: { current: boolean }
  currentStatusRef: React.MutableRefObject<GigAudioStatus>
  gameStateRef: { current: RhythmGameRefState }
  setGameOver: (isGameOver: boolean) => void
  setInitStatus: (status: GigInitStatus) => void
  currentT: TFunction
  currentAddToast: OptionalToastCallback
  currentSetLastGigStats: SetLastGigStats
  currentEndGig: () => void
}

const handleHarmonyGuard = ({
  currentHarmony,
  hasResolvedLowHarmonyRef,
  currentStatusRef,
  gameStateRef,
  setGameOver,
  setInitStatus,
  currentT,
  currentAddToast,
  currentSetLastGigStats,
  currentEndGig
}: HarmonyGuardParams): boolean => {
  if (currentHarmony <= 1) {
    logger.warn('RhythmGame', 'Band harmony too low to start gig.')
    if (!hasResolvedLowHarmonyRef.current) {
      hasResolvedLowHarmonyRef.current = true
      const currentRhythmState = gameStateRef.current
      currentRhythmState.isGameOver = true
      setGameOver(true)
      currentStatusRef.current = 'ready'
      setInitStatus({ status: 'ready' })

      const message = currentT('ui:gig.toasts.bandCollapsed', {
        defaultValue: 'BAND COLLAPSED'
      })
      currentAddToast(
        typeof message === 'string' ? message : 'BAND COLLAPSED',
        'error'
      )

      // Take the shared claim so a Quit before the scene change cannot
      // submit a second result (#3591). A path that already claimed owns endGig.
      const submit = claimGigResultSubmission(
        currentRhythmState,
        currentSetLastGigStats
      )
      if (submit) {
        try {
          submit(() =>
            buildGigStatsSnapshot(
              0,
              {
                perfectHits: 0,
                misses: 0,
                maxCombo: 0,
                peakHype: 0,
                corruptionLevel: 0
              },
              0,
              [],
              true
            )
          )
        } finally {
          currentEndGig()
        }
      }
    }
    return true
  }
  return false
}

type PhysicsSetupParams = {
  currentBand: GameState['band']
  currentGigModifiers: GigModifiers
  currentConditionProfile: ExpeditionConditionPerformanceProfile | null
  activeGig: GameState['currentGig']
  currentGameMap: GameMap | null
  currentPlayer: PlayerState
  currentSetlist: RhythmSetlistEntry[]
  gameStateRef: { current: RhythmGameRefState }
}

/**
 * Applies gig physics to the rhythm state ref.
 * @returns `false` on any setup failure; the caller owns the resulting status update.
 */
const applyGigPhysicsSetup = ({
  currentBand,
  currentGigModifiers,
  currentConditionProfile,
  activeGig,
  currentGameMap,
  currentPlayer,
  currentSetlist,
  gameStateRef
}: PhysicsSetupParams): boolean => {
  const setlistFirstId =
    typeof currentSetlist?.[0] === 'string'
      ? currentSetlist[0]
      : currentSetlist?.[0]?.id

  if (!currentBand || !currentGameMap?.nodes || !currentPlayer?.currentNodeId) {
    logger.error(
      'RhythmGame',
      'Missing band, gameMap nodes, or current player node before gig physics setup'
    )
    return false
  }

  const physicsSetup = setupGigPhysics(
    currentBand,
    currentGigModifiers,
    typeof activeGig?.songId === 'string' ? activeGig.songId : undefined,
    currentGameMap,
    currentPlayer?.currentNodeId,
    typeof setlistFirstId === 'string' ? setlistFirstId : undefined,
    currentConditionProfile
  )
  if (!physicsSetup) {
    return false
  }

  gameStateRef.current.modifiers = physicsSetup.mergedModifiers
  gameStateRef.current.speed = physicsSetup.speed
  const lanes = gameStateRef.current.lanes
  const hitWindows = physicsSetup.hitWindows
  if (!Array.isArray(lanes) || lanes.length < 3) {
    logger.error(
      'RhythmGame',
      'Rhythm game lanes are not initialized correctly'
    )
    return false
  }
  if (!Array.isArray(hitWindows) || hitWindows.length < 3) {
    logger.error(
      'RhythmGame',
      'Gig physics hit windows are not initialized correctly'
    )
    return false
  }
  const laneWindows: { lane: RhythmLane; hitWindow: number }[] = []
  for (let index = 0; index < 3; index++) {
    const lane = lanes[index]
    const hitWindow = hitWindows[index]
    if (!lane) {
      logger.error('RhythmGame', 'Rhythm game lane entries are missing')
      return false
    }
    if (typeof hitWindow !== 'number' || !Number.isFinite(hitWindow)) {
      logger.error('RhythmGame', 'Gig physics hit window values are invalid')
      return false
    }
    laneWindows.push({ lane, hitWindow })
  }
  for (const { lane, hitWindow } of laneWindows) {
    lane.hitWindow = hitWindow
  }

  return true
}

/**
 * Longest wait for the stage's readiness signal before the song starts anyway.
 * The stage reports ready even after degraded or timed-out asset loads (10 s
 * per load, in parallel), so this only fires when no stage is mounted
 * (headless tests) or Pixi init itself hangs.
 */
const STAGE_READY_FALLBACK_MS = 15_000

/**
 * Audio controls exposed by the rhythm game audio hook.
 */
type RhythmGameAudioReturn = {
  retryAudioInitialization: () => Promise<void>
  /** Stable callback for the gig stage's one-shot readiness signal. */
  onStageReady: () => void
  /** Stable callback for the gig stage's one-shot init-failure signal. */
  onStageInitError: () => void
}

/**
 * Manages audio initialization, playback, and setup for the gig.
 *
 * @param params - Rhythm state ref, UI setters, game context, and context actions for audio initialization.
 * - `params.gameStateRef` - Game state reference.
 * - `params.setters` - Setters (setIsAudioReady).
 * - `params.contextState` - Context state (band, gameMap, player, setlist, gigModifiers, addToast).
 * @returns Audio actions (`retryAudioInitialization`).
 */
export const useRhythmGameAudio = ({
  gameStateRef,
  resetGameplayState,
  setters,
  contextState,
  contextActions
}: RhythmGameAudioParams): RhythmGameAudioReturn => {
  const audioEngine = useAudioEngine()
  const { setAudioStatus, setIsGameOver, setFailureKind, setInitStatus } =
    setters
  const {
    band,
    gameMap,
    player,
    setlist,
    gigModifiers,
    currentGig,
    conditionProfile
  } = contextState
  const { addToast, setLastGigStats, endGig, t } = contextActions

  const mountedRef = useRef(false)
  const currentStatusRef = useRef<GigAudioStatus>('idle')
  const hasResolvedLowHarmonyRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const stageReadyRef = useRef(false)
  const stageFailedRef = useRef(false)
  const stageWaiterRef = useRef<(() => void) | null>(null)
  const latestContextRef = useRef({
    band,
    gameMap,
    player,
    setlist,
    gigModifiers,
    currentGig,
    conditionProfile,
    addToast,
    setLastGigStats,
    endGig,
    t,
    setInitStatus,
    setAudioStatus,
    setIsGameOver,
    setFailureKind
  })

  useEffect(() => {
    latestContextRef.current = {
      band,
      gameMap,
      player,
      setlist,
      gigModifiers,
      currentGig,
      conditionProfile,
      addToast,
      setLastGigStats,
      endGig,
      t,
      setInitStatus,
      setAudioStatus,
      setIsGameOver,
      setFailureKind
    }
  }, [
    band,
    gameMap,
    player,
    setlist,
    gigModifiers,
    currentGig,
    conditionProfile,
    addToast,
    setLastGigStats,
    endGig,
    t,
    setInitStatus,
    setAudioStatus,
    setIsGameOver,
    setFailureKind
  ])

  /** Writes the gig init status; the reducer derives `audioStatus` and `failureKind` from it. */
  const updateInitStatus = useCallback((status: GigInitStatus) => {
    latestContextRef.current.setInitStatus(status)
  }, [])

  const onStageReady = useCallback(() => {
    stageReadyRef.current = true
    stageWaiterRef.current?.()
  }, [])

  // A failed stage can never draw: show 'failed' (retry or quit overlay) at
  // once, even while the audio unlock is still pending, and release the wait
  // so the in-flight init keeps 'failed' instead of starting the song. If the
  // readiness fallback already started the song, stop it. An ended gig (lost,
  // or results submitted ahead of the completion transition) is left alone.
  const onStageInitError = useCallback(() => {
    stageFailedRef.current = true
    stageWaiterRef.current?.()
    const status = currentStatusRef.current
    const { isGameOver, hasSubmittedResults } = gameStateRef.current
    if (
      (status !== 'initializing' && status !== 'ready') ||
      isGameOver ||
      hasSubmittedResults
    ) {
      return
    }
    invalidateSongSequence(gameStateRef)
    currentStatusRef.current = 'failed'
    updateInitStatus({ status: 'failed', failureKind: 'stage' })
    if (status === 'ready') {
      logger.error('RhythmGame', 'Gig stage failed after the song started.')
      audioEngine.stopAudio()
    }
  }, [audioEngine, gameStateRef, updateInitStatus])

  /**
   * Resolves once the stage has signalled ready or failed, the init was
   * aborted, or {@link STAGE_READY_FALLBACK_MS} passed without a signal.
   */
  const waitForStageReady = useCallback(
    (signal: AbortSignal) =>
      new Promise<void>(resolve => {
        if (stageReadyRef.current || stageFailedRef.current || signal.aborted) {
          resolve()
          return
        }
        const finish = () => {
          clearTimeout(timer)
          signal.removeEventListener('abort', finish)
          if (stageWaiterRef.current === finish) stageWaiterRef.current = null
          resolve()
        }
        const timer = setTimeout(() => {
          logger.warn(
            'RhythmGame',
            'Gig stage not ready in time; starting audio without it.'
          )
          finish()
        }, STAGE_READY_FALLBACK_MS)
        signal.addEventListener('abort', finish)
        stageWaiterRef.current = finish
      }),
    []
  )

  /**
   * Initializes gig physics and note data once per gig.
   */
  const initializeGigState = useCallback(
    async (isRetry = false) => {
      // Prevent concurrent initialization
      if (
        !mountedRef.current ||
        currentStatusRef.current === 'initializing' ||
        currentStatusRef.current === 'ready'
      ) {
        return
      }
      const ctx = latestContextRef.current
      const {
        band: currentBand,
        gameMap: currentGameMap,
        player: currentPlayer,
        setlist: currentSetlist,
        gigModifiers: currentGigModifiers,
        currentGig: activeGig,
        conditionProfile: currentConditionProfile,
        addToast: currentAddToast,
        setLastGigStats: currentSetLastGigStats,
        endGig: currentEndGig,
        t: currentT,
        setInitStatus: currentSetInitStatus,
        setIsGameOver: setGameOver
      } = ctx

      currentStatusRef.current = 'initializing'
      const controller = new AbortController()
      abortControllerRef.current = controller
      const { signal } = controller
      const isAborted = () =>
        signal.aborted || abortControllerRef.current !== controller
      const hasRetryEnded = () =>
        isRetry &&
        (gameStateRef.current.hasSubmittedResults ||
          gameStateRef.current.isGameOver)
      const failForStage = () => {
        logger.error('RhythmGame', 'Gig stage failed to initialize.')
        currentStatusRef.current = 'failed'
        updateInitStatus({ status: 'failed', failureKind: 'stage' })
      }

      try {
        // Mute ambient radio to prevent audio overlap
        audioEngine.stopMusic()

        const currentHarmony = clampBandHarmony(currentBand?.harmony)

        // Harmony Guard
        const isBandCollapsed = handleHarmonyGuard({
          currentHarmony,
          hasResolvedLowHarmonyRef,
          currentStatusRef,
          gameStateRef,
          setGameOver,
          setInitStatus: currentSetInitStatus,
          currentT,
          currentAddToast,
          currentSetLastGigStats,
          currentEndGig
        })

        if (isBandCollapsed) {
          return
        }

        const audioUnlocked = await audioEngine.ensureAudioContext()

        if (isAborted() || hasRetryEnded()) {
          return
        }

        // A stage failure during the unlock already showed 'failed'; keep it
        // rather than reporting 'blocked' or mounting a stage wait.
        if (stageFailedRef.current) {
          failForStage()
          return
        }

        if (!audioUnlocked) {
          logger.warn(
            'RhythmGame',
            'Audio Context blocked. Waiting for user gesture.'
          )
          currentStatusRef.current = 'blocked'
          updateInitStatus({ status: 'blocked' })
          return
        }

        // Reset cross-song tracking state for a new gig
        resetGigStateTracking(gameStateRef)

        const physicsSuccess = applyGigPhysicsSetup({
          currentBand,
          currentGigModifiers,
          currentConditionProfile,
          activeGig,
          currentGameMap,
          currentPlayer,
          currentSetlist,
          gameStateRef
        })

        if (!physicsSuccess) {
          currentStatusRef.current = 'failed'
          updateInitStatus({ status: 'failed', failureKind: 'audio' })
          return
        }

        const activeSetlist = resolveActiveSetlist(currentSetlist)

        // The song clock must not run before the stage can draw it: a late first
        // frame would auto-miss notes that were never shown. 'initializing' also
        // lifts the blocked overlay on a retry so the stage can mount.
        if (!stageReadyRef.current && !isAborted()) {
          updateInitStatus({ status: 'initializing' })
          await waitForStageReady(signal)
        }

        if (hasRetryEnded()) {
          return
        }

        if (isAborted()) {
          currentStatusRef.current = 'idle'
          updateInitStatus({ status: 'idle' })
          return
        }

        if (stageFailedRef.current) {
          failForStage()
          return
        }

        updateInitStatus({ status: 'ready' })
        currentStatusRef.current = 'ready'
        gameStateRef.current.onPlaybackError = error => {
          if (currentStatusRef.current !== 'ready') return
          invalidateSongSequence(gameStateRef)
          currentStatusRef.current = 'failed'
          updateInitStatus({ status: 'failed', failureKind: 'audio' })
          audioEngine.stopAudio()
          handleError(error, {
            addToast: latestContextRef.current.addToast,
            fallbackMessage: latestContextRef.current.t(
              'ui:gig.errors.nextSongFailed',
              {
                defaultValue: 'Failed to start next song!'
              }
            )
          })
        }
        await audioEngine.playSongSequence(
          0,
          activeSetlist,
          gameStateRef,
          currentAddToast,
          currentT
        )
      } catch (error) {
        if (isAborted() || hasRetryEnded()) {
          return
        }

        const translated = currentT('ui:gig.errors.initFailed', {
          defaultValue: 'Gig initialization failed!'
        })
        const toastMessage =
          typeof translated === 'string'
            ? translated
            : 'Gig initialization failed!'
        // handleError toasts the translated fallback and only logs error.message.
        handleError(error, {
          addToast: currentAddToast,
          fallbackMessage: toastMessage
        })
        currentStatusRef.current = 'failed'
        const failureKind = stageFailedRef.current ? 'stage' : 'audio'
        updateInitStatus({ status: 'failed', failureKind })
      } finally {
        if (abortControllerRef.current === controller) {
          if (currentStatusRef.current !== 'ready' || isAborted()) {
            audioEngine.stopAudio()
          }
        }
      }
    },
    [audioEngine, gameStateRef, updateInitStatus, waitForStageReady]
  )

  useEffect(() => {
    mountedRef.current = true
    initializeGigState()

    return () => {
      mountedRef.current = false
      const controller = abortControllerRef.current
      if (controller) {
        controller.abort()
      }
      if (abortControllerRef.current === controller) {
        currentStatusRef.current = 'idle'
        audioEngine.stopAudio()
      }
    }
  }, [audioEngine, initializeGigState])

  const retryAudioInitialization = useCallback(async () => {
    if (
      !mountedRef.current ||
      gameStateRef.current.hasSubmittedResults ||
      gameStateRef.current.isGameOver
    ) {
      logger.debug(
        'RhythmGame',
        'Skipping audio retry after unmount or gig completion.'
      )
      return
    }
    if (currentStatusRef.current !== 'initializing') {
      const { gigIntroFired, gigMidFired, lastGigEventSongIndex } =
        gameStateRef.current
      resetGameplayState()
      Object.assign(gameStateRef.current, {
        gigIntroFired,
        gigMidFired,
        lastGigEventSongIndex
      })
      hasResolvedLowHarmonyRef.current = false
      currentStatusRef.current = 'idle'
      // Retries come from the blocked/failed overlay, which replaced the
      // stage; wait for the remounted stage's own signal.
      stageReadyRef.current = false
      stageFailedRef.current = false
      updateInitStatus({ status: 'idle' })
    }
    await initializeGigState(true)
  }, [gameStateRef, initializeGigState, resetGameplayState, updateInitStatus])

  return { retryAudioInitialization, onStageReady, onStageInitError }
}
