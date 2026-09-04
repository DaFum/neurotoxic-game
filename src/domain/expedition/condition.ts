/**
 * Technical Condition domain logic for Expedition tours.
 *
 * @remarks
 * Manages physical equipment groups (PA, Instruments, Stage Gear) and evaluates
 * their active gameplay performance profiles.
 */

import type {
  ConditionGroup,
  ExpeditionConditionPerformanceProfile,
  ExpeditionTechnicalCondition
} from '../../types/expedition'
import type { GameState, PostGigSummary } from '../../types'
import { finiteNumberOr } from '../../utils/finiteNumber'

/**
 * All physical equipment groups tracked by technical condition.
 */
const EXPEDITION_CONDITION_GROUPS: readonly ConditionGroup[] = [
  'pa',
  'instruments',
  'stageGear'
] as const

/**
 * Clamps a condition value to an integer within `0..100`.
 *
 * @param value - Raw numeric condition.
 * @returns Clamped condition in `0..100`.
 */
export const clampCondition = (value: unknown): number => {
  const num = finiteNumberOr(value, 0)
  return Math.max(0, Math.min(100, Math.round(num)))
}

/**
 * Creates default 100% technical condition with zero defects for a fresh run.
 *
 * @returns New ExpeditionTechnicalCondition object.
 */
export const createDefaultTechnicalCondition =
  (): ExpeditionTechnicalCondition => ({
    pa: 100,
    instruments: 100,
    stageGear: 100,
    defects: []
  })

/**
 * Safely extracts or creates technical condition from active GameState.
 *
 * @param state - Current game state.
 * @returns Stored or default technical condition.
 */
export const getExpeditionTechnicalCondition = (
  state: GameState
): ExpeditionTechnicalCondition => {
  const tc = state.expedition?.technicalCondition
  if (!tc) return createDefaultTechnicalCondition()
  return {
    pa: clampCondition(tc.pa),
    instruments: clampCondition(tc.instruments),
    stageGear: clampCondition(tc.stageGear),
    defects: Array.isArray(tc.defects) ? tc.defects : []
  }
}

/**
 * Evaluates active gameplay performance modifiers from technical condition.
 *
 * @param condition - Equipment condition or null/undefined.
 * @returns Performance profile with audio hazards, timing, stamina, and disabled groups.
 */
export const getExpeditionConditionPerformanceProfile = (
  condition: ExpeditionTechnicalCondition | null | undefined
): ExpeditionConditionPerformanceProfile => {
  const pa = clampCondition(condition?.pa ?? 100)
  const instruments = clampCondition(condition?.instruments ?? 100)
  const stageGear = clampCondition(condition?.stageGear ?? 100)

  const disabledGroups: ConditionGroup[] = []

  // PA Profile:
  // 70..100: baseline
  // 40..69: audioHazardLevel 1
  // 1..39: audioHazardLevel 2; timing x0.96
  // 0: disabledGroups includes pa
  if (pa === 0) {
    disabledGroups.push('pa')
  }
  const paHazard = pa <= 39 ? 2 : pa <= 69 ? 1 : 0
  const paTiming = pa <= 39 ? 0.96 : 1.0

  // Instruments Profile:
  // 70..100: baseline
  // 40..69: timing x0.98
  // 1..39: timing x0.93; miss stamina x1.15
  // 0: disabledGroups includes instruments
  if (instruments === 0) {
    disabledGroups.push('instruments')
  }
  const instTiming = instruments <= 39 ? 0.93 : instruments <= 69 ? 0.98 : 1.0
  const instMissStamina = instruments <= 39 ? 1.15 : 1.0

  // Stage Gear Profile:
  // 70..100: baseline
  // 40..69: combo recovery x0.95
  // 1..39: combo recovery x0.85; audioHazardLevel >= 1
  // 0: disabledGroups includes stageGear
  if (stageGear === 0) {
    disabledGroups.push('stageGear')
  }
  const stageComboRecovery =
    stageGear <= 39 ? 0.85 : stageGear <= 69 ? 0.95 : 1.0
  const stageHazard = stageGear <= 39 ? 1 : 0

  return {
    audioHazardLevel: Math.max(paHazard, stageHazard),
    timingMultiplier: Number((paTiming * instTiming).toFixed(4)),
    missStaminaMultiplier: instMissStamina,
    comboRecoveryMultiplier: stageComboRecovery,
    disabledGroups
  }
}

/**
 * Summarizes condition across all 4 equipment groups (Vehicle, PA, Instruments, Stage Gear).
 *
 * @param state - Current game state.
 * @returns Average condition in `0..100`.
 */
export const getExpeditionConditionSummary = (state: GameState): number => {
  const vehicle = Math.max(
    0,
    Math.min(100, finiteNumberOr(state.player.van?.condition, 100))
  )

  if (
    state.expedition?.status === 'active' &&
    state.expedition.technicalCondition
  ) {
    const tc = state.expedition.technicalCondition
    const pa = clampCondition(tc.pa)
    const inst = clampCondition(tc.instruments)
    const stage = clampCondition(tc.stageGear)
    return Math.round((vehicle + pa + inst + stage) / 4)
  }

  return Math.max(
    0,
    Math.min(100, finiteNumberOr(state.player.van?.condition, 0))
  )
}

/**
 * Derives technical wear inflicted by a completed gig based on results and multiplier.
 *
 * @param gigSummary - Post-gig summary result.
 * @param technicalWearMultiplier - Multiplier from effective expedition rules.
 * @returns Points of wear to deduct per group.
 */
export const calculatePostGigTechnicalWear = (
  gigSummary: PostGigSummary | null | undefined,
  technicalWearMultiplier: number = 1.0
): { pa: number; instruments: number; stageGear: number } => {
  const multiplier = Math.max(0, finiteNumberOr(technicalWearMultiplier, 1.0))
  const accuracy = finiteNumberOr(gigSummary?.accuracy, 100)
  const misses = finiteNumberOr(gigSummary?.misses, 0)
  const failed = gigSummary?.failed === true

  const baseWear = 8
  const paPenalty = (failed ? 6 : 0) + (accuracy < 60 ? 4 : 0)
  const instPenalty = (misses > 5 ? 4 : 0) + (failed ? 6 : 0)
  const stagePenalty = (failed ? 6 : 0) + (accuracy < 70 ? 3 : 0)

  return {
    pa: Math.round((baseWear + paPenalty) * multiplier),
    instruments: Math.round((baseWear + instPenalty) * multiplier),
    stageGear: Math.round((baseWear + stagePenalty) * multiplier)
  }
}

/**
 * Applies wear deductions to an ExpeditionTechnicalCondition snapshot.
 *
 * @param condition - Current technical condition.
 * @param wear - Points of wear to subtract per group.
 * @returns New technical condition with re-clamped values.
 */
export const applyTechnicalWear = (
  condition: ExpeditionTechnicalCondition,
  wear: { pa: number; instruments: number; stageGear: number }
): ExpeditionTechnicalCondition => ({
  ...condition,
  pa: clampCondition(condition.pa - wear.pa),
  instruments: clampCondition(condition.instruments - wear.instruments),
  stageGear: clampCondition(condition.stageGear - wear.stageGear)
})

/**
 * Translates an active performance profile into user-facing PreGig active effects.
 *
 * @param profile - Condition performance profile.
 * @returns Array of ActiveEffect objects to render on the PreGig screen.
 */
export const getExpeditionConditionActiveEffects = (
  profile: ExpeditionConditionPerformanceProfile
): Array<{
  key: string
  fallback?: string
  options?: Record<string, unknown>
}> => {
  const effects: Array<{
    key: string
    fallback?: string
    options?: Record<string, unknown>
  }> = []

  if (profile.audioHazardLevel === 1) {
    effects.push({
      key: 'ui:pregig.effects.audioHazard1',
      fallback: 'HAZARD: Audio Distortion Level 1'
    })
  } else if (profile.audioHazardLevel >= 2) {
    effects.push({
      key: 'ui:pregig.effects.audioHazard2',
      fallback: 'HAZARD: Severe Audio Distortion Level 2'
    })
  }

  if (profile.timingMultiplier < 1.0) {
    const penaltyPct = Math.round((1 - profile.timingMultiplier) * 100)
    effects.push({
      key: 'ui:pregig.effects.timingPenalty',
      options: { penalty: penaltyPct },
      fallback: `TIMING: -${penaltyPct}% Hit Window`
    })
  }

  if (profile.missStaminaMultiplier > 1.0) {
    const penaltyPct = Math.round((profile.missStaminaMultiplier - 1) * 100)
    effects.push({
      key: 'ui:pregig.effects.missStaminaPenalty',
      options: { penalty: penaltyPct },
      fallback: `STAMINA: +${penaltyPct}% Drain on Miss`
    })
  }

  if (profile.comboRecoveryMultiplier < 1.0) {
    const penaltyPct = Math.round((1 - profile.comboRecoveryMultiplier) * 100)
    effects.push({
      key: 'ui:pregig.effects.comboRecoveryPenalty',
      options: { penalty: penaltyPct },
      fallback: `COMBO: -${penaltyPct}% Recovery Speed`
    })
  }

  for (const group of profile.disabledGroups) {
    effects.push({
      key: `ui:pregig.effects.disabled_${group}`,
      fallback: `DISABLED: ${group.toUpperCase()} system offline`
    })
  }

  return effects
}
