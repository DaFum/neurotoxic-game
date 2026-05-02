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

// Use any for payload in the mapped type to allow handlers to define their own specific constraints while ensuring all keys are handled.
type ReducerMap = {
  [K in HandledActionTypes]: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: ExtractActionPayload<GameAction, K> | any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any
}

/**
 * Maps action types to their respective handler functions.
 * Using a map provides O(1) lookup instead of a long switch statement.
 */
const reducerMap = {
  [ActionTypes.CHANGE_SCENE]: handleChangeScene,
  [ActionTypes.UPDATE_PLAYER]: handleUpdatePlayer,
  [ActionTypes.UPDATE_SOCIAL]: handleUpdateSocial,
  [ActionTypes.UPDATE_SETTINGS]: handleUpdateSettings,
  [ActionTypes.SET_MAP]: handleSetMap,
  [ActionTypes.SET_GIG]: handleSetGig,
  [ActionTypes.START_GIG]: handleStartGig,
  [ActionTypes.SET_SETLIST]: handleSetSetlist,
  [ActionTypes.SET_LAST_GIG_STATS]: handleSetLastGigStats,
  [ActionTypes.SET_ACTIVE_EVENT]: handleSetActiveEvent,
  [ActionTypes.ADD_TOAST]: handleAddToast,
  [ActionTypes.REMOVE_TOAST]: handleRemoveToast,
  [ActionTypes.SET_GIG_MODIFIERS]: handleSetGigModifiers,
  [ActionTypes.LOAD_GAME]: handleLoadGame,
  [ActionTypes.RESET_STATE]: handleResetState,
  [ActionTypes.APPLY_EVENT_DELTA]: handleApplyEventDelta,
  [ActionTypes.POP_PENDING_EVENT]: (state: GameState) =>
    handlePopPendingEvent(state),
  [ActionTypes.ADVANCE_DAY]: handleAdvanceDay,
  [ActionTypes.ADD_COOLDOWN]: handleAddCooldown,
  [ActionTypes.START_TRAVEL_MINIGAME]: handleStartTravelMinigame,
  [ActionTypes.COMPLETE_TRAVEL_MINIGAME]: handleCompleteTravelMinigame,
  [ActionTypes.START_ROADIE_MINIGAME]: handleStartRoadieMinigame,
  [ActionTypes.COMPLETE_ROADIE_MINIGAME]: handleCompleteRoadieMinigame,
  [ActionTypes.START_KABELSALAT_MINIGAME]: handleStartKabelsalatMinigame,
  [ActionTypes.COMPLETE_KABELSALAT_MINIGAME]: handleCompleteKabelsalatMinigame,
  [ActionTypes.START_AMP_CALIBRATION]: handleStartAmpCalibration,
  [ActionTypes.COMPLETE_AMP_CALIBRATION]: handleCompleteAmpCalibration,
  [ActionTypes.PIRATE_BROADCAST]: handlePirateBroadcast,
  [ActionTypes.MERCH_PRESS]: handleMerchPress,
  [ActionTypes.DARK_WEB_LEAK]: handleDarkWebLeak,
  [ActionTypes.ADD_VENUE_BLACKLIST]: handleAddVenueBlacklist,
  [ActionTypes.ADD_QUEST]: handleAddQuest,
  [ActionTypes.ADVANCE_QUEST]: handleAdvanceQuest,
  [ActionTypes.COMPLETE_QUEST]: handleCompleteQuest,
  [ActionTypes.FAIL_QUESTS]: (state: GameState) => handleFailQuests(state),
  [ActionTypes.ADD_UNLOCK]: handleAddUnlock,
  [ActionTypes.CLINIC_HEAL]: handleClinicHeal,
  [ActionTypes.CLINIC_ENHANCE]: handleClinicEnhance,
  [ActionTypes.TRADE_VOID_ITEM]: handleTradeVoidItem,
  [ActionTypes.BLOOD_BANK_DONATE]: handleBloodBankDonate,
  [ActionTypes.SET_PENDING_BANDHQ_OPEN]: handleSetPendingBandHQOpen
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload?: any
    ) => GameState
    const payload = 'payload' in action ? action.payload : undefined
    return handler(state, payload)
  }

  // Fallback: unhandled action type
  assertNever(action as never)
}
