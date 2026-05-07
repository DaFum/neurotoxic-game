import { QuestLifecycle } from '../../domain/questLifecycle'

export const handleAddQuest = QuestLifecycle.addQuest
export const handleCompleteQuest = QuestLifecycle.completeQuest
export const handleAdvanceQuest = QuestLifecycle.advanceQuest
export const handleFailQuests = QuestLifecycle.checkDeadlines
