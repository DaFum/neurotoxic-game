/**
 * Once-only settlement of route Fuel and vehicle wear.
 *
 * @remarks
 * Travel is the Expedition's mobility pressure, so its cost has to be both
 * attributable and charged exactly once. Two terms make up a leg:
 *
 * - the **route** term — the node's own declared wear cost, scaled by the
 *   chassis and module road-wear rules. This is the management axis: a heavier
 *   chassis or a harsher region makes the same trip cost more.
 * - the **player** term — the damage the travel minigame run actually produced.
 *   This is the skill axis, and it is deliberately *not* scaled by the
 *   road-wear multiplier: management should shape the situation, not amplify
 *   the player's own mistakes into it.
 *
 * `vehicleWear` lands on the canonical `player.van.condition` only. G2's
 * technical Condition (PA, Instruments, Stage Gear) has its own post-gig wear
 * owner in `condition.ts`; copying one into the other would charge a single
 * trip to two failure axes.
 *
 * Outside an active Expedition the settlement reports the legacy numbers
 * unchanged, so the travel reducer has one call site instead of a branch and
 * Career play is unaffected.
 */

import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'
import { calculateTravelExpenses } from '../../utils/economy'
import { getActiveAssetModifiers } from '../../utils/assets/assetSelectors'
import { getEffectiveExpeditionRules } from './effectiveRules'
import { getActiveExpeditionMap } from './map'
import { getExpeditionTravelMap } from './routeOverlay'
import type { GameState } from '../../types'
import type {
  ExpeditionRouteContext,
  ExpeditionTravelSettlement
} from '../../types/expedition'

/**
 * Wear charged per 100 km when the route declares nothing for a node.
 *
 * @remarks
 * Only reached for a node the prepared route does not describe — an off-route
 * arrival, or a save whose map and run drifted. It keeps such a leg from being
 * free rather than trying to reproduce the route's own tuning.
 */
const FALLBACK_WEAR_PER_100KM = 4

/** Wear floor for a fallback leg, so a very short hop still costs something. */
const FALLBACK_MIN_WEAR = 1

/**
 * Subset of the effective rules a travel settlement reads.
 *
 * @remarks
 * Injectable so the settlement's arithmetic can be exercised against specific
 * multipliers without standing up a chassis and module set for each case.
 * Production always resolves them from {@link getEffectiveExpeditionRules}.
 */
export interface ExpeditionTravelRules {
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
}

/**
 * Reads a non-negative finite number from an untrusted route-context field.
 */
const readNonNegative = (value: unknown): number =>
  Math.max(0, finiteNumberOr(value, 0))

/**
 * Resolves the wear the route itself declares for one node.
 *
 * @param state - Current game state.
 * @param targetNodeId - Node the leg arrives at.
 * @param distance - Base leg distance, used only for the off-route fallback.
 * @returns Non-negative wear before the road-wear multiplier.
 */
const resolveRouteWear = (
  state: GameState,
  targetNodeId: string,
  distance: number
): number => {
  const map = getActiveExpeditionMap(state)
  if (map && Object.hasOwn(map.meta, targetNodeId)) {
    const declared = map.meta[targetNodeId]?.hidden.exactWearCost
    if (isFiniteNumber(declared)) return Math.max(0, declared)
  }
  return Math.max(
    FALLBACK_MIN_WEAR,
    Math.round((readNonNegative(distance) / 100) * FALLBACK_WEAR_PER_100KM)
  )
}

/**
 * Settles the Fuel and vehicle wear of one travel leg.
 *
 * @param state - Current game state.
 * @param routeContext - Inputs for the leg, from the canonical travel helpers.
 * @param rules - Effective travel rules; resolved from state when omitted.
 * @returns The leg's once-only cost.
 *
 * @remarks
 * Every input is read defensively: a non-finite distance or litre count yields
 * a zero term rather than an `NaN` that would later clamp to a silently wrong
 * fuel level.
 */
export const resolveExpeditionTravelCost = (
  state: GameState,
  routeContext: ExpeditionRouteContext,
  rules?: ExpeditionTravelRules
): ExpeditionTravelSettlement => {
  const baseFuelLiters = readNonNegative(routeContext?.baseFuelLiters)
  const minigameFuelBonus = readNonNegative(routeContext?.minigameFuelBonus)
  const minigameConditionLoss = readNonNegative(
    routeContext?.minigameConditionLoss
  )

  if (state.expedition?.status !== 'active') {
    // Career travel: the helper's litres, and wear from the minigame alone —
    // exactly the behavior that predates the Expedition layer, surplus fuel
    // pickups included.
    return {
      fuelConsumed: baseFuelLiters - minigameFuelBonus,
      vehicleWear: minigameConditionLoss
    }
  }

  const effective =
    rules ??
    (() => {
      const { numeric } = getEffectiveExpeditionRules(state)
      return {
        fuelConsumptionMultiplier: numeric.fuelConsumptionMultiplier,
        roadWearMultiplier: numeric.roadWearMultiplier
      }
    })()

  const fuelMultiplier = Math.max(
    0,
    finiteNumberOr(effective.fuelConsumptionMultiplier, 1)
  )
  const wearMultiplier = Math.max(
    0,
    finiteNumberOr(effective.roadWearMultiplier, 1)
  )

  const targetNodeId =
    typeof routeContext?.targetNodeId === 'string'
      ? routeContext.targetNodeId
      : ''
  const routeWear = resolveRouteWear(
    state,
    targetNodeId,
    routeContext?.distance
  )

  return {
    // Signed: a minigame run that collected more fuel than the leg burns is a
    // net gain, exactly as it was before the Expedition layer. Clamping it at
    // zero here would quietly discard the surplus the player earned.
    fuelConsumed: baseFuelLiters * fuelMultiplier - minigameFuelBonus,
    // Route term scaled, player term added: see the module remarks.
    vehicleWear: Math.max(0, routeWear * wearMultiplier + minigameConditionLoss)
  }
}

/**
 * Litres the cheapest onward leg from the current node would burn.
 *
 * @param state - Current game state.
 * @returns The smallest zero-pickup fuel quote over the route's outgoing
 * edges, or `null` outside an active run or when no onward leg exists.
 *
 * @remarks
 * Quoted exactly as the travel gate and {@link resolveExpeditionTravelCost}
 * price a leg: helper litres for the van, band and assets, times the effective
 * fuel multiplier. Only the run's own edges count; a run refuses an
 * unconnected START, so there is no HQ fallback here. Cash plays no part, so a
 * leg the protected-Cash floor refused is not a fuel shortage.
 */
export const getExpeditionCheapestOnwardLegFuel = (
  state: GameState
): number | null => {
  if (state.expedition?.status !== 'active') return null
  const travelMap = getExpeditionTravelMap(state)
  const currentNodeId = state.player.currentNodeId
  if (!travelMap || typeof currentNodeId !== 'string') return null
  const nodes = travelMap.nodes
  if (!Object.hasOwn(nodes, currentNodeId)) return null
  const currentNode = nodes[currentNodeId]

  const assetModifiers = getActiveAssetModifiers(state.assets ?? [])
  const fuelMultiplier = Math.max(
    0,
    finiteNumberOr(
      getEffectiveExpeditionRules(state).numeric.fuelConsumptionMultiplier,
      1
    )
  )

  let cheapest: number | null = null
  for (const edge of travelMap.connections) {
    if (edge.from !== currentNodeId || edge.to === currentNodeId) continue
    if (!Object.hasOwn(nodes, edge.to)) continue
    const { fuelLiters } = calculateTravelExpenses(
      nodes[edge.to],
      currentNode,
      state.player,
      state.band,
      assetModifiers
    )
    const quote = readNonNegative(fuelLiters) * fuelMultiplier
    if (cheapest === null || quote < cheapest) cheapest = quote
  }
  return cheapest
}
