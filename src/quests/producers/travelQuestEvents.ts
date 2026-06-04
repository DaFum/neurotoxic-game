import type { QuestEvent } from '../../types'

/**
 * Creates a `travel.completed` quest event for arriving in a region.
 */
export const createTravelCompletedQuestEvent = ({
  region
}: {
  region: string
}): QuestEvent => ({
  type: 'travel.completed',
  amount: 1,
  success: true,
  context: { region },
  tags: [region]
})
