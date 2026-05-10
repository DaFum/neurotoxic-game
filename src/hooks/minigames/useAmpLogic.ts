import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameState } from '../../context/GameState'
import { GAME_PHASES } from '../../context/gameConstants'
import { getSafeRandom } from '../../utils/crypto'

const MINIGAME_DURATION = 15
const FALLBACK_ADVANCE_DELAY_MS = 10_000

export function useAmpLogic() {
  const { completeAmpCalibration, changeScene } = useGameState()

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
  const isHijackActiveRef = useRef(false)
  const hijacksOverriddenRef = useRef(0)

  // Neurotoxic Signal Jamming
  const [interference, setInterference] = useState(0)
  const interferenceRef = useRef(0)
  const purgesUsedRef = useRef(0)

  const isCompleteRef = useRef(false)
  const accumulatedScoreRef = useRef(0)
  const accumulatedMsRef = useRef(0)
  const dialValueRef = useRef(dialValue)
  const targetValueRef = useRef(targetValue)
  const timeLeftRef = useRef(timeLeft)
  const heatRef = useRef(heat)
  const isOverdriveActiveRef = useRef(isOverdriveActive)
  const isOverheatRef = useRef(isOverheat)
  const voidResonanceRef = useRef(voidResonance)
  const isAnomalyActiveRef = useRef(isAnomalyActive)
  const gameStateRef = useRef(null)

  useEffect(() => {
    isHijackActiveRef.current = isHijackActive
  }, [isHijackActive])

  useEffect(() => {
    dialValueRef.current = dialValue
  }, [dialValue])

  useEffect(() => {
    targetValueRef.current = targetValue
  }, [targetValue])

  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  useEffect(() => {
    heatRef.current = heat
  }, [heat])

  useEffect(() => {
    isOverdriveActiveRef.current = isOverdriveActive
  }, [isOverdriveActive])

  useEffect(() => {
    isOverheatRef.current = isOverheat
  }, [isOverheat])

  useEffect(() => {
    voidResonanceRef.current = voidResonance
  }, [voidResonance])

  useEffect(() => {
    isAnomalyActiveRef.current = isAnomalyActive
  }, [isAnomalyActive])

  const finishCalledRef = useRef(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const overrideHijack = useCallback(() => {
    if (isHijackActiveRef.current) {
      isHijackActiveRef.current = false
      setIsHijackActive(false)
      hijacksOverriddenRef.current += 1
      setHijacksOverridden(prev => prev + 1)
    }
  }, [])

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
  }, [completeAmpCalibration])

  const handleComplete = useCallback(() => {
    if (isCompleteRef.current) return

    finishMinigame()
  }, [finishMinigame])

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

  const purgeInterference = useCallback(() => {
    setInterference(0)
    interferenceRef.current = 0
    purgesUsedRef.current += 1
  }, [])

  // Function called by PixiStage component to get latest state for rendering
  const update = useCallback(
    deltaMS => {
      if (isCompleteRef.current || !Number.isFinite(deltaMS) || deltaMS <= 0)
        return

      const deltaSec = deltaMS / 1000
      const nextTimeLeft = timeLeftRef.current - deltaSec
      if (nextTimeLeft <= 0) {
        timeLeftRef.current = 0
        setTimeLeft(0)
        handleComplete()
        return
      }
      timeLeftRef.current = nextTimeLeft
      setTimeLeft(nextTimeLeft)

      // Overdrive & Heat Logic
      let currentHeat = heatRef.current
      let currentIsOverheat = isOverheatRef.current
      const currentOverdriveActive = isOverdriveActiveRef.current

      if (currentIsOverheat) {
        // Cooldown mode: disable overdrive automatically
        if (currentOverdriveActive) {
          setIsOverdriveActive(false)
        }
        currentHeat -= 25 * deltaSec // Cool down quickly when overheated
        if (currentHeat <= 0) {
          currentHeat = 0
          currentIsOverheat = false
          setIsOverheat(false)
        }
        setHeat(currentHeat)
      } else {
        if (currentOverdriveActive) {
          currentHeat += 35 * deltaSec // Heats up in ~3 seconds
          if (currentHeat >= 100) {
            currentHeat = 100
            currentIsOverheat = true
            setIsOverheat(true)
            setIsOverdriveActive(false) // Force off
          }
        } else {
          currentHeat = Math.max(0, currentHeat - 15 * deltaSec) // Normal cooldown
        }
        setHeat(currentHeat)
      }

      // Void Anomaly Logic
      if (
        currentOverdriveActive &&
        !currentIsOverheat &&
        !isAnomalyActiveRef.current
      ) {
        // 2% chance per 100ms to spawn an anomaly during overdrive
        if (
          getSafeRandom() < Math.max(0, Math.min(1, 0.02 * (deltaMS / 100)))
        ) {
          isAnomalyActiveRef.current = true
          setIsAnomalyActive(true)
          // Force an extreme target frequency
          setTargetValue(getSafeRandom() > 0.5 ? 950 : 50)
        }
      } else if (
        isAnomalyActiveRef.current &&
        (!currentOverdriveActive || currentIsOverheat)
      ) {
        // Anomaly ends if overdrive is disabled or overheat happens
        isAnomalyActiveRef.current = false
        setIsAnomalyActive(false)
      }

      // Approximately 5% chance per 100ms
      let chance = 0.05
      let shiftSize = 200
      if (currentIsOverheat) {
        chance = 0.2 // Higher chance when overheated
        shiftSize = 400
      }

      if (
        !isAnomalyActiveRef.current &&
        getSafeRandom() < Math.max(0, Math.min(1, chance * (deltaMS / 100)))
      ) {
        const shift = (getSafeRandom() - 0.5) * shiftSize
        setTargetValue(prev => Math.max(0, Math.min(1000, prev + shift)))
      }

      // Kranker Schrank Hijack Logic
      const clampedHijackProbability = Math.max(
        0,
        Math.min(1, 0.02 * (deltaMS / 100))
      )
      if (
        !isHijackActiveRef.current &&
        getSafeRandom() < clampedHijackProbability
      ) {
        isHijackActiveRef.current = true
        setIsHijackActive(true)
      }

      // Neurotoxic interference buildup (kept in ref to avoid frame-by-frame React renders)
      interferenceRef.current = Math.min(
        100,
        interferenceRef.current + (deltaMS / 1000) * 5
      )

      // Time-driven tick for score accumulation
      const diff = Math.abs(dialValueRef.current - targetValueRef.current)
      let currentScore = Math.max(0, 100 - diff / 10) // Max difference 1000 = 0 score

      if (currentOverdriveActive && !currentIsOverheat) {
        currentScore *= 1.5 // 50% bonus score for overdrive
      } else if (currentIsOverheat) {
        currentScore *= 0.5 // Penalty while overheated
      }

      if (isHijackActiveRef.current) {
        currentScore *= 0.2 // Huge penalty during active hijack
      }

      accumulatedScoreRef.current += currentScore * deltaMS
      accumulatedMsRef.current += deltaMS

      setScore(
        accumulatedScoreRef.current / Math.max(1, accumulatedMsRef.current)
      )

      if (isAnomalyActiveRef.current) {
        // If dialed in perfectly during anomaly, rapidly gain resonance
        if (diff < 30) {
          const nextResonance = Math.min(
            100,
            voidResonanceRef.current + 20 * deltaSec
          )
          voidResonanceRef.current = nextResonance
          setVoidResonance(nextResonance)

          if (nextResonance >= 100) {
            isAnomalyActiveRef.current = false
            setIsAnomalyActive(false)
          }
        }
      }
    },
    [handleComplete]
  )

  // Sync high-frequency refs to React state less frequently to avoid render thrashing
  useEffect(() => {
    if (isGameOver) return
    const syncInterval = setInterval(() => {
      setInterference(interferenceRef.current)
    }, 100) // 10fps UI update for interference is plenty
    return () => clearInterval(syncInterval)
  }, [isGameOver])

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
    voidResonance
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
