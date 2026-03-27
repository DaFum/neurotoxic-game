import { useCallback, useRef, useEffect } from 'react'
import { audioManager } from '../../utils/AudioManager'
import { stopAudio } from '../../utils/audioEngine'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import {
  setupGigPhysics,
  resolveActiveSetlist,
  playSongSequence,
  resetGigStateTracking
} from '../../utils/rhythmGameAudioUtils.js'

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
}) => {
  const { setIsAudioReady } = setters
  const { band, gameMap, player, setlist, gigModifiers, currentGig } =
    contextState
  const { addToast, t } = contextActions

  const hasInitializedRef = useRef(false)
  const isInitializingRef = useRef(false)
  const abortControllerRef = useRef(null)

  /**
   * Initializes gig physics and note data once per gig.
   */
  const initializeGigState = useCallback(async () => {
    // Prevent double initialization
    if (hasInitializedRef.current || isInitializingRef.current) {
      return
    }
    isInitializingRef.current = true
    const controller = new AbortController()
    abortControllerRef.current = controller
    const { signal } = controller
    const isAborted = () =>
      signal.aborted || abortControllerRef.current !== controller

    // Mute ambient radio to prevent audio overlap
    audioManager.stopMusic()

    // Harmony Guard
    if (band.harmony <= 0) {
      logger.warn('RhythmGame', 'Band harmony too low to start gig.')
      setIsAudioReady(false)
      isInitializingRef.current = false
      return
    }

    try {
      const audioUnlocked = await audioManager.ensureAudioContext()

      if (isAborted()) {
        isInitializingRef.current = false
        return
      }

      if (!audioUnlocked) {
        logger.warn(
          'RhythmGame',
          'Audio Context blocked. Waiting for user gesture.'
        )
        setIsAudioReady(false)
        isInitializingRef.current = false
        return
      }
      setIsAudioReady(true)
      hasInitializedRef.current = true
      isInitializingRef.current = false

      // Reset cross-song tracking state for a new gig
      resetGigStateTracking(gameStateRef)

      const setlistFirstId =
        typeof setlist?.[0] === 'string' ? setlist[0] : setlist?.[0]?.id

      const physicsSetup = setupGigPhysics(
        band,
        gigModifiers,
        currentGig?.songId,
        gameMap,
        player.currentNodeId,
        setlistFirstId
      )
      if (!physicsSetup) {
        hasInitializedRef.current = false
        isInitializingRef.current = false
        return
      }

      gameStateRef.current.modifiers = physicsSetup.mergedModifiers
      gameStateRef.current.speed = physicsSetup.speed
      gameStateRef.current.lanes[0].hitWindow = physicsSetup.hitWindows[0]
      gameStateRef.current.lanes[1].hitWindow = physicsSetup.hitWindows[1]
      gameStateRef.current.lanes[2].hitWindow = physicsSetup.hitWindows[2]

      const activeSetlist = resolveActiveSetlist(setlist)

      if (isAborted()) {
        setIsAudioReady(false)
        isInitializingRef.current = false
        return
      }

      if (!isAborted()) {
        await playSongSequence(0, activeSetlist, gameStateRef, addToast, t)
      }
    } catch (error) {
      if (isAborted()) {
        isInitializingRef.current = false
        return
      }

      handleError(error, {
        addToast,
        fallbackMessage: 'Gig initialization failed!'
      })
      setIsAudioReady(false)
      isInitializingRef.current = false
      hasInitializedRef.current = false
    }
  }, [
    band,
    gameMap,
    player.currentNodeId,
    setlist,
    gigModifiers,
    addToast,
    t,
    gameStateRef,
    setIsAudioReady,
    currentGig?.songId
  ])

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
