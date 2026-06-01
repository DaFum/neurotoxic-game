import type { QuestEvent } from '../../types'

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
