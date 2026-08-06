import { getSafeRandom } from '../../utils/crypto'
import { clampAmpDial } from '../../utils/gameState'
import { clampUnit } from '../../utils/numberUtils'

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
