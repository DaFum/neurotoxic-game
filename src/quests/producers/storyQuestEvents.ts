import type { QuestEvent } from '../../types'

/**
 * Creates a `story.flagAdded` quest event for newly added story flags.
 */
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
