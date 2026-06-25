import { useCallback } from 'react'
import {
  updateGigPerformanceStats,
  calculateAccuracy
} from '../../../utils/gigStats'
import {
  audioService,
  getGigTimeMs,
  getToneAbsoluteTimeMs,
  playNoteAtTime,
  enableCorruptionBurstAudio,
  setCorruptionEffect,
  getScheduledHitTimeMs
} from '../../../utils/audio/audioEngine'
import { checkHit } from '../../../utils/rhythmUtils'
import { getSafeRandom } from '../../../utils/crypto'
import {
  calculateDynamicHitWindow,
  calculatePoints,
  calculateFinalScore
} from '../../../utils/rhythmGameScoringUtils'
import type { RhythmGameRefState } from '../../../types/rhythmGame'
import type { RhythmStateSetters } from '../useRhythmGameState'

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

export const useHandleHit = ({
  gameStateRef,
  setters,
  performance,
  activateToxicMode,
  handleMiss
}: HandleHitParams) => {
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
      const elapsed = getGigTimeMs()
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
          // For all other gig logic, getGigTimeMs() handles relative timing.
          const toneNowMs = getToneAbsoluteTimeMs()
          const scheduledMs = getScheduledHitTimeMs({
            noteTimeMs: note.time,
            gigTimeMs: elapsed,
            audioTimeMs: toneNowMs,
            maxLeadMs: 30
          })
          playNoteAtTime(
            originalNote.p as number,
            lane.id,
            scheduledMs / 1000,
            velocity
          )
        } else {
          audioService.playSFX('hit') // Fallback
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

        // Inclusive <= is intentional: the perfect threshold is a strict
        // subset of checkHit's exclusive (< hitWindow) window, so a note at
        // exactly 0.4 * hitWindow still counts as perfect.
        const isPerfect = Math.abs(elapsed - note.time) <= hitWindow * 0.4

        if (isPerfect) {
          gameStateRef.current.stats.perfectHits++

          if (!gameStateRef.current.isCorruptionBurstActive) {
            const currentCorruption = gameStateRef.current.corruptionLevel ?? 0
            const nextCorruption = Math.min(100, currentCorruption + 5)
            gameStateRef.current.corruptionLevel = nextCorruption
            gameStateRef.current.stats.corruptionLevel = nextCorruption
            setCorruptionLevel(nextCorruption)

            if (nextCorruption >= 100) {
              const burstEndTime = elapsed + 1000
              gameStateRef.current.corruptionLevel = 0
              gameStateRef.current.stats.corruptionLevel = 0
              gameStateRef.current.isCorruptionBurstActive = true
              gameStateRef.current.corruptionBurstEndTime = burstEndTime
              setIsCorruptionBurstActive(true)
              setCorruptionBurstEndTime(burstEndTime)
              setCorruptionState(0, true)
              enableCorruptionBurstAudio()
              setCorruptionEffect(true)
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

        // Band crit effect (e.g. contraband): chance to double the hit score
        if (critChance > 0 && getSafeRandom() < critChance) {
          finalScore *= 2
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

        if (!toxicModeActive) {
          const gain = 4 // Increased gain to make Toxic Mode reachable
          const currentOverload = gameStateRef.current.overload ?? 0
          const next = currentOverload + gain
          const peakCandidate = Math.min(next, 100)

          gameStateRef.current.stats = updateGigPerformanceStats(
            gameStateRef.current.stats,
            { combo: gameStateRef.current.combo, overload: peakCandidate }
          )

          if (next >= 100) {
            activateToxicMode()
            gameStateRef.current.overload = 0
            setOverload(0)
          } else {
            gameStateRef.current.overload = next
            setOverload(next)
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
