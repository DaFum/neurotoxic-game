import { logger } from '../../utils/logger'
import {
  hasForbiddenKeys,
  isLooseRecord,
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

  if (!isLooseRecord(updates) || hasForbiddenKeys(updates)) {
    return state
  }

  const safeUpdates = { ...updates }
  if (Object.hasOwn(safeUpdates, 'money')) {
    safeUpdates.money = clampPlayerMoney(
      typeof safeUpdates.money === 'number' &&
        Number.isFinite(safeUpdates.money)
        ? safeUpdates.money
        : state.player.money
    )
  }
  if (Object.hasOwn(safeUpdates, 'fame')) {
    const nextFame =
      typeof safeUpdates.fame === 'number' && Number.isFinite(safeUpdates.fame)
        ? safeUpdates.fame
        : state.player.fame
    const clampedFame = clampPlayerFame(nextFame)
    safeUpdates.fame = clampedFame
    safeUpdates.fameLevel = calculateFameLevel(clampedFame)
  }

  const mergedPlayer = {
    ...state.player,
    ...safeUpdates
  }

  return { ...state, player: mergedPlayer } as TState
}
