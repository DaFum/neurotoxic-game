import { GAME_PHASES } from '../gameConstants'
import { logger } from '../../utils/logger'
import type { GameState, GamePhase } from '../../types/game'

export const ALLOWED_SCENES: ReadonlySet<GamePhase> = new Set(
  Object.values(GAME_PHASES) as GamePhase[]
)

const isValidGamePhase = (value: string): value is GamePhase => {
  return ALLOWED_SCENES.has(value as GamePhase)
}

/**
 * Handles scene change actions
 * @param {Object} state - Current state
 * @param {string} payload - New scene name
 * @returns {Object} Updated state
 */
export const handleChangeScene = (
  state: GameState,
  payload: string
): GameState => {
  if (!isValidGamePhase(payload)) {
    logger.warn(
      'GameState',
      `Invalid scene transition ignored: ${state.currentScene} -> ${payload}`
    )
    return state
  }

  logger.info('GameState', `Scene Change: ${state.currentScene} -> ${payload}`)
  return { ...state, currentScene: payload }
}
