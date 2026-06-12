import { logger } from '../../utils/logger'
import {
  hasForbiddenKeys,
  isLooseRecord,
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel,
  finiteNumberOr
} from '../../utils/gameState'
import type { PlayerState, UpdatePlayerPayload } from '../../types'

type WithPlayer = { player: PlayerState }
/**
 * Applies sanitized player updates while preserving derived fame level invariants.
 *
 * Money and fame are clamped before merge; malformed or prototype-polluting
 * payloads leave the original state untouched. `fameLevel` is always derived
 * from `fame` — a payload carrying `fameLevel` without `fame` has the field
 * dropped to keep the pair in sync.
 *
 * @typeParam TState - State shape that carries the player slice.
 * @param state - State object containing the player slice to update.
 * @param payload - Player updates or functional updater from the action creator.
 * @returns Updated state with merged player values, or the original state when the payload is invalid.
 */
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
      finiteNumberOr(safeUpdates.money, state.player.money)
    )
  }
  if (Object.hasOwn(safeUpdates, 'fame')) {
    const nextFame = finiteNumberOr(safeUpdates.fame, state.player.fame)
    const clampedFame = clampPlayerFame(nextFame)
    safeUpdates.fame = clampedFame
    safeUpdates.fameLevel = calculateFameLevel(clampedFame)
  } else if (Object.hasOwn(safeUpdates, 'fameLevel')) {
    // fameLevel is derived from fame; a standalone fameLevel update would
    // desync the pair, so drop it.
    delete safeUpdates.fameLevel
  }

  const mergedPlayer = {
    ...state.player,
    ...safeUpdates
  }

  return { ...state, player: mergedPlayer } as TState
}
