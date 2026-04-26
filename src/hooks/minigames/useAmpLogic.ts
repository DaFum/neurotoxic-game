import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameState } from '../../context/GameState'
import { getSafeRandom } from '../../utils/crypto'

const MINIGAME_DURATION = 15

export function useAmpLogic() {
  const { completeAmpCalibration } = useGameState()

  const [dialValue, setDialValue] = useState(500)
  const [targetValue, setTargetValue] = useState(
    () => Math.floor(getSafeRandom() * 800) + 100
  )
  const [timeLeft, setTimeLeft] = useState(MINIGAME_DURATION)
  const [score, setScore] = useState(100)
  const [isGameOver, setIsGameOver] = useState(false)

  const isCompleteRef = useRef(false)
  const accumulatedScoreRef = useRef(0)
  const accumulatedMsRef = useRef(0)
  const dialValueRef = useRef(dialValue)
  const targetValueRef = useRef(targetValue)
  const gameStateRef = useRef(null)

  useEffect(() => {
    dialValueRef.current = dialValue
  }, [dialValue])

  useEffect(() => {
    targetValueRef.current = targetValue
  }, [targetValue])

  const finishCalledRef = useRef(false)

  const finishMinigame = useCallback(() => {
    if (finishCalledRef.current) return
    finishCalledRef.current = true

    const finalScore =
      accumulatedScoreRef.current / Math.max(1, accumulatedMsRef.current)
    completeAmpCalibration(finalScore)
  }, [completeAmpCalibration])

  const handleComplete = useCallback(() => {
    if (isCompleteRef.current) return
    isCompleteRef.current = true

    finishMinigame()
    setIsGameOver(true)
  }, [finishMinigame])

  // Function called by PixiStage component to get latest state for rendering
  const update = useCallback(
    deltaMS => {
      if (isCompleteRef.current || !Number.isFinite(deltaMS) || deltaMS <= 0)
        return

      const deltaSec = deltaMS / 1000

      setTimeLeft(prev => {
        if (prev <= deltaSec) {
          handleComplete()
          return 0
        }
        return prev - deltaSec
      })

      // Approximately 5% chance per 100ms
      if (getSafeRandom() < 0.05 * (deltaMS / 100)) {
        const shift = (getSafeRandom() - 0.5) * 200
        setTargetValue(prev => Math.max(0, Math.min(1000, prev + shift)))
      }

      // Time-driven tick for score accumulation
      const diff = Math.abs(dialValueRef.current - targetValueRef.current)
      const currentScore = Math.max(0, 100 - diff / 10) // Max difference 1000 = 0 score

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
      targetValue
    }
  }, [dialValue, targetValue])

  return {
    dialValue,
    setDialValue,
    targetValue,
    timeLeft,
    score,
    isGameOver,
    update,
    finishMinigame,
    gameStateRef
  }
}
