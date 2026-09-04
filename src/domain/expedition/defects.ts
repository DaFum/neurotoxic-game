/**
 * Hidden defect domain logic and lifecycle management.
 *
 * @remarks
 * Manages deterministic creation, trigger evaluation, and leak-free views of
 * hidden, revealed, triggered, and resolved equipment defects.
 */

import type {
  ConditionGroup,
  HiddenDefectState,
  HiddenDefectTrigger
} from '../../types/expedition'
import type { GameState } from '../../types'
import { clampCondition, getExpeditionTechnicalCondition } from './condition'
import { mulberry32 } from '../../utils/seededRng'

/**
 * Condition damage inflicted when a defect of a given severity triggers.
 */
export const DEFECT_SEVERITY_DAMAGE: Readonly<Record<1 | 2 | 3, number>> = {
  1: 8,
  2: 15,
  3: 25
} as const

const TRIGGERS: readonly HiddenDefectTrigger[] = [
  'post_travel',
  'pre_gig',
  'post_gig'
] as const

const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

/**
 * Generates a deterministic hidden defect tied to runSeed, equipment group, and route step.
 *
 * @param runSeed - Root run seed.
 * @param group - Equipment condition group.
 * @param source - Defect origin.
 * @param routeStep - Route step when the defect was generated.
 * @param severityOverride - Optional explicit severity.
 * @returns Deterministic HiddenDefectState.
 */
export const createDeterministicHiddenDefect = (
  runSeed: number,
  group: ConditionGroup,
  source: 'field_repair' | 'improvise' | 'critical_wear',
  routeStep: number,
  severityOverride?: 1 | 2 | 3
): HiddenDefectState => {
  const seed =
    (runSeed + routeStep * 1000 + hashString(`${group}_${source}`)) >>> 0
  const rng = mulberry32(seed)

  const id = `defect_${group}_${source}_step_${routeStep}`

  let severity: 1 | 2 | 3
  if (
    severityOverride === 1 ||
    severityOverride === 2 ||
    severityOverride === 3
  ) {
    severity = severityOverride
  } else {
    const roll = rng()
    severity = roll < 0.5 ? 1 : roll < 0.85 ? 2 : 3
  }

  const triggerIndex = Math.floor(rng() * TRIGGERS.length)
  const triggerAt = TRIGGERS[triggerIndex] || 'pre_gig'
  const triggerRouteStep = routeStep + 1

  return {
    id,
    group,
    severity,
    status: 'hidden',
    source,
    createdAtRouteStep: routeStep,
    triggerAt,
    triggerRouteStep
  }
}

/**
 * Public view of a defect that is safe for visual and ARIA renderers.
 */
export interface VisibleDefectView {
  id: string
  group: ConditionGroup
  severity: 1 | 2 | 3
  status: 'revealed' | 'triggered'
  source: 'field_repair' | 'improvise' | 'critical_wear'
}

/**
 * Extracts visible defects without leaking information about hidden defects.
 *
 * @param state - Current game state.
 * @returns Array of revealed or triggered defects only.
 */
export const getVisibleExpeditionDefects = (
  state: GameState
): VisibleDefectView[] => {
  const tc = state.expedition?.technicalCondition
  if (!tc || !Array.isArray(tc.defects)) return []

  const visible: VisibleDefectView[] = []
  for (const defect of tc.defects) {
    if (defect.status === 'revealed' || defect.status === 'triggered') {
      visible.push({
        id: defect.id,
        group: defect.group,
        severity: defect.severity,
        status: defect.status,
        source: defect.source
      })
    }
  }
  return visible
}

/**
 * Checks all eligible defects for an Expedition trigger boundary and applies damage.
 *
 * @param state - Current game state.
 * @param trigger - Current trigger phase (post_travel, pre_gig, post_gig).
 * @returns Updated game state with triggered defects and condition damage applied.
 */
export const evaluateExpeditionDefectTriggers = (
  state: GameState,
  trigger: HiddenDefectTrigger
): GameState => {
  if (state.expedition?.status !== 'active') return state

  const tc = getExpeditionTechnicalCondition(state)
  const currentRouteStep = state.expedition.routeStep ?? 0

  let conditionChanged = false
  const updatedTc = {
    ...tc,
    pa: tc.pa,
    instruments: tc.instruments,
    stageGear: tc.stageGear,
    defects: [...tc.defects]
  }

  for (let i = 0; i < updatedTc.defects.length; i++) {
    const defect = updatedTc.defects[i]
    if (!defect) continue

    if (
      (defect.status === 'hidden' || defect.status === 'revealed') &&
      defect.triggerAt === trigger &&
      defect.triggerRouteStep <= currentRouteStep
    ) {
      conditionChanged = true
      const damage = DEFECT_SEVERITY_DAMAGE[defect.severity] || 8
      updatedTc[defect.group] = clampCondition(updatedTc[defect.group] - damage)
      updatedTc.defects[i] = {
        ...defect,
        status: 'triggered'
      }
    }
  }

  if (!conditionChanged) return state

  return {
    ...state,
    expedition: {
      ...state.expedition,
      technicalCondition: updatedTc
    }
  }
}
