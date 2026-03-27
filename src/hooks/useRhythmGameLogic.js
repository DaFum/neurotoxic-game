import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState.jsx'
import { stopAudio } from '../utils/audioEngine'
import { useRhythmGameState } from './rhythmGame/useRhythmGameState'
import { useRhythmGameScoring } from './rhythmGame/useRhythmGameScoring'
import { useRhythmGameAudio } from './rhythmGame/useRhythmGameAudio'
import { useRhythmGameLoop } from './rhythmGame/useRhythmGameLoop'
import { useRhythmGameInput } from './rhythmGame/useRhythmGameInput'

/**
 * Pure function to build the rhythm game stats snapshot.
 */
export const buildRhythmGameStats = state => ({
  score: state.score,
  combo: state.combo,
  health: state.health,
  overload: state.overload,
  isToxicMode: state.isToxicMode,
  isGameOver: state.isGameOver,
  isAudioReady: state.isAudioReady,
  accuracy: state.accuracy
})

/**
 * Pure function to build the rhythm game actions map.
 */
export const buildRhythmGameActions = (
  registerInput,
  activateToxicMode,
  retryAudioInitialization
) => ({
  registerInput,
  activateToxicMode,
  retryAudioInitialization
})

/**
 * Pure function to handle rhythm game cleanup.
 */
export const cleanupRhythmGame = gameStateRef => {
  const currentState = gameStateRef.current
  if (currentState) {
    currentState.isGameOver = true
  }
  stopAudio()
}

/**
 * Provides rhythm game state, actions, and update loop for the gig scene.
 * @returns {{gameStateRef: object, stats: object, actions: object, update: Function}} Rhythm game API.
 */
export const useRhythmGameLogic = () => {
  const { t } = useTranslation()
  const {
    setlist,
    band,
    activeEvent,
    setLastGigStats,
    addToast,
    gameMap,
    player,
    changeScene,
    gigModifiers,
    currentGig,
    endGig
  } = useGameState()

  // 1. Core State (React + Ref)
  const { gameStateRef, state, setters } = useRhythmGameState()

  // 2. Scoring Logic (Hits, Misses, Toxic Mode)
  const scoringActions = useRhythmGameScoring({
    gameStateRef,
    setters,
    performance: band.performance, // Injected for dynamic stats
    contextActions: { addToast, setLastGigStats, endGig }
  })
  const { activateToxicMode } = scoringActions

  // 3. Audio & Initialization
  const { retryAudioInitialization } = useRhythmGameAudio({
    gameStateRef,
    setters,
    contextState: {
      band,
      gameMap,
      player,
      setlist,
      gigModifiers,
      currentGig
    },
    contextActions: { addToast, t }
  })

  // 4. Game Loop (Update)
  const { update } = useRhythmGameLoop({
    gameStateRef,
    scoringActions,
    setters,
    state,
    contextState: { activeEvent },
    contextActions: {
      setLastGigStats,
      endGig,
      changeScene
    }
  })

  // 5. Input Handling
  const { registerInput } = useRhythmGameInput({
    gameStateRef,
    scoringActions,
    contextState: { activeEvent }
  })

  // Cleanup hook to prevent memory leaks and sync audio state on unmount
  useEffect(() => {
    return () => cleanupRhythmGame(gameStateRef)
  }, [gameStateRef])

  const stats = useMemo(
    () => buildRhythmGameStats(state),
    [
      state.score,
      state.combo,
      state.health,
      state.overload,
      state.isToxicMode,
      state.isGameOver,
      state.isAudioReady,
      state.accuracy
    ]
  )

  const actions = useMemo(
    () =>
      buildRhythmGameActions(
        registerInput,
        activateToxicMode,
        retryAudioInitialization
      ),
    [registerInput, activateToxicMode, retryAudioInitialization]
  )

  return useMemo(
    () => ({
      gameStateRef,
      stats,
      actions,
      update
    }),
    [gameStateRef, stats, actions, update]
  )
}
