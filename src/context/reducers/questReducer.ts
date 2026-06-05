/**
 * Routes quest reducer calls to the domain quest lifecycle service.
 *
 * @remarks
 * Progress, completion, and deadline logic live in `src/domain/questLifecycle.ts`;
 * this reducer layer stays as the integration boundary.
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
