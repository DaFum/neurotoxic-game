import {
  EXPEDITION_CONTRACTS_BY_ID,
  MAX_NATIVE_EXPEDITION_CONTRACTS
} from '../../data/expedition/contracts'
import type { GameState } from '../../types'
import type {
  ExpeditionDoubleDownState,
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
      // An invariant, not a completion condition: breaching the cap fails the
      // obligation on the spot, but staying under it only counts at the run's
      // terminal checkpoint. Satisfying it on the first safe signal would
      // settle the reward while the rest of the run could still breach it.
      return {
        value,
        satisfied: !!evidence.finaleCompleted && value <= constraint.maxHeat,
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

/**
 * Whether the run's resolved obligation signals prove a rest stop.
 *
 * @param resolvedObligationSignalIds - The run's banked signal ids.
 * @returns True when any `rest:` signal was banked this run.
 */
export const hasExpeditionRestSignal = (
  resolvedObligationSignalIds: readonly string[]
): boolean =>
  resolvedObligationSignalIds.some(signalId => signalId.startsWith('rest:'))

/** The persisted run evidence a constraint's progress is re-derived from. */
export interface ExpeditionRunConstraintEvidence {
  heat: number
  resolvedObligationSignalIds: readonly string[]
  visitedNodeIds: readonly string[]
}

/**
 * What the run's persisted evidence alone already decides about a constraint.
 *
 * @param constraint - A materialized constraint.
 * @param evidence - Current Heat, banked signals and the walked path.
 * @returns Whether the evidence already satisfies or already breaks it.
 *
 * @remarks
 * The load sanitizer re-derives these verdicts on every load instead of
 * trusting persisted progress, so anything that creates an obligation mid-run
 * must refuse a constraint this already decides: one created `active` would
 * otherwise turn `failed` (or `completed`) on the next load, and run on
 * unchanged without one.
 */
export const getExpeditionConstraintRunVerdict = (
  constraint: ExpeditionContractConstraint,
  evidence: ExpeditionRunConstraintEvidence
): { satisfied: boolean; failed: boolean } => {
  switch (constraint.kind) {
    case 'max_heat':
      return { satisfied: false, failed: evidence.heat > constraint.maxHeat }
    case 'no_rest_before_finale':
      return {
        satisfied: false,
        failed: hasExpeditionRestSignal(evidence.resolvedObligationSignalIds)
      }
    case 'visit_node':
      return {
        satisfied: evidence.visitedNodeIds.includes(constraint.targetNodeId),
        failed: false
      }
    default:
      return { satisfied: false, failed: false }
  }
}

/**
 * Resolves the route node a template must commit, if it needs one.
 *
 * @param templateId - Canonical contract template id.
 * @param preparedMap - The prepared route.
 * @returns The target node id, or `null` for a template that needs none.
 *
 * @remarks
 * The build validator requires a route Contract to name its target and every
 * other Contract to name none. Which node that is is not the player's to pick:
 * it is the first node on the prepared route matching the template's rule, so
 * Tour Prep commits the same node the reducer would materialize.
 */
export const getExpeditionContractTargetNodeId = (
  templateId: string,
  preparedMap: MaterializationMap
): string | null => {
  const template = EXPEDITION_CONTRACTS_BY_ID.get(templateId)
  if (!template) return null
  const constraints = materializeContractConstraints(template, preparedMap)
  const visit = constraints?.find(
    constraint => constraint.kind === 'visit_node'
  )
  return visit?.kind === 'visit_node' ? visit.targetNodeId : null
}

/**
 * Materializes the committed native Contracts against the prepared route.
 *
 * @param commitments - The loadout's committed `{templateId, targetNodeId}` pairs.
 * @param map - The route START rebuilt from the canonical run seed.
 * @returns One entry per commitment; `template` or `constraints` is missing when
 * the commitment no longer materializes, which START treats as a refusal.
 */
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

/** Route step a `<kind>:<id>:<step>` signal id was banked at, else `null`. */
export const readExpeditionSignalStep = (signalId: string): number | null => {
  const tail = signalId.slice(signalId.lastIndexOf(':') + 1)
  return /^(?:0|[1-9]\d*)$/.test(tail) ? Number.parseInt(tail, 10) : null
}

/**
 * Whether a double-down can still be accepted at this step.
 *
 * @remarks
 * A restriction already broken by a signal banked at the same step would be
 * accepted already failed. Refusing it keeps load honest: every matching
 * signal at or after the acceptance step is then provably a later breach.
 */
export const isExpeditionDoubleDownAcceptable = (
  offer: Pick<ExpeditionDoubleDownState, 'addedConstraint'>,
  resolvedObligationSignalIds: readonly string[],
  routeStep: number
): boolean => {
  const prefix =
    offer.addedConstraint.kind === 'no_more_rest'
      ? 'rest:'
      : offer.addedConstraint.kind === 'social_silence'
        ? 'social_post:'
        : null
  if (prefix === null) return true
  return !resolvedObligationSignalIds.some(
    signalId =>
      signalId.startsWith(prefix) &&
      readExpeditionSignalStep(signalId) === routeStep
  )
}

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

/**
 * Derives the critical-Contract crisis signal for the G1B failure composer.
 *
 * @param state - Current game state.
 * @returns The breached obligation's source evidence, or `null`.
 *
 * @remarks
 * `tourEndingOnFailure` is the template's own declaration that breaching it
 * ends the run, so this reads the failed obligation rather than letting a
 * caller name one. Exported as a signal instead of terminating the run here:
 * `composeExpeditionFailureSignal` stays the single path from "something went
 * wrong" to "the run is over".
 */
export const getCriticalContractFailureSignal = (
  state: GameState
): { sourceId: string; expectedRouteStep: number } | null => {
  if (state.expedition?.status !== 'active') return null
  const breached = state.expedition.activeObligations.find(
    obligation =>
      obligation.status === 'failed' &&
      obligation.sourceType === 'native' &&
      EXPEDITION_CONTRACTS_BY_ID.get(obligation.sourceId)
        ?.tourEndingOnFailure === true
  )
  return breached
    ? { sourceId: breached.id, expectedRouteStep: state.expedition.routeStep }
    : null
}
