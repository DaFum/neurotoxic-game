import { useState, useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { useGameState } from '../../context/GameState'

const MINIGAME_DURATION = 15

export function useAmpLogic() {
  const { completeAmpCalibration } = useGameState()

  const [dialValue, setDialValue] = useState(500)
  const [targetValue, setTargetValue] = useState(500)
  const [timeLeft, setTimeLeft] = useState(MINIGAME_DURATION)
  const [score, setScore] = useState(100)

  const synthRef = useRef(null)
  const isCompleteRef = useRef(false)
  const accumulatedScoreRef = useRef(0)
  const ticksRef = useRef(0)

  // Initialize Audio
  useEffect(() => {
    synthRef.current = new Tone.Oscillator(500, "sine").toDestination()
    // Need user interaction to start audio, so we start it muted or low
    synthRef.current.volume.value = -20

    // We only start if Tone context is running. The game engine handles this globally,
    // but we can try to start it just in case.
    if (Tone.context.state === 'running') {
      synthRef.current.start()
    }

    // Set initial random target
    setTargetValue(Math.floor(Math.random() * 800) + 100)

    return () => {
      if (synthRef.current) {
        synthRef.current.stop()
        synthRef.current.dispose()
      }
    }
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

    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Update logic and audio
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.frequency.rampTo(dialValue, 0.1)
    }

    // Calculate difference
    const diff = Math.abs(dialValue - targetValue)
    const currentScore = Math.max(0, 100 - (diff / 10)) // Max difference 1000 = 0 score

    accumulatedScoreRef.current += currentScore
    ticksRef.current += 1

    setScore(accumulatedScoreRef.current / ticksRef.current)

  }, [dialValue, targetValue])

  const handleComplete = useCallback(() => {
    if (isCompleteRef.current) return
    isCompleteRef.current = true

    if (synthRef.current) {
      synthRef.current.stop()
    }

    const finalScore = accumulatedScoreRef.current / Math.max(1, ticksRef.current)
    completeAmpCalibration(finalScore)
  }, [completeAmpCalibration])

  // Function called by PixiStage component to get latest state for rendering
  const update = useCallback(() => {
    return {
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
    update,
    handleComplete
  }
}
