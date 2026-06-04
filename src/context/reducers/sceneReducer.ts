import { ALLOWED_SCENE_VALUES } from '../gameConstants'
import { logger } from '../../utils/logger'
import type { GameState, GamePhase } from '../../types'

const ALLOWED_SCENE_SET: ReadonlySet<string> = new Set(ALLOWED_SCENE_VALUES)

/**
 * Checks whether a string is a known game phase.
 *
 * @param value - Candidate scene value.
 * @returns True when the value is a valid game phase.
 */
export const isValidGamePhase = (value: string): value is GamePhase => {
  return ALLOWED_SCENE_SET.has(value)
}

/**
 * Handles scene change actions
 * @param state - Current state
 * @param payload - New scene name
 * @returns Updated state
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
