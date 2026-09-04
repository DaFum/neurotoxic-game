/**
 * Canonical insurance policies and claim lifecycle for Expedition runs.
 *
 * @remarks
 * Insurance is an optional risk-management sink, not mandatory upkeep.
 * Policies cover specific failure/breakdown classes and contain exclusions,
 * notably around Contraband and intentional sabotage Authority outcomes.
 *
 * Policies:
 * - roadside: €300 -> one vehicle rescue
 * - equipment: €350 -> one technical zero-Condition rescue to 25
 * - touring: €550 -> one rescue of either class
 *
 * Premiums are charged once at START via the protected-Cash boundary.
 * Run state stores only policy id and whether the claim has been consumed.
 */

import { EXPEDITION_TOW_FUEL_RESTORED } from './failure'
import { getExpeditionTechnicalCondition } from './condition'
import type { GameState } from '../../types'
import type {
  ConditionGroup,
  ExpeditionInsuranceClaimType,
  ExpeditionInsurancePolicy,
  ExpeditionInsurancePolicyId
} from '../../types/expedition'

export const EXPEDITION_INSURANCE_POLICIES: Record<
  ExpeditionInsurancePolicyId,
  ExpeditionInsurancePolicy
> = {
  roadside: {
    id: 'roadside',
    premium: 300,
    coverage: 'vehicle'
  },
  equipment: {
    id: 'equipment',
    premium: 350,
    coverage: 'technical'
  },
  touring: {
    id: 'touring',
    premium: 550,
    coverage: 'either'
  }
}

export const EXPEDITION_INSURANCE_POLICY_IDS: readonly ExpeditionInsurancePolicyId[] =
  ['roadside', 'equipment', 'touring']

export const getExpeditionInsurancePolicy = (
  policyId: unknown
): ExpeditionInsurancePolicy | null => {
  if (typeof policyId !== 'string') return null
  if (!Object.hasOwn(EXPEDITION_INSURANCE_POLICIES, policyId)) return null
  return EXPEDITION_INSURANCE_POLICIES[policyId as ExpeditionInsurancePolicyId]
}

export const getExpeditionInsurancePremium = (policyId: unknown): number => {
  const policy = getExpeditionInsurancePolicy(policyId)
  return policy ? policy.premium : 0
}

export const getAvailableInsurancePolicyIds = (
  _state?: GameState
): readonly ExpeditionInsurancePolicyId[] => EXPEDITION_INSURANCE_POLICY_IDS

export interface CanClaimInsuranceOptions {
  isContrabandOrSabotage?: boolean
}

export const canClaimExpeditionInsurance = (
  state: GameState,
  claimType: ExpeditionInsuranceClaimType,
  targetGroup?: ConditionGroup,
  options?: CanClaimInsuranceOptions
): boolean => {
  if (state.expedition?.status !== 'active') return false

  // Exclusion check: Contraband / intentional sabotage Authority outcomes are excluded
  if (options?.isContrabandOrSabotage === true) return false
  if (state.expedition.pendingFailure?.reason === 'authority_crisis')
    return false

  // Check claim not consumed
  if (
    state.expedition.insuranceClaimConsumed === true ||
    state.expedition.claimConsumed === true
  ) {
    return false
  }

  // Check policy
  const policyId =
    state.expedition.insurancePolicyId ??
    state.expedition.loadout?.insurancePolicyId
  const policy = getExpeditionInsurancePolicy(policyId)
  if (!policy) return false

  // Coverage check
  if (claimType === 'vehicle') {
    if (policy.coverage !== 'vehicle' && policy.coverage !== 'either') {
      return false
    }
    const fuel = state.player.van?.fuel ?? 0
    const condition = state.player.van?.condition ?? 0
    const isMobilityFailure =
      state.expedition.pendingFailure?.reason === 'fuel_stranded'
    if (fuel > 0 && condition > 0 && !isMobilityFailure) {
      return false
    }
    return true
  }

  if (claimType === 'technical') {
    if (policy.coverage !== 'technical' && policy.coverage !== 'either') {
      return false
    }
    const tc = getExpeditionTechnicalCondition(state)
    if (targetGroup) {
      if (!['pa', 'instruments', 'stageGear'].includes(targetGroup))
        return false
      return tc[targetGroup] === 0
    }
    return tc.pa === 0 || tc.instruments === 0 || tc.stageGear === 0
  }

  return false
}

export type InsuranceClaimResolution =
  | {
      ok: true
      claimType: ExpeditionInsuranceClaimType
      targetGroup?: ConditionGroup
      restoredValue: number
    }
  | {
      ok: false
      reason: string
    }

export const resolveExpeditionInsuranceClaim = (
  state: GameState,
  intent: {
    claimType: ExpeditionInsuranceClaimType
    targetGroup?: ConditionGroup
    isContrabandOrSabotage?: boolean
  }
): InsuranceClaimResolution => {
  if (
    !canClaimExpeditionInsurance(state, intent.claimType, intent.targetGroup, {
      isContrabandOrSabotage: intent.isContrabandOrSabotage
    })
  ) {
    return { ok: false, reason: 'CLAIM_INELIGIBLE' }
  }

  if (intent.claimType === 'vehicle') {
    return {
      ok: true,
      claimType: 'vehicle',
      restoredValue: EXPEDITION_TOW_FUEL_RESTORED
    }
  }

  if (intent.claimType === 'technical') {
    const targetGroup = intent.targetGroup
    if (!targetGroup) {
      return { ok: false, reason: 'TARGET_GROUP_REQUIRED' }
    }
    return {
      ok: true,
      claimType: 'technical',
      targetGroup,
      restoredValue: 25
    }
  }

  return { ok: false, reason: 'UNKNOWN_CLAIM_TYPE' }
}
