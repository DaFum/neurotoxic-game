import { useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getGigTimeMs } from '../../utils/audio/audioEngine'
import { clampUnit } from '../../utils/numberUtils'
import type {
  RhythmGameRefState,
  SetLastGigStats
} from '../../types/rhythmGame'
import type { RhythmStateSetters } from './useRhythmGameState'
import { useHandleMiss } from './scoring/useHandleMiss'
import { useHandleHit } from './scoring/useHandleHit'

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
    addToast: (message: string, type?: string) => void
    setLastGigStats: SetLastGigStats
    endGig: () => void
  }
}

/**
 * Scoring controls and timers exposed by the rhythm game scoring hook.
 */
export type RhythmGameScoringReturn = {
  handleHit: (laneIndex: number) => boolean
  handleMiss: (count?: number, isEmptyHit?: boolean) => void
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
  const { setIsToxicMode } = setters
  const { addToast } = contextActions

  // Extract primitives from performance to stabilise callback dependency arrays
  const crowdControl = clampUnit(performance?.crowdControl ?? 0)
  const baseCrowdDecay = (performance?.crowdDecay ?? 1.0) * (1 - crowdControl)
  const guitarDifficulty = performance?.guitarDifficulty ?? 1.0
  const drumMultiplier = performance?.drumMultiplier ?? 1.0
  const tempoBonus = Math.max(0, performance?.tempo ?? 0)
  const critChance = clampUnit(performance?.critChance ?? 0)

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
    gameStateRef.current.toxicModeEndTime = getGigTimeMs() + 10000
    addToast(t('ui:gig.toasts.toxicOverload', 'TOXIC OVERLOAD!'), 'success')
  }, [addToast, gameStateRef, setIsToxicMode, t])

  const handleMiss = useHandleMiss({
    gameStateRef,
    setters,
    contextActions,
    baseCrowdDecay,
    gameOverTimerRef
  })

  const handleHit = useHandleHit({
    gameStateRef,
    setters,
    performance: {
      guitarDifficulty,
      drumMultiplier,
      tempoBonus,
      critChance
    },
    activateToxicMode,
    handleMiss
  })

  return {
    handleHit,
    handleMiss,
    activateToxicMode,
    gameOverTimerRef // Exposed for cleanup if needed
  }
}
