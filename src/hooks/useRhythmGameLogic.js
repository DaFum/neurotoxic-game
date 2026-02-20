import { useGameState } from '../context/GameState'
import { useRhythmGameState } from './rhythmGame/useRhythmGameState'
import { useRhythmGameScoring } from './rhythmGame/useRhythmGameScoring'
import { useRhythmGameAudio } from './rhythmGame/useRhythmGameAudio'
import { useRhythmGameLoop } from './rhythmGame/useRhythmGameLoop'
import { useRhythmGameInput } from './rhythmGame/useRhythmGameInput'

/**
 * Provides rhythm game state, actions, and update loop for the gig scene.
 * @param {void} _unused - Hook has no direct parameters; state comes from GameState.
 * @returns {{gameStateRef: object, stats: object, actions: object, update: Function}} Rhythm game API.
 */
export const useRhythmGameLogic = () => {
  const {
    setlist,
    band,
    activeEvent,
    hasUpgrade,
    setLastGigStats,
    addToast,
    gameMap,
    player,
    changeScene,
    gigModifiers
  } = useGameState()

  // 1. Core State (React + Ref)
  const { gameStateRef, state, setters } = useRhythmGameState()

  // 2. Scoring Logic (Hits, Misses, Toxic Mode)
  const scoringActions = useRhythmGameScoring({
    gameStateRef,
    setters,
    performance: band.performance, // Injected for dynamic stats
    contextActions: { addToast, changeScene, hasUpgrade, setLastGigStats }
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
    contextActions: { setLastGigStats, changeScene }
  })

  // 5. Input Handling
  const { registerInput } = useRhythmGameInput({
    gameStateRef,
    scoringActions,
    contextState: { activeEvent }
  })

  return {
    gameStateRef,
    stats: {
      score: state.score,
      combo: state.combo,
      health: state.health,
      progress: gameStateRef.current.progress,
      overload: state.overload,
      isToxicMode: state.isToxicMode,
      isGameOver: state.isGameOver,
      isAudioReady: state.isAudioReady
    },
    actions: { registerInput, activateToxicMode, retryAudioInitialization },
    update
  }
}
