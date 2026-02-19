import { useState, useRef } from 'react'

/**
 * Manages the state for the rhythm game, including React state for UI
 * and a Ref for the high-frequency game loop.
 *
 * @returns {{gameStateRef: React.MutableRefObject, state: Object, setters: Object}} State and setters.
 */
export const useRhythmGameState = () => {
  // React State for UI
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [health, setHealth] = useState(100)
  const [overload, setOverload] = useState(0)
  const [isToxicMode, setIsToxicMode] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(null)

  // High-Frequency Game State (Ref)
  const gameStateRef = useRef({
    notes: [],
    nextMissCheckIndex: 0, // Optimization: only check notes that haven't passed yet
    lanes: [
      {
        id: 'guitar',
        key: 'ArrowLeft',
        x: 0,
        color: 0xff0041,
        active: false,
        hitWindow: 150
      },
      {
        id: 'drums',
        key: 'ArrowDown',
        x: 120,
        color: 0x00ff41,
        active: false,
        hitWindow: 150
      },
      {
        id: 'bass',
        key: 'ArrowRight',
        x: 240,
        color: 0x0041ff,
        active: false,
        hitWindow: 150
      }
    ],
    speed: 500,
    modifiers: {},
    stats: { perfectHits: 0, misses: 0, maxCombo: 0, peakHype: 0 },
    projectiles: [],
    // Mirror React State for Renderer
    combo: 0,
    health: 100,
    score: 0,
    progress: 0,
    isToxicMode: false,
    isGameOver: false,
    overload: 0,
    totalDuration: 0,
    hasSubmittedResults: false,
    songTransitioning: false,
    setlistCompleted: false,
    transportPausedByOverlay: false,
    toxicTimeTotal: 0,
    toxicModeEndTime: 0,
    rng: Math.random // Store RNG for consistency
  })

  return {
    gameStateRef,
    state: {
      score,
      combo,
      health,
      overload,
      isToxicMode,
      isGameOver,
      isAudioReady
    },
    setters: {
      setScore,
      setCombo,
      setHealth,
      setOverload,
      setIsToxicMode,
      setIsGameOver,
      setIsAudioReady
    }
  }
}
