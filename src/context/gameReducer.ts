// @ts-nocheck
/**
 * Game Reducer Module
 * Handles all state mutations through a centralized reducer pattern.
 * @module gameReducer
 */

import { ActionTypes } from './actionTypes'
import { handleChangeScene } from './reducers/sceneReducer'
import { handleUpdatePlayer } from './reducers/playerReducer'
import { bandReducer } from './reducers/bandReducer'
import {
  handleUpdateSocial,
  handleAddVenueBlacklist,
  handlePirateBroadcast,
  handleMerchPress
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
  handleAddUnlock
} from './reducers/systemReducer'
import { handleTradeVoidItem } from './reducers/tradeReducer'

export { ActionTypes }

/**
 * Maps action types to their respective handler functions.
 * Using a map provides O(1) lookup instead of a long switch statement.
 * @type {Object.<string, Function>}
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
  [ActionTypes.POP_PENDING_EVENT]: state => handlePopPendingEvent(state),
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
  [ActionTypes.ADD_VENUE_BLACKLIST]: handleAddVenueBlacklist,
  [ActionTypes.ADD_QUEST]: handleAddQuest,
  [ActionTypes.ADVANCE_QUEST]: handleAdvanceQuest,
  [ActionTypes.COMPLETE_QUEST]: handleCompleteQuest,
  [ActionTypes.FAIL_QUESTS]: state => handleFailQuests(state),
  [ActionTypes.ADD_UNLOCK]: handleAddUnlock,
  [ActionTypes.CLINIC_HEAL]: handleClinicHeal,
  [ActionTypes.CLINIC_ENHANCE]: handleClinicEnhance,
  [ActionTypes.TRADE_VOID_ITEM]: handleTradeVoidItem,
  [ActionTypes.BLOOD_BANK_DONATE]: handleBloodBankDonate
}

/**
 * Main state reducer for the game.
 * Uses a map-based dispatcher or delegates to sub-reducers.
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export const gameReducer = (state, action) => {
  // Delegate band actions to the bandReducer
  if (
    action.type === ActionTypes.UPDATE_BAND ||
    action.type === ActionTypes.ADD_CONTRABAND ||
    action.type === ActionTypes.USE_CONTRABAND ||
    action.type === ActionTypes.CONSUME_ITEM ||
    action.type === ActionTypes.UNLOCK_TRAIT
  ) {
    return bandReducer(state, action)
  }

  // Dispatch using the O(1) reducer map
  if (Object.hasOwn(reducerMap, action.type)) {
    const handler = reducerMap[action.type]
    return handler(state, action.payload)
  }

  // Fallback
  return state
}
