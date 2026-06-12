import type { QuestEvent } from '../../types'

const filterStringTags = (...values: (string | undefined)[]): string[] =>
  values.filter((v): v is string => v !== undefined)

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
  tags: filterStringTags(reason)
})

/**
 * Creates a `fame.gained` quest event for fame increases.
 *
 * @remarks
 * Fame used to be funneled through `region.reputationChanged` (legacy
 * `fame_gained` mapping), conflating two different quantities. The optional
 * `region` carries the canonical city key so perRegion fame quests can match
 * their stamped scope.
 */
export const createFameGainedQuestEvent = ({
  amount,
  region,
  reason
}: {
  amount: number
  region?: string
  reason?: string
}): QuestEvent => ({
  type: 'fame.gained',
  amount,
  success: amount >= 0,
  context: { region, reason },
  tags: filterStringTags(region, reason)
})
