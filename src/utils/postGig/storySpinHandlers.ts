import { applyClampedMoneyDelta } from './socialResolution'
import { clampControversyLevel, finiteNumberOr } from '../gameState'
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
 */
export const getSpinStoryMoneyUpdate = ({
  player
}: {
  player: GameState['player']
}): SpinStoryMoneyUpdate => {
  if (finiteNumberOr(player.money, 0) < SPIN_STORY_MONEY_COST) {
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
 * Returns a social-state updater that reduces controversy by
 * {@link SPIN_STORY_CONTROVERSY_REDUCTION} (clamped) for a story spin.
 */
export const getSpinStorySocialUpdateFactory = () => {
  return (prevSocial: GameState['social']) => ({
    controversyLevel: clampControversyLevel(
      finiteNumberOr(prevSocial.controversyLevel, 0) -
        SPIN_STORY_CONTROVERSY_REDUCTION
    )
  })
}
