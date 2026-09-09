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
  state.expedition.pressure.heat >= 90 &&
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
