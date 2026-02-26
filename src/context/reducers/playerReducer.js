import { logger } from '../../utils/logger.js'
import { clampPlayerMoney } from '../../utils/gameStateUtils.js'

/**
 * Handles player update actions
 * Clamps player.money to ensure it never goes negative
 * @param {Object} state - Current state
 * @param {Object} payload - Player updates
 * @returns {Object} Updated state
 */
export const handleUpdatePlayer = (state, payload) => {
  logger.debug('GameState', 'Update Player', payload)
  const updates =
    typeof payload === 'function' ? payload(state.player) : payload
  const mergedPlayer = { ...state.player, ...updates }

  // Clamp money to prevent negative values
  if (typeof mergedPlayer.money === 'number') {
    mergedPlayer.money = clampPlayerMoney(mergedPlayer.money)
  }

  return { ...state, player: mergedPlayer }
}
