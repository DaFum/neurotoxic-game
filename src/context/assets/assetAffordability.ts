import type { GameState } from '../../types'
import { getExpeditionSpendableCash } from '../../domain/expedition/spendableCash'

/**
 * Mirrors the reducer's affordability rule: non-finite money never affords a
 * debit (`NaN < cost` is false, so a bare comparison would let it through).
 */
const canAfford = (money: number, cost: number): boolean =>
  Number.isFinite(money) && money >= cost

/**
 * Affordability against the raw balance and, during an active Expedition, the
 * spendable slice. The cash floor rolls a debit into protected cash back
 * silently, so the creator has to refuse it with a typed failure instead.
 *
 * @param state - Player and Expedition slices of the game state.
 * @param cost - Debit to check.
 * @returns Whether both balances cover the debit.
 *
 * @remarks
 * Exported so UI gates (e.g. the refinance button) apply the exact rule the
 * creators enforce instead of re-deriving it.
 */
export const canAffordInState = (
  state: Pick<GameState, 'player' | 'expedition'>,
  cost: number
): boolean =>
  canAfford(state.player.money, cost) &&
  canAfford(getExpeditionSpendableCash(state), cost)
