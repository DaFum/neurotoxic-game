// TODO: Review this file
import { GAME_PHASES } from '../gameConstants'
import { logger } from '../../utils/logger'
import type { GameState, GamePhase } from '../../types/game'

const VALID_SCENES: Set<string> = new Set(
  Object.values(GAME_PHASES) as string[]
)

const isValidGamePhase = (value: string): value is GamePhase => {
  return VALID_SCENES.has(value)
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
  if (!VALID_SCENES.has(payload)) {
    logger.warn(
      'GameState',
      `Invalid scene transition ignored: ${state.currentScene} -> ${payload}`
    )
    return state
  }

  logger.info('GameState', `Scene Change: ${state.currentScene} -> ${payload}`)
  return { ...state, currentScene: payload as any }
}
