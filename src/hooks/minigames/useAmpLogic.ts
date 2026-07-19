import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { getSafeRandom } from '../../utils/crypto'
import { updateAmpGameState } from './ampLogicUtils'
import type { AmpStageOptions } from '../../types/components'
import type { GamePhase } from '../../types/game'

const MINIGAME_DURATION = 15
const FALLBACK_ADVANCE_DELAY_MS = 10_000

function useAmpState() {
  const [dialValue, setDialValue] = useState(500)
  const [targetValue, setTargetValue] = useState(
    () => Math.floor(getSafeRandom() * 800) + 100
  )
  const [timeLeft, setTimeLeft] = useState(MINIGAME_DURATION)
  const [score, setScore] = useState(100)
  const [isGameOver, setIsGameOver] = useState(false)

  // Overdrive & Heat
  const [isOverdriveActive, setIsOverdriveActive] = useState(false)
  const [heat, setHeat] = useState(0) // 0 to 100
  const [isOverheat, setIsOverheat] = useState(false)

  // Void Anomaly
  const [voidResonance, setVoidResonance] = useState(0)
  const [isAnomalyActive, setIsAnomalyActive] = useState(false)

  // Kranker Schrank Signal Hijack
  const [isHijackActive, setIsHijackActive] = useState(false)
  const [hijacksOverridden, setHijacksOverridden] = useState(0)

  // Neurotoxic Signal Jamming
  const [interference, setInterference] = useState(0)

  return {
    dialValue,
    setDialValue,
    targetValue,
    setTargetValue,
    timeLeft,
    setTimeLeft,
    score,
    setScore,
    isGameOver,
    setIsGameOver,
    isOverdriveActive,
    setIsOverdriveActive,
    heat,
    setHeat,
    isOverheat,
    setIsOverheat,
    voidResonance,
    setVoidResonance,
    isAnomalyActive,
    setIsAnomalyActive,
    isHijackActive,
    setIsHijackActive,
    hijacksOverridden,
    setHijacksOverridden,
    interference,
    setInterference
  }
}
function useAmpTimer(
  timeLeft: number,
  isGameOver: boolean,
  changeScene: (scene: GamePhase) => void
) {
  const timeLeftRef = useRef(timeLeft)

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isGameOver || fallbackTimeoutRef.current) return

    fallbackTimeoutRef.current = setTimeout(() => {
      fallbackTimeoutRef.current = null
      changeScene(GAME_PHASES.GIG)
    }, FALLBACK_ADVANCE_DELAY_MS)

    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
        fallbackTimeoutRef.current = null
      }
    }
  }, [isGameOver, changeScene])

  return { timeLeftRef }
}

function useAmpGameLoop(
  dialValue: number,
  targetValue: number,
  heat: number,
  isOverdriveActive: boolean,
  isOverheat: boolean,
  voidResonance: number,
  isAnomalyActive: boolean
) {
  const isCompleteRef = useRef(false)
  const accumulatedScoreRef = useRef(0)
  const accumulatedMsRef = useRef(0)
  const dialValueRef = useRef(dialValue)
  const targetValueRef = useRef(targetValue)
  const heatRef = useRef(heat)
  const isOverdriveActiveRef = useRef(isOverdriveActive)
  const isOverheatRef = useRef(isOverheat)
  const voidResonanceRef = useRef(voidResonance)
  const isAnomalyActiveRef = useRef(isAnomalyActive)

  useEffect(() => {
    dialValueRef.current = dialValue
    targetValueRef.current = targetValue
    heatRef.current = heat
    isOverdriveActiveRef.current = isOverdriveActive
    isOverheatRef.current = isOverheat
    voidResonanceRef.current = voidResonance
    isAnomalyActiveRef.current = isAnomalyActive
  }, [
    dialValue,
    targetValue,
    heat,
    isOverdriveActive,
    isOverheat,
    voidResonance,
    isAnomalyActive
  ])

  return {
    isCompleteRef,
    accumulatedScoreRef,
    accumulatedMsRef,
    dialValueRef,
    targetValueRef,
    heatRef,
    isOverdriveActiveRef,
    isOverheatRef,
    voidResonanceRef,
    isAnomalyActiveRef
  }
}

function useAmpHazards(
  isHijackActive: boolean,
  setIsHijackActive: (value: boolean | ((prev: boolean) => boolean)) => void,
  setHijacksOverridden: (value: number | ((prev: number) => number)) => void,
  isGameOver: boolean,
  setInterference: (value: number | ((prev: number) => number)) => void
) {
  const isHijackActiveRef = useRef(isHijackActive)
  const hijacksOverriddenRef = useRef(0)
  const interferenceRef = useRef(0)
  const purgesUsedRef = useRef(0)

  useEffect(() => {
    isHijackActiveRef.current = isHijackActive
  }, [isHijackActive])

  const overrideHijack = useCallback(() => {
    if (isHijackActiveRef.current) {
      isHijackActiveRef.current = false
      setIsHijackActive(false)
      hijacksOverriddenRef.current += 1
      setHijacksOverridden(prev => prev + 1)
    }
  }, [setIsHijackActive, setHijacksOverridden])

  const purgeInterference = useCallback(() => {
    setInterference(0)
    interferenceRef.current = 0
    purgesUsedRef.current += 1
  }, [setInterference])

  useEffect(() => {
    if (isGameOver) return
    const syncInterval = setInterval(() => {
      setInterference(interferenceRef.current)
    }, 100)
    return () => clearInterval(syncInterval)
  }, [isGameOver, setInterference])

  return {
    isHijackActiveRef,
    hijacksOverriddenRef,
    interferenceRef,
    purgesUsedRef,
    overrideHijack,
    purgeInterference
  }
}

/**
 * Owns amp calibration minigame state, update loop entry point, and completion dispatch.
 *
 * @returns Amp calibration state, controls, high-frequency update callback, and stage ref.
 */
export function useAmpLogic() {
  const { completeAmpCalibration, changeScene } = useGameActions()

  const ampState = useAmpState()
  const {
    dialValue,
    targetValue,
    timeLeft,
    score,
    isGameOver,
    isOverdriveActive,
    heat,
    isOverheat,
    voidResonance,
    isAnomalyActive,
    isHijackActive,
    hijacksOverridden,
    interference
  } = ampState
  const {
    setDialValue,
    setTargetValue,
    setTimeLeft,
    setScore,
    setIsGameOver,
    setIsOverdriveActive,
    setHeat,
    setIsOverheat,
    setVoidResonance,
    setIsAnomalyActive,
    setIsHijackActive,
    setHijacksOverridden,
    setInterference
  } = ampState

  const { timeLeftRef } = useAmpTimer(timeLeft, isGameOver, changeScene)

  const {
    isHijackActiveRef,
    hijacksOverriddenRef,
    interferenceRef,
    purgesUsedRef,
    overrideHijack,
    purgeInterference
  } = useAmpHazards(
    isHijackActive,
    setIsHijackActive,
    setHijacksOverridden,
    isGameOver,
    setInterference
  )

  const {
    isCompleteRef,
    accumulatedScoreRef,
    accumulatedMsRef,
    dialValueRef,
    targetValueRef,
    heatRef,
    isOverdriveActiveRef,
    isOverheatRef,
    voidResonanceRef,
    isAnomalyActiveRef
  } = useAmpGameLoop(
    dialValue,
    targetValue,
    heat,
    isOverdriveActive,
    isOverheat,
    voidResonance,
    isAnomalyActive
  )

  const gameStateRef = useRef<AmpStageOptions>({
    dialValue,
    targetValue,
    isOverdriveActive,
    isOverheat,
    heat,
    isAnomalyActive,
    voidResonance,
    interference,
    isHijackActive,
    hijacksOverridden
  })

  const finishCalledRef = useRef(false)

  const finishMinigame = useCallback(() => {
    if (finishCalledRef.current) return
    finishCalledRef.current = true
    isCompleteRef.current = true
    setIsGameOver(true)

    const finalScore =
      accumulatedScoreRef.current / Math.max(1, accumulatedMsRef.current)
    completeAmpCalibration(
      finalScore,
      voidResonanceRef.current,
      purgesUsedRef.current,
      hijacksOverriddenRef.current
    )
  }, [
    completeAmpCalibration,
    setIsGameOver,
    isCompleteRef,
    accumulatedScoreRef,
    accumulatedMsRef,
    voidResonanceRef,
    purgesUsedRef,
    hijacksOverriddenRef
  ])

  const handleComplete = useCallback(() => {
    if (isCompleteRef.current) return

    finishMinigame()
  }, [finishMinigame, isCompleteRef])

  // Function called by PixiStage component to get latest state for rendering
  const update = useCallback(
    (deltaMS: number) => {
      updateAmpGameState(
        deltaMS,
        {
          isCompleteRef,
          timeLeftRef,
          heatRef,
          isOverheatRef,
          isOverdriveActiveRef,
          isAnomalyActiveRef,
          isHijackActiveRef,
          interferenceRef,
          dialValueRef,
          targetValueRef,
          accumulatedScoreRef,
          accumulatedMsRef,
          voidResonanceRef
        },
        {
          setTimeLeft,
          handleComplete,
          setIsOverdriveActive,
          setIsOverheat,
          setHeat,
          setIsAnomalyActive,
          setTargetValue,
          setIsHijackActive,
          setScore,
          setVoidResonance
        }
      )
    },
    [
      handleComplete,
      setTimeLeft,
      setIsOverdriveActive,
      setIsOverheat,
      setHeat,
      setIsAnomalyActive,
      setTargetValue,
      setIsHijackActive,
      setScore,
      setVoidResonance,
      timeLeftRef,
      isHijackActiveRef,
      interferenceRef,
      isCompleteRef,
      heatRef,
      isOverheatRef,
      isOverdriveActiveRef,
      isAnomalyActiveRef,
      dialValueRef,
      targetValueRef,
      accumulatedScoreRef,
      accumulatedMsRef,
      voidResonanceRef
    ]
  )

  // Keep gameStateRef up to date for Stage Controller
  useEffect(() => {
    gameStateRef.current = {
      dialValue,
      targetValue,
      isOverdriveActive,
      isOverheat,
      heat,
      isAnomalyActive,
      voidResonance,
      interference: interferenceRef.current,
      isHijackActive,
      hijacksOverridden
    }
  }, [
    interference,
    isHijackActive,
    hijacksOverridden,
    dialValue,
    targetValue,
    isOverdriveActive,
    isOverheat,
    heat,
    isAnomalyActive,
    voidResonance,
    interferenceRef
  ])

  return {
    dialValue,
    setDialValue,
    targetValue,
    timeLeft,
    score,
    isGameOver,
    update,
    finishMinigame,
    gameStateRef,
    isOverdriveActive,
    setIsOverdriveActive,
    heat,
    isOverheat,
    voidResonance,
    isAnomalyActive,
    interference,
    purgeInterference,
    isHijackActive,
    hijacksOverridden,
    overrideHijack
  }
}
