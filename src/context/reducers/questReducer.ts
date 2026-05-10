/**
 * Architecture (Quest System / Clean Architecture):
 * This reducer acts purely as an integration point. The actual quest lifecycle
 * logic (progress, completion, deadlines) is intentionally maintained independently
 * in `src/domain/questLifecycle.ts`. The domain layer must not depend on or act as a
 * facade for reducers to prevent dependency inversion.
 */
import { QuestLifecycle } from '../../domain/questLifecycle'

export const handleAddQuest = QuestLifecycle.addQuest
export const handleCompleteQuest = QuestLifecycle.completeQuest
export const handleAdvanceQuest = QuestLifecycle.advanceQuest
export const handleFailQuests = QuestLifecycle.checkDeadlines
