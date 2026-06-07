import { applyClampedMoneyDelta } from './socialResolution'
import { clampControversyLevel } from '../gameState'
import type { GameState } from '../../types'
import type { SpinStoryMoneyUpdate } from './types'

export const SPIN_STORY_MONEY_COST = 200
export const SPIN_STORY_CONTROVERSY_REDUCTION = 25

export const getSpinStoryMoneyUpdate = ({
  player
}: {
  player: GameState['player']
}): SpinStoryMoneyUpdate => {
  if ((player.money ?? 0) < SPIN_STORY_MONEY_COST) {
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

export const getSpinStorySocialUpdateFactory = () => {
  return (prevSocial: GameState['social']) => ({
    controversyLevel: clampControversyLevel(
      (prevSocial.controversyLevel || 0) - SPIN_STORY_CONTROVERSY_REDUCTION
    )
  })
}
