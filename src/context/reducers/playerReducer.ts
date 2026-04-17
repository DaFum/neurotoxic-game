// TODO: Review playerReducer.js for completeness (UPDATE_PLAYER) and verify edge cases are handled in the switch.
import { logger } from '../../utils/logger'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel
} from '../../utils/gameStateUtils'
import { ActionTypes } from '../actionTypes'

type PlayerSlice = {
  player: Record<string, unknown> & {
    money: number
    fame: number
    fameLevel: number
  }
}

type PlayerUpdates = Partial<PlayerSlice['player']>
type UpdatePlayerPayload = PlayerUpdates | ((player: PlayerSlice['player']) => PlayerUpdates)

export type PlayerAction =
  | { type: typeof ActionTypes.UPDATE_PLAYER; payload: UpdatePlayerPayload }
  | { type: string; payload?: unknown }

/**
 * Handles player update actions
 * Clamps player.money and player.fame to ensure they never go negative
 * and correctly applied.
 */
export const handleUpdatePlayer = (
  state: PlayerSlice,
  payload: UpdatePlayerPayload
): PlayerSlice => {
  logger.debug('GameState', 'Update Player', payload)
  const updates =
    typeof payload === 'function' ? payload(state.player) : payload || {}

  if (updates == null || typeof updates !== 'object') {
    return state
  }

  const nextFame = clampPlayerFame(
    Object.hasOwn(updates, 'fame') ? (updates.fame as number) : state.player.fame
  )

  const nextMoney = clampPlayerMoney(
    Object.hasOwn(updates, 'money')
      ? (updates.money as number)
      : state.player.money
  )

  const nextFameLevel = Object.hasOwn(updates, 'fameLevel')
    ? (updates.fameLevel as number)
    : calculateFameLevel(nextFame)

  const mergedPlayer = {
    ...state.player,
    ...updates,
    money: nextMoney,
    fame: nextFame,
    fameLevel: nextFameLevel
  }

  return { ...state, player: mergedPlayer }
}

/**
 * Reducer for player actions.
 * Uses a discriminated union so payload is typed for UPDATE_PLAYER.
 */
export const playerReducer = (
  state: PlayerSlice,
  action: PlayerAction
): PlayerSlice => {
  switch (action.type) {
    case ActionTypes.UPDATE_PLAYER:
      return handleUpdatePlayer(state, action.payload as UpdatePlayerPayload)
    default:
      return state
  }
}
