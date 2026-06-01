import type { MinigameType, QuestEvent } from '../../types'

export const createMinigameCompletedQuestEvent = ({
  minigameId,
  success,
  score,
  grade
}: {
  minigameId: MinigameType | string
  success: boolean
  score?: number
  grade?: string
}): QuestEvent => ({
  type: 'minigame.completed',
  amount: 1,
  success,
  context: { minigameId, score, grade },
  tags: [minigameId, grade].filter(
    (entry): entry is string => typeof entry === 'string'
  )
})
