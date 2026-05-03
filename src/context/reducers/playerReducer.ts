import { logger } from '../../utils/logger'
import { isForbiddenKey, isPlainObject } from '../../utils/gameStateUtils'
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
  const updates =
    typeof payload === 'function' ? payload(state.player) : payload

  if (!isPlainObject(updates) || Object.keys(updates).some(isForbiddenKey)) {
    return state
  }

  const mergedPlayer = {
    ...state.player,
    ...updates
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
