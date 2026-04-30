import { useCallback, useRef, useEffect } from 'react'
import type { TFunction } from 'i18next'
import { audioManager } from '../../utils/audio/AudioManager'
import { stopAudio } from '../../utils/audio/audioEngine'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { clampBandHarmony } from '../../utils/gameStateUtils'
import { buildGigStatsSnapshot } from '../../utils/gigStats'
import {
  setupGigPhysics,
  resolveActiveSetlist,
  playSongSequence,
  resetGigStateTracking
} from '../../utils/audio/rhythmGameAudioUtils'
import type {
  GameMap,
  GameState,
  GigModifiers,
  PlayerState
} from '../../types/game'
import type {
  RhythmGameRefState,
  RhythmSetlistEntry,
  SetLastGigStats
} from '../../types/rhythmGame'
import type { RhythmStateSetters } from './useRhythmGameState'

type RhythmGameAudioParams = {
  gameStateRef: { current: RhythmGameRefState }
  setters: Pick<RhythmStateSetters, 'setIsAudioReady' | 'setIsGameOver'>
  contextState: {
    band: GameState['band']
    gameMap: GameMap | null
    player: PlayerState
    setlist: RhythmSetlistEntry[]
    gigModifiers: GigModifiers
    currentGig: GameState['currentGig']
  }
  contextActions: {
    addToast: (message: string, type?: string) => void
    setLastGigStats: SetLastGigStats
    endGig: () => void
    t: TFunction
  }
}

export type RhythmGameAudioReturn = {
  retryAudioInitialization: () => Promise<void>
}

/**
 * Manages audio initialization, playback, and setup for the gig.
 *
 * @param {Object} params - Hook parameters.
 * @param {Object} params.gameStateRef - Game state reference.
 * @param {Object} params.setters - Setters (setIsAudioReady).
 * @param {Object} params.contextState - Context state (band, gameMap, player, setlist, gigModifiers, addToast).
 * @returns {Object} Audio actions ({ retryAudioInitialization }).
 */
export const useRhythmGameAudio = ({
  gameStateRef,
  setters,
  contextState,
  contextActions
}: RhythmGameAudioParams): RhythmGameAudioReturn => {
  const { setIsAudioReady, setIsGameOver } = setters
  const { band, gameMap, player, setlist, gigModifiers, currentGig } =
    contextState
  const { addToast, setLastGigStats, endGig, t } = contextActions

  const hasInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)
  const hasResolvedLowHarmonyRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const latestContextRef = useRef({
    band,
    gameMap,
    player,
    setlist,
    gigModifiers,
    currentGig,
    addToast,
    setLastGigStats,
    endGig,
    t,
    setIsAudioReady,
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
      addToast,
      setLastGigStats,
      endGig,
      t,
      setIsAudioReady,
      setIsGameOver
    }
  }, [
    band,
    gameMap,
    player,
    setlist,
    gigModifiers,
    currentGig,
    addToast,
    setLastGigStats,
    endGig,
    t,
    setIsAudioReady,
    setIsGameOver
  ])

  /**
   * Initializes gig physics and note data once per gig.
   */
  const initializeGigState = useCallback(async () => {
    // Prevent concurrent initialization
    if (isInitializingRef.current || hasInitializedRef.current) {
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
      addToast: currentAddToast,
      setLastGigStats: currentSetLastGigStats,
      endGig: currentEndGig,
      t: currentT,
      setIsAudioReady: setAudioReady,
      setIsGameOver: setGameOver
    } = ctx

    isInitializingRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller
    const { signal } = controller
    const isAborted = () =>
      signal.aborted || abortControllerRef.current !== controller

    try {
      // Mute ambient radio to prevent audio overlap
      audioManager.stopMusic()

      const currentHarmony = clampBandHarmony(currentBand?.harmony)

      // Harmony Guard
      if (currentHarmony <= 1) {
        logger.warn('RhythmGame', 'Band harmony too low to start gig.')
        if (!hasResolvedLowHarmonyRef.current) {
          hasResolvedLowHarmonyRef.current = true
          const currentRhythmState = gameStateRef.current
          currentRhythmState.isGameOver = true
          setGameOver(true)
          setAudioReady(true)

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
                peakHype: 0
              },
              0,
              []
            )
          )
          currentEndGig()
        }
        return
      }

      const audioUnlocked = await audioManager.ensureAudioContext()

      if (isAborted()) {
        return
      }

      if (!audioUnlocked) {
        logger.warn(
          'RhythmGame',
          'Audio Context blocked. Waiting for user gesture.'
        )
        setAudioReady(false)
        return
      }

      // Reset cross-song tracking state for a new gig
      resetGigStateTracking(gameStateRef)

      const setlistFirstId =
        typeof currentSetlist?.[0] === 'string'
          ? currentSetlist[0]
          : currentSetlist?.[0]?.id

      if (!currentGameMap?.nodes || !currentPlayer?.currentNodeId) {
        logger.error(
          'RhythmGame',
          'Missing gameMap nodes or current player node before gig physics setup'
        )
        if (hasInitializedRef.current) {
          setAudioReady(false)
        }
        hasInitializedRef.current = false
        return
      }

      const physicsSetup = setupGigPhysics(
        currentBand,
        currentGigModifiers,
        typeof activeGig?.songId === 'string' ? activeGig.songId : undefined,
        currentGameMap,
        currentPlayer?.currentNodeId,
        typeof setlistFirstId === 'string' ? setlistFirstId : undefined
      )
      if (!physicsSetup) {
        if (hasInitializedRef.current) {
          setAudioReady(false)
        }
        hasInitializedRef.current = false
        return
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
        setAudioReady(false)
        hasInitializedRef.current = false
        return
      }
      if (!Array.isArray(hitWindows) || hitWindows.length < 3) {
        logger.error(
          'RhythmGame',
          'Gig physics hit windows are not initialized correctly'
        )
        setAudioReady(false)
        hasInitializedRef.current = false
        return
      }
      const lane0 = lanes[0]
      const lane1 = lanes[1]
      const lane2 = lanes[2]
      const hitWindow0 = hitWindows[0]
      const hitWindow1 = hitWindows[1]
      const hitWindow2 = hitWindows[2]
      if (!lane0 || !lane1 || !lane2) {
        logger.error('RhythmGame', 'Rhythm game lane entries are missing')
        setAudioReady(false)
        hasInitializedRef.current = false
        return
      }
      if (
        typeof hitWindow0 !== 'number' ||
        !Number.isFinite(hitWindow0) ||
        typeof hitWindow1 !== 'number' ||
        !Number.isFinite(hitWindow1) ||
        typeof hitWindow2 !== 'number' ||
        !Number.isFinite(hitWindow2)
      ) {
        logger.error('RhythmGame', 'Gig physics hit window values are invalid')
        setAudioReady(false)
        hasInitializedRef.current = false
        return
      }
      lane0.hitWindow = hitWindow0
      lane1.hitWindow = hitWindow1
      lane2.hitWindow = hitWindow2

      const activeSetlist = resolveActiveSetlist(currentSetlist)

      if (isAborted()) {
        setAudioReady(false)
        return
      }

      if (!isAborted()) {
        setAudioReady(true)
        hasInitializedRef.current = true
        await playSongSequence(
          0,
          activeSetlist,
          gameStateRef,
          currentAddToast,
          currentT
        )
      }
    } catch (error) {
      if (isAborted()) {
        return
      }

      handleError(error, {
        addToast: currentAddToast,
        fallbackMessage: 'Gig initialization failed!'
      })
      setAudioReady(false)
      hasInitializedRef.current = false
    } finally {
      if (abortControllerRef.current === controller) {
        isInitializingRef.current = false
        if (!hasInitializedRef.current || isAborted()) {
          stopAudio()
        }
      }
    }
  }, [gameStateRef])

  useEffect(() => {
    initializeGigState()

    return () => {
      const controller = abortControllerRef.current
      if (controller) {
        controller.abort()
      }
      if (abortControllerRef.current === controller) {
        hasInitializedRef.current = false
        isInitializingRef.current = false
        stopAudio()
      }
    }
  }, [initializeGigState])

  const retryAudioInitialization = useCallback(async () => {
    if (!isInitializingRef.current) {
      hasInitializedRef.current = false
    }
    await initializeGigState()
  }, [initializeGigState])

  return { retryAudioInitialization }
}
