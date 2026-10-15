/**
 * Projects the prepared route through the player's earned intel.
 *
 * @remarks
 * The map builder stores every hidden detail deterministically; this is the one
 * place that decides which of it a given intel level may be shown. Keeping the
 * projection out of the UI is what stops a component from rendering intel that
 * was never earned.
 */

import { getActiveExpeditionMap, getExpeditionNodePublicFacts } from './map'
import { getEffectiveExpeditionRules } from './effectiveRules'
import { getEffectiveExpeditionRoute } from './routeOverlay'
import {
  getExpeditionIntelCapability,
  getExpeditionNodeIntelLevel
} from './nodeIntel'
import { resolveExpeditionTravelCost } from './travel'
import { calculateGigFinancials } from '../../utils/economy'
import { isGigNode } from '../../utils/arrivalUtils'
import type { GameState, PlayerState } from '../../types'
import type { Venue } from '../../types/map'
import type { ExpeditionNodeFog } from '../../types/expedition'

/**
 * Estimates what a gig at `venue` nets, from the real gig calculation.
 *
 * @param venue - The venue the node books.
 * @param player - Supplies the band's current fame, which drives the draw.
 * @returns The `net` of {@link calculateGigFinancials} for neutral inputs.
 *
 * @remarks
 * The Fog may only reveal a number the economy can actually produce, so this
 * calls the authoritative calculation rather than a parallel formula. Inputs
 * the player has not decided yet stay neutral: a mid-range performance, no
 * pre-gig modifiers, no merch stock and no performance bonuses. That is why the
 * UI labels it an estimate - the played gig settles the real amount.
 */
const estimateExpeditionGigPayout = (
  venue: Venue,
  player: Pick<PlayerState, 'fame'>
): number =>
  calculateGigFinancials({
    gigData: venue,
    performanceScore: 50,
    modifiers: {},
    bandInventory: {},
    playerState: player,
    gigStats: {}
  }).net

/**
 * Builds the per-node fog projection for the active run.
 *
 * @param state - Current game state.
 * @returns Projection keyed by node id, or `null` outside an active run.
 */
export const getExpeditionNodeFogByNodeId = (
  state: GameState
): Record<string, ExpeditionNodeFog> | null => {
  const map = getActiveExpeditionMap(state)
  if (!map) return null

  // Resolved once for the whole projection: the travel settlement would
  // otherwise re-aggregate the chassis and module profiles for every node.
  const { numeric } = getEffectiveExpeditionRules(state)
  const travelRules = {
    fuelConsumptionMultiplier: numeric.fuelConsumptionMultiplier,
    roadWearMultiplier: numeric.roadWearMultiplier
  }

  // Resolved once as well: the capability derives the route step's familiarity
  // draw, which must not be redrawn per node.
  const capability = getExpeditionIntelCapability(state)

  // Onward routes come from the effective route travel authorizes, so an
  // overlay edge (Underground invite, Nemesis shortcut, Legendaries) counts.
  const onwardRouteCountByNodeId: Record<string, number> = Object.create(null)
  for (const edge of getEffectiveExpeditionRoute(state, map).connections) {
    onwardRouteCountByNodeId[edge.from] =
      (onwardRouteCountByNodeId[edge.from] ?? 0) + 1
  }

  const out: Record<string, ExpeditionNodeFog> = {}
  for (const nodeId of map.nodeOrder) {
    const entry = map.meta[nodeId]
    // The always-visible half comes from the one public projection, so the
    // Fog cannot show a level-0 fact that projection does not list.
    const facts = getExpeditionNodePublicFacts(map, nodeId)
    if (!entry || !facts) continue
    const intelLevel = getExpeditionNodeIntelLevel(state, nodeId, capability)
    const node = map.nodes[nodeId]
    out[nodeId] = {
      routeStep: facts.routeStep,
      onwardRouteCount: onwardRouteCountByNodeId[nodeId] ?? 0,
      nodeClass: facts.nodeClass,
      specialSubtype: facts.specialSubtype,
      dangerTier: facts.dangerTier,
      rewardTier: facts.rewardTier,
      isExtractionWindow: facts.isExtractionWindow,
      intelLevel,
      estimatedPayout:
        intelLevel >= 1 && isGigNode(node) && node.venue
          ? estimateExpeditionGigPayout(node.venue, state.player)
          : null,
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
      rareRewardId: intelLevel >= 1 ? entry.hidden.rareRewardId : null,
      // Level-0 presence hints: whether a category is here, never which one or
      // what it pays. `null` is "not entitled to the hint" and stays distinct
      // from `false`, which is the hint reporting the category is absent.
      hasRecoveryOrSponsorHint: capability.hasRecoveryOrSponsorHint
        ? entry.nodeClass === 'REST_STOP' ||
          entry.hidden.hiddenOpportunityId !== null
        : null,
      hasRivalOrSponsorCategoryHint: capability.hasRivalOrSponsorCategoryHint
        ? entry.specialSubtype === 'RIVAL_ENCOUNTER' ||
          entry.hidden.rivalId !== null ||
          entry.hidden.hiddenOpportunityId !== null
        : null,
      hasUndergroundCategoryHint: capability.hasUndergroundCategoryHint
        ? entry.specialSubtype === 'UNDERGROUND_MARKET' ||
          entry.specialSubtype === 'BLACK_MARKET'
        : null
    }
  }
  return out
}
