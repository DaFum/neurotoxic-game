import { useCallback, useRef, useEffect } from 'react'
import { audioManager } from '../../utils/AudioManager'
import { stopAudio } from '../../utils/audioEngine'
import { handleError } from '../../utils/errorHandler'
import { logger } from '../../utils/logger'
import { clampBandHarmony } from '../../utils/gameStateUtils.js'
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

    try {
      // Mute ambient radio to prevent audio overlap
      audioManager.stopMusic()

      const currentHarmony = clampBandHarmony(band?.harmony)

      // Harmony Guard
      if (currentHarmony <= 1) {
        logger.warn('RhythmGame', 'Band harmony too low to start gig.')
        setIsAudioReady(false)
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
        setIsAudioReady(false)
        return
      }
      setIsAudioReady(true)
      hasInitializedRef.current = true

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
        return
      }

      if (!isAborted()) {
        await playSongSequence(0, activeSetlist, gameStateRef, addToast, t)
      }
    } catch (error) {
      if (isAborted()) {
        return
      }

      handleError(error, {
        addToast,
        fallbackMessage: 'Gig initialization failed!'
      })
      setIsAudioReady(false)
      hasInitializedRef.current = false
    } finally {
      isInitializingRef.current = false
    }
  }, [
    band?.members?.length,
    band?.harmony,
    gameMap?.nodes ? Object.keys(gameMap.nodes).length : 0,
    player?.currentNodeId,
    setlist?.length,
    currentGig?.songId,
    // Stringify gigModifiers to ensure referential stability
    JSON.stringify(gigModifiers),
    addToast,
    t,
    gameStateRef,
    setIsAudioReady
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
