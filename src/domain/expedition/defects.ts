/**
 * Hidden defect domain logic and lifecycle management.
 *
 * @remarks
 * Manages deterministic creation, trigger evaluation, and leak-free views of
 * hidden, revealed, triggered, and resolved equipment defects.
 */

import type {
  ConditionGroup,
  ExpeditionTechnicalCondition,
  HiddenDefectState,
  HiddenDefectTrigger
} from '../../types/expedition'
import type { GameState } from '../../types'
import { clampCondition, getExpeditionTechnicalCondition } from './condition'
import { mulberry32 } from '../../utils/seededRng'
import { pickIndex } from '../../utils/selectionUtils'

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

  const triggerIndex = pickIndex(TRIGGERS, rng)
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
 * Replaces one defect entry, returning the next technical condition.
 *
 * @param tc - Current technical condition.
 * @param index - Index of the defect being transitioned.
 * @param defect - The transitioned defect.
 * @returns A copy of `tc` with the defect list updated.
 */
const withDefectAt = (
  tc: ExpeditionTechnicalCondition,
  index: number,
  defect: HiddenDefectState
): ExpeditionTechnicalCondition => {
  const defects = [...tc.defects]
  defects[index] = defect
  return { ...tc, defects }
}

/**
 * Reveals one hidden defect (`hidden` -\> `revealed`).
 *
 * @param tc - Current technical condition.
 * @param defectId - Defect to reveal.
 * @returns The next technical condition, or `null` when the defect is unknown
 * or not hidden.
 *
 * @remarks
 * The single reveal transition: `REVEAL_EXPEDITION_DEFECT` and every inspection
 * that reveals defects go through here.
 */
export const applyExpeditionDefectReveal = (
  tc: ExpeditionTechnicalCondition,
  defectId: string
): ExpeditionTechnicalCondition | null => {
  const index = tc.defects.findIndex(d => d.id === defectId)
  const defect = index === -1 ? undefined : tc.defects[index]
  if (!defect || defect.status !== 'hidden') return null
  return withDefectAt(tc, index, { ...defect, status: 'revealed' })
}

/**
 * Triggers one defect (`hidden`/`revealed` -\> `triggered`) and applies its
 * severity damage to the defect's group.
 *
 * @param tc - Current technical condition.
 * @param defectId - Defect to trigger.
 * @returns The next technical condition, or `null` when the defect is unknown,
 * already triggered or resolved.
 *
 * @remarks
 * The single trigger transition and the only place severity damage is applied:
 * `TRIGGER_EXPEDITION_DEFECT` and the automatic boundary sweep in
 * {@link evaluateExpeditionDefectTriggers} both go through here.
 */
export const applyExpeditionDefectTrigger = (
  tc: ExpeditionTechnicalCondition,
  defectId: string
): ExpeditionTechnicalCondition | null => {
  const index = tc.defects.findIndex(d => d.id === defectId)
  const defect = index === -1 ? undefined : tc.defects[index]
  if (
    !defect ||
    defect.status === 'triggered' ||
    defect.status === 'resolved'
  ) {
    return null
  }
  const damage = DEFECT_SEVERITY_DAMAGE[defect.severity] || 8
  return {
    ...withDefectAt(tc, index, { ...defect, status: 'triggered' }),
    [defect.group]: clampCondition(tc[defect.group] - damage)
  }
}

/**
 * Resolves one defect (any unresolved status -\> `resolved`).
 *
 * @param tc - Current technical condition.
 * @param defectId - Defect to resolve.
 * @returns The next technical condition, or `null` when the defect is unknown
 * or already resolved.
 *
 * @remarks
 * The single resolve transition: `RESOLVE_EXPEDITION_DEFECT` and the repair
 * paths (professional, cannibalize, full-service repair) go through here. Which
 * defects a repair may resolve is the repair's own rule; this only performs it.
 */
export const applyExpeditionDefectResolution = (
  tc: ExpeditionTechnicalCondition,
  defectId: string
): ExpeditionTechnicalCondition | null => {
  const index = tc.defects.findIndex(d => d.id === defectId)
  const defect = index === -1 ? undefined : tc.defects[index]
  if (!defect || defect.status === 'resolved') return null
  return withDefectAt(tc, index, { ...defect, status: 'resolved' })
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

  let updatedTc = tc
  for (const defect of tc.defects) {
    if (
      (defect.status === 'hidden' || defect.status === 'revealed') &&
      defect.triggerAt === trigger &&
      defect.triggerRouteStep <= currentRouteStep
    ) {
      updatedTc =
        applyExpeditionDefectTrigger(updatedTc, defect.id) ?? updatedTc
    }
  }

  if (updatedTc === tc) return state

  return {
    ...state,
    expedition: {
      ...state.expedition,
      technicalCondition: updatedTc
    }
  }
}
