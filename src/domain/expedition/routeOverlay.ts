/**
 * Effective route overlay for Roguelite Expedition.
 *
 * @remarks
 * The base route built by `buildExpeditionMap` is the run's immutable
 * structural identity - START's parity check hashes it, and a contract that
 * committed a target node must keep pointing at the same node for the whole
 * run. So run-scoped opportunities never edit the map: they are composed on
 * top of it here, and every reader that asks "may the run move there?" asks
 * this resolver instead of `map.connections`.
 */

import type { GameState } from '../../types'
import type {
  ExpeditionMap,
  ExpeditionSpecialNodeSubtype
} from '../../types/expedition'
import { hashExpeditionRoute } from './map'
import {
  deriveExpeditionGhostRouteTarget,
  deriveExpeditionNemesisKeyTarget
} from './legendaries'

/**
 * The route as the run may actually travel it right now.
 */
export interface ExpeditionEffectiveRoute {
  /** Base edges plus any run-scoped overlay edges. */
  connections: ReadonlyArray<{ from: string; to: string }>
  /** Subtypes the overlay adds, keyed by node. The base meta is untouched. */
  subtypeByNodeId: Readonly<Record<string, ExpeditionSpecialNodeSubtype>>
}

/**
 * Picks the deterministic node one step deeper that the base route does not
 * already reach from where the run stands.
 *
 * @param state - Current game state.
 * @param map - The canonical base route.
 * @param salt - Distinguishes one overlay source from another.
 * @returns A node id, or `null` when the run has no unreached neighbour.
 *
 * @remarks
 * A node the base route cannot reach from here is the better prize, so those
 * are preferred; on a route whose adjacent steps are already fully connected
 * there are none, and the overlay falls back to a reachable node, which it
 * then carries as a *subtype* change rather than a new edge. Both are what the
 * plan means by an effective edge/subtype overlay. Seeded from `runSeed`, so
 * the same run resolves the same target every time.
 */
export const deriveExpeditionOverlayTarget = (
  state: GameState,
  map: ExpeditionMap,
  salt: string
): string | null =>
  deriveExpeditionOverlayTargetFrom(
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1],
    state.expedition.routeStep,
    state.runSeed,
    map,
    salt
  )

/**
 * The seeded derivation itself, independent of `GameState`.
 *
 * @param from - Node the run currently stands on.
 * @param routeStep - Route step the run is at.
 * @param runSeed - The run's seed.
 * @param map - The canonical base route.
 * @param salt - Which overlay source is asking.
 * @returns The node the overlay would target, or `null`.
 *
 * @remarks
 * Split out so the load sanitizer can re-derive a persisted opportunity's
 * target without a full state: a save that names a different next-step node is
 * then rejected instead of being handed an edge the run never earned.
 */
export const deriveExpeditionOverlayTargetFrom = (
  from: unknown,
  routeStep: number,
  runSeed: number | undefined,
  map: ExpeditionMap,
  salt: string
): string | null => {
  if (typeof from !== 'string' || !Number.isFinite(runSeed)) return null
  const nextRouteStep = routeStep + 1
  const alreadyReachable = new Set(
    map.connections.filter(edge => edge.from === from).map(edge => edge.to)
  )
  const atNextStep = map.nodeOrder.filter(
    nodeId => map.meta[nodeId]?.routeStep === nextRouteStep
  )
  const unreached = atNextStep.filter(nodeId => !alreadyReachable.has(nodeId))
  const candidates = unreached.length > 0 ? unreached : atNextStep
  if (candidates.length === 0) return null
  const index =
    Number.parseInt(hashExpeditionRoute(`${runSeed}:${salt}:${from}`), 16) %
    candidates.length
  return candidates[index] ?? null
}

/**
 * Resolves the route the run may currently travel.
 *
 * @param state - Current game state.
 * @param map - The canonical base route.
 * @returns Base edges plus the active overlay, and the subtypes it adds.
 *
 * @remarks
 * Four sources contribute. A high-Heat Underground invite opens the detour the
 * Pressure Director banked, which is what turns Heat into an opportunity
 * rather than only a penalty. A Rival at Nemesis level 2 or above opens a
 * Rival shortcut, which is the tier's "changes real rules" effect. The Ghost
 * Route Legendary opens the Underground way out of an Authority crisis, and
 * the Nemesis Key Legendary opens the only two-step jump in the run.
 *
 * Every one of them is additive: an overlay never removes a base edge, so it
 * cannot strand a run. None of them reaches `buildExpeditionMap`, so `mapHash`
 * is the same with and without them.
 */
export const getEffectiveExpeditionRoute = (
  state: GameState,
  map: ExpeditionMap
): ExpeditionEffectiveRoute => {
  if (state.expedition?.status !== 'active') {
    return { connections: map.connections, subtypeByNodeId: {} }
  }
  const from =
    state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]
  if (typeof from !== 'string') {
    return { connections: map.connections, subtypeByNodeId: {} }
  }

  const extraConnections: Array<{ from: string; to: string }> = []
  const subtypeByNodeId: Record<string, ExpeditionSpecialNodeSubtype> =
    Object.create(null)

  const addOverlay = (
    nodeId: string | null,
    subtype: ExpeditionSpecialNodeSubtype,
    stepsAhead = 1
  ): void => {
    if (
      nodeId === null ||
      !Object.hasOwn(map.meta, nodeId) ||
      map.meta[nodeId]?.routeStep !== state.expedition.routeStep + stepsAhead ||
      Object.hasOwn(subtypeByNodeId, nodeId)
    ) {
      return
    }
    // The subtype is the opportunity; the edge is only added when the base
    // route could not already get there, so an overlay never duplicates an
    // existing connection.
    subtypeByNodeId[nodeId] = subtype
    if (!map.connections.some(edge => edge.from === from && edge.to === nodeId))
      extraConnections.push({ from, to: nodeId })
  }

  const opportunity = state.expedition.pressure.temporaryRouteOpportunity
  if (opportunity) addOverlay(opportunity.targetNodeId, opportunity.subtype)

  const rivalRecord = state.rivalBand
    ? state.career.rivalsById[state.rivalBand.id]
    : undefined
  if ((rivalRecord?.history.nemesisLevel ?? 0) >= 2) {
    addOverlay(
      deriveExpeditionOverlayTarget(state, map, 'nemesis_shortcut'),
      'RIVAL_ENCOUNTER'
    )
  }

  // Ghost Route before Nemesis Key: the Authority crisis is the more urgent
  // of the two, and a node claimed by one overlay is not re-claimed by the
  // other, so an escape is never traded for a jump.
  addOverlay(deriveExpeditionGhostRouteTarget(state, map), 'UNDERGROUND_MARKET')
  // Two steps ahead: the only overlay in the run that skips a layer, which is
  // what makes the Legendary different in kind from the Nemesis tier shortcut
  // above rather than a stronger version of it.
  addOverlay(deriveExpeditionNemesisKeyTarget(state, map), 'RIVAL_ENCOUNTER', 2)

  return {
    connections:
      extraConnections.length === 0
        ? map.connections
        : [...map.connections, ...extraConnections],
    subtypeByNodeId
  }
}
