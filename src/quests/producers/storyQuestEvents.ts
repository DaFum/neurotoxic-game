import type { QuestEvent } from '../../types'

export const createStoryFlagAddedQuestEvent = ({
  flag
}: {
  flag: string
}): QuestEvent => ({
  type: 'story.flagAdded',
  amount: 1,
  success: true,
  context: { flag },
  tags: [flag]
})
