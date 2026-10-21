/**
 * Pure protected-cash helpers, kept free of heavy imports so the event engine
 * and UI can evaluate the spendable balance without pulling in the whole
 * Expedition loadout module.
 */
import type { GameState } from '../../types'
import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'

/**
 * Career Cash the active run may not touch.
 *
 * @param state - Current game state.
 * @returns Non-negative protected amount; `0` outside an active run.
 *
 * @remarks
 * A corrupt protected slice (non-finite or negative) fails closed: the whole
 * balance counts as protected, so {@link getExpeditionSpendableCash} reports
 * nothing spendable rather than treating the protection as gone.
 */
export const getExpeditionProtectedCash = (state: GameState): number => {
  if (state.expedition?.status !== 'active') return 0
  const protectedCash = state.expedition.protectedCareerCash
  if (!isFiniteNumber(protectedCash) || protectedCash < 0) {
    return Math.max(0, finiteNumberOr(state.player.money, 0))
  }
  return protectedCash
}

/**
 * Cash the player may spend inside an active Expedition.
 *
 * @param state - Current game state.
 * @returns Non-negative spendable amount.
 *
 * @remarks
 * `protectedCareerCash` is committed in the build and is off-limits for the
 * whole run. Without this boundary a wealthy Career would trivialize every run
 * safety decision — the design requires Cash to be a tool for controlling risk,
 * not an unlimited rescue. Outside a run the full balance is spendable.
 */
export const getExpeditionSpendableCash = (state: GameState): number =>
  Math.max(
    0,
    finiteNumberOr(state.player.money, 0) - getExpeditionProtectedCash(state)
  )

/**
 * A state view whose balance is only the cash an active run may spend.
 *
 * @param state - Game state, or an engine slice of it.
 * @returns `state` itself outside a run or without protected cash; otherwise a
 * shallow copy whose `player.money` is the spendable slice.
 *
 * @remarks
 * Event option conditions gate paid choices on `player.money`. Evaluating them
 * against this view keeps an optional purchase from being offered, or resolved,
 * on the strength of protected cash the floor will not let it spend.
 */
export const withExpeditionSpendableCash = <T extends object>(state: T): T => {
  const full = state as unknown as GameState
  if (getExpeditionProtectedCash(full) === 0) return state
  return {
    ...state,
    player: { ...full.player, money: getExpeditionSpendableCash(full) }
  }
}
