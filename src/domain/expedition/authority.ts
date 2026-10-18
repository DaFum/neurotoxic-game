import {
  canSpendExpeditionCash,
  getAvailableNativeContractTemplateIds
} from './loadout'
import type { GameState } from '../../types'
import type {
  ActiveObligationState,
  ExpeditionAuthorityExitId,
  ExpeditionMap,
  ExpeditionNativeContractCommitment,
  ExpeditionNodeClass
} from '../../types/expedition'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { EXPEDITION_CONTRACTS_BY_ID } from '../../data/expedition/contracts'
import { getExpeditionCargoView } from './cargo'
import { isCrewAvailable } from './crew'
import {
  areExpeditionContractsCompatible,
  getExpeditionConstraintRunVerdict,
  materializeContractConstraints
} from './contracts'
import { getActiveExpeditionMap } from './map'
import { applyCrewStressDelta, CREW_STRESS_SOURCE_DELTAS } from './crewStress'
import { getEffectiveExpeditionRules } from './effectiveRules'

export type { ExpeditionAuthorityExitId }

/** Every safe exit, in the order the encounter offers them. */
export const EXPEDITION_AUTHORITY_EXIT_IDS: readonly ExpeditionAuthorityExitId[] =
  [
    'pay',
    'crew',
    'hidden_compartment',
    'surrender_cargo',
    'route_detour',
    'future_obligation'
  ]

/** Heat at which the Authority corners the run: encounter, or crisis. */
const EXPEDITION_AUTHORITY_ENCOUNTER_HEAT = 90

/** Cash the `pay` exit costs. */
export const EXPEDITION_AUTHORITY_PAY_COST = 500

/** Fuel the `route_detour` exit burns. */
export const EXPEDITION_AUTHORITY_DETOUR_FUEL = 10

/**
 * Heat every executed safe exit removes.
 *
 * @remarks
 * The size of the existing `suppress` social result's Heat relief, and large
 * enough that one exit always takes a capped run (Heat 100) back under
 * {@link EXPEDITION_AUTHORITY_ENCOUNTER_HEAT}, so a paid exit actually ends
 * the encounter instead of asking for a second payment.
 */
export const EXPEDITION_AUTHORITY_EXIT_HEAT_RELIEF = 12

/**
 * What executing one exit costs, as resolved from the current state.
 *
 * @remarks
 * Produced by {@link resolveAuthoritySafeExit}, which is the only legality
 * check: availability lists the exits it resolves, and the reducer applies the
 * plan it resolves, so the two cannot drift apart.
 */
export type ExpeditionAuthorityExitPlan =
  | { exitId: 'pay'; cost: number }
  | { exitId: 'crew'; crewId: string; nextStress: number }
  | { exitId: 'hidden_compartment' }
  | { exitId: 'surrender_cargo' }
  | { exitId: 'route_detour'; fuelCost: number }
  | {
      exitId: 'future_obligation'
      commitment: ExpeditionNativeContractCommitment
      obligation: ActiveObligationState
    }

/** Heat the run is left at once an exit's relief applies. */
const getHeatAfterRelief = (state: GameState): number =>
  Math.max(
    0,
    finiteNumberOr(state.expedition.pressure.heat, 0) -
      EXPEDITION_AUTHORITY_EXIT_HEAT_RELIEF
  )

const resolveCrewExit = (
  state: GameState
): ExpeditionAuthorityExitPlan | null => {
  const crewIds = state.expedition.loadout?.crewIds ?? []
  const multiplier =
    getEffectiveExpeditionRules(state).numeric.crewStressMultiplier
  for (const crewId of crewIds) {
    const role = EXPEDITION_CREW_BY_ID[crewId]?.role
    if (role !== 'manager' && role !== 'security') continue
    // An unavailable or seriously injured member cannot talk the run out.
    if (!isCrewAvailable(state, crewId)) continue
    if (state.expedition.crew?.injuryByCrewId[crewId] === 'serious') continue
    const nextStress = applyCrewStressDelta(
      finiteNumberOr(state.expedition.crew?.stressByCrewId[crewId], 0),
      CREW_STRESS_SOURCE_DELTAS.authority_event,
      multiplier
    )
    // Talking the run out of trouble may not be what collapses the talker:
    // an exit that raises a Crew crisis is not a safe exit.
    if (nextStress < 100) return { exitId: 'crew', crewId, nextStress }
  }
  return null
}

/** Node classes whose show banks a `gig` obligation signal. */
const GIG_NODE_CLASSES: ReadonlySet<ExpeditionNodeClass> = new Set([
  'CLUB_GIG',
  'FESTIVAL',
  'FINALE'
])

/**
 * What the route still holds past the node the run stands on.
 *
 * @param map - The active route.
 * @param fromNodeId - The node the run stands on.
 * @returns Every node still reachable from it, and the most gig nodes any one
 * remaining path plays. The current node counts toward neither: whether its
 * show is still to come is not something the route can say.
 */
const getRouteAhead = (
  map: ExpeditionMap,
  fromNodeId: string
): { reachable: Set<string>; mostGigs: number } => {
  const next = new Map<string, string[]>()
  for (const edge of map.connections) {
    const list = next.get(edge.from)
    if (list) list.push(edge.to)
    else next.set(edge.from, [edge.to])
  }
  const reachable = new Set<string>()
  const mostGigsByNodeId = new Map<string, number>()
  const mostGigsFrom = (nodeId: string): number => {
    const known = mostGigsByNodeId.get(nodeId)
    if (known !== undefined) return known
    reachable.add(nodeId)
    let best = 0
    for (const to of next.get(nodeId) ?? [])
      best = Math.max(best, mostGigsFrom(to))
    const nodeClass = map.meta[nodeId]?.nodeClass
    const result = best + (nodeClass && GIG_NODE_CLASSES.has(nodeClass) ? 1 : 0)
    mostGigsByNodeId.set(nodeId, result)
    return result
  }
  let mostGigs = 0
  for (const to of next.get(fromNodeId) ?? [])
    mostGigs = Math.max(mostGigs, mostGigsFrom(to))
  return { reachable, mostGigs }
}

/**
 * The Contract the Authority would accept as a future obligation.
 *
 * @remarks
 * The first native template, in registry order, that the run could still
 * commit and still meet: unlocked and materializable on the played route (the
 * Tour Prep gate), compatible with every native Contract the run already holds
 * (which includes the slot limit), not tour-ending on failure (a safe exit may
 * not stake the run), with any route target still reachable and enough gigs
 * still ahead for a gig count, and not already decided by the evidence the
 * load sanitizer re-derives progress from, at the Heat the run is left at once
 * the exit applies.
 */
const resolveFutureObligationExit = (
  state: GameState
): ExpeditionAuthorityExitPlan | null => {
  const runId = state.expedition.runId
  const map = getActiveExpeditionMap(state)
  const loadout = state.expedition.loadout
  const currentNodeId = state.expedition.visitedNodeIds.at(-1)
  if (
    typeof runId !== 'string' ||
    !map ||
    !loadout ||
    currentNodeId === undefined
  )
    return null
  const heldIds = state.expedition.activeObligations
    .filter(obligation => obligation.sourceType === 'native')
    .map(obligation => obligation.sourceId)
  const ahead = getRouteAhead(map, currentNodeId)
  const runEvidence = {
    heat: getHeatAfterRelief(state),
    resolvedObligationSignalIds: state.expedition.resolvedObligationSignalIds,
    visitedNodeIds: state.expedition.visitedNodeIds
  }
  for (const templateId of getAvailableNativeContractTemplateIds(state, map)) {
    const template = EXPEDITION_CONTRACTS_BY_ID.get(templateId)
    if (!template || template.tourEndingOnFailure) continue
    if (!areExpeditionContractsCompatible([...heldIds, templateId])) continue
    const constraints = materializeContractConstraints(template, map)
    if (!constraints) continue
    let targetNodeId: string | null = null
    let viable = true
    for (const constraint of constraints) {
      if (constraint.kind === 'visit_node') {
        targetNodeId = constraint.targetNodeId
        if (!ahead.reachable.has(constraint.targetNodeId)) viable = false
      }
      if (
        constraint.kind === 'gig_accuracy_count' &&
        ahead.mostGigs < constraint.requiredCount
      )
        viable = false
      const verdict = getExpeditionConstraintRunVerdict(constraint, runEvidence)
      if (verdict.failed || verdict.satisfied) viable = false
    }
    if (!viable) continue
    const progressByConstraintId: ActiveObligationState['progressByConstraintId'] =
      Object.create(null)
    for (const constraint of constraints)
      progressByConstraintId[constraint.id] = {
        constraintId: constraint.id,
        value: 0,
        satisfied: false,
        failed: false
      }
    return {
      exitId: 'future_obligation',
      commitment: { templateId, targetNodeId },
      obligation: {
        id: `${runId}:${templateId}`,
        sourceType: 'native',
        sourceId: templateId,
        constraints,
        progressByConstraintId,
        status: 'active',
        settled: false,
        doubleDown: null
      }
    }
  }
  return null
}

/**
 * Resolves one Authority safe exit into what executing it would cost.
 *
 * @param state - Current game state.
 * @param exitId - The exit to check.
 * @returns The execution plan, or `null` when the exit is not legal now.
 */
export const resolveAuthoritySafeExit = (
  state: GameState,
  exitId: ExpeditionAuthorityExitId
): ExpeditionAuthorityExitPlan | null => {
  switch (exitId) {
    case 'pay':
      return canSpendExpeditionCash(state, EXPEDITION_AUTHORITY_PAY_COST)
        ? { exitId, cost: EXPEDITION_AUTHORITY_PAY_COST }
        : null
    case 'crew':
      return resolveCrewExit(state)
    case 'hidden_compartment':
      // The compartment hides contraband that is actually aboard, and the
      // trick works once per run: without either gate a build with a hidden
      // module would hold a free, endless Heat relief.
      return state.expedition.authorityHiddenCompartmentUsed !== true &&
        getExpeditionCargoView(state).hiddenSlotsUsed > 0
        ? { exitId }
        : null
    case 'surrender_cargo':
      return (state.expedition.cargo?.contraband.length ?? 0) > 0
        ? { exitId }
        : null
    case 'route_detour':
      return finiteNumberOr(state.player.van?.fuel, 0) >=
        EXPEDITION_AUTHORITY_DETOUR_FUEL
        ? { exitId, fuelCost: EXPEDITION_AUTHORITY_DETOUR_FUEL }
        : null
    case 'future_obligation':
      return resolveFutureObligationExit(state)
    default:
      return null
  }
}

export const getAvailableAuthoritySafeExits = (
  state: GameState
): ExpeditionAuthorityExitId[] =>
  EXPEDITION_AUTHORITY_EXIT_IDS.filter(
    exitId => resolveAuthoritySafeExit(state, exitId) !== null
  )

/**
 * The live Authority encounter: cornered, but with a way out.
 *
 * @param state - Current game state.
 * @returns The executable exits and the stale guard, or `null`.
 *
 * @remarks
 * The complement of {@link getAuthorityCrisisSignal} at the same threshold:
 * with an executable exit the run gets a decision, without one a crisis.
 */
export const getAuthorityEncounter = (
  state: GameState
): {
  exits: ExpeditionAuthorityExitId[]
  expectedRouteStep: number
} | null => {
  if (
    state.expedition.status !== 'active' ||
    finiteNumberOr(state.expedition.pressure.heat, 0) <
      EXPEDITION_AUTHORITY_ENCOUNTER_HEAT
  )
    return null
  const exits = getAvailableAuthoritySafeExits(state)
  return exits.length > 0
    ? { exits, expectedRouteStep: state.expedition.routeStep }
    : null
}

/**
 * Whether the Ghost Route Legendary is still standing as a way out.
 *
 * @param state - Current game state.
 * @returns True when it is owned and this run has not spent it.
 *
 * @remarks
 * Local rather than imported from `./legendaries`, which reads the exit list
 * above to decide whether the Authority situation is severe enough to convert:
 * asking that module here would make the two mutually recursive. Ownership and
 * consumption are plain state reads, so there is nothing to share.
 */
const holdsUnspentGhostRoute = (state: GameState): boolean =>
  Array.isArray(state.career?.legendaryIds) &&
  state.career.legendaryIds.includes('ghost_route') &&
  !(state.expedition.consumedLegendaryIds ?? []).includes('ghost_route')

export const getAuthorityCrisisSignal = (
  state: GameState
): { sourceId: string; expectedRouteStep: number } | null =>
  state.expedition.status === 'active' &&
  state.expedition.pressure.heat >= EXPEDITION_AUTHORITY_ENCOUNTER_HEAT &&
  // Ghost Route is the deterministic Underground alternative, so while it is
  // unspent the situation is a detour rather than a crisis. It is not in the
  // exit list itself: that list is what tells the Legendary the pressure got
  // severe enough to convert, and an exit it added would answer its own
  // question.
  !holdsUnspentGhostRoute(state) &&
  getAvailableAuthoritySafeExits(state).length === 0
    ? {
        sourceId: `authority:${state.expedition.runId}:${state.expedition.routeStep}`,
        expectedRouteStep: state.expedition.routeStep
      }
    : null
