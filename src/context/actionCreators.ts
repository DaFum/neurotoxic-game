// @ts-nocheck
/**
 * Action Creators Module
 * Factory functions for creating dispatch actions.
 * @module actionCreators
 */

import { ActionTypes } from './actionTypes'
import { getSafeUUID } from '../utils/crypto'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'

/**
 * Creates a scene change action
 * @param {string} scene - Target scene name
 * @returns {Object} Action object
 */
export const createChangeSceneAction = scene => ({
  type: ActionTypes.CHANGE_SCENE,
  payload: scene
})

/**
 * Creates a player update action
 * @param {Object} updates - Player state updates
 * @returns {Object} Action object
 */
export const createUpdatePlayerAction = updates => {
  let safeUpdates = updates
  if (
    updates &&
    typeof updates === 'object' &&
    Object.hasOwn(updates, 'money')
  ) {
    safeUpdates = {
      ...updates,
      money: clampPlayerMoney(updates.money)
    }
  }
  return {
    type: ActionTypes.UPDATE_PLAYER,
    payload: safeUpdates
  }
}

/**
 * Creates a band update action
 * @param {Object} updates - Band state updates
 * @returns {Object} Action object
 */
export const createUpdateBandAction = updates => {
  let safeUpdates = updates
  if (
    updates &&
    typeof updates === 'object' &&
    Object.hasOwn(updates, 'harmony')
  ) {
    safeUpdates = {
      ...updates,
      harmony: clampBandHarmony(updates.harmony)
    }
  }
  return {
    type: ActionTypes.UPDATE_BAND,
    payload: safeUpdates
  }
}

/**
 * Creates a social update action
 * @param {Object} updates - Social media state updates
 * @returns {Object} Action object
 */
export const createUpdateSocialAction = updates => ({
  type: ActionTypes.UPDATE_SOCIAL,
  payload: updates
})

/**
 * Creates a settings update action
 * @param {Object} updates - Settings updates
 * @returns {Object} Action object
 */
export const createUpdateSettingsAction = updates => ({
  type: ActionTypes.UPDATE_SETTINGS,
  payload: updates
})

/**
 * Creates a map set action
 * @param {Object} map - Generated map object
 * @returns {Object} Action object
 */
export const createSetMapAction = map => ({
  type: ActionTypes.SET_MAP,
  payload: map
})

/**
 * Creates a gig set action
 * @param {Object} gig - Current gig data
 * @returns {Object} Action object
 */
export const createSetGigAction = gig => ({
  type: ActionTypes.SET_GIG,
  payload: gig
})

/**
 * Creates a start gig action
 * @param {Object} venue - Venue object
 * @returns {Object} Action object
 */
export const createStartGigAction = venue => ({
  type: ActionTypes.START_GIG,
  payload: venue
})

/**
 * Creates a setlist action
 * @param {Array} list - Array of songs
 * @returns {Object} Action object
 */
export const createSetSetlistAction = list => ({
  type: ActionTypes.SET_SETLIST,
  payload: list
})

/**
 * Creates a last gig stats action
 * @param {Object} stats - Gig statistics
 * @returns {Object} Action object
 */
export const createSetLastGigStatsAction = stats => ({
  type: ActionTypes.SET_LAST_GIG_STATS,
  payload: stats
})

/**
 * Creates an active event action
 * @param {Object|null} event - Event object or null
 * @returns {Object} Action object
 */
export const createSetActiveEventAction = event => ({
  type: ActionTypes.SET_ACTIVE_EVENT,
  payload: event
})

/**
 * Creates a toast addition action
 * @param {string|Object} messageOrPayload - Toast message string or structured payload
 * @param {string} type - Toast type (info, success, error, warning)
 * @returns {Object} Action object with generated ID
 */
export const createAddToastAction = (messageOrPayload, type = 'info') => {
  if (
    messageOrPayload &&
    typeof messageOrPayload === 'object' &&
    !Array.isArray(messageOrPayload)
  ) {
    const {
      id: _ignoredId,
      type: payloadType,
      ...restPayload
    } = messageOrPayload
    return {
      type: ActionTypes.ADD_TOAST,
      payload: {
        id: getSafeUUID(),
        type: payloadType ?? type,
        ...restPayload
      }
    }
  }

  return {
    type: ActionTypes.ADD_TOAST,
    payload: { id: getSafeUUID(), message: messageOrPayload, type }
  }
}

/**
 * Creates a toast removal action
 * @param {string} id - Toast ID to remove
 * @returns {Object} Action object
 */
export const createRemoveToastAction = id => ({
  type: ActionTypes.REMOVE_TOAST,
  payload: id
})

/**
 * Creates a gig modifiers action
 * @param {Object|Function} payload - Modifiers or updater function
 * @returns {Object} Action object
 */
export const createSetGigModifiersAction = payload => ({
  type: ActionTypes.SET_GIG_MODIFIERS,
  payload
})

/**
 * Creates a load game action
 * @param {Object} data - Saved game data
 * @returns {Object} Action object
 */
export const createLoadGameAction = data => ({
  type: ActionTypes.LOAD_GAME,
  payload: data
})

/**
 * Creates a reset state action
 * @param {Object} [payload={}] - Data to preserve across reset (e.g. settings, unlocks)
 * @returns {Object} Action object
 */
export const createResetStateAction = (payload = {}) => ({
  type: ActionTypes.RESET_STATE,
  payload
})

/**
 * Creates an event delta application action
 * @param {Object} delta - State delta to apply
 * @returns {Object} Action object
 */
export const createApplyEventDeltaAction = delta => ({
  type: ActionTypes.APPLY_EVENT_DELTA,
  payload: delta
})

/**
 * Creates a pop pending event action
 * @returns {Object} Action object
 */
export const createPopPendingEventAction = () => ({
  type: ActionTypes.POP_PENDING_EVENT
})

/**
 * Creates a consume item action
 * @param {string} itemType - Item type to consume
 * @returns {Object} Action object
 */
export const createConsumeItemAction = itemType => ({
  type: ActionTypes.CONSUME_ITEM,
  payload: itemType
})

/**
 * Creates an advance day action
 * @returns {Object} Action object
 */
export const createAdvanceDayAction = () => ({
  type: ActionTypes.ADVANCE_DAY
})

/**
 * Creates an add cooldown action
 * @param {string} eventId - Event ID to add to cooldowns
 * @returns {Object} Action object
 */
export const createAddCooldownAction = eventId => ({
  type: ActionTypes.ADD_COOLDOWN,
  payload: eventId
})

/**
 * Creates start travel minigame action
 * @param {string} targetNodeId - The destination node ID
 * @returns {Object} Action object
 */
export const createStartTravelMinigameAction = targetNodeId => ({
  type: ActionTypes.START_TRAVEL_MINIGAME,
  payload: { targetNodeId }
})

/**
 * Creates complete travel minigame action
 * @param {number} damageTaken - Amount of damage taken
 * @param {Array} itemsCollected - Array of collected items
 * @param {number} [rngValue] - The secure random value used for drops
 * @param {string} [contrabandId] - The ID of the contraband item dropped
 * @param {string} [instanceId] - The unique instance ID of the dropped item
 * @returns {Object} Action object with payload { damageTaken, itemsCollected, rngValue, contrabandId, instanceId }
 */
export const createCompleteTravelMinigameAction = (
  damageTaken,
  itemsCollected,
  rngValue,
  contrabandId,
  instanceId
) => ({
  type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
  payload: { damageTaken, itemsCollected, rngValue, contrabandId, instanceId }
})

/**
 * Creates start roadie minigame action
 * @param {string} gigId - The gig ID
 * @returns {Object} Action object
 */
export const createStartRoadieMinigameAction = gigId => ({
  type: ActionTypes.START_ROADIE_MINIGAME,
  payload: { gigId }
})

/**
 * Creates complete roadie minigame action
 * @param {Object} results - Results { equipmentDamage }
 * @returns {Object} Action object
 */
export const createCompleteRoadieMinigameAction = equipmentDamage => ({
  type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
  payload: { equipmentDamage }
})

/**
 * Creates start kabelsalat minigame action
 * @param {string} gigId
 * @returns {Object}
 */
export const createStartKabelsalatMinigameAction = gigId => ({
  type: ActionTypes.START_KABELSALAT_MINIGAME,
  payload: { gigId }
})

/**
 * Creates complete kabelsalat minigame action
 * @param {Object} results
 * @returns {Object}
 */
export const createCompleteKabelsalatMinigameAction = results => ({
  type: ActionTypes.COMPLETE_KABELSALAT_MINIGAME,
  payload: { results }
})

/**
 * Action creator to start Amp Calibration minigame
 * @param {string} gigId - Target gig
 * @returns {Object} Action object
 */
export const createStartAmpCalibrationAction = gigId => ({
  type: ActionTypes.START_AMP_CALIBRATION,
  payload: { gigId }
})

/**
 * Action creator to complete Amp Calibration minigame
 * @param {number} score
 * @returns {Object} Action object
 */
export const createCompleteAmpCalibrationAction = score => ({
  type: ActionTypes.COMPLETE_AMP_CALIBRATION,
  payload: { score }
})

/**
 * Creates unlock trait action
 * @param {Object} payload - { memberId, traitId }
 * @returns {Object} Action object
 */
export const createUnlockTraitAction = (memberId, traitId) => ({
  type: ActionTypes.UNLOCK_TRAIT,
  payload: { memberId, traitId }
})

/**
 * Creates an action to blacklist a venue.
 * The `handleAddVenueBlacklist` reducer handles it.
 * @param {string} venueId - The ID of the venue to blacklist.
 * @returns {Object} Action object
 */
export const createAddVenueBlacklistAction = venueId => ({
  type: ActionTypes.ADD_VENUE_BLACKLIST,
  payload: { venueId, toastId: getSafeUUID() }
})

/**
 * Creates an action to add a new quest.
 * @param {Object} quest - The quest object to add.
 * @returns {Object} Action object
 */
export const createAddQuestAction = quest => ({
  type: ActionTypes.ADD_QUEST,
  payload: quest
})

/**
 * Creates an action to advance a quest's progress.
 * @param {string} questId - The ID of the quest.
 * @param {number} [amount=1] - The amount to advance progress by.
 * @returns {Object} Action object
 */
export const createAdvanceQuestAction = (
  questId,
  amount = 1,
  randomIdx = undefined
) => ({
  type: ActionTypes.ADVANCE_QUEST,
  payload: { questId, amount, randomIdx }
})

/**
 * Creates an action to complete a quest.
 * The `handleCompleteQuest` reducer processes it.
 * @param {string} questId - The ID of the quest to complete.
 * @returns {Object} Action object
 */
export const createCompleteQuestAction = (questId, randomIdx = undefined) => ({
  type: ActionTypes.COMPLETE_QUEST,
  payload: { questId, randomIdx }
})

/**
 * Creates an action to fail expired quests.
 * It utilizes the `handleFailQuests` reducer.
 * @returns {Object} Action object
 */
export const createFailQuestsAction = () => ({
  type: ActionTypes.FAIL_QUESTS
})

/**
 * Creates an action to add an unlock to the state.
 * @param {string} unlockId - The ID of the unlock.
 * @returns {Object} Action object
 */
export const createAddUnlockAction = unlockId => ({
  type: ActionTypes.ADD_UNLOCK,
  payload: unlockId
})

/**
 * Creates an action to add a contraband item to the stash.
 * @param {string} contrabandId - The ID of the contraband item.
 * @returns {Object} Action object
 */
export const createAddContrabandAction = contrabandId => ({
  type: ActionTypes.ADD_CONTRABAND,
  payload: {
    contrabandId,
    instanceId: getSafeUUID()
  }
})

/**
 * Creates an action to use a contraband item from the stash.
 * @param {string} instanceId - The unique instance ID of the contraband item in the stash.
 * @param {string} contrabandId - The ID of the contraband item.
 * @param {string} [memberId] - Optional. The ID of the band member to apply the effect to.
 * @returns {Object} Action object
 */
export const createUseContrabandAction = (
  instanceId,
  contrabandId,
  memberId
) => ({
  type: ActionTypes.USE_CONTRABAND,
  payload: { instanceId, contrabandId, memberId }
})

/**
 * Creates an action to heal a band member in the Void Clinic.
 * Cost is computed by the reducer from CLINIC_CONFIG and clinicVisits.
 * @param {Object} payload
 * @param {string} payload.memberId - The ID of the band member.
 * @param {string} payload.type - Must be 'heal'. Used by the reducer to compute cost.
 * @param {number} payload.staminaGain - The amount of stamina to restore.
 * @param {number} payload.moodGain - The amount of mood to restore.
 * @param {Object} [payload.successToast] - Toast object appended to state on success.
 * @returns {Object} Action object
 */
export const createClinicHealAction = payload => ({
  type: ActionTypes.CLINIC_HEAL,
  payload
})

/**
 * Creates an action to enhance a band member in the Void Clinic.
 * Cost is computed by the reducer from CLINIC_CONFIG and clinicVisits.
 * @param {Object} payload
 * @param {string} payload.memberId - The ID of the band member.
 * @param {string} payload.type - Must be 'enhance'. Used by the reducer to compute cost.
 * @param {string} payload.trait - The ID of the trait to graft.
 * @param {Object} [payload.successToast] - Toast object appended to state on success.
 * @returns {Object} Action object
 */
export const createClinicEnhanceAction = payload => ({
  type: ActionTypes.CLINIC_ENHANCE,
  payload
})

/**
 * Creates an action to trigger a pirate radio broadcast.
 * @param {Object} payload
 * @param {number} payload.cost - Money cost.
 * @param {number} payload.fameGain - Fame gained.
 * @param {number} payload.zealotryGain - Zealotry gained.
 * @param {number} payload.controversyGain - Controversy gained.
 * @param {number} payload.harmonyCost - Band harmony lost.
 * @param {Object} [payload.successToast] - Toast object appended to state on success.
 * @returns {Object} Action object
 */
export const createPirateBroadcastAction = payload => ({
  type: ActionTypes.PIRATE_BROADCAST,
  payload:
    payload && typeof payload === 'object'
      ? {
          ...payload,
          successToast: payload.successToast
            ? { ...payload.successToast, id: getSafeUUID() }
            : undefined
        }
      : payload
})

/**
 * Creates an action to donate blood to the void clinic.
 * @param {Object} payload
 * @param {number} payload.moneyGain - The money gained.
 * @param {number} payload.harmonyCost - The harmony lost.
 * @param {number} payload.staminaCost - The stamina lost per member.
 * @param {number} payload.controversyGain - The controversy gained.
 * @param {Object} [payload.successToast] - Optional toast on success.
 * @returns {Object} Action object
 */
export const createBloodBankDonateAction = payload => ({
  type: ActionTypes.BLOOD_BANK_DONATE,
  payload:
    payload && typeof payload === 'object'
      ? {
          ...payload,
          successToast: payload.successToast
            ? { ...payload.successToast, id: getSafeUUID() }
            : undefined
        }
      : payload
})

/**
 * Creates an action to trade fame for a void item (contraband).
 * @param {Object} payload
 * @param {string} payload.contrabandId - ID of the contraband item.
 * @param {number} payload.fameCost - Cost in fame to purchase.
 * @param {Object} [payload.successToast] - Optional toast on success.
 * @returns {Object} Action object
 */
export const createTradeVoidItemAction = payload => ({
  type: ActionTypes.TRADE_VOID_ITEM,
  payload:
    payload && typeof payload === 'object'
      ? {
          ...payload,
          instanceId: getSafeUUID(),
          successToast: payload.successToast
            ? { ...payload.successToast, id: getSafeUUID() }
            : undefined
        }
      : payload
})

/**
 * Creates an action to press merch underground.
 * @param {Object} payload
 * @param {number} payload.cost - Money cost.
 * @param {number} payload.loyaltyGain - Loyalty gained.
 * @param {number} payload.controversyGain - Controversy gained.
 * @param {number} payload.fameGain - Fame gained.
 * @param {number} payload.harmonyCost - Band harmony lost.
 * @param {Object} [payload.successToast] - Toast object appended to state on success.
 * @returns {Object} Action object
 */
export const createMerchPressAction = payload => ({
  type: ActionTypes.MERCH_PRESS,
  payload:
    payload && typeof payload === 'object'
      ? {
          ...payload,
          successToast: payload.successToast
            ? { ...payload.successToast, id: getSafeUUID() }
            : undefined
        }
      : payload
})
