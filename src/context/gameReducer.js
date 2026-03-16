// TODO: Implement this
/**
 * Game Reducer Module
 * Handles all state mutations through a centralized reducer pattern.
 * @module gameReducer
 */

import { ActionTypes } from './actionTypes.js'
import { handleChangeScene } from './reducers/sceneReducer.js'
import { handleUpdatePlayer } from './reducers/playerReducer.js'
import {
  handleUpdateBand,
  handleConsumeItem,
  handleUnlockTrait,
  handleAddContraband,
  handleUseContraband
} from './reducers/bandReducer.js'
import {
  handleUpdateSocial,
  handleAddVenueBlacklist,
  handlePirateBroadcast
} from './reducers/socialReducer.js'
import {
  handleSetGig,
  handleStartGig,
  handleSetSetlist,
  handleSetLastGigStats,
  handleSetGigModifiers
} from './reducers/gigReducer.js'
import {
  handleSetActiveEvent,
  handleApplyEventDelta,
  handlePopPendingEvent,
  handleAddCooldown
} from './reducers/eventReducer.js'
import {
  handleStartTravelMinigame,
  handleCompleteTravelMinigame,
  handleStartRoadieMinigame,
  handleCompleteRoadieMinigame,
  handleStartKabelsalatMinigame,
  handleCompleteKabelsalatMinigame
} from './reducers/minigameReducer.js'
import {
  handleClinicHeal,
  handleClinicEnhance
} from './reducers/clinicReducer.js'
import {
  handleAddQuest,
  handleAdvanceQuest,
  handleCompleteQuest,
  handleFailQuests
} from './reducers/questReducer.js'
import {
  handleLoadGame,
  handleResetState,
  handleUpdateSettings,
  handleSetMap,
  handleAddToast,
  handleRemoveToast,
  handleAdvanceDay,
  handleAddUnlock
} from './reducers/systemReducer.js'

export { ActionTypes }

/**
 * Main state reducer for the game.
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
export const gameReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.CHANGE_SCENE:
      return handleChangeScene(state, action.payload)

    case ActionTypes.UPDATE_PLAYER:
      return handleUpdatePlayer(state, action.payload)

    case ActionTypes.UPDATE_BAND:
      return handleUpdateBand(state, action.payload)

    case ActionTypes.ADD_CONTRABAND:
      return handleAddContraband(state, action.payload)

    case ActionTypes.USE_CONTRABAND:
      return handleUseContraband(state, action.payload)

    case ActionTypes.UPDATE_SOCIAL:
      return handleUpdateSocial(state, action.payload)

    case ActionTypes.UPDATE_SETTINGS:
      return handleUpdateSettings(state, action.payload)

    case ActionTypes.SET_MAP:
      return handleSetMap(state, action.payload)

    case ActionTypes.SET_GIG:
      return handleSetGig(state, action.payload)

    case ActionTypes.START_GIG:
      return handleStartGig(state, action.payload)

    case ActionTypes.SET_SETLIST:
      return handleSetSetlist(state, action.payload)

    case ActionTypes.SET_LAST_GIG_STATS:
      return handleSetLastGigStats(state, action.payload)

    case ActionTypes.SET_ACTIVE_EVENT:
      return handleSetActiveEvent(state, action.payload)

    case ActionTypes.ADD_TOAST:
      return handleAddToast(state, action.payload)

    case ActionTypes.REMOVE_TOAST:
      return handleRemoveToast(state, action.payload)

    case ActionTypes.SET_GIG_MODIFIERS:
      return handleSetGigModifiers(state, action.payload)

    case ActionTypes.LOAD_GAME:
      return handleLoadGame(state, action.payload)

    case ActionTypes.RESET_STATE:
      return handleResetState(state, action.payload)

    case ActionTypes.APPLY_EVENT_DELTA:
      return handleApplyEventDelta(state, action.payload)

    case ActionTypes.POP_PENDING_EVENT:
      return handlePopPendingEvent(state)

    case ActionTypes.CONSUME_ITEM:
      return handleConsumeItem(state, action.payload)

    case ActionTypes.ADVANCE_DAY:
      return handleAdvanceDay(state, action.payload)

    case ActionTypes.ADD_COOLDOWN:
      return handleAddCooldown(state, action.payload)

    case ActionTypes.START_TRAVEL_MINIGAME:
      return handleStartTravelMinigame(state, action.payload)

    case ActionTypes.COMPLETE_TRAVEL_MINIGAME:
      return handleCompleteTravelMinigame(state, action.payload)

    case ActionTypes.START_ROADIE_MINIGAME:
      return handleStartRoadieMinigame(state, action.payload)

    case ActionTypes.COMPLETE_ROADIE_MINIGAME:
      return handleCompleteRoadieMinigame(state, action.payload)

    case ActionTypes.START_KABELSALAT_MINIGAME:
      return handleStartKabelsalatMinigame(state, action.payload)

    case ActionTypes.COMPLETE_KABELSALAT_MINIGAME:
      return handleCompleteKabelsalatMinigame(state, action.payload)

    case ActionTypes.UNLOCK_TRAIT:
      return handleUnlockTrait(state, action.payload)

    case ActionTypes.PIRATE_BROADCAST:
      return handlePirateBroadcast(state, action.payload)

    case ActionTypes.ADD_VENUE_BLACKLIST:
      return handleAddVenueBlacklist(state, action.payload)

    case ActionTypes.ADD_QUEST:
      return handleAddQuest(state, action.payload)

    case ActionTypes.ADVANCE_QUEST:
      return handleAdvanceQuest(state, action.payload)

    case ActionTypes.COMPLETE_QUEST:
      return handleCompleteQuest(state, action.payload)

    case ActionTypes.FAIL_QUESTS:
      return handleFailQuests(state)

    case ActionTypes.ADD_UNLOCK:
      return handleAddUnlock(state, action.payload)

    case ActionTypes.CLINIC_HEAL:
      return handleClinicHeal(state, action.payload)

    case ActionTypes.CLINIC_ENHANCE:
      return handleClinicEnhance(state, action.payload)

    default:
      return state
  }
}
