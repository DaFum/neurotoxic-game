import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState.tsx'
import { stopAudio } from '../utils/audio/audioEngine'
import { useRhythmGameState } from './rhythmGame/useRhythmGameState'
import { useRhythmGameScoring } from './rhythmGame/useRhythmGameScoring'
import { useRhythmGameAudio } from './rhythmGame/useRhythmGameAudio'
import { useRhythmGameLoop } from './rhythmGame/useRhythmGameLoop'
import { useRhythmGameInput } from './rhythmGame/useRhythmGameInput'
import type { RhythmGameRefState } from '../types/rhythmGame'
import type { RhythmUiState } from './rhythmGame/useRhythmGameState'

type RhythmGameLogicActions = {
  registerInput: (laneIndex: number, isDown: boolean) => void
  activateToxicMode: () => void
  retryAudioInitialization: () => Promise<void>
}

export type RhythmGameLogicReturn = {
  gameStateRef: { current: RhythmGameRefState }
  stats: RhythmUiState
  actions: RhythmGameLogicActions
  update: (deltaMS: number) => void
}

/**
 * Provides rhythm game state, actions, and update loop for the gig scene.
 * @returns {{gameStateRef: object, stats: object, actions: object, update: Function}} Rhythm game API.
 */
export const useRhythmGameLogic = (): RhythmGameLogicReturn => {
  const { t } = useTranslation()
  const gameState = useGameState()
  const { setLastGigStats, addToast, endGig } = gameState
  const {
    setlist,
    band,
    activeEvent,
    gameMap,
    player,
    gigModifiers,
    currentGig
  } = gameState

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
    contextActions: { addToast, setLastGigStats, endGig, t }
  })

  // 4. Game Loop (Update)
  const { update } = useRhythmGameLoop({
    gameStateRef,
    scoringActions,
    setters,
    contextState: { activeEvent },
    contextActions: {
      setLastGigStats,
      endGig
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

  const stats = state

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
