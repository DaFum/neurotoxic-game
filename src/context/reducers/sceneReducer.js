// TODO: Implement this
import { GAME_PHASES } from '../gameConstants.js'
import { logger } from '../../utils/logger.js'

const VALID_SCENES = new Set(Object.values(GAME_PHASES))

/**
 * Handles scene change actions
 * @param {Object} state - Current state
 * @param {string} payload - New scene name
 * @returns {Object} Updated state
 */
export const handleChangeScene = (state, payload) => {
  if (!VALID_SCENES.has(payload)) {
    logger.warn(
      'GameState',
      `Invalid scene transition ignored: ${state.currentScene} -> ${payload}`
    )
    return state
  }

  logger.info('GameState', `Scene Change: ${state.currentScene} -> ${payload}`)
  return { ...state, currentScene: payload }
}
