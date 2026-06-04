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
 * Changes scenes only when the requested phase is known.
 *
 * @param state - Game state before the transition.
 * @param payload - Requested scene name.
 * @returns State with `currentScene` changed, or the original state for invalid
 * scene names.
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
