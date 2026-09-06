/**
 * Projects the prepared route through the player's earned intel.
 *
 * @remarks
 * The map builder stores every hidden detail deterministically; this is the one
 * place that decides which of it a given intel level may be shown. Keeping the
 * projection out of the UI is what stops a component from rendering intel that
 * was never earned.
 */

import { buildExpeditionMap } from './map'
import { NEUTRAL_EXPEDITION_ROUTE_PROFILE } from './defaults'
import { getEffectiveExpeditionRules } from './effectiveRules'
import { getExpeditionNodeIntelLevel } from './nodeIntel'
import { resolveExpeditionTravelCost } from './travel'
import type { GameState } from '../../types'
import type { ExpeditionNodeFog } from '../../types/expedition'

/**
 * Builds the per-node fog projection for the active run.
 *
 * @param state - Current game state.
 * @returns Projection keyed by node id, or `null` outside an active run.
 */
export const getExpeditionNodeFogByNodeId = (
  state: GameState
): Record<string, ExpeditionNodeFog> | null => {
  const loadout = state.expedition?.loadout
  if (state.expedition?.status !== 'active' || !loadout) return null

  const map = buildExpeditionMap(
    state.runSeed,
    loadout.tourTypeId,
    loadout.regionId,
    NEUTRAL_EXPEDITION_ROUTE_PROFILE
  )

  // Resolved once for the whole projection: the travel settlement would
  // otherwise re-aggregate the chassis and module profiles for every node.
  const { numeric } = getEffectiveExpeditionRules(state)
  const travelRules = {
    fuelConsumptionMultiplier: numeric.fuelConsumptionMultiplier,
    roadWearMultiplier: numeric.roadWearMultiplier
  }

  const out: Record<string, ExpeditionNodeFog> = {}
  for (const nodeId of map.nodeOrder) {
    const entry = map.meta[nodeId]
    if (!entry) continue
    const intelLevel = getExpeditionNodeIntelLevel(state, nodeId)
    out[nodeId] = {
      nodeClass: entry.nodeClass,
      specialSubtype: entry.specialSubtype,
      dangerTier: entry.dangerTier,
      rewardTier: entry.rewardTier,
      isExtractionWindow: entry.isExtractionWindow,
      intelLevel,
      exactPayout: intelLevel >= 1 ? entry.hidden.exactPayout : null,
      // The *effective* cost, not the route's raw declaration. Revealing the
      // pre-multiplier number would make the Fog lie: a chassis with a
      // road-wear multiplier would quietly charge more than the intel promised,
      // which is exactly the invisible debuff the design forbids.
      exactWearCost:
        intelLevel >= 1
          ? resolveExpeditionTravelCost(
              state,
              {
                targetNodeId: nodeId,
                distance: 0,
                baseFuelLiters: 0,
                minigameFuelBonus: 0,
                minigameConditionLoss: 0
              },
              travelRules
            ).vehicleWear
          : null,
      revealedIdentity:
        intelLevel >= 2
          ? (entry.hidden.rivalId ?? entry.hidden.eventId ?? null)
          : null,
      rareRewardId: intelLevel >= 1 ? entry.hidden.rareRewardId : null
    }
  }
  return out
}
