import { gameReducer } from './gameReducer'
import type { GameAction, GameState } from '../types'

/**
 * Replays actions dispatched since the last render over `base`.
 *
 * @param base - Last committed state.
 * @param queue - Actions dispatched but not yet reflected in `base`, oldest first.
 * @returns The projected state and the actions that actually changed it.
 * No-op actions are dropped, so replaying them on a later snapshot is not needed.
 */
export const projectQueuedActions = (
  base: GameState,
  queue: readonly GameAction[]
): { snapshot: GameState; pending: GameAction[] } => {
  let snapshot = base
  const pending: GameAction[] = []
  for (const action of queue) {
    const next = gameReducer(snapshot, action)
    if (next !== snapshot) {
      snapshot = next
      pending.push(action)
    }
  }
  return { snapshot, pending }
}
