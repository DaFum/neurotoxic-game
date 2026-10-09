import type { GameEvent, GameState } from '../../types'

/**
 * Adds context-sensitive options to an event before it is displayed.
 *
 * @remarks
 * No event currently gains options from game state; the hook stays so the
 * display path has one place to add them.
 *
 * @param event - Event definition selected for the current context.
 * @param _gameState - The current game state.
 * @returns The event unchanged, or null when the input event is null.
 */
export const processOptions = (
  event: GameEvent,
  _gameState: GameState
): GameEvent | null => event
