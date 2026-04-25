import { logger } from '../../utils/logger'
import { isForbiddenKey, isPlainObject, clampPlayerMoney, clampPlayerFame, calculateFameLevel } from '../../utils/gameStateUtils'
import { ActionTypes } from '../actionTypes'
import type { PlayerState, UpdatePlayerPayload } from '../../types/game'

type PlayerSlice = { player: PlayerState }

export type PlayerAction =
  | { type: typeof ActionTypes.UPDATE_PLAYER; payload: UpdatePlayerPayload }
  | { type: string; payload?: unknown }

/**
 * Handles player update actions
 * Clamps player.money and player.fame to ensure they never go negative
 * and correctly applied.
 */
export const handleUpdatePlayer = (
  state: PlayerSlice,
  payload: UpdatePlayerPayload
): PlayerSlice => {
  logger.debug('GameState', 'Update Player', payload)
  const updates = typeof payload === 'function' ? payload(state.player) : payload

  if (
    !isPlainObject(updates) ||
    Object.keys(updates).some(isForbiddenKey)
  ) {
    return state
  }

  const mergedPlayer = {
    ...state.player,
    ...updates
  }

  // Ensure invariants are maintained after resolving function payloads
  if (Object.hasOwn(updates, 'money')) {
    mergedPlayer.money = clampPlayerMoney(mergedPlayer.money)
  }
  if (Object.hasOwn(updates, 'fame')) {
    mergedPlayer.fame = clampPlayerFame(mergedPlayer.fame)
    // Auto-derive fameLevel if fame was updated and level wasn't explicitly provided
    if (!Object.hasOwn(updates, 'fameLevel')) {
      mergedPlayer.fameLevel = calculateFameLevel(mergedPlayer.fame)
    }
  }

  return { ...state, player: mergedPlayer }
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
      return state
  }
}
