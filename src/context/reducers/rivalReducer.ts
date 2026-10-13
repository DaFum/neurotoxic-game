import type { GameState, RivalBandState, ToastPayload } from '../../types'
import { buildDeterministicToastId } from './toastSanitizers'
import { isLooseRecord } from '../../utils/objectUtils'
import {
  sanitizeRivalBand,
  sanitizeRivalBandUpdates
} from './sanitizers/stateSanitizers'
import type {
  SpawnRivalBandPayload,
  MoveRivalBandPayload
} from '../../types/actions'

/**
 * Re-validates a rival band carried by a spawn/move payload.
 *
 * @param payload - Untrusted spawn or move payload.
 * @returns A whitelisted rival band, or null when the payload is malformed.
 */
const readPayloadRivalBand = (payload: unknown): RivalBandState | null =>
  isLooseRecord(payload) && Object.hasOwn(payload, 'rivalBand')
    ? sanitizeRivalBand(payload.rivalBand)
    : null

/**
 * Spawns the rival band when no rival is currently active.
 *
 * @param state - Current game state before spawning.
 * @param payload - Rival band payload from the action creator; re-validated
 * with the load sanitizer's whitelist.
 * @returns Updated state with the rival band, or the original state when one
 * already exists or the payload is malformed.
 */
export const handleSpawnRivalBand = (
  state: GameState,
  payload: SpawnRivalBandPayload
): GameState => {
  if (state.rivalBand) return state
  const rivalBand = readPayloadRivalBand(payload)
  if (!rivalBand) return state

  return {
    ...state,
    rivalBand
  }
}

/**
 * Moves the active rival band across the current game map.
 *
 * @param state - Current game state before movement.
 * @param payload - Rival band state after movement; re-validated with the load
 * sanitizer's whitelist.
 * @returns Updated state with the moved rival, or the original state when no
 * rival or map exists or the payload is malformed.
 */
export const handleMoveRivalBand = (
  state: GameState,
  payload: MoveRivalBandPayload
): GameState => {
  if (!state.rivalBand || !state.gameMap) return state
  const rivalBand = readPayloadRivalBand(payload)
  if (!rivalBand) return state

  return {
    ...state,
    rivalBand
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
 * @param payload - Partial rival state. Re-whitelisted with
 * `sanitizeRivalBandUpdates` (the same helper the action creator uses), so a
 * raw dispatch cannot add unknown keys or write mistyped fields.
 * @returns Updated state with merged rival data, or the original state when no rival exists.
 */
export const handleUpdateRivalBand = (
  state: GameState,
  payload: Partial<RivalBandState>
): GameState => {
  if (!state.rivalBand) return state

  const updates = sanitizeRivalBandUpdates(payload)

  return {
    ...state,
    rivalBand: {
      ...state.rivalBand,
      ...updates
    }
  }
}
