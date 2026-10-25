import { applyClampedMoneyDelta } from './socialResolution'
import { clampControversyLevel, finiteNumberOr } from '../gameState'
import { withExpeditionSpendableCash } from '../../domain/expedition/spendableCash'
import type { GameState } from '../../types'
import type { SpinStoryMoneyUpdate } from './types'

/** Cash cost of spinning a story to defuse controversy. */
export const SPIN_STORY_MONEY_COST = 200
/** Controversy points removed by a successful story spin. */
export const SPIN_STORY_CONTROVERSY_REDUCTION = 25

/**
 * Computes the money update for a story spin: fails (no-op) when the player
 * cannot afford {@link SPIN_STORY_MONEY_COST}, otherwise returns the clamped
 * next money and applied delta.
 *
 * During an active Expedition only the spendable slice counts toward the
 * affordability gate: the cash floor would reject the debit, and the controversy
 * reduction dispatched beside it would still apply.
 */
export const getSpinStoryMoneyUpdate = ({
  player,
  expedition
}: {
  player: GameState['player']
  expedition?: GameState['expedition']
}): SpinStoryMoneyUpdate => {
  const spendable = withExpeditionSpendableCash({ player, expedition }).player
  if (finiteNumberOr(spendable.money, 0) < SPIN_STORY_MONEY_COST) {
    return { success: false }
  }

  const { nextMoney, appliedDelta } = applyClampedMoneyDelta(
    player.money ?? 0,
    -SPIN_STORY_MONEY_COST
  )

  return {
    success: true,
    nextMoney,
    appliedDelta
  }
}

/**
 * Reduces social-state controversy by
 * {@link SPIN_STORY_CONTROVERSY_REDUCTION} (clamped) for a story spin.
 */
export const getSpinStorySocialUpdate = (prevSocial: GameState['social']) => ({
  controversyLevel: clampControversyLevel(
    finiteNumberOr(prevSocial.controversyLevel, 0) -
      SPIN_STORY_CONTROVERSY_REDUCTION
  )
})
