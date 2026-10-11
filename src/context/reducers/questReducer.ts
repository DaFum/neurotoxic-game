/**
 * Routes quest reducer calls to the domain quest lifecycle service.
 *
 * @remarks
 * Progress, completion, and deadline logic live in `src/domain/questLifecycle.ts`;
 * this reducer layer stays as the integration boundary.
 */
import { QuestLifecycle } from '../../domain/questLifecycle'
import { QuestEvents } from '../../utils/questProgress'
import type { QuestProgressEvent } from '../../utils/questProgress'
import { isLooseRecord } from '../../utils/objectUtils'
import type { GameState } from '../../types'

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
 * @returns Updated state with quest progress, completion, and rewards applied
 * as needed, or the original state when the payload is not a record.
 */
export const handleAdvanceQuest = (
  state: GameState,
  payload: Parameters<typeof QuestLifecycle.advanceQuest>[1]
): GameState =>
  isLooseRecord(payload) ? QuestLifecycle.advanceQuest(state, payload) : state

/**
 * Applies one quest progress event emitted from a hook.
 *
 * @param state - Current game state before the event.
 * @param payload - Canonical or legacy quest progress event.
 * @returns Updated state with matching quest progress applied, or the original
 * state when the payload is not a record.
 */
export const handleApplyQuestEvent = (
  state: GameState,
  payload: QuestProgressEvent
): GameState =>
  isLooseRecord(payload) ? QuestEvents.emit(state, payload) : state
