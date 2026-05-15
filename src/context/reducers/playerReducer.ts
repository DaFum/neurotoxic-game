import { logger } from '../../utils/logger'
import {
  hasForbiddenKeys,
  isPlainObject,
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel
} from '../../utils/gameStateUtils'
import type { PlayerState, UpdatePlayerPayload } from '../../types'

/**
 * Handles player update actions
 * Clamps player.money and player.fame to ensure they never go negative
 * and correctly applied.
 */
type WithPlayer = { player: PlayerState }
export const handleUpdatePlayer = <TState extends WithPlayer>(
  state: TState,
  payload: UpdatePlayerPayload
): TState => {
  logger.debug('GameState', 'Update Player', payload)
  const updates =
    typeof payload === 'function' ? payload(state.player) : payload

  if (
    !isPlainObject(updates) ||
    hasForbiddenKeys(updates as Record<string, unknown>)
  ) {
    return state
  }

  const safeUpdates = { ...updates }
  if (Object.hasOwn(safeUpdates, 'money')) {
    safeUpdates.money = clampPlayerMoney(
      typeof safeUpdates.money === 'number'
        ? safeUpdates.money
        : state.player.money
    )
  }
  if (Object.hasOwn(safeUpdates, 'fame')) {
    const nextFame =
      typeof safeUpdates.fame === 'number'
        ? safeUpdates.fame
        : state.player.fame
    safeUpdates.fame = clampPlayerFame(nextFame)
    safeUpdates.fameLevel = calculateFameLevel(safeUpdates.fame)
  }

  const mergedPlayer = {
    ...state.player,
    ...safeUpdates
  }

  return { ...state, player: mergedPlayer } as TState
}
