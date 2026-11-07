import { useState, useRef, useEffect, useCallback } from 'react'
import type { SetStateAction } from 'react'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import {
  buildAmpResult,
  buildAmpUiSnapshot,
  createAmpSimulation,
  isSameAmpUiSnapshot,
  buildAmpStageSnapshot,
  stepAmpSimulation
} from './ampLogicUtils'
import type { AmpSimulation } from './ampLogicUtils'
import type { AmpStageOptions } from '../../types/components'

const FALLBACK_ADVANCE_DELAY_MS = 10_000

function useAmpTimer(isGameOver: boolean, onContinue: () => void) {
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isGameOver || fallbackTimeoutRef.current) return

    fallbackTimeoutRef.current = setTimeout(() => {
      fallbackTimeoutRef.current = null
      onContinue()
    }, FALLBACK_ADVANCE_DELAY_MS)

    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }
    }
  }, [isGameOver, onContinue])
}

const resolveAction = <T>(action: SetStateAction<T>, prev: T): T =>
  typeof action === 'function' ? (action as (prev: T) => T)(prev) : action

/**
 * Owns amp calibration minigame state, update loop entry point, and completion dispatch.
 *
 * All gameplay state lives in one mutable {@link AmpSimulation}. Inputs and
 * frame ticks mutate it, then `publish()` writes the Pixi stage snapshot and
 * the React snapshot from it synchronously.
 *
 * @param options - Optional result/continuation owner for embedded field repairs.
 * @returns Amp calibration state, controls, high-frequency update callback, and stage ref.
 */
export function useAmpLogic({
  onResult,
  onContinue
}: {
  onResult?: (score: number) => void
  onContinue?: () => void
} = {}) {
  const { completeAmpCalibration, changeScene } = useGameActions()
  const continueMinigame = useCallback(() => {
    if (onContinue) onContinue()
    else if (!onResult) changeScene(GAME_PHASES.GIG)
  }, [onContinue, onResult, changeScene])

  // Lazy one-time creation keeps the mount-time target roll to one RNG call.
  const [sim] = useState<AmpSimulation>(createAmpSimulation)
  const [ui, setUi] = useState(() => buildAmpUiSnapshot(sim))
  const gameStateRef = useRef<AmpStageOptions>(buildAmpStageSnapshot(sim))

  const publish = useCallback(() => {
    gameStateRef.current = buildAmpStageSnapshot(sim)
    const next = buildAmpUiSnapshot(sim)
    setUi(prev => (isSameAmpUiSnapshot(prev, next) ? prev : next))
  }, [sim])

  useAmpTimer(ui.isGameOver, continueMinigame)

  const setDialValue = useCallback(
    (action: SetStateAction<number>) => {
      sim.dialValue = resolveAction(action, sim.dialValue)
      publish()
    },
    [sim, publish]
  )

  const setIsOverdriveActive = useCallback(
    (action: SetStateAction<boolean>) => {
      sim.isOverdriveActive = resolveAction(action, sim.isOverdriveActive)
      publish()
    },
    [sim, publish]
  )

  const overrideHijack = useCallback(() => {
    if (!sim.isHijackActive) return
    sim.isHijackActive = false
    sim.hijacksOverridden += 1
    publish()
  }, [sim, publish])

  const dampenFeedback = useCallback(() => {
    if (!sim.isFeedbackLoopActive) return
    sim.isFeedbackLoopActive = false
    sim.feedbackLoopsDampened += 1
    publish()
  }, [sim, publish])

  const purgeInterference = useCallback(() => {
    sim.interference = 0
    sim.purgesUsed += 1
    publish()
  }, [sim, publish])

  const finishMinigame = useCallback(() => {
    if (sim.isComplete) return
    sim.isComplete = true
    publish()

    const result = buildAmpResult(sim)
    if (onResult) {
      onResult(result.score)
    } else {
      completeAmpCalibration(
        result.score,
        result.voidResonance,
        result.purgesUsed,
        result.hijacksOverridden,
        result.feedbackLoopsDampened
      )
    }
  }, [sim, publish, completeAmpCalibration, onResult])

  // Called by PixiStage before the stage controller renders each frame.
  const update = useCallback(
    (deltaMS: number) => {
      const outcome = stepAmpSimulation(sim, deltaMS)
      if (outcome === 'expired') finishMinigame()
      else if (outcome === 'advanced') publish()
    },
    [sim, publish, finishMinigame]
  )

  return {
    dialValue: ui.dialValue,
    setDialValue,
    targetValue: ui.targetValue,
    timeLeft: ui.timeLeft,
    score: ui.score,
    isGameOver: ui.isGameOver,
    update,
    finishMinigame,
    gameStateRef,
    isOverdriveActive: ui.isOverdriveActive,
    setIsOverdriveActive,
    heat: ui.heat,
    isOverheat: ui.isOverheat,
    voidResonance: ui.voidResonance,
    isAnomalyActive: ui.isAnomalyActive,
    interference: ui.interference,
    purgeInterference,
    isHijackActive: ui.isHijackActive,
    hijacksOverridden: ui.hijacksOverridden,
    overrideHijack,
    isFeedbackLoopActive: ui.isFeedbackLoopActive,
    dampenFeedback,
    feedbackLoopsDampened: ui.feedbackLoopsDampened
  }
}
