import { logger } from '../../utils/logger'
import {
  isForbiddenKey,
  isPlainObject,
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel
} from '../../utils/gameStateUtils'
import { ActionTypes } from '../actionTypes'
import { assertNever } from '../../utils/assertNever'
import type { PlayerState, UpdatePlayerPayload } from '../../types/game'

type PlayerSlice = { player: PlayerState }

export type PlayerAction = {
  type: typeof ActionTypes.UPDATE_PLAYER
  payload: UpdatePlayerPayload
}

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

  if (!isPlainObject(updates) || Object.keys(updates).some(isForbiddenKey)) {
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

/**
 * Reducer for player actions.
 * Uses a discriminated union so payload is typed for UPDATE_PLAYER.
 */
export const playerReducer = (
  state: PlayerSlice,
  action: PlayerAction
): PlayerSlice => {
  switch (action.type) {
    case ActionTypes.UPDATE_PLAYER:
      return handleUpdatePlayer(state, action.payload as UpdatePlayerPayload)
    default:
      // Catch unhandled action types (defensive fallback)
      return assertNever(action as never)
  }
}
