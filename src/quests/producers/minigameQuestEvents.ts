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

export const createMinigamePerfectQuestEvent = ({
  minigameId
}: {
  minigameId: MinigameType | string
}): QuestEvent => ({
  type: 'minigame.perfect',
  amount: 1,
  success: true,
  context: { minigameId },
  tags: [minigameId]
})

export const createMinigameFailedQuestEvent = ({
  minigameId,
  damage
}: {
  minigameId: MinigameType | string
  damage?: number
}): QuestEvent => ({
  type: 'minigame.failed',
  amount: 1,
  success: false,
  context: { minigameId, damage },
  tags: [minigameId]
})
