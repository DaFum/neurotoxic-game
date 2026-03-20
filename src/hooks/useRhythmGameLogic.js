// TODO: Refactor logic to reduce cognitive complexity and improve testability
import { useMemo, useEffect } from 'react'
import { useGameState } from '../context/GameState.jsx'
import { stopAudio } from '../utils/audioEngine'
import { useRhythmGameState } from './rhythmGame/useRhythmGameState'
import { useRhythmGameScoring } from './rhythmGame/useRhythmGameScoring'
import { useRhythmGameAudio } from './rhythmGame/useRhythmGameAudio'
import { useRhythmGameLoop } from './rhythmGame/useRhythmGameLoop'
import { useRhythmGameInput } from './rhythmGame/useRhythmGameInput'

/**
 * Provides rhythm game state, actions, and update loop for the gig scene.
 * @returns {{gameStateRef: object, stats: object, actions: object, update: Function}} Rhythm game API.
 */
export const useRhythmGameLogic = () => {
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
      gigModifiers
    },
    contextActions: { addToast }
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
    const currentState = gameStateRef.current
    return () => {
      if (currentState) {
        currentState.isGameOver = true
      }
      stopAudio()
    }
  }, [gameStateRef])

  const stats = useMemo(
    () => ({
      score: state.score,
      combo: state.combo,
      health: state.health,
      overload: state.overload,
      isToxicMode: state.isToxicMode,
      isGameOver: state.isGameOver,
      isAudioReady: state.isAudioReady,
      accuracy: state.accuracy
    }),
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
    () => ({ registerInput, activateToxicMode, retryAudioInitialization }),
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
