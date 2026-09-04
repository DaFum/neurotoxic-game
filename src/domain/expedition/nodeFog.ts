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
import { getExpeditionNodeIntelLevel } from './nodeIntel'
import type { GameState } from '../../types'
import type { ExpeditionNodeFog } from '../../ui/expedition/ExpeditionNodeFogBadge'

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
      exactWearCost: intelLevel >= 1 ? entry.hidden.exactWearCost : null,
      revealedIdentity:
        intelLevel >= 2
          ? (entry.hidden.rivalId ?? entry.hidden.eventId ?? null)
          : null
    }
  }
  return out
}
