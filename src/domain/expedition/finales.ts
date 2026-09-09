import type { ExpeditionFinaleType } from '../../types/expedition'
import { EXPEDITION_FINALES_BY_ID } from '../../data/expedition/finales'
import type { ExpeditionFinaleProfile } from '../../types/expedition'
export interface ExpeditionFinaleSelectionContext {
  specialFinaleRequired?: boolean
  nemesisLevel?: number
  technicalConditionAggregate?: number
  heat?: number
  exposure?: number
  hasSponsorObligation?: boolean
}
export const selectExpeditionFinaleType = (
  context: ExpeditionFinaleSelectionContext
): ExpeditionFinaleType => {
  if (context.specialFinaleRequired) return 'contract_special'
  if ((context.nemesisLevel ?? 0) >= 4) return 'rival_battle'
  if ((context.technicalConditionAggregate ?? 100) < 25) return 'disaster_gig'
  if ((context.heat ?? 0) >= 75) return 'illegal_show'
  if ((context.exposure ?? 0) >= 60 && context.hasSponsorObligation)
    return 'corporate_showcase'
  return 'regional_headliner'
}

export const getExpeditionFinaleProfile = (
  finaleType: ExpeditionFinaleType | null | undefined
): ExpeditionFinaleProfile | null =>
  finaleType ? (EXPEDITION_FINALES_BY_ID.get(finaleType) ?? null) : null

/**
 * Derives the reward one Finale earns, from the run's own Finale profile.
 *
 * @param finaleType - The run's committed Finale profile.
 * @returns The canonical registry id for that Finale's reward.
 *
 * @remarks
 * Derived rather than requested: standing on the Finale does not say *which*
 * Finale reward was earned, so letting the caller name one would let it pick
 * the better of the two. The hostile, high-Heat Finales earn the secured
 * Underground ledger; every other profile earns the unsecured Road-crew
 * respect, which is only kept by actually completing the run.
 */
export const getExpeditionFinaleRewardId = (
  finaleType: ExpeditionFinaleType | null | undefined
): 'reward_finale_underground_ledger' | 'reward_finale_road_crew_respect' =>
  finaleType === 'illegal_show' || finaleType === 'rival_battle'
    ? 'reward_finale_underground_ledger'
    : 'reward_finale_road_crew_respect'
