import {
  EXPEDITION_CONTRACTS_BY_ID,
  MAX_NATIVE_EXPEDITION_CONTRACTS
} from '../../data/expedition/contracts'
import type {
  ActiveObligationState,
  ExpeditionContractConstraint,
  ExpeditionContractTemplate,
  ExpeditionMap,
  ExpeditionNativeContractCommitment
} from '../../types/expedition'
import { hashExpeditionRoute } from './map'

export const areExpeditionContractsCompatible = (
  ids: readonly string[]
): boolean => {
  if (
    ids.length > MAX_NATIVE_EXPEDITION_CONTRACTS ||
    new Set(ids).size !== ids.length
  )
    return false
  if (ids.includes('contract_keep_it_clean') && ids.includes('contract_all_in'))
    return false
  let routeTargets = 0
  for (const id of ids) {
    const template = EXPEDITION_CONTRACTS_BY_ID.get(id)
    if (!template) return false
    if (
      template.constraints.some(
        constraint => constraint.kind === 'visit_matching_node'
      )
    )
      routeTargets += 1
  }
  return routeTargets <= 1
}

type MaterializationMap = Pick<ExpeditionMap, 'nodeOrder' | 'meta'>
export const materializeContractConstraints = (
  template: ExpeditionContractTemplate | undefined,
  preparedMap: MaterializationMap,
  committedTargetNodeId?: string | null
): ExpeditionContractConstraint[] | null => {
  if (!template) return null
  const result: ExpeditionContractConstraint[] = []
  for (const constraint of template.constraints) {
    if (constraint.kind !== 'visit_matching_node') {
      result.push(constraint)
      continue
    }
    const matches = preparedMap.nodeOrder.filter(nodeId => {
      const meta = preparedMap.meta[nodeId]
      return (
        !!meta &&
        (!constraint.routeTargetRule.nodeType ||
          meta.nodeClass === constraint.routeTargetRule.nodeType) &&
        (!constraint.routeTargetRule.subtype ||
          meta.specialSubtype === constraint.routeTargetRule.subtype)
      )
    })
    const targetNodeId = committedTargetNodeId ?? matches[0]
    if (!targetNodeId || !matches.includes(targetNodeId)) return null
    result.push({ id: constraint.id, kind: 'visit_node', targetNodeId })
  }
  return result
}

export interface ExpeditionConstraintEvidence {
  accuracy?: number
  heat?: number
  visitedNodeId?: string
  rested?: boolean
  finaleCompleted?: boolean
  socialPosts?: number
  finaleProfileId?: string
}
export const evaluateExpeditionConstraint = (
  constraint: ExpeditionContractConstraint,
  evidence: ExpeditionConstraintEvidence
): { value: number; satisfied: boolean; failed: boolean } => {
  switch (constraint.kind) {
    case 'gig_accuracy_count': {
      const value = (evidence.accuracy ?? -1) >= constraint.minAccuracy ? 1 : 0
      return {
        value,
        satisfied: value >= constraint.requiredCount,
        failed: false
      }
    }
    case 'max_heat': {
      const value = evidence.heat ?? 0
      return {
        value,
        satisfied: value <= constraint.maxHeat,
        failed: value > constraint.maxHeat
      }
    }
    case 'visit_node': {
      const satisfied = evidence.visitedNodeId === constraint.targetNodeId
      return { value: satisfied ? 1 : 0, satisfied, failed: false }
    }
    case 'no_rest_before_finale':
      return {
        value: evidence.rested ? 1 : 0,
        satisfied: !!evidence.finaleCompleted && !evidence.rested,
        failed: !!evidence.rested
      }
    case 'finale_completed': {
      const heatOk =
        constraint.minHeatAtFinale === null ||
        (evidence.heat ?? 0) >= constraint.minHeatAtFinale
      return {
        value: evidence.finaleCompleted ? 1 : 0,
        satisfied: !!evidence.finaleCompleted && heatOk,
        failed: !!evidence.finaleCompleted && !heatOk
      }
    }
    case 'social_post_count': {
      const value = evidence.socialPosts ?? 0
      return {
        value,
        satisfied: value >= constraint.requiredCount,
        failed: false
      }
    }
    case 'special_finale': {
      const satisfied = evidence.finaleProfileId === constraint.profileId
      return {
        value: satisfied ? 1 : 0,
        satisfied,
        failed: !!evidence.finaleCompleted && !satisfied
      }
    }
  }
}

export const materializeCommittedContracts = (
  commitments: readonly ExpeditionNativeContractCommitment[],
  map: MaterializationMap
) =>
  commitments.map(commitment => ({
    commitment,
    template: EXPEDITION_CONTRACTS_BY_ID.get(commitment.templateId),
    constraints: materializeContractConstraints(
      EXPEDITION_CONTRACTS_BY_ID.get(commitment.templateId),
      map,
      commitment.targetNodeId
    )
  }))

export const deriveExpeditionDoubleDownOffer = (
  runSeed: number,
  obligationId: string,
  routeStep: number
): NonNullable<ActiveObligationState['doubleDown']> => {
  const derivationKey = `${runSeed}:${obligationId}:${routeStep}`
  const options = [
    {
      addedConstraint: { kind: 'no_more_rest' } as const,
      rewardMultiplier: 1.25 as const,
      failureHeatBonus: 8
    },
    {
      addedConstraint: { kind: 'heat_cap', maxHeat: 60 } as const,
      rewardMultiplier: 1.35 as const,
      failureHeatBonus: 12
    },
    {
      addedConstraint: { kind: 'finale_required' } as const,
      rewardMultiplier: 1.35 as const,
      failureHeatBonus: 15
    },
    {
      addedConstraint: { kind: 'social_silence', maxPosts: 0 } as const,
      rewardMultiplier: 1.25 as const,
      failureHeatBonus: 10
    }
  ] as const
  const picked =
    options[
      Number.parseInt(hashExpeditionRoute(derivationKey), 16) % options.length
    ] ?? options[0]
  return {
    acceptedOfferId: hashExpeditionRoute(
      `${derivationKey}:${picked.addedConstraint.kind}`
    ),
    derivationKey,
    addedConstraint: picked.addedConstraint,
    rewardMultiplier: picked.rewardMultiplier,
    failureHeatBonus: picked.failureHeatBonus,
    acceptedAtRouteStep: routeStep
  }
}
