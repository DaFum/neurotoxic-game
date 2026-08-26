import { useCallback } from 'react'
import {
  updateGigPerformanceStats,
  calculateAccuracy
} from '../../../utils/gigStats'
// `getScheduledHitTimeMs` is a pure calculation over explicit arguments, not a
// runtime audio capability, so it stays a direct import; every operation that
// actually touches the audio stack goes through the injected engine.
import { getScheduledHitTimeMs } from '../../../utils/audio/audioEngine'
import { useAudioEngine } from '../../../context/AudioEngineContext'
import { checkHit } from '../../../utils/rhythmUtils'
import {
  calculateDynamicHitWindow,
  calculatePoints,
  calculateFinalScore,
  calculateHitCorruption,
  calculateHitOverload,
  isPerfectHit,
  calculateCritMultiplier
} from '../../../utils/rhythmGameScoringUtils'
import { finiteNumberOr } from '../../../utils/finiteNumber'
import type { RhythmGameRefState } from '../../../types/rhythmGame'
import type { RhythmStateSetters } from '../useRhythmGameState'

/**
 * Configuration payload for initializing the hit detection and scoring handler.
 *
 * @remarks
 * Encapsulates the mutable game state reference alongside the specific setter functions
 * required to update score, combo, health, and corruption metrics during a successful hit.
 *
 * @param gameStateRef - A mutable reference object holding the current rhythm game state
 * @param setters - A bounded collection of state updater functions
 * @param performance - The active gig performance modifiers and difficulty multipliers
 * @param activateToxicMode - A callback executed when overload reaches maximum capacity
 * @param handleMiss - A fallback callback triggered if the hit check evaluates to false
 */
type HandleHitParams = {
  gameStateRef: { current: RhythmGameRefState }
  setters: Pick<
    RhythmStateSetters,
    | 'setScore'
    | 'setCombo'
    | 'setHealth'
    | 'setOverload'
    | 'setAccuracy'
    | 'setCorruptionLevel'
    | 'setIsCorruptionBurstActive'
    | 'setCorruptionBurstEndTime'
    | 'setCorruptionState'
  >
  performance: {
    guitarDifficulty: number
    drumMultiplier: number
    tempoBonus: number
    critChance: number
  }
  activateToxicMode: () => void
  handleMiss: (count?: number, isEmptyHit?: boolean) => void
}

/**
 * Constructs and memoizes the core hit detection callback for the rhythm game loop.
 *
 * Evaluates whether a note resides within the dynamically calculated hit window for a given lane.
 * On a successful hit, it consumes the note, schedules the associated audio event, calculates
 * score and combo increments, and manages complex state transitions like corruption bursts and toxic mode.
 *
 * @remarks
 * This hook intrinsically relies on the Tone.js AudioContext clock (`getGigTimeMs()`) for precise
 * temporal evaluation, ensuring visual and auditory synchronization. It deliberately mutates
 * `gameStateRef.current` directly before invoking React state setters to ensure synchronous availability
 * of the updated state for the next animation frame.
 *
 * @param params - The dependency payload required to evaluate and apply hit logic
 * @returns A stable callback function that accepts a lane index and returns a boolean indicating hit success
 */
export const useHandleHit = ({
  gameStateRef,
  setters,
  performance,
  activateToxicMode,
  handleMiss
}: HandleHitParams) => {
  const audioEngine = useAudioEngine()
  const {
    setScore,
    setCombo,
    setHealth,
    setOverload,
    setAccuracy,
    setCorruptionLevel,
    setIsCorruptionBurstActive,
    setCorruptionBurstEndTime,
    setCorruptionState
  } = setters
  const { guitarDifficulty, drumMultiplier, tempoBonus, critChance } =
    performance

  const handleHit = useCallback(
    (laneIndex: number) => {
      const state = gameStateRef.current
      if (
        !Number.isInteger(laneIndex) ||
        laneIndex < 0 ||
        laneIndex >= state.lanes.length
      ) {
        return false
      }
      // Use Tone.js AudioContext clock for hit detection
      const elapsed = audioEngine.getGigTimeMs()
      const toxicModeActive = state.isToxicMode
      const lane = state.lanes[laneIndex]
      if (!lane) {
        throw new Error(
          `Missing lane at index ${laneIndex} during hit handling`
        )
      }

      const hitWindow = calculateDynamicHitWindow(
        lane.hitWindow * (1 + tempoBonus),
        state.modifiers.hitWindowBonus ?? 0,
        laneIndex,
        guitarDifficulty
      )

      const note = checkHit(state.notes, laneIndex, elapsed, hitWindow)

      if (note) {
        note.hit = true
        note.visible = false // consumed

        // Play the specific note pitch
        const originalNote = note.originalNote
        if (
          originalNote &&
          Number.isInteger(originalNote.p) &&
          (originalNote.p as number) >= 0 &&
          (originalNote.p as number) <= 127
        ) {
          const velocity =
            typeof originalNote.velocity === 'number' &&
            Number.isFinite(originalNote.velocity)
              ? originalNote.velocity
              : 127
          // Using Tone's absolute time is necessary here for proper MIDI note scheduling.
          // For all other gig logic, the engine's gig clock handles
          // relative timing.
          const toneNowMs = audioEngine.getToneAbsoluteTimeMs()
          const scheduledMs = getScheduledHitTimeMs({
            noteTimeMs: note.time,
            gigTimeMs: elapsed,
            audioTimeMs: toneNowMs,
            maxLeadMs: 30
          })
          audioEngine.scheduleNote(
            originalNote.p as number,
            lane.id,
            scheduledMs / 1000,
            velocity
          )
        } else {
          audioEngine.playSFX('hit') // Fallback
        }

        // Prefer the value written into modifiers by audio init (physics-aware), fall back to
        // the static performance value if audio hasn't initialized yet.
        const activeDrumMultiplier =
          state.modifiers.drumMultiplier ?? drumMultiplier
        const basePoints = calculatePoints(
          laneIndex,
          activeDrumMultiplier,
          state.modifiers.guitarScoreMult ?? 1.0,
          state.modifiers.bassScoreMult ?? 1.0,
          Boolean(state.modifiers.guestlist)
        )

        const isPerfect = isPerfectHit(elapsed, note.time, hitWindow)

        if (isPerfect) {
          gameStateRef.current.stats.perfectHits++

          if (!gameStateRef.current.isCorruptionBurstActive) {
            const currentCorruption = gameStateRef.current.corruptionLevel ?? 0
            const { nextCorruption, didBurstTrigger } = calculateHitCorruption(
              currentCorruption,
              gameStateRef.current.isCorruptionBurstActive
            )

            gameStateRef.current.corruptionLevel = nextCorruption
            gameStateRef.current.stats.corruptionLevel = nextCorruption
            setCorruptionLevel(nextCorruption)

            if (didBurstTrigger) {
              const burstEndTime = elapsed + 1000
              gameStateRef.current.isCorruptionBurstActive = true
              gameStateRef.current.corruptionBurstEndTime = burstEndTime
              setIsCorruptionBurstActive(true)
              setCorruptionBurstEndTime(burstEndTime)
              setCorruptionState(0, true)
              audioEngine.enableCorruptionBurstAudio()
              audioEngine.setCorruptionEffect(true)
            }
          }
        } else {
          if (!gameStateRef.current.stats.hits)
            gameStateRef.current.stats.hits = 0
          gameStateRef.current.stats.hits++
        }

        const currentAccuracy = calculateAccuracy(
          gameStateRef.current.stats.perfectHits +
            (gameStateRef.current.stats.hits ?? 0),
          gameStateRef.current.stats.misses
        )
        setAccuracy(currentAccuracy)

        let finalScore = calculateFinalScore(
          basePoints,
          state.combo,
          toxicModeActive,
          Boolean(state.modifiers.hasPerfektionist),
          currentAccuracy,
          gameStateRef.current.isCorruptionBurstActive
        )

        if (critChance > 0) {
          finalScore *= calculateCritMultiplier(
            critChance,
            typeof state.rng === 'function' ? state.rng() : 0.5
          )
        }

        // Extract calculations outside state callbacks
        const nextScore = gameStateRef.current.score + finalScore
        const nextCombo = gameStateRef.current.combo + 1
        const nextHealth = Math.max(
          0,
          Math.min(100, gameStateRef.current.health + (toxicModeActive ? 1 : 2))
        )

        gameStateRef.current.score = nextScore
        gameStateRef.current.combo = nextCombo
        gameStateRef.current.health = nextHealth

        setScore(nextScore)
        setCombo(nextCombo)
        setHealth(nextHealth)

        const currentOverload = finiteNumberOr(gameStateRef.current.overload, 0)

        const { nextOverload, didToxicModeTrigger } = calculateHitOverload(
          currentOverload,
          toxicModeActive
        )

        const peakCandidate = Math.min(currentOverload + 4, 100)

        gameStateRef.current.stats = updateGigPerformanceStats(
          gameStateRef.current.stats,
          {
            combo: gameStateRef.current.combo,
            overload: toxicModeActive ? currentOverload : peakCandidate
          }
        )

        if (!toxicModeActive) {
          gameStateRef.current.overload = nextOverload
          setOverload(nextOverload)

          if (didToxicModeTrigger) {
            activateToxicMode()
          }
        }

        return true
      } else {
        handleMiss(1, true) // Pass true for isEmptyHit
        return false
      }
    },
    [
      activateToxicMode,
      audioEngine,
      handleMiss,
      gameStateRef,
      setCombo,
      setHealth,
      setOverload,
      setScore,
      setAccuracy,
      setCorruptionLevel,
      setIsCorruptionBurstActive,
      setCorruptionBurstEndTime,
      setCorruptionState,
      guitarDifficulty,
      drumMultiplier,
      tempoBonus,
      critChance
    ]
  )

  return handleHit
}
