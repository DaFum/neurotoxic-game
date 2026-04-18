import { useCallback, useRef, useEffect } from 'react'
import type { TFunction } from 'i18next'
import { audioManager } from '../../utils/AudioManager'
import { stopAudio } from '../../utils/audioEngine'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { clampBandHarmony } from '../../utils/gameStateUtils'
import {
  setupGigPhysics,
  resolveActiveSetlist,
  playSongSequence,
  resetGigStateTracking
} from '../../utils/rhythmGameAudioUtils'
import type {
  GameMap,
  GameState,
  GigModifiers,
  PlayerState
} from '../../types/game'
import type { RhythmGameRefState } from '../../types/rhythmGame'
import type { RhythmStateSetters } from './useRhythmGameState'

type RhythmGameAudioParams = {
  gameStateRef: { current: RhythmGameRefState }
  setters: Pick<RhythmStateSetters, 'setIsAudioReady'>
  contextState: {
    band: GameState['band']
    gameMap: GameMap | null
    player: PlayerState
    setlist: Array<string | { id?: string }>
    gigModifiers: GigModifiers
    currentGig: GameState['currentGig']
  }
  contextActions: {
    addToast: (message: string, type?: string) => void
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
 * @returns {Object} Audio actions (initializeGigState, retryAudioInitialization).
 */
export const useRhythmGameAudio = ({
  gameStateRef,
  setters,
  contextState,
  contextActions
}: RhythmGameAudioParams): RhythmGameAudioReturn => {
  const { setIsAudioReady } = setters
  const { band, gameMap, player, setlist, gigModifiers, currentGig } =
    contextState
  const { addToast, t } = contextActions

  const hasInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const latestContextRef = useRef({
    band,
    gameMap,
    player,
    setlist,
    gigModifiers,
    currentGig,
    addToast,
    t,
    setIsAudioReady
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
      t,
      setIsAudioReady
    }
  }, [
    band,
    gameMap,
    player,
    setlist,
    gigModifiers,
    currentGig,
    addToast,
    t,
    setIsAudioReady
  ])

  /**
   * Initializes gig physics and note data once per gig.
   */
  const initializeGigState = useCallback(async () => {
    // Prevent double initialization
    if (hasInitializedRef.current || isInitializingRef.current) {
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
      t: currentT,
      setIsAudioReady: setAudioReady
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
        setAudioReady(false)
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
      setAudioReady(true)
      hasInitializedRef.current = true

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
        hasInitializedRef.current = false
        return
      }

      gameStateRef.current.modifiers = physicsSetup.mergedModifiers
      gameStateRef.current.speed = physicsSetup.speed
      gameStateRef.current.lanes[0].hitWindow = physicsSetup.hitWindows[0]
      gameStateRef.current.lanes[1].hitWindow = physicsSetup.hitWindows[1]
      gameStateRef.current.lanes[2].hitWindow = physicsSetup.hitWindows[2]

      const activeSetlist = resolveActiveSetlist(currentSetlist)

      if (isAborted()) {
        setAudioReady(false)
        return
      }

      if (!isAborted()) {
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
      isInitializingRef.current = false
      if (!hasInitializedRef.current || isAborted()) {
        stopAudio()
      }
    }
  }, [gameStateRef])

  useEffect(() => {
    initializeGigState()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      hasInitializedRef.current = false
      isInitializingRef.current = false
      stopAudio()
    }
  }, [initializeGigState])

  return {
    retryAudioInitialization: () => initializeGigState()
  }
}
