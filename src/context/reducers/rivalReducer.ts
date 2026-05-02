import type { GameState, RivalBandState, ToastPayload } from '../../types/game'
import { generateRivalBand, moveRivalBand } from '../../utils/rivalEngine'
import { secureRandom, getSafeUUID } from '../../utils/crypto'

export const handleSpawnRivalBand = (state: GameState): GameState => {
  if (state.rivalBand) return state

  return {
    ...state,
    rivalBand: generateRivalBand(state.player.day ?? 1, secureRandom)
  }
}

export const handleMoveRivalBand = (state: GameState): GameState => {
  if (!state.rivalBand || !state.gameMap) return state

  return {
    ...state,
    rivalBand: moveRivalBand(state.rivalBand, state.gameMap, secureRandom)
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
      message: `Your rival band, ${rivalName}, is in town!`,
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
