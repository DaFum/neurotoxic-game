import type { GameState, RivalBandState, ToastPayload } from '../../types'
import { getSafeUUID } from '../../utils/crypto'
import type {
  SpawnRivalBandPayload,
  MoveRivalBandPayload
} from '../../types/actions'

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

export const handleCheckRivalEncounter = (state: GameState): GameState => {
  if (
    state.rivalBand &&
    state.player &&
    state.rivalBand.currentLocationId === state.player.currentNodeId
  ) {
    const rivalName = state.rivalBand.name
    const toast: ToastPayload = {
      id: getSafeUUID(),
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
