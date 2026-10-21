import { ALLOWED_SCENE_VALUES, GAME_PHASES } from '../gameConstants'
import { logger } from '../../utils/logger'
import type { GameState, GamePhase, TerminalOutcome } from '../../types'

const ALLOWED_SCENE_SET: ReadonlySet<string> = new Set(ALLOWED_SCENE_VALUES)

/**
 * Checks whether a string is a known game phase.
 *
 * @param value - Candidate scene value.
 * @returns True when the value is a valid game phase.
 */
const isValidGamePhase = (value: string): value is GamePhase => {
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
  if (payload === GAME_PHASES.GAMEOVER && !state.terminalOutcome) {
    return {
      ...state,
      currentScene: payload,
      terminalOutcome: deriveGameOverOutcome(state)
    }
  }
  return { ...state, currentScene: payload }
}

/**
 * Names why a live GAMEOVER transition happened, so the ending is saved.
 *
 * @remarks
 * The live Continue and stranded paths change scene through this action rather
 * than through a settlement, so without a recorded outcome the autosave at
 * GAMEOVER would reload as OVERWORLD. The cause is read the way the GameOver
 * screen reads it: a completed tour is the victory, a scene change out of the
 * Overworld is the stranded check, and anything else is bankruptcy.
 */
const deriveGameOverOutcome = (state: GameState): TerminalOutcome => {
  if (state.player.stats?.tourCompleted === true) {
    return { reason: 'career_victory' }
  }
  return state.currentScene === GAME_PHASES.OVERWORLD
    ? { reason: 'stranded' }
    : { reason: 'bankruptcy' }
}
