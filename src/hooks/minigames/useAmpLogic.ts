import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameActions } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { getSafeRandom } from '../../utils/crypto'
import { clampAmpDial } from '../../utils/gameState'
import { clampUnit } from '../../utils/numberUtils'
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
/**
 * Mutable refs consumed by the high-frequency amp calibration update loop.
 */
export interface AmpGameRefs {
  isCompleteRef: { current: boolean }
  timeLeftRef: { current: number }
  heatRef: { current: number }
  isOverheatRef: { current: boolean }
  isOverdriveActiveRef: { current: boolean }
  isAnomalyActiveRef: { current: boolean }
  isHijackActiveRef: { current: boolean }
  interferenceRef: { current: number }
  dialValueRef: { current: number }
  targetValueRef: { current: number }
  accumulatedScoreRef: { current: number }
  accumulatedMsRef: { current: number }
  voidResonanceRef: { current: number }
}

/**
 * React state setters used by the amp calibration update loop.
 */
export interface AmpGameSetters {
  setTimeLeft: (value: number | ((prev: number) => number)) => void
  handleComplete: () => void
  setIsOverdriveActive: (value: boolean | ((prev: boolean) => boolean)) => void
  setIsOverheat: (value: boolean | ((prev: boolean) => boolean)) => void
  setHeat: (value: number | ((prev: number) => number)) => void
  setIsAnomalyActive: (value: boolean | ((prev: boolean) => boolean)) => void
  setTargetValue: (value: number | ((prev: number) => number)) => void
  setIsHijackActive: (value: boolean | ((prev: boolean) => boolean)) => void
  setScore: (value: number | ((prev: number) => number)) => void
  setVoidResonance: (value: number | ((prev: number) => number)) => void
}

/**
 * Decrements the round timer; on expiry triggers completion.
 * @returns True when the round just completed (caller should stop the frame).
 */
function advanceAmpTime(
  deltaSec: number,
  refs: AmpGameRefs,
  setters: AmpGameSetters
): boolean {
  const nextTimeLeft = refs.timeLeftRef.current - deltaSec
  if (nextTimeLeft <= 0) {
    refs.timeLeftRef.current = 0
    setters.setTimeLeft(0)
    setters.handleComplete()
    return true
  }
  refs.timeLeftRef.current = nextTimeLeft
  setters.setTimeLeft(nextTimeLeft)
  return false
}

/**
 * Applies overdrive heat buildup and overheat cooldown.
 * @returns The resulting overdrive/overheat snapshot for downstream phases.
 */
function applyAmpHeat(
  deltaSec: number,
  refs: AmpGameRefs,
  setters: AmpGameSetters
): { isOverheat: boolean; overdriveActive: boolean } {
  let currentHeat = refs.heatRef.current
  let currentIsOverheat = refs.isOverheatRef.current
  let currentOverdriveActive = refs.isOverdriveActiveRef.current

  if (currentIsOverheat) {
    // Cooldown mode: disable overdrive automatically
    if (currentOverdriveActive) {
      currentOverdriveActive = false
      refs.isOverdriveActiveRef.current = false
      setters.setIsOverdriveActive(false)
    }
    currentHeat -= 25 * deltaSec // Cool down quickly when overheated
    if (currentHeat <= 0) {
      currentHeat = 0
      currentIsOverheat = false
      refs.isOverheatRef.current = false
      setters.setIsOverheat(false)
    }
    refs.heatRef.current = currentHeat
    setters.setHeat(currentHeat)
  } else {
    if (currentOverdriveActive) {
      currentHeat += 35 * deltaSec // Heats up in ~3 seconds
      if (currentHeat >= 100) {
        currentHeat = 100
        currentIsOverheat = true
        refs.isOverheatRef.current = true
        setters.setIsOverheat(true)
        currentOverdriveActive = false
        refs.isOverdriveActiveRef.current = false
        setters.setIsOverdriveActive(false) // Force off
      }
    } else {
      currentHeat = Math.max(0, currentHeat - 15 * deltaSec) // Normal cooldown
    }
    refs.heatRef.current = currentHeat
    setters.setHeat(currentHeat)
  }

  return {
    isOverheat: currentIsOverheat,
    overdriveActive: currentOverdriveActive
  }
}

/**
 * Spawns or clears a void anomaly (forces an extreme target during overdrive).
 */
function applyAmpVoidAnomaly(
  deltaMS: number,
  overdriveActive: boolean,
  isOverheat: boolean,
  refs: AmpGameRefs,
  setters: AmpGameSetters
): void {
  if (overdriveActive && !isOverheat && !refs.isAnomalyActiveRef.current) {
    // 2% chance per 100ms to spawn an anomaly during overdrive
    if (getSafeRandom() < clampUnit(0.02 * (deltaMS / 100))) {
      refs.isAnomalyActiveRef.current = true
      setters.setIsAnomalyActive(true)
      // Force an extreme target frequency
      const nextTarget = getSafeRandom() > 0.5 ? 950 : 50
      refs.targetValueRef.current = nextTarget
      setters.setTargetValue(nextTarget)
    }
  } else if (
    refs.isAnomalyActiveRef.current &&
    (!overdriveActive || isOverheat)
  ) {
    // Anomaly ends if overdrive is disabled or overheat happens
    refs.isAnomalyActiveRef.current = false
    setters.setIsAnomalyActive(false)
  }
}

/**
 * Randomly drifts the target frequency (faster/larger while overheated).
 */
function applyAmpTargetDrift(
  deltaMS: number,
  isOverheat: boolean,
  refs: AmpGameRefs,
  setters: AmpGameSetters
): void {
  // Approximately 5% chance per 100ms
  let chance = 0.05
  let shiftSize = 200
  if (isOverheat) {
    chance = 0.2 // Higher chance when overheated
    shiftSize = 400
  }

  if (
    !refs.isAnomalyActiveRef.current &&
    getSafeRandom() < clampUnit(chance * (deltaMS / 100))
  ) {
    const shift = (getSafeRandom() - 0.5) * shiftSize
    const nextTarget = clampAmpDial(refs.targetValueRef.current + shift)
    refs.targetValueRef.current = nextTarget
    setters.setTargetValue(nextTarget)
  }
}

/**
 * Triggers a Kranker Schrank hijack with a small per-frame probability.
 */
function applyAmpHijack(
  deltaMS: number,
  refs: AmpGameRefs,
  setters: AmpGameSetters
): void {
  const clampedHijackProbability = clampUnit(0.02 * (deltaMS / 100))
  if (
    !refs.isHijackActiveRef.current &&
    getSafeRandom() < clampedHijackProbability
  ) {
    refs.isHijackActiveRef.current = true
    setters.setIsHijackActive(true)
  }
}

/**
 * Accumulates the time-weighted accuracy score with overdrive/overheat/hijack
 * modifiers.
 * @returns The dial-to-target difference, reused by the resonance phase.
 */
function accumulateAmpScore(
  deltaMS: number,
  overdriveActive: boolean,
  isOverheat: boolean,
  refs: AmpGameRefs,
  setters: AmpGameSetters
): number {
  const diff = Math.abs(refs.dialValueRef.current - refs.targetValueRef.current)
  let currentScore = Math.max(0, 100 - diff / 10) // Max difference 1000 = 0 score

  if (overdriveActive && !isOverheat) {
    currentScore *= 1.5 // 50% bonus score for overdrive
  } else if (isOverheat) {
    currentScore *= 0.5 // Penalty while overheated
  }

  if (refs.isHijackActiveRef.current) {
    currentScore *= 0.2 // Huge penalty during active hijack
  }

  refs.accumulatedScoreRef.current += currentScore * deltaMS
  refs.accumulatedMsRef.current += deltaMS

  setters.setScore(
    refs.accumulatedScoreRef.current /
      Math.max(1, refs.accumulatedMsRef.current)
  )

  return diff
}

/**
 * Builds void resonance while an active anomaly is dialed in; clears the
 * anomaly once resonance maxes out.
 */
function applyAmpResonance(
  deltaSec: number,
  diff: number,
  refs: AmpGameRefs,
  setters: AmpGameSetters
): void {
  // If dialed in perfectly during anomaly, rapidly gain resonance
  if (refs.isAnomalyActiveRef.current && diff < 30) {
    const nextResonance = Math.min(
      100,
      refs.voidResonanceRef.current + 20 * deltaSec
    )
    refs.voidResonanceRef.current = nextResonance
    setters.setVoidResonance(nextResonance)

    if (nextResonance >= 100) {
      refs.isAnomalyActiveRef.current = false
      setters.setIsAnomalyActive(false)
    }
  }
}

/**
 * Advances amp calibration simulation state for one frame.
 *
 * @param deltaMS - Milliseconds elapsed since the previous update.
 * @param refs - Mutable gameplay refs read and updated by the loop.
 * @param setters - React setters used to synchronize visible state.
 */
export function updateAmpGameState(
  deltaMS: number,
  refs: AmpGameRefs,
  setters: AmpGameSetters
) {
  if (refs.isCompleteRef.current || !Number.isFinite(deltaMS) || deltaMS <= 0) {
    return
  }

  const deltaSec = deltaMS / 1000

  if (advanceAmpTime(deltaSec, refs, setters)) return

  const { isOverheat, overdriveActive } = applyAmpHeat(deltaSec, refs, setters)
  applyAmpVoidAnomaly(deltaMS, overdriveActive, isOverheat, refs, setters)
  applyAmpTargetDrift(deltaMS, isOverheat, refs, setters)
  applyAmpHijack(deltaMS, refs, setters)

  // Neurotoxic interference buildup (kept in ref to avoid frame-by-frame React renders)
  refs.interferenceRef.current = Math.min(
    100,
    refs.interferenceRef.current + (deltaMS / 1000) * 5
  )

  const diff = accumulateAmpScore(
    deltaMS,
    overdriveActive,
    isOverheat,
    refs,
    setters
  )
  applyAmpResonance(deltaSec, diff, refs, setters)
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

  const {
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
  } = useAmpState()

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
