import type { MinigameType, QuestEvent } from '../../types'

/**
 * Creates a `minigame.completed` quest event for any minigame result.
 */
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

/**
 * Creates a `minigame.perfect` quest event for perfect minigame outcomes.
 */
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

/**
 * Creates a `minigame.failed` quest event for failed minigame outcomes.
 */
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
