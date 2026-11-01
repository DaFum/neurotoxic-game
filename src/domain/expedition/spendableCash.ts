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
export const getExpeditionProtectedCash = (
  state: Pick<GameState, 'player' | 'expedition'>
): number => {
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
export const getExpeditionSpendableCash = (
  state: Pick<GameState, 'player' | 'expedition'>
): number =>
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

/**
 * Outcome of settling a mandatory charge against spendable cash.
 */
export interface ExpeditionMandatoryDebitSettlement {
  /** The next player money balance. */
  nextMoney: number
  /** The amount of the charge actually paid. */
  paid: number
  /** The portion of the charge that was waived due to insufficient spendable cash. */
  waived: number
}

/**
 * Settles a mandatory debit (such as Roadie minigame equipment repairs) against available
 * spendable cash and credit.
 *
 * @param state - Current game state.
 * @param params - The mandatory charge and optional offsetting credit.
 * @returns Settlement containing next money balance, amount paid, and amount waived.
 *
 * @remarks
 * Normalizes inputs to finite nonnegative numbers. Outside an active run, protection is 0 and
 * debit is capped at balance so money never goes below 0. If protection is malformed, spendable
 * cash is 0, so only `credit` pays the charge and `nextMoney` is never lower than `money`.
 */
export const settleExpeditionMandatoryDebit = (
  state: GameState,
  { charge: rawCharge, credit: rawCredit }: { charge: number; credit?: number }
): ExpeditionMandatoryDebitSettlement => {
  const charge = Math.max(0, finiteNumberOr(rawCharge, 0))
  const credit = Math.max(0, finiteNumberOr(rawCredit, 0))
  const money = finiteNumberOr(state?.player?.money, 0)

  const available = getExpeditionSpendableCash(state) + credit
  const paid = Math.min(charge, available)
  const waived = charge - paid
  const nextMoney = money + credit - paid

  return { nextMoney, paid, waived }
}
