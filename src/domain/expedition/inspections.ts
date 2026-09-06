/**
 * Inspection domain logic and resolution for Expedition tours.
 *
 * @remarks
 * Manages physical inspection modes (quick_check, crew_inspection,
 * module_inspection, full_service) for defect detection and diagnostics.
 */

import type { BandMember, GameState } from '../../types'
import type {
  ExpeditionInspectionIntent,
  ExpeditionInspectionResolution,
  ExpeditionInspectionResult
} from '../../types/expedition'
import { canSpendExpeditionCash } from './loadout'
import { getEffectiveExpeditionRules } from './effectiveRules'
import { aggregateExpeditionModuleProfiles } from './modules'
import { isExpeditionServiceLocation, resolveExpeditionRepair } from './repairs'
import { getExpeditionTechnicalCondition } from './condition'

/**
 * Baseline flat diagnostic fee for professional full service.
 */
export const DIAGNOSTIC_FEE_BASE = 150

/**
 * Maps numeric equipment condition (0..100) to its descriptive condition band.
 *
 * @param condition - Numeric condition value.
 * @returns Descriptive band string.
 */
export const getConditionBand = (
  condition: number
): 'optimal' | 'degraded' | 'critical' | 'disabled' => {
  if (condition <= 0) return 'disabled'
  if (condition < 40) return 'critical'
  if (condition < 70) return 'degraded'
  return 'optimal'
}

/**
 * Checks whether the active expedition state has an eligible technician or roadie crew member.
 *
 * @param state - Current game state.
 * @param crewId - Optional specific crew ID to evaluate.
 * @returns True if an eligible technician or roadie is present and available.
 */
const hasEligibleInspectionCrew = (
  state: GameState,
  crewId?: string
): boolean => {
  const isEligibleRole = (role?: string) =>
    role === 'technician' || role === 'roadie'

  const isEligibleId = (id?: string) =>
    typeof id === 'string' &&
    (id === 'technician' ||
      id === 'roadie' ||
      id.includes('technician') ||
      id.includes('roadie'))

  if (crewId) {
    const committed = state.expedition?.loadout?.crewIds?.includes(crewId)
    if (isEligibleId(crewId) && committed) return true
    const member = state.band?.members?.find((m: BandMember) => m.id === crewId)
    return Boolean(committed && member && isEligibleRole(member.role))
  }

  const committedCrew = state.expedition?.loadout?.crewIds ?? []
  for (const id of committedCrew) {
    if (isEligibleId(id)) return true
    const member = state.band?.members?.find((m: BandMember) => m.id === id)
    if (member && isEligibleRole(member.role)) return true
  }

  return (
    state.band?.members?.some(
      (m: BandMember) => isEligibleRole(m.role) || isEligibleId(m.id)
    ) ?? false
  )
}

/**
 * Pure resolver evaluating an inspection intent against active expedition state.
 *
 * @param state - Current game state.
 * @param intent - Candidate inspection intent.
 * @returns Detailed resolution result or failure reason.
 */
export const resolveExpeditionInspection = (
  state: GameState,
  intent: ExpeditionInspectionIntent
): ExpeditionInspectionResolution => {
  if (state.expedition?.status !== 'active') {
    return { ok: false, reason: 'RUN_NOT_ACTIVE' }
  }

  const tc = getExpeditionTechnicalCondition(state)

  switch (intent.mode) {
    case 'quick_check': {
      return {
        ok: true,
        result: {
          mode: 'quick_check',
          diagnosticFee: 0,
          revealedDefectIds: [],
          conditionBands: {
            pa: getConditionBand(tc.pa),
            instruments: getConditionBand(tc.instruments),
            stageGear: getConditionBand(tc.stageGear)
          }
        }
      }
    }

    case 'crew_inspection': {
      if (!hasEligibleInspectionCrew(state, intent.crewId)) {
        return { ok: false, reason: 'NO_ELIGIBLE_CREW' }
      }

      const defects = Array.isArray(tc.defects) ? tc.defects : []
      const firstHidden = defects.find(d => d.status === 'hidden')
      return {
        ok: true,
        result: {
          mode: 'crew_inspection',
          diagnosticFee: 0,
          revealedDefectIds: firstHidden ? [firstHidden.id] : []
        }
      }
    }

    case 'module_inspection': {
      const moduleIds =
        state.expedition?.loadout?.build?.selectedTourbusModuleIds ?? []
      const moduleProfile = aggregateExpeditionModuleProfiles(moduleIds)

      if (moduleProfile.inspectionLevel < 1) {
        return { ok: false, reason: 'MODULE_INSPECTION_UNAVAILABLE' }
      }

      const defects = Array.isArray(tc.defects) ? tc.defects : []
      const firstHidden = defects.find(d => d.status === 'hidden')
      return {
        ok: true,
        result: {
          mode: 'module_inspection',
          diagnosticFee: 0,
          revealedDefectIds: firstHidden ? [firstHidden.id] : []
        }
      }
    }

    case 'full_service': {
      if (!isExpeditionServiceLocation(state)) {
        return { ok: false, reason: 'SERVICE_LOCATION_REQUIRED' }
      }

      const rules = getEffectiveExpeditionRules(state)
      const diagnosticFee = Math.ceil(
        DIAGNOSTIC_FEE_BASE * rules.numeric.repairCostMultiplier
      )

      let professionalRepair: ExpeditionInspectionResult['professionalRepair']
      let totalCost = diagnosticFee

      if (intent.repairTargetGroup) {
        const repairRes = resolveExpeditionRepair(state, {
          mode: 'professional',
          targetGroup: intent.repairTargetGroup,
          expectedRouteStep: intent.expectedRouteStep
        })

        if (!repairRes.ok) {
          return { ok: false, reason: repairRes.reason }
        }

        professionalRepair = repairRes.result
        totalCost += professionalRepair.moneyCost
      }

      if (!canSpendExpeditionCash(state, totalCost)) {
        return { ok: false, reason: 'INSUFFICIENT_FUNDS' }
      }

      const defects = Array.isArray(tc.defects) ? tc.defects : []
      const hiddenDefects = defects.filter(d => d.status === 'hidden')
      return {
        ok: true,
        result: {
          mode: 'full_service',
          diagnosticFee,
          revealedDefectIds: hiddenDefects.map(d => d.id),
          ...(professionalRepair ? { professionalRepair } : {})
        }
      }
    }

    default:
      return { ok: false, reason: 'INVALID_INSPECTION_MODE' }
  }
}
