/**
 * Action Creators Module
 * Factory functions for creating dispatch actions.
 * @module actionCreators
 */

import { ActionTypes } from './actionTypes.js'

/**
 * Monotonic counter for generating unique toast IDs
 * Combines with timestamp to ensure uniqueness even for back-to-back toasts
 * @type {number}
 */
let toastIdCounter = 0

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
export const createUpdatePlayerAction = updates => ({
  type: ActionTypes.UPDATE_PLAYER,
  payload: updates
})

/**
 * Creates a band update action
 * @param {Object} updates - Band state updates
 * @returns {Object} Action object
 */
export const createUpdateBandAction = updates => ({
  type: ActionTypes.UPDATE_BAND,
  payload: updates
})

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
 * @param {string} message - Toast message
 * @param {string} type - Toast type (info, success, error, warning)
 * @returns {Object} Action object with generated ID
 */
export const createAddToastAction = (message, type = 'info') => ({
  type: ActionTypes.ADD_TOAST,
  payload: { id: crypto.randomUUID(), message, type }
})

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
  payload: venueId
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
    instanceId: crypto.randomUUID()
  }
})

/**
 * Creates an action to use a contraband item from the stash.
 * @param {string} instanceId - The unique instance ID of the contraband item in the stash.
 * @param {string} [memberId] - Optional. The ID of the band member to apply the effect to.
 * @returns {Object} Action object
 */
export const createUseContrabandAction = (instanceId, memberId) => ({
  type: ActionTypes.USE_CONTRABAND,
  payload: { instanceId, memberId }
})
