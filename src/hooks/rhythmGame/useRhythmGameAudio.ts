import { useCallback, useRef, useEffect } from 'react'
import type { TFunction } from 'i18next'
import {
  setupGigPhysics,
  resolveActiveSetlist,
  resetGigStateTracking
} from '../../utils/audio/audioEngine'
import { useAudioEngine } from '../../context/AudioEngineContext'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { clampBandHarmony } from '../../utils/gameState'
import { buildGigStatsSnapshot } from '../../utils/gigStats'
import type { GameMap, GameState, GigModifiers, PlayerState } from '../../types'
import type {
  RhythmGameRefState,
  RhythmLane,
  RhythmSetlistEntry,
  SetLastGigStats
} from '../../types/rhythmGame'
import type { GigAudioStatus } from '../../types/gigAudioStatus'
import type { ExpeditionConditionPerformanceProfile } from '../../types/expedition'

import type { RhythmStateSetters } from './useRhythmGameState'
import type { OptionalToastCallback } from '../../types/callbacks'

type RhythmGameAudioParams = {
  gameStateRef: { current: RhythmGameRefState }
  setters: Pick<RhythmStateSetters, 'setAudioStatus' | 'setIsGameOver'>
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
  setAudioStatus: (status: GigAudioStatus) => void
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
  setAudioStatus,
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
      setAudioStatus('ready')

      const message = currentT('ui:gig.toasts.bandCollapsed', {
        defaultValue: 'BAND COLLAPSED'
      })
      currentAddToast(
        typeof message === 'string' ? message : 'BAND COLLAPSED',
        'error'
      )

      currentSetLastGigStats(
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
      currentEndGig()
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
  setters,
  contextState,
  contextActions
}: RhythmGameAudioParams): RhythmGameAudioReturn => {
  const audioEngine = useAudioEngine()
  const { setAudioStatus, setIsGameOver } = setters
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

  const currentStatusRef = useRef<GigAudioStatus>('idle')
  const hasResolvedLowHarmonyRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const stageReadyRef = useRef(false)
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
    setAudioStatus,
    setIsGameOver
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
      setAudioStatus,
      setIsGameOver
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
    setAudioStatus,
    setIsGameOver
  ])

  const onStageReady = useCallback(() => {
    stageReadyRef.current = true
    stageWaiterRef.current?.()
  }, [])

  /**
   * Resolves once the stage has signalled ready, the init was aborted, or
   * {@link STAGE_READY_FALLBACK_MS} passed without a signal.
   */
  const waitForStageReady = useCallback(
    (signal: AbortSignal) =>
      new Promise<void>(resolve => {
        if (stageReadyRef.current || signal.aborted) {
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
  const initializeGigState = useCallback(async () => {
    // Prevent concurrent initialization
    if (
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
      setAudioStatus,
      setIsGameOver: setGameOver
    } = ctx

    currentStatusRef.current = 'initializing'
    const controller = new AbortController()
    abortControllerRef.current = controller
    const { signal } = controller
    const isAborted = () =>
      signal.aborted || abortControllerRef.current !== controller

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
        setAudioStatus,
        currentT,
        currentAddToast,
        currentSetLastGigStats,
        currentEndGig
      })

      if (isBandCollapsed) {
        return
      }

      const audioUnlocked = await audioEngine.ensureAudioContext()

      if (isAborted()) {
        return
      }

      if (!audioUnlocked) {
        logger.warn(
          'RhythmGame',
          'Audio Context blocked. Waiting for user gesture.'
        )
        currentStatusRef.current = 'blocked'
        setAudioStatus('blocked')
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
        setAudioStatus('failed')
        currentStatusRef.current = 'failed'
        return
      }

      const activeSetlist = resolveActiveSetlist(currentSetlist)

      // The song clock must not run before the stage can draw it: a late first
      // frame would auto-miss notes that were never shown. 'initializing' also
      // lifts the blocked overlay on a retry so the stage can mount.
      if (!stageReadyRef.current && !isAborted()) {
        setAudioStatus('initializing')
        await waitForStageReady(signal)
      }

      if (isAborted()) {
        currentStatusRef.current = 'idle'
        setAudioStatus('idle')
        return
      }

      setAudioStatus('ready')
      currentStatusRef.current = 'ready'
      await audioEngine.playSongSequence(
        0,
        activeSetlist,
        gameStateRef,
        currentAddToast,
        currentT
      )
    } catch (error) {
      if (isAborted()) {
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
      setAudioStatus('failed')
    } finally {
      if (abortControllerRef.current === controller) {
        if (currentStatusRef.current !== 'ready' || isAborted()) {
          audioEngine.stopAudio()
        }
      }
    }
  }, [audioEngine, gameStateRef, waitForStageReady])

  useEffect(() => {
    initializeGigState()

    return () => {
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
    if (currentStatusRef.current !== 'initializing') {
      currentStatusRef.current = 'idle'
      // Retries come from the blocked/failed overlay, which replaced the
      // stage; wait for the remounted stage's own signal.
      stageReadyRef.current = false
    }
    await initializeGigState()
  }, [initializeGigState])

  return { retryAudioInitialization, onStageReady }
}
