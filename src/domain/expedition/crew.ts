import type { GameState } from '../../types'
import type { ExpeditionNumericRules } from '../../types/expedition'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'

export const isCrewAvailable = (state: GameState, crewId: string): boolean => {
  if (!Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId)) return false
  const debt = state.career.crewRecoveryDebtById[crewId]
  const career = state.career.crewById[crewId]
  return (
    !debt &&
    (!career ||
      career.unavailableUntilCompletedRunCount <=
        state.career.completedExpeditionRuns)
  )
}

export const validateExpeditionCrewSelection = (
  state: GameState,
  crewIds: readonly string[]
):
  | { valid: true; crewIds: string[] }
  | { valid: false; reason: 'TOO_MANY' | 'DUPLICATE' | 'UNAVAILABLE' } => {
  if (crewIds.length > 3) return { valid: false, reason: 'TOO_MANY' }
  if (new Set(crewIds).size !== crewIds.length)
    return { valid: false, reason: 'DUPLICATE' }
  if (crewIds.some(id => !isCrewAvailable(state, id)))
    return { valid: false, reason: 'UNAVAILABLE' }
  return { valid: true, crewIds: [...crewIds] }
}

export const getCrewRuleContribution = (
  state: GameState
): Partial<ExpeditionNumericRules> => {
  const result: Partial<ExpeditionNumericRules> = {}
  const selected = state.expedition.loadout?.crewIds ?? []
  for (const id of selected) {
    if (!isCrewAvailable(state, id)) continue
    const injury = state.expedition.crew?.injuryByCrewId[id] ?? 'none'
    const factor = injury === 'serious' ? 0 : injury === 'light' ? 0.5 : 1
    const crew = EXPEDITION_CREW_BY_ID[id]
    if (!crew || factor === 0) continue
    const signatureTraitId = state.career.crewById[id]?.signatureTraitId
    if (crew.role === 'technician') {
      result.fieldRepairEfficiency =
        (result.fieldRepairEfficiency ?? 0) + 0.2 * factor
      result.technicalWearMultiplier =
        (result.technicalWearMultiplier ?? 1) * (1 - 0.1 * factor)
      if (signatureTraitId === 'signature_field_surgeon') {
        result.fieldRepairEfficiency =
          (result.fieldRepairEfficiency ?? 0) + 0.1 * factor
      }
    } else if (crew.role === 'roadie') {
      result.technicalWearMultiplier =
        (result.technicalWearMultiplier ?? 1) * (1 - 0.08 * factor)
      result.crewStressMultiplier =
        (result.crewStressMultiplier ?? 1) * (1 - 0.05 * factor)
      if (signatureTraitId === 'signature_load_master') {
        result.technicalWearMultiplier =
          (result.technicalWearMultiplier ?? 1) * (1 - 0.05 * factor)
      }
    } else if (crew.role === 'driver') {
      result.fuelConsumptionMultiplier =
        (result.fuelConsumptionMultiplier ?? 1) * (1 - 0.1 * factor)
      result.roadWearMultiplier =
        (result.roadWearMultiplier ?? 1) * (1 - 0.1 * factor)
      if (signatureTraitId === 'signature_night_driver') {
        result.fuelConsumptionMultiplier =
          (result.fuelConsumptionMultiplier ?? 1) * (1 - 0.05 * factor)
        result.roadWearMultiplier =
          (result.roadWearMultiplier ?? 1) * (1 - 0.05 * factor)
      }
    } else if (crew.role === 'manager') {
      result.contractRewardMultiplier =
        (result.contractRewardMultiplier ?? 1) * (1 + 0.1 * factor)
      result.exposureGainMultiplier =
        (result.exposureGainMultiplier ?? 1) * (1 - 0.05 * factor)
      if (signatureTraitId === 'signature_dealmaker') {
        result.contractRewardMultiplier =
          (result.contractRewardMultiplier ?? 1) * (1 + 0.05 * factor)
      }
    } else if (crew.role === 'security') {
      result.authorityEventWeightMultiplier =
        (result.authorityEventWeightMultiplier ?? 1) * (1 - 0.15 * factor)
      result.heatGainMultiplier =
        (result.heatGainMultiplier ?? 1) * (1 - 0.1 * factor)
      if (signatureTraitId === 'signature_cool_head') {
        result.crewStressMultiplier =
          (result.crewStressMultiplier ?? 1) * (1 - 0.1 * factor)
      }
    }
  }
  return result
}
