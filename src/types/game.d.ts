import type { ActionTypes } from '../context/actionTypes'

export interface PlayerStats {
  money: number
  fame: number
  /** Internal field name in state is controversyLevel; kept as toxicity for design-level docs. */
  toxicity: number
  day?: number
  score?: number
}

export type ActionType = ActionTypes[keyof ActionTypes]

export type UpdatePlayerPayload =
  | Partial<{ money: number; fame: number; fameLevel: number }>
  | ((player: Record<string, unknown>) => Record<string, unknown>)

export type GameAction =
  | { type: ActionTypes['UPDATE_PLAYER']; payload: UpdatePlayerPayload }
  | { type: ActionTypes['START_GIG']; payload: { venueId: string } | Record<string, unknown> }
  | { type: 'ADD_MONEY'; payload: number }
  | { type: string; payload?: unknown }

export interface Action<TPayload = unknown, TType extends string = ActionType> {
  type: TType
  payload?: TPayload
}
