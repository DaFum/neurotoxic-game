import type { QuestEvent } from '../../types'

/**
 * Creates an `economy.moneyEarned` quest event for money deltas.
 */
export const createMoneyEarnedQuestEvent = ({
  amount,
  reason
}: {
  amount: number
  reason?: string
}): QuestEvent => ({
  type: 'economy.moneyEarned',
  amount,
  success: amount >= 0,
  context: { reason },
  tags: [reason].filter((entry): entry is string => typeof entry === 'string')
})
