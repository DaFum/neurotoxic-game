import { canSpendExpeditionCash } from './loadout'
import type { GameState } from '../../types'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { getExpeditionCargoView } from './cargo'
export type ExpeditionAuthorityExitId =
  | 'pay'
  | 'crew'
  | 'hidden_compartment'
  | 'surrender_cargo'
  | 'route_detour'
  | 'future_obligation'
export const getAvailableAuthoritySafeExits = (
  state: GameState
): ExpeditionAuthorityExitId[] => {
  const exits: ExpeditionAuthorityExitId[] = []
  if (canSpendExpeditionCash(state, 500)) exits.push('pay')
  if (
    state.expedition.loadout?.crewIds.some(id => {
      const role = EXPEDITION_CREW_BY_ID[id]?.role
      return role === 'manager' || role === 'security'
    })
  )
    exits.push('crew')
  if (getExpeditionCargoView(state).hiddenCapacity > 0)
    exits.push('hidden_compartment')
  if ((state.expedition.cargo?.contraband.length ?? 0) > 0)
    exits.push('surrender_cargo')
  if ((state.player.van?.fuel ?? 0) >= 10) exits.push('route_detour')
  if (
    state.expedition.activeObligations.filter(
      o => o.sourceType === 'native' && o.status === 'active'
    ).length < 2
  )
    exits.push('future_obligation')
  return exits
}
export const getAuthorityCrisisSignal = (
  state: GameState
): { sourceId: string; expectedRouteStep: number } | null =>
  state.expedition.status === 'active' &&
  state.expedition.pressure.heat >= 90 &&
  getAvailableAuthoritySafeExits(state).length === 0
    ? {
        sourceId: `authority:${state.expedition.runId}:${state.expedition.routeStep}`,
        expectedRouteStep: state.expedition.routeStep
      }
    : null
