import type { GameState, RivalBandState } from '../../types/game'
import { generateRivalBand, moveRivalBand } from '../../utils/rivalEngine'
import { secureRandom } from '../../utils/crypto'

export const handleSpawnRivalBand = (state: GameState): GameState => {
  if (state.rivalBand) return state

  return {
    ...state,
    rivalBand: generateRivalBand(state.player.day || 1, secureRandom)
  }
}

export const handleMoveRivalBand = (state: GameState): GameState => {
  if (!state.rivalBand || !state.gameMap) return state

  return {
    ...state,
    rivalBand: moveRivalBand(state.rivalBand, state.gameMap, secureRandom)
  }
}

export const handleUpdateRivalBand = (
  state: GameState,
  payload: Partial<RivalBandState>
): GameState => {
  if (!state.rivalBand) return state

  // Whitelist safe fields to merge to prevent arbitrary payload pollution
  const safeUpdates: Partial<RivalBandState> = {}
  if (payload.id !== undefined) safeUpdates.id = payload.id
  if (payload.name !== undefined) safeUpdates.name = payload.name
  if (payload.alignment !== undefined) safeUpdates.alignment = payload.alignment
  if (payload.powerLevel !== undefined)
    safeUpdates.powerLevel = payload.powerLevel
  if (payload.currentLocationId !== undefined)
    safeUpdates.currentLocationId = payload.currentLocationId

  return {
    ...state,
    rivalBand: {
      ...state.rivalBand,
      ...safeUpdates
    }
  }
}
