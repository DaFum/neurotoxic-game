/**
 * Architecture (Quest System / Clean Architecture):
 * This reducer acts as the integration point for quest-related state changes.
 * The actual quest lifecycle logic (progress, completion, deadlines) is
 * maintained independently in src/domain/questLifecycle.ts. The domain
 * layer must remain isolated from the reducer layer to maintain a clean
 * unidirectional dependency flow.
 */
import { QuestLifecycle } from '../../domain/questLifecycle'

export const handleAddQuest = QuestLifecycle.addQuest
export const handleAdvanceQuest = QuestLifecycle.advanceQuest
