import { useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAudioEngine } from '../../context/AudioEngineContext'
import { clampUnit } from '../../utils/numberUtils'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { resolveLaneHitWindow } from '../../utils/rhythmGameScoringUtils'
import type {
  RhythmGameRefState,
  SetLastGigStats
} from '../../types/rhythmGame'
import type { RhythmStateSetters } from './useRhythmGameState'
import { useHandleMiss } from './scoring/useHandleMiss'
import { useHandleHit } from './scoring/useHandleHit'
import type { OptionalToastCallback } from '../../types/callbacks'

type RhythmPerformance = {
  crowdDecay?: number
  guitarDifficulty?: number
  drumMultiplier?: number
  /** Hit-window bonus fraction from band effects (0.15 = +15% window). */
  tempo?: number
  /** Chance (0-1) that a hit scores double points. */
  critChance?: number
  /** Fractional reduction of crowd decay from band effects (0-1). */
  crowdControl?: number
  comboBonusMultiplier?: number
  timingWindowMultiplier?: number
  missPenaltyMultiplier?: number
}

type RhythmGameScoringParams = {
  gameStateRef: { current: RhythmGameRefState }
  setters: Pick<
    RhythmStateSetters,
    | 'setScore'
    | 'setCombo'
    | 'setHealth'
    | 'setOverload'
    | 'setIsToxicMode'
    | 'setIsGameOver'
    | 'setAccuracy'
    | 'setCorruptionLevel'
    | 'setIsCorruptionBurstActive'
    | 'setCorruptionBurstEndTime'
    | 'setCorruptionState'
  >
  performance: RhythmPerformance
  contextActions: {
    addToast: OptionalToastCallback
    setLastGigStats: SetLastGigStats
    endGig: () => void
  }
}

/**
 * Scoring controls and timers exposed by the rhythm game scoring hook.
 */
type RhythmGameScoringReturn = {
  handleHit: (laneIndex: number) => boolean
  handleMiss: (count?: number, isEmptyHit?: boolean) => void
  /** Effective hit window of a lane; the loop expires notes against it. */
  getLaneHitWindow: (laneIndex: number) => number
  activateToxicMode: () => void
  gameOverTimerRef: { current: ReturnType<typeof setTimeout> | null }
}

/**
 * Handles scoring logic including hits, misses, toxic mode, and game over.
 *
 * @param params - Rhythm state ref, UI setters, performance stats, and context actions for scoring.
 * - `params.gameStateRef` - Reference to the mutable game state.
 * - `params.setters` - React state setters from useRhythmGameState.
 * - `params.performance` - Band performance stats (modifiers).
 * - `params.contextActions` - Game action callbacks (addToast, setLastGigStats, endGig).
 * @returns Scoring actions plus the game-over timer ref owned by this hook.
 */
export const useRhythmGameScoring = ({
  gameStateRef,
  setters,
  performance,
  contextActions
}: RhythmGameScoringParams): RhythmGameScoringReturn => {
  const { t } = useTranslation('ui')
  const audioEngine = useAudioEngine()
  const { setIsToxicMode } = setters
  const { addToast } = contextActions

  // Extract primitives from performance to stabilise callback dependency arrays
  const crowdControl = clampUnit(performance?.crowdControl ?? 0)
  const baseCrowdDecay = (performance?.crowdDecay ?? 1.0) * (1 - crowdControl)
  const guitarDifficulty = performance?.guitarDifficulty ?? 1.0
  const drumMultiplier = performance?.drumMultiplier ?? 1.0
  const tempoBonus = Math.max(0, performance?.tempo ?? 0)
  const critChance = clampUnit(performance?.critChance ?? 0)
  const comboBonusMultiplier = Math.max(
    0,
    finiteNumberOr(performance?.comboBonusMultiplier, 1)
  )
  const timingWindowMultiplier = Math.max(
    0,
    finiteNumberOr(performance?.timingWindowMultiplier, 1)
  )
  const missPenaltyMultiplier = Math.max(
    0,
    finiteNumberOr(performance?.missPenaltyMultiplier, 1)
  )

  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup game over timer on unmount
  useEffect(() => {
    return () => {
      if (gameOverTimerRef.current) {
        clearTimeout(gameOverTimerRef.current)
        gameOverTimerRef.current = null
      }
    }
  }, [])

  /**
   * Triggers toxic mode and schedules its end.
   */
  const activateToxicMode = useCallback(() => {
    setIsToxicMode(true)
    gameStateRef.current.isToxicMode = true
    gameStateRef.current.toxicModeEndTime = audioEngine.getGigTimeMs() + 10000
    addToast(t('ui:gig.toasts.toxicOverload', 'TOXIC OVERLOAD!'), 'success')
  }, [addToast, audioEngine, gameStateRef, setIsToxicMode, t])

  const handleMiss = useHandleMiss({
    gameStateRef,
    setters,
    contextActions,
    baseCrowdDecay,
    missPenaltyMultiplier,
    gameOverTimerRef
  })

  const handleHit = useHandleHit({
    gameStateRef,
    setters,
    performance: {
      guitarDifficulty,
      drumMultiplier,
      tempoBonus,
      critChance,
      comboBonusMultiplier,
      timingWindowMultiplier
    },
    activateToxicMode,
    handleMiss
  })

  // Natural song completion can arrive while the frame ticker is suspended
  // (background tab); the sequencer calls this so due notes still cost health
  // and count against accuracy before the chart is replaced or finalized.
  useEffect(() => {
    const state = gameStateRef.current
    state.settleUnhitNotes = () => {
      let missCount = 0
      for (let i = state.nextMissCheckIndex; i < state.notes.length; i++) {
        const note = state.notes[i]
        if (note && note.visible && !note.hit) {
          note.visible = false
          missCount++
        }
      }
      state.nextMissCheckIndex = state.notes.length
      if (missCount > 0) handleMiss(missCount, false)
    }
    return () => {
      delete state.settleUnhitNotes
    }
  }, [gameStateRef, handleMiss])

  const getLaneHitWindow = useCallback(
    (laneIndex: number): number => {
      const lane = gameStateRef.current.lanes[laneIndex]
      return lane
        ? resolveLaneHitWindow(lane.hitWindow, laneIndex, {
            tempoBonus,
            timingWindowMultiplier,
            guitarDifficulty
          })
        : 0
    },
    [gameStateRef, tempoBonus, timingWindowMultiplier, guitarDifficulty]
  )

  return {
    handleHit,
    handleMiss,
    getLaneHitWindow,
    activateToxicMode,
    gameOverTimerRef // Exposed for cleanup if needed
  }
}
