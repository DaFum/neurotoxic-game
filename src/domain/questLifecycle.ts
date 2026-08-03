export { canAcceptQuest } from './questAcceptance'

import { addQuest } from './questAdd'
import { completeQuest } from './questComplete'
import { advanceQuest, setQuestProgress } from './questAdvance'
import { checkDeadlines } from './questDeadlines'

/**
 * Pure quest lifecycle operations for adding, advancing, completing, and expiring quests.
 */
export const QuestLifecycle = {
  addQuest,
  completeQuest,
  advanceQuest,
  setQuestProgress,
  checkDeadlines
}
