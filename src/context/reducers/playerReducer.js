// TODO: Review this file
import { logger } from '../../utils/logger.js'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel
} from '../../utils/gameStateUtils.js'
import { ActionTypes } from '../actionTypes.js'

/**
 * Handles player update actions
 * Clamps player.money and player.fame to ensure they never go negative
 * and correctly applied.
 * @param {Object} state - Current state
 * @param {Object} payload - Player updates
 * @returns {Object} Updated state
 */
export const handleUpdatePlayer = (state, payload) => {
  logger.debug('GameState', 'Update Player', payload)
  const updates =
    typeof payload === 'function' ? payload(state.player) : payload

  const nextFame = clampPlayerFame(
    updates != null && Object.hasOwn(updates, 'fame')
      ? updates.fame
      : state.player.fame
  )

  const nextMoney = Math.max(0, clampPlayerMoney(
    updates != null && Object.hasOwn(updates, 'money')
      ? updates.money
      : state.player.money
  ))

  const nextFameLevel =
    updates != null && Object.hasOwn(updates, 'fameLevel')
      ? updates.fameLevel
      : calculateFameLevel(nextFame)

  const mergedPlayer = {
    ...state.player,
    ...updates,
    money: nextMoney,
    fame: nextFame,
    fameLevel: nextFameLevel
  }

  return { ...state, player: mergedPlayer }
}

/**
 * Reducer for player actions.
 * Extracts the subset of actions specific to the player context.
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export const playerReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.UPDATE_PLAYER:
      return handleUpdatePlayer(state, action.payload)
    default:
      return state
  }
}
