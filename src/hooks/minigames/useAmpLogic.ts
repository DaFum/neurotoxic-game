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

  const isCompleteRef = useRef(false)
  const accumulatedScoreRef = useRef(0)
  const accumulatedMsRef = useRef(0)
  const dialValueRef = useRef(dialValue)
  const targetValueRef = useRef(targetValue)
  const timeLeftRef = useRef(timeLeft)
  const heatRef = useRef(heat)
  const isOverdriveActiveRef = useRef(isOverdriveActive)
  const isOverheatRef = useRef(isOverheat)
  const gameStateRef = useRef(null)

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

  const finishCalledRef = useRef(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finishMinigame = useCallback(() => {
    if (finishCalledRef.current) return
    finishCalledRef.current = true
    isCompleteRef.current = true
    setIsGameOver(true)

    const finalScore =
      accumulatedScoreRef.current / Math.max(1, accumulatedMsRef.current)
    completeAmpCalibration(finalScore)
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

      // Approximately 5% chance per 100ms
      let chance = 0.05
      let shiftSize = 200
      if (currentIsOverheat) {
        chance = 0.2 // Higher chance when overheated
        shiftSize = 400
      }

      if (getSafeRandom() < chance * (deltaMS / 100)) {
        const shift = (getSafeRandom() - 0.5) * shiftSize
        setTargetValue(prev => Math.max(0, Math.min(1000, prev + shift)))
      }

      // Time-driven tick for score accumulation
      const diff = Math.abs(dialValueRef.current - targetValueRef.current)
      let currentScore = Math.max(0, 100 - diff / 10) // Max difference 1000 = 0 score

      if (currentOverdriveActive && !currentIsOverheat) {
        currentScore *= 1.5 // 50% bonus score for overdrive
      } else if (currentIsOverheat) {
        currentScore *= 0.5 // Penalty while overheated
      }

      accumulatedScoreRef.current += currentScore * deltaMS
      accumulatedMsRef.current += deltaMS

      setScore(
        accumulatedScoreRef.current / Math.max(1, accumulatedMsRef.current)
      )
    },
    [handleComplete]
  )

  // Keep gameStateRef up to date for Stage Controller
  useEffect(() => {
    gameStateRef.current = {
      dialValue,
      targetValue,
      isOverdriveActive,
      isOverheat,
      heat
    }
  }, [dialValue, targetValue, isOverdriveActive, isOverheat, heat])

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
    isOverheat
  }
}
