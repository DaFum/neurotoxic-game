import { useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { MapNode } from '../types/map'
import { useGameActions, useGameSelector } from '../context/GameState.tsx'
import { stopAudio } from '../utils/audio/audioEngine'
import { useRhythmGameState } from './rhythmGame/useRhythmGameState'
import { useRhythmGameScoring } from './rhythmGame/useRhythmGameScoring'
import { useRhythmGameAudio } from './rhythmGame/useRhythmGameAudio'
import { useRhythmGameLoop } from './rhythmGame/useRhythmGameLoop'
import { useRhythmGameInput } from './rhythmGame/useRhythmGameInput'
import type { RhythmGameRefState } from '../types/rhythmGame'
import type { RhythmUiState } from './rhythmGame/useRhythmGameState'
export type { RhythmUiState } from './rhythmGame/useRhythmGameState'
export type RhythmGameStats = RhythmUiState

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
 * @returns Rhythm game API.
 */
export const useRhythmGameLogic = (): RhythmGameLogicReturn => {
  const { t } = useTranslation()
  const setlist = useGameSelector(state => state.setlist)
  const band = useGameSelector(state => state.band)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const gameMap = useGameSelector(state => state.gameMap)
  const player = useGameSelector(state => state.player)
  const gigModifiers = useGameSelector(state => state.gigModifiers)
  const currentGig = useGameSelector(state => state.currentGig)
  const rivalBand = useGameSelector(state => state.rivalBand)
  const { setLastGigStats, addToast, endGig } = useGameActions()

  // 1. Core State (React + Ref)
  const { gameStateRef, state, setters } = useRhythmGameState()

  // Memoize venue to node mapping to avoid O(N) lookup on every effect run
  const venueIdToNodeIdMap = useMemo(() => {
    const map = new Map<string, string>()
    if (!gameMap?.nodes) return map

    for (const key in gameMap.nodes) {
      if (Object.hasOwn(gameMap.nodes, key)) {
        const node = gameMap.nodes[key] as MapNode
        if (node.venueId) {
          map.set(node.venueId, node.id)
        } else if (node.venue?.id) {
          // Fallback for some potential older map formats
          map.set(node.venue.id, node.id)
        }
      }
    }
    return map
  }, [gameMap?.nodes])

  // Set rival penalty directly in the ref for the scoring hook to access
  useEffect(() => {
    if (gameStateRef.current) {
      if (currentGig) {
        // Find the node corresponding to the venue to compare correctly against the rival map node
        const venueNodeId = venueIdToNodeIdMap.get(currentGig.id)
        gameStateRef.current.rivalPenaltyActive =
          !!rivalBand &&
          !!venueNodeId &&
          rivalBand.currentLocationId === venueNodeId
      } else {
        gameStateRef.current.rivalPenaltyActive = false
      }
    }
  }, [rivalBand, currentGig, venueIdToNodeIdMap, gameStateRef])

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
