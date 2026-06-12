import type { GameState, RivalBandState, ToastPayload } from '../../types'
import { buildDeterministicToastId } from './toastSanitizers'
import type {
  SpawnRivalBandPayload,
  MoveRivalBandPayload
} from '../../types/actions'

/**
 * Spawns the rival band when no rival is currently active.
 *
 * @param state - Current game state before spawning.
 * @param payload - Sanitized rival band payload from the action creator.
 * @returns Updated state with the rival band, or the original state when one already exists.
 */
export const handleSpawnRivalBand = (
  state: GameState,
  payload: SpawnRivalBandPayload
): GameState => {
  if (state.rivalBand) return state

  return {
    ...state,
    rivalBand: payload.rivalBand
  }
}

/**
 * Moves the active rival band across the current game map.
 *
 * @param state - Current game state before movement.
 * @param payload - Sanitized rival band state after movement.
 * @returns Updated state with the moved rival, or the original state when no rival or map exists.
 */
export const handleMoveRivalBand = (
  state: GameState,
  payload: MoveRivalBandPayload
): GameState => {
  if (!state.rivalBand || !state.gameMap) return state

  return {
    ...state,
    rivalBand: payload.rivalBand
  }
}

/**
 * Adds a warning toast when the rival occupies the player's current node.
 *
 * @param state - Current game state to inspect for a rival encounter.
 * @returns Updated state with an encounter toast, or the original state when no encounter exists.
 */
export const handleCheckRivalEncounter = (state: GameState): GameState => {
  if (
    state.rivalBand &&
    state.player &&
    state.rivalBand.currentLocationId === state.player.currentNodeId
  ) {
    const rivalName = state.rivalBand.name
    const toast: ToastPayload = {
      id: buildDeterministicToastId('rival-encounter-toast', state.toasts),
      type: 'warning',
      messageKey: 'ui:travel.rivalEncounter',
      options: { rivalName }
    }
    return {
      ...state,
      toasts: [...(state.toasts || []), toast]
    }
  }

  return state
}

/**
 * Merges sanitized rival band updates into the active rival state.
 *
 * @param state - Current game state before the rival update.
 * @param payload - Partial rival state already sanitized by the action creator.
 * @returns Updated state with merged rival data, or the original state when no rival exists.
 */
export const handleUpdateRivalBand = (
  state: GameState,
  payload: Partial<RivalBandState>
): GameState => {
  if (!state.rivalBand) return state

  return {
    ...state,
    rivalBand: {
      ...state.rivalBand,
      ...payload // already sanitized by createUpdateRivalBandAction
    }
  }
}
