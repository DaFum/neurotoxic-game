import { getSafeRandom } from '../../utils/crypto'
import { clampAmpDial } from '../../utils/gameState'
import { clampUnit } from '../../utils/numberUtils'
import type { AmpStageOptions } from '../../types/components'

const MINIGAME_DURATION = 15
const INITIAL_DISPLAY_SCORE = 100

/**
 * Single mutable owner of amp calibration gameplay state. Inputs and frame
 * ticks mutate this model; React and the Pixi stage only receive snapshots.
 */
export interface AmpSimulation {
  dialValue: number
  targetValue: number
  timeLeft: number
  accumulatedScore: number
  accumulatedMs: number
  isComplete: boolean
  isOverdriveActive: boolean
  heat: number
  isOverheat: boolean
  voidResonance: number
  isAnomalyActive: boolean
  isHijackActive: boolean
  hijacksOverridden: number
  isFeedbackLoopActive: boolean
  feedbackLoopsDampened: number
  /** Fractional interference; React receives the floored value. */
  interference: number
  purgesUsed: number
}

/**
 * React-facing amp state published from {@link AmpSimulation}.
 */
export interface AmpUiSnapshot {
  dialValue: number
  targetValue: number
  timeLeft: number
  score: number
  isGameOver: boolean
  isOverdriveActive: boolean
  heat: number
  isOverheat: boolean
  voidResonance: number
  isAnomalyActive: boolean
  isHijackActive: boolean
  hijacksOverridden: number
  isFeedbackLoopActive: boolean
  feedbackLoopsDampened: number
  interference: number
}

/**
 * Values reported when an amp calibration round completes.
 */
export interface AmpResult {
  score: number
  voidResonance: number
  purgesUsed: number
  hijacksOverridden: number
  feedbackLoopsDampened: number
}

/**
 * Outcome of one {@link stepAmpSimulation} frame.
 */
export type AmpStepOutcome = 'skipped' | 'advanced' | 'expired'

/**
 * Creates a fresh amp simulation. Draws exactly one RNG value for the target.
 */
export function createAmpSimulation(): AmpSimulation {
  return {
    dialValue: 500,
    targetValue: Math.floor(getSafeRandom() * 800) + 100,
    timeLeft: MINIGAME_DURATION,
    accumulatedScore: 0,
    accumulatedMs: 0,
    isComplete: false,
    isOverdriveActive: false,
    heat: 0,
    isOverheat: false,
    voidResonance: 0,
    isAnomalyActive: false,
    isHijackActive: false,
    hijacksOverridden: 0,
    isFeedbackLoopActive: false,
    feedbackLoopsDampened: 0,
    interference: 0,
    purgesUsed: 0
  }
}

/**
 * Time-weighted mean score, or `null` before the first scoring frame.
 */
function averageAmpScore(sim: AmpSimulation): number | null {
  if (sim.accumulatedMs <= 0) return null
  return sim.accumulatedScore / Math.max(1, sim.accumulatedMs)
}

/**
 * Builds the React snapshot. The score shows 100 until the first scoring frame.
 */
export function buildAmpUiSnapshot(sim: AmpSimulation): AmpUiSnapshot {
  return {
    dialValue: sim.dialValue,
    targetValue: sim.targetValue,
    timeLeft: sim.timeLeft,
    score: averageAmpScore(sim) ?? INITIAL_DISPLAY_SCORE,
    isGameOver: sim.isComplete,
    isOverdriveActive: sim.isOverdriveActive,
    heat: sim.heat,
    isOverheat: sim.isOverheat,
    voidResonance: sim.voidResonance,
    isAnomalyActive: sim.isAnomalyActive,
    isHijackActive: sim.isHijackActive,
    hijacksOverridden: sim.hijacksOverridden,
    isFeedbackLoopActive: sim.isFeedbackLoopActive,
    feedbackLoopsDampened: sim.feedbackLoopsDampened,
    interference: Math.floor(sim.interference)
  }
}

/**
 * Shallow equality for UI snapshots, used to skip no-op React publications.
 */
export function isSameAmpUiSnapshot(
  a: AmpUiSnapshot,
  b: AmpUiSnapshot
): boolean {
  return (Object.keys(a) as Array<keyof AmpUiSnapshot>).every(
    key => a[key] === b[key]
  )
}

/**
 * Builds the Pixi stage snapshot. Interference stays fractional.
 */
export function buildAmpStageSnapshot(sim: AmpSimulation): AmpStageOptions {
  return {
    dialValue: sim.dialValue,
    targetValue: sim.targetValue,
    isOverdriveActive: sim.isOverdriveActive,
    isOverheat: sim.isOverheat,
    heat: sim.heat,
    isAnomalyActive: sim.isAnomalyActive,
    voidResonance: sim.voidResonance,
    interference: sim.interference,
    isHijackActive: sim.isHijackActive,
    hijacksOverridden: sim.hijacksOverridden
  }
}

/**
 * Builds the completion result; the score is 0 when no frame was scored.
 */
export function buildAmpResult(sim: AmpSimulation): AmpResult {
  return {
    score: averageAmpScore(sim) ?? 0,
    voidResonance: sim.voidResonance,
    purgesUsed: sim.purgesUsed,
    hijacksOverridden: sim.hijacksOverridden,
    feedbackLoopsDampened: sim.feedbackLoopsDampened
  }
}

/**
 * Decrements the round timer.
 * @returns True when the round just expired (caller should stop the frame).
 */
function advanceAmpTime(deltaSec: number, sim: AmpSimulation): boolean {
  const nextTimeLeft = sim.timeLeft - deltaSec
  if (nextTimeLeft <= 0) {
    sim.timeLeft = 0
    return true
  }
  sim.timeLeft = nextTimeLeft
  return false
}

/**
 * Applies overdrive heat buildup and overheat cooldown.
 */
function applyAmpHeat(deltaSec: number, sim: AmpSimulation): void {
  if (sim.isOverheat) {
    // Cooldown mode: disable overdrive automatically
    sim.isOverdriveActive = false
    sim.heat -= 25 * deltaSec // Cool down quickly when overheated
    if (sim.heat <= 0) {
      sim.heat = 0
      sim.isOverheat = false
    }
  } else if (sim.isOverdriveActive) {
    sim.heat += 35 * deltaSec // Heats up in ~3 seconds
    if (sim.heat >= 100) {
      sim.heat = 100
      sim.isOverheat = true
      sim.isOverdriveActive = false // Force off
    }
  } else {
    sim.heat = Math.max(0, sim.heat - 15 * deltaSec) // Normal cooldown
  }
}

/**
 * Spawns or clears a void anomaly (forces an extreme target during overdrive).
 */
function applyAmpVoidAnomaly(deltaMS: number, sim: AmpSimulation): void {
  if (sim.isOverdriveActive && !sim.isOverheat && !sim.isAnomalyActive) {
    // 2% chance per 100ms to spawn an anomaly during overdrive
    if (getSafeRandom() < clampUnit(0.02 * (deltaMS / 100))) {
      sim.isAnomalyActive = true
      // Force an extreme target frequency
      sim.targetValue = getSafeRandom() > 0.5 ? 950 : 50
    }
  } else if (
    sim.isAnomalyActive &&
    (!sim.isOverdriveActive || sim.isOverheat)
  ) {
    // Anomaly ends if overdrive is disabled or overheat happens
    sim.isAnomalyActive = false
  }
}

/**
 * Randomly drifts the target frequency (faster/larger while overheated).
 */
function applyAmpTargetDrift(deltaMS: number, sim: AmpSimulation): void {
  // Approximately 5% chance per 100ms
  let chance = 0.05
  let shiftSize = 200
  if (sim.isOverheat) {
    chance = 0.2 // Higher chance when overheated
    shiftSize = 400
  }

  if (
    !sim.isAnomalyActive &&
    getSafeRandom() < clampUnit(chance * (deltaMS / 100))
  ) {
    const shift = (getSafeRandom() - 0.5) * shiftSize
    sim.targetValue = clampAmpDial(sim.targetValue + shift)
  }
}

/**
 * Triggers a Kranker Schrank hijack with a small per-frame probability.
 */
function applyAmpHijack(deltaMS: number, sim: AmpSimulation): void {
  const clampedHijackProbability = clampUnit(0.02 * (deltaMS / 100))
  if (!sim.isHijackActive && getSafeRandom() < clampedHijackProbability) {
    sim.isHijackActive = true
  }
}

/**
 * Triggers a severe Feedback Loop hazard (Kranker Schrank lore).
 * Generates massive heat and disables overdrive until dampened.
 */
function applyAmpFeedbackLoop(deltaMS: number, sim: AmpSimulation): void {
  // ~1.5% chance per 100ms to trigger a feedback loop if not already active
  if (
    !sim.isFeedbackLoopActive &&
    getSafeRandom() < clampUnit(0.015 * (deltaMS / 100))
  ) {
    sim.isFeedbackLoopActive = true

    // Feedback loop instantly maxes out interference
    sim.interference = 100
  }

  if (sim.isFeedbackLoopActive) {
    // Disables overdrive constantly while feedback loop is active
    sim.isOverdriveActive = false

    // Generates massive heat constantly
    if (sim.heat < 100) {
      sim.heat = Math.min(100, sim.heat + 40 * (deltaMS / 1000))
      if (sim.heat >= 100) {
        sim.isOverheat = true
      }
    }
  }
}

/**
 * Accumulates the time-weighted accuracy score with overdrive/overheat/hijack
 * modifiers.
 * @returns The dial-to-target difference, reused by the resonance phase.
 */
function accumulateAmpScore(deltaMS: number, sim: AmpSimulation): number {
  const diff = Math.abs(sim.dialValue - sim.targetValue)
  let currentScore = Math.max(0, 100 - diff / 10) // Max difference 1000 = 0 score

  if (sim.isOverdriveActive && !sim.isOverheat) {
    currentScore *= 1.5 // 50% bonus score for overdrive
  } else if (sim.isOverheat) {
    currentScore *= 0.5 // Penalty while overheated
  }

  if (sim.isHijackActive) {
    currentScore *= 0.2 // Huge penalty during active hijack
  }

  if (sim.isFeedbackLoopActive) {
    currentScore *= 0.1 // Catastrophic penalty during feedback loop
  }

  sim.accumulatedScore += currentScore * deltaMS
  sim.accumulatedMs += deltaMS

  return diff
}

/**
 * Builds void resonance while an active anomaly is dialed in; clears the
 * anomaly once resonance maxes out.
 */
function applyAmpResonance(
  deltaSec: number,
  diff: number,
  sim: AmpSimulation
): void {
  // If dialed in perfectly during anomaly, rapidly gain resonance
  if (sim.isAnomalyActive && diff < 30) {
    sim.voidResonance = Math.min(100, sim.voidResonance + 20 * deltaSec)

    if (sim.voidResonance >= 100) {
      sim.isAnomalyActive = false
    }
  }
}

/**
 * Advances the amp simulation by one frame. Completion callbacks stay with
 * the caller: on `'expired'` the timer is clamped to 0 and the frame is not
 * scored.
 *
 * @param sim - Simulation model, mutated in place.
 * @param deltaMS - Milliseconds elapsed since the previous update.
 * @returns `'skipped'` for a completed model or a non-finite/non-positive
 * delta, `'expired'` when the timer ran out this frame, otherwise `'advanced'`.
 */
export function stepAmpSimulation(
  sim: AmpSimulation,
  deltaMS: number
): AmpStepOutcome {
  if (sim.isComplete || !Number.isFinite(deltaMS) || deltaMS <= 0) {
    return 'skipped'
  }

  const deltaSec = deltaMS / 1000

  if (advanceAmpTime(deltaSec, sim)) return 'expired'

  applyAmpFeedbackLoop(deltaMS, sim)
  applyAmpHeat(deltaSec, sim)
  applyAmpVoidAnomaly(deltaMS, sim)
  applyAmpTargetDrift(deltaMS, sim)
  applyAmpHijack(deltaMS, sim)

  // Neurotoxic interference buildup (fractional; React sees the floor)
  sim.interference = Math.min(100, sim.interference + (deltaMS / 1000) * 5)

  const diff = accumulateAmpScore(deltaMS, sim)
  applyAmpResonance(deltaSec, diff, sim)
  return 'advanced'
}
