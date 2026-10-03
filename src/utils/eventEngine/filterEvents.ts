import { logEventError } from './helpers'
import type { EngineEvent, EngineGameState } from './types'

/**
 * Evaluates a collection of engine events against a specific trigger and the current game state to determine which events are eligible to fire.
 *
 * @remarks
 * Events matching the specified trigger (or 'random' events) are evaluated against their custom condition logic.
 * If an event's condition function throws an error during evaluation, the error is caught and logged to prevent halting the event engine.
 *
 * @param pool - The array of potential events to evaluate.
 * @param trigger - The explicit trigger identifier to match, or null to bypass trigger checking. Events marked as 'random' are always evaluated.
 * @param state - The current game state provided to the event conditions for validation.
 * @returns A filtered array containing only the events that are eligible to be executed.
 */
export const filterEvents = (
  pool: EngineEvent[],
  trigger: string | null,
  state: EngineGameState
) => {
  const result: EngineEvent[] = []
  for (let i = 0, len = pool.length; i < len; i++) {
    const e = pool[i]
    if (!e) continue
    // Match exact trigger OR 'random' events (eligible at any trigger point)
    if (trigger && e.trigger !== trigger && e.trigger !== 'random') {
      continue
    }
    if (!e.condition) {
      result.push(e)
      continue
    }
    try {
      if (e.condition(state)) {
        result.push(e)
      }
    } catch (err) {
      logEventError(err, e.id)
    }
  }
  return result
}
