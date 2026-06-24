import type { GameEvent, GameState } from '../../types'
import type { EngineEvent, EngineGameState, TriggerPoint } from './types'
import { EVENTS_DB } from '../../data/events/index'
import { secureRandom } from '../crypto'
import { selectEvent } from './eventSelection'

/**
 * Checks for and selects a random event from a specific category.
 * @param category - The category of events to check (e.g., 'travel', 'gig').
 * @param gameState - The current game state.
 * @param triggerPoint - Optional specific trigger point filter. Defaults to `null`.
 * @param rng - Random number generator. Defaults to `secureRandom`.
 * @returns The selected event object or null if none found.
 */
export const checkEvent = (
  category: string,
  gameState: GameState,
  triggerPoint: TriggerPoint = null,
  rng: () => number = secureRandom
): GameEvent | null => {
  const pool = EVENTS_DB[category as keyof typeof EVENTS_DB] as
    | EngineEvent[]
    | undefined
  if (!pool) return null
  return selectEvent(
    pool,
    gameState as unknown as EngineGameState,
    triggerPoint,
    rng
  ) as GameEvent | null
}
