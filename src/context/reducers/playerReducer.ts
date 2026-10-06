import { logger } from '../../utils/logger'
import { hasForbiddenOwnKeys } from '../../utils/objectUtils'
import {
  isLooseRecord,
  clampPlayerMoney,
  clampPlayerFame,
  clampVanCondition,
  clampVanFuel,
  calculateFameLevel,
  finiteNumberOr,
  wrapClockHour
} from '../../utils/gameState'
import type { PlayerState, UpdatePlayerPayload } from '../../types'

type WithPlayer = { player: PlayerState }
/**
 * Applies sanitized player updates while preserving derived fame level invariants.
 *
 * Money, fame, van fuel/condition, day (at least 1), time (wrapped to 0..23) and
 * location (string only) are clamped before merge; malformed or
 * prototype-polluting payloads leave the original state untouched. A malformed
 * value for one of those fields keeps the prior value. `fameLevel` is always derived
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

  if (!isLooseRecord(updates) || hasForbiddenOwnKeys(updates)) {
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

  // Re-clamp the same fields `APPLY_EVENT_DELTA` and the load sanitizer clamp,
  // so a raw dispatch cannot persist values those paths would reject. Malformed
  // values leave the field unchanged.
  if (Object.hasOwn(safeUpdates, 'van')) {
    const van = safeUpdates.van
    if (isLooseRecord(van)) {
      const nextVan = { ...van }
      const prevVan: Partial<PlayerState['van']> = state.player.van ?? {}
      if (Object.hasOwn(nextVan, 'fuel')) {
        nextVan.fuel = clampVanFuel(
          finiteNumberOr(nextVan.fuel, finiteNumberOr(prevVan.fuel, 0))
        )
      }
      if (Object.hasOwn(nextVan, 'condition')) {
        nextVan.condition = clampVanCondition(
          finiteNumberOr(
            nextVan.condition,
            finiteNumberOr(prevVan.condition, 0)
          )
        )
      }
      safeUpdates.van = nextVan
    } else {
      delete safeUpdates.van
    }
  }
  if (Object.hasOwn(safeUpdates, 'day')) {
    safeUpdates.day = Math.max(
      1,
      Math.floor(
        finiteNumberOr(safeUpdates.day, finiteNumberOr(state.player.day, 1))
      )
    )
  }
  if (Object.hasOwn(safeUpdates, 'time')) {
    safeUpdates.time = wrapClockHour(
      finiteNumberOr(safeUpdates.time, finiteNumberOr(state.player.time, 12))
    )
  }
  if (
    Object.hasOwn(safeUpdates, 'location') &&
    typeof safeUpdates.location !== 'string'
  ) {
    delete safeUpdates.location
  }

  const mergedPlayer = {
    ...state.player,
    ...safeUpdates
  }

  return { ...state, player: mergedPlayer } as TState
}
