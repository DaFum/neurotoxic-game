import { useMemo, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { MapNode } from '../types/map'
import { useGameActions, useGameSelector } from '../context/GameState.tsx'
import { useAudioEngine } from '../context/AudioEngineContext'
import { maybeFireGigProgressEvent } from '../utils/rhythmGameLoopUtils'
import { finiteNumberOr } from '../utils/finiteNumber'
import { bandHasTrait } from '../utils/traitUtils'
import {
  applyExpeditionGearPerformanceDelta,
  getExpeditionCommittedGearProfile
} from '../domain/expedition/equipment'
import { getExpeditionConditionPerformanceProfile } from '../domain/expedition/condition'
import { useRhythmGameState } from './rhythmGame/useRhythmGameState'
import { useRhythmGameScoring } from './rhythmGame/useRhythmGameScoring'
import { useRhythmGameAudio } from './rhythmGame/useRhythmGameAudio'
import { useRhythmGameLoop } from './rhythmGame/useRhythmGameLoop'
import { useRhythmGameInput } from './rhythmGame/useRhythmGameInput'
import type { RhythmGameRefState } from '../types/rhythmGame'
import type { RhythmUiState } from './rhythmGame/useRhythmGameState'
/**
 * Public rhythm game stats shape exposed to the gig scene.
 */
export type RhythmGameStats = RhythmUiState

type RhythmGameLogicActions = {
  registerInput: (laneIndex: number, isDown: boolean) => void
  activateToxicMode: () => void
  retryAudioInitialization: () => Promise<void>
}

/**
 * Runtime API returned by the rhythm game orchestration hook.
 */
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
  const audioEngine = useAudioEngine()
  const { t } = useTranslation()
  const setlist = useGameSelector(state => state.setlist)
  const band = useGameSelector(state => state.band)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const gigEventScoreDelta = useGameSelector(state =>
    finiteNumberOr(state.gigEventScoreDelta, 0)
  )
  const gameMap = useGameSelector(state => state.gameMap)
  const player = useGameSelector(state => state.player)
  const gigModifiers = useGameSelector(state => state.gigModifiers)
  const currentGig = useGameSelector(state => state.currentGig)
  const rivalBand = useGameSelector(state => state.rivalBand)
  // Only an *active* Expedition neutralizes unselected owned gear. Career play
  // keeps the existing global purchase behavior, so this stays null outside a
  // run and the scoring path below is unchanged there.
  const expeditionGearDelta = useGameSelector(state =>
    state.expedition.status === 'active'
      ? getExpeditionCommittedGearProfile(state).performanceDelta
      : null
  )
  // Technical Condition only exists inside a run, so this stays null in Career
  // play and the rhythm owners fall back to their neutral multipliers.
  const conditionProfile = useGameSelector(state =>
    state.expedition.status === 'active'
      ? getExpeditionConditionPerformanceProfile(
          state.expedition.technicalCondition
        )
      : null
  )
  const { setLastGigStats, addToast, endGig, triggerEvent } = useGameActions()

  // 1. Core State (React + Ref)
  const { gameStateRef, state, setters } = useRhythmGameState()
  const appliedEventScoreDeltaRef = useRef(0)

  useEffect(() => {
    const scoreDelta = gigEventScoreDelta - appliedEventScoreDeltaRef.current
    appliedEventScoreDeltaRef.current = gigEventScoreDelta
    if (scoreDelta === 0) return

    const nextScore = Math.max(
      0,
      finiteNumberOr(gameStateRef.current.score, 0) + scoreDelta
    )
    gameStateRef.current.score = nextScore
    setters.setScore(nextScore)
  }, [gameStateRef, gigEventScoreDelta, setters])

  // Memoize venue to node mapping to avoid O(N) lookup on every effect run
  const venueIdToNodeIdMap = useMemo(() => {
    const map = new Map<string, string>()
    if (!gameMap?.nodes) return map

    // ⚡ BOLT OPTIMIZATION: Replaced Object.values() with for...in loop.
    // Why: Avoids creating a temporary intermediate array of all nodes in a frequently called React useMemo hook.
    // Impact: Reduces garbage collection pressure in the rhythm game component mounting path.
    for (const key in gameMap.nodes) {
      if (!Object.hasOwn(gameMap.nodes, key)) continue
      const node = gameMap.nodes[key] as MapNode | undefined
      if (!node) continue
      if (node.venueId && node.id) {
        map.set(node.venueId, node.id)
      } else if (node.venue?.id && node.id) {
        // Fallback for some potential older map formats
        map.set(node.venue.id, node.id)
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

  // Fold temporary band effects (contraband/equipment) into the static
  // performance values the scoring hook consumes.
  const scoringPerformance = useMemo(() => {
    const hasNeuroOverclock = bandHasTrait(band, 'neuro_overclock')
    const baseTempo = finiteNumberOr(band?.tempo, 0)
    const finalTempo = hasNeuroOverclock ? baseTempo + 0.5 : baseTempo

    const resolved = {
      ...band?.performance,
      tempo: finalTempo,
      critChance: finiteNumberOr(band?.crit, 0),
      crowdControl: finiteNumberOr(band?.crowdControl, 0)
    }

    // During an Expedition only the committed gear contributes: the delta
    // subtracts every owned catalog contribution and re-adds the selected ones,
    // leaving contraband and trait effects intact.
    return expeditionGearDelta
      ? applyExpeditionGearPerformanceDelta(resolved, expeditionGearDelta)
      : resolved
  }, [band, expeditionGearDelta])

  // 2. Scoring Logic (Hits, Misses, Toxic Mode)
  const scoringActions = useRhythmGameScoring({
    gameStateRef,
    setters,
    performance: scoringPerformance, // Injected for dynamic stats
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
      currentGig,
      conditionProfile
    },
    contextActions: { addToast, setLastGigStats, endGig, t }
  })

  // 4. Game Loop (Update)
  const { update: rawUpdate } = useRhythmGameLoop({
    gameStateRef,
    scoringActions,
    setters,
    contextState: { activeEvent },
    contextActions: {
      setLastGigStats,
      endGig
    }
  })

  // Fire the in-gig narrative events off gig progress, which is kept on the ref
  // (not React state) for perf. `gig_intro` fires once the gig is underway and
  // `gig_mid` at the halfway mark; the rhythm loop pauses audio while the
  // resulting event modal is open (see processRhythmGameTick). The ref guards
  // keep each event to at most one firing per gig and at most one event per
  // setlist song (see maybeFireGigProgressEvent).
  const update = useCallback(
    (deltaMS: number) => {
      rawUpdate(deltaMS)
      const ref = gameStateRef.current
      if (!ref || activeEvent) return
      maybeFireGigProgressEvent(ref, triggerEvent)
    },
    [rawUpdate, gameStateRef, activeEvent, triggerEvent]
  )

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
      audioEngine.stopAudio()
    }
  }, [audioEngine, gameStateRef])

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
