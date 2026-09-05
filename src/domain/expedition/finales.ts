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
