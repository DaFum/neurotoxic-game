/**
 * Architecture (Quest System / Clean Architecture):
 * This reducer acts as the integration point for quest-related state changes.
 * The actual quest lifecycle logic (progress, completion, deadlines) is
 * maintained independently in src/domain/questLifecycle.ts. The domain
 * layer must remain isolated from the reducer layer to maintain a clean
 * unidirectional dependency flow.
 */
import { QuestLifecycle } from '../../domain/questLifecycle'

/**
 * Adds a quest by delegating to the domain quest lifecycle service.
 *
 * @param state - Current game state before adding the quest.
 * @param quest - Quest request or runtime quest to add.
 * @returns Updated state with the quest lifecycle changes applied.
 */
export const handleAddQuest = QuestLifecycle.addQuest
/**
 * Advances quest progress by delegating to the domain quest lifecycle service.
 *
 * @param state - Current game state before progress changes.
 * @param payload - Quest progress payload including quest id, amount, and deterministic random index.
 * @returns Updated state with quest progress, completion, and rewards applied as needed.
 */
export const handleAdvanceQuest = QuestLifecycle.advanceQuest
