import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameState } from '../../context/GameState'

const MINIGAME_DURATION = 15

export function useAmpLogic() {
  const { completeAmpCalibration } = useGameState()

  const [dialValue, setDialValue] = useState(500)
  const [targetValue, setTargetValue] = useState(500)
  const [timeLeft, setTimeLeft] = useState(MINIGAME_DURATION)
  const [score, setScore] = useState(100)
  const [isGameOver, setIsGameOver] = useState(false)

  const isCompleteRef = useRef(false)
  const accumulatedScoreRef = useRef(0)
  const ticksRef = useRef(0)
  const dialValueRef = useRef(dialValue)
  const targetValueRef = useRef(targetValue)
  const gameStateRef = useRef(null)

  useEffect(() => {
    dialValueRef.current = dialValue
  }, [dialValue])

  useEffect(() => {
    targetValueRef.current = targetValue
  }, [targetValue])

  // Initialize Target
  useEffect(() => {
    setTargetValue(Math.floor(Math.random() * 800) + 100)
  }, [])

  // Game Loop
  useEffect(() => {
    if (isCompleteRef.current) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(interval)
          handleComplete()
          return 0
        }
        return prev - 0.1
      })

      // Update Target randomly occasionally to make it harder
      if (Math.random() < 0.05) {
        setTargetValue(prev => {
          const shift = (Math.random() - 0.5) * 200
          return Math.max(0, Math.min(1000, prev + shift))
        })
      }

      // Time-driven tick for score accumulation
      const diff = Math.abs(dialValueRef.current - targetValueRef.current)
      const currentScore = Math.max(0, 100 - (diff / 10)) // Max difference 1000 = 0 score

      accumulatedScoreRef.current += currentScore
      ticksRef.current += 1

      setScore(accumulatedScoreRef.current / Math.max(1, ticksRef.current))

    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleComplete = useCallback(() => {
    if (isCompleteRef.current) return
    isCompleteRef.current = true

    setIsGameOver(true)
  }, [])

  // Function called by PixiStage component to get latest state for rendering
  const update = useCallback(() => {
    // If you need per-frame updates beyond what is in the controller
  }, [])

  const finishMinigame = useCallback(() => {
    const finalScore = accumulatedScoreRef.current / Math.max(1, ticksRef.current)
    completeAmpCalibration(finalScore)
  }, [completeAmpCalibration])

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
