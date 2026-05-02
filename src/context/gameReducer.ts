/**
 * Game Reducer Module
 * Handles all state mutations through a centralized reducer pattern.
 * @module gameReducer
 */

import { ActionTypes } from './actionTypes'
import { assertNever } from '../utils/assertNever'
import type { GameAction, GameState } from '../types/game'
import { handleChangeScene } from './reducers/sceneReducer'
import { handleUpdatePlayer } from './reducers/playerReducer'
import { bandReducer } from './reducers/bandReducer'
import {
  handleUpdateSocial,
  handleAddVenueBlacklist,
  handlePirateBroadcast,
  handleMerchPress,
  handleDarkWebLeak
} from './reducers/socialReducer'
import {
  handleSetGig,
  handleStartGig,
  handleSetSetlist,
  handleSetLastGigStats,
  handleSetGigModifiers
} from './reducers/gigReducer'
import {
  handleSetActiveEvent,
  handleApplyEventDelta,
  handlePopPendingEvent,
  handleAddCooldown
} from './reducers/eventReducer'
import {
  handleStartTravelMinigame,
  handleCompleteTravelMinigame,
  handleStartRoadieMinigame,
  handleCompleteRoadieMinigame,
  handleStartKabelsalatMinigame,
  handleCompleteKabelsalatMinigame,
  handleStartAmpCalibration,
  handleCompleteAmpCalibration
} from './reducers/minigameReducer'
import {
  handleClinicHeal,
  handleClinicEnhance,
  handleBloodBankDonate
} from './reducers/clinicReducer'
import {
  handleAddQuest,
  handleAdvanceQuest,
  handleCompleteQuest,
  handleFailQuests
} from './reducers/questReducer'
import {
  handleLoadGame,
  handleResetState,
  handleUpdateSettings,
  handleSetMap,
  handleAddToast,
  handleRemoveToast,
  handleAdvanceDay,
  handleAddUnlock,
  handleSetPendingBandHQOpen
} from './reducers/systemReducer'
import { handleTradeVoidItem } from './reducers/tradeReducer'

export { ActionTypes }

/**
 * Utility type to extract the payload type from a GameAction union.
 */
type ExtractActionPayload<A, T> = A extends { type: T; payload: infer P }
  ? P
  : A extends { type: T }
    ? undefined
    : never

type ActionTypeUnion = (typeof ActionTypes)[keyof typeof ActionTypes]

/**
 * Union of action types handled by the main gameReducer's reducerMap.
 * Excludes actions handled by sub-reducers (e.g., bandReducer).
 */
export const BAND_ACTIONS = [
  ActionTypes.UPDATE_BAND,
  ActionTypes.ADD_CONTRABAND,
  ActionTypes.USE_CONTRABAND,
  ActionTypes.CONSUME_ITEM,
  ActionTypes.UNLOCK_TRAIT
] as const

type HandledActionTypes = Exclude<
  ActionTypeUnion,
  (typeof BAND_ACTIONS)[number]
>

type ReducerMap = {
  [K in HandledActionTypes]: (
    state: GameState,
    payload: ExtractActionPayload<GameAction, K>
  ) => GameState
}

/**
 * Maps action types to their respective handler functions.
 * Using a map provides O(1) lookup instead of a long switch statement.
 */
const reducerMap = {
  [ActionTypes.CHANGE_SCENE]: handleChangeScene as never,
  [ActionTypes.UPDATE_PLAYER]: handleUpdatePlayer as never,
  [ActionTypes.UPDATE_SOCIAL]: handleUpdateSocial as never,
  [ActionTypes.UPDATE_SETTINGS]: handleUpdateSettings as never,
  [ActionTypes.SET_MAP]: handleSetMap as never,
  [ActionTypes.SET_GIG]: handleSetGig as never,
  [ActionTypes.START_GIG]: handleStartGig as never,
  [ActionTypes.SET_SETLIST]: handleSetSetlist as never,
  [ActionTypes.SET_LAST_GIG_STATS]: handleSetLastGigStats as never,
  [ActionTypes.SET_ACTIVE_EVENT]: handleSetActiveEvent as never,
  [ActionTypes.ADD_TOAST]: handleAddToast as never,
  [ActionTypes.REMOVE_TOAST]: handleRemoveToast as never,
  [ActionTypes.SET_GIG_MODIFIERS]: handleSetGigModifiers as never,
  [ActionTypes.LOAD_GAME]: handleLoadGame as never,
  [ActionTypes.RESET_STATE]: handleResetState as never,
  [ActionTypes.APPLY_EVENT_DELTA]: handleApplyEventDelta as never,
  [ActionTypes.POP_PENDING_EVENT]: ((state: GameState) =>
    handlePopPendingEvent(state)) as never,
  [ActionTypes.ADVANCE_DAY]: handleAdvanceDay as never,
  [ActionTypes.ADD_COOLDOWN]: handleAddCooldown as never,
  [ActionTypes.START_TRAVEL_MINIGAME]: handleStartTravelMinigame as never,
  [ActionTypes.COMPLETE_TRAVEL_MINIGAME]: handleCompleteTravelMinigame as never,
  [ActionTypes.START_ROADIE_MINIGAME]: handleStartRoadieMinigame as never,
  [ActionTypes.COMPLETE_ROADIE_MINIGAME]: handleCompleteRoadieMinigame as never,
  [ActionTypes.START_KABELSALAT_MINIGAME]:
    handleStartKabelsalatMinigame as never,
  [ActionTypes.COMPLETE_KABELSALAT_MINIGAME]:
    handleCompleteKabelsalatMinigame as never,
  [ActionTypes.START_AMP_CALIBRATION]: handleStartAmpCalibration as never,
  [ActionTypes.COMPLETE_AMP_CALIBRATION]: handleCompleteAmpCalibration as never,
  [ActionTypes.PIRATE_BROADCAST]: handlePirateBroadcast as never,
  [ActionTypes.MERCH_PRESS]: handleMerchPress as never,
  [ActionTypes.DARK_WEB_LEAK]: handleDarkWebLeak as never,
  [ActionTypes.ADD_VENUE_BLACKLIST]: handleAddVenueBlacklist as never,
  [ActionTypes.ADD_QUEST]: handleAddQuest as never,
  [ActionTypes.ADVANCE_QUEST]: handleAdvanceQuest as never,
  [ActionTypes.COMPLETE_QUEST]: handleCompleteQuest as never,
  [ActionTypes.FAIL_QUESTS]: ((state: GameState) =>
    handleFailQuests(state)) as never,
  [ActionTypes.ADD_UNLOCK]: handleAddUnlock as never,
  [ActionTypes.CLINIC_HEAL]: handleClinicHeal as never,
  [ActionTypes.CLINIC_ENHANCE]: handleClinicEnhance as never,
  [ActionTypes.TRADE_VOID_ITEM]: handleTradeVoidItem as never,
  [ActionTypes.BLOOD_BANK_DONATE]: handleBloodBankDonate as never,
  [ActionTypes.SET_PENDING_BANDHQ_OPEN]: handleSetPendingBandHQOpen as never
} satisfies ReducerMap

/**
 * Main state reducer for the game.
 * Uses a map-based dispatcher or delegates to sub-reducers.
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export const gameReducer = (
  state: GameState,
  action: GameAction
): GameState => {
  // Delegate band actions to the bandReducer
  if ((BAND_ACTIONS as readonly string[]).includes(action.type)) {
    return bandReducer(state, action)
  }

  // Dispatch using the O(1) reducer map
  if (Object.hasOwn(reducerMap, action.type)) {
    const handler = reducerMap[action.type as keyof ReducerMap] as (
      nextState: GameState,
      payload?: unknown
    ) => GameState
    const payload = 'payload' in action ? action.payload : undefined
    return handler(state, payload)
  }

  // Fallback: unhandled action type
  assertNever(action as never)
  return state
}
