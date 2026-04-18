/**
 * Action Creators Module
 * Factory functions for creating dispatch actions.
 * @module actionCreators
 */

import { ActionTypes } from './actionTypes'
import { getSafeUUID } from '../utils/crypto'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'
import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type {
  BloodBankDonatePayload,
  ClinicActionPayload,
  GameAction,
  GameState,
  GameMap,
  GameEvent,
  GigModifiers,
  GigStats,
  MerchPressPayload,
  PirateBroadcastPayload,
  QuestState,
  ResetStatePayload,
  EventDeltaPayload,
  Venue,
  ToastPayload,
  TradeVoidItemPayload,
  UpdateBandPayload,
  UpdatePlayerPayload,
  SocialState
} from '../types/game'

/**
 * Creates a scene change action
 * @param {string} scene - Target scene name
 * @returns {Object} Action object
 */
export const createChangeSceneAction = (
  scene: string
): Extract<GameAction, { type: typeof ActionTypes.CHANGE_SCENE }> => ({
  type: ActionTypes.CHANGE_SCENE,
  payload: scene
})

/**
 * Creates a player update action
 * @param {Object} updates - Player state updates
 * @returns {Object} Action object
 */
export const createUpdatePlayerAction = (
  updates: UpdatePlayerPayload
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_PLAYER }> => {
  if (typeof updates === 'function') {
    return {
      type: ActionTypes.UPDATE_PLAYER,
      payload: updates
    }
  }

  let safeUpdates = updates
  if (
    updates &&
    typeof updates === 'object' &&
    Object.hasOwn(updates, 'money')
  ) {
    const moneyValue = (updates as { money?: unknown }).money
    safeUpdates = {
      ...updates,
      money: clampPlayerMoney(
        typeof moneyValue === 'number' ? moneyValue : Number.NaN
      )
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
export const createUpdateBandAction = (
  updates: UpdateBandPayload
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_BAND }> => {
  if (typeof updates === 'function') {
    return {
      type: ActionTypes.UPDATE_BAND,
      payload: updates
    }
  }

  let safeUpdates = updates
  if (
    updates &&
    typeof updates === 'object' &&
    Object.hasOwn(updates, 'harmony')
    const harmonyValue = (updates as { harmony?: unknown }).harmony
    safeUpdates = {
      ...updates,
      harmony: typeof harmonyValue === 'number'
        ? clampBandHarmony(harmonyValue)
        : clampBandHarmony(1)
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
export const createUpdateSocialAction = (
  updates: Partial<SocialState>
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_SOCIAL }> => ({
  type: ActionTypes.UPDATE_SOCIAL,
  payload: updates
})

/**
 * Creates a settings update action
 * @param {Object} updates - Settings updates
 * @returns {Object} Action object
 */
export const createUpdateSettingsAction = (
  updates: Record<string, unknown>
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_SETTINGS }> => ({
  type: ActionTypes.UPDATE_SETTINGS,
  payload: updates
})

/**
 * Creates a map set action
 * @param {Object} map - Generated map object
 * @returns {Object} Action object
 */
export const createSetMapAction = (
  map: GameMap
): Extract<GameAction, { type: typeof ActionTypes.SET_MAP }> => ({
  type: ActionTypes.SET_MAP,
  payload: map
})

/**
 * Creates a gig set action
 * @param {Object} gig - Current gig data
 * @returns {Object} Action object
 */
export const createSetGigAction = (
  gig: Venue | null
): Extract<GameAction, { type: typeof ActionTypes.SET_GIG }> => ({
  type: ActionTypes.SET_GIG,
  payload: gig
})

/**
 * Creates a start gig action
 * @param {Object} venue - Venue object
 * @returns {Object} Action object
 */
export const createStartGigAction = (
  venue: Venue
): Extract<GameAction, { type: typeof ActionTypes.START_GIG }> => ({
  type: ActionTypes.START_GIG,
  payload: venue
})

/**
 * Creates a setlist action
 * @param {Array} list - Array of songs
 * @returns {Object} Action object
 */
export const createSetSetlistAction = (
  list: RhythmSetlistEntry[]
): Extract<GameAction, { type: typeof ActionTypes.SET_SETLIST }> => ({
  type: ActionTypes.SET_SETLIST,
  payload: list
})

/**
 * Creates a last gig stats action
 * @param {Object} stats - Gig statistics
 * @returns {Object} Action object
 */
export const createSetLastGigStatsAction = (
  stats: GigStats | null
): Extract<GameAction, { type: typeof ActionTypes.SET_LAST_GIG_STATS }> => ({
  type: ActionTypes.SET_LAST_GIG_STATS,
  payload: stats
})

/**
 * Creates an active event action
 * @param {Object|null} event - Event object or null
 * @returns {Object} Action object
 */
export const createSetActiveEventAction = (
  event: GameEvent | null
): Extract<GameAction, { type: typeof ActionTypes.SET_ACTIVE_EVENT }> => ({
  type: ActionTypes.SET_ACTIVE_EVENT,
  payload: event
})

/**
 * Creates a toast addition action
 * @param {string|Object} messageOrPayload - Toast message string or structured payload
 * @param {string} type - Toast type (info, success, error, warning)
 * @returns {Object} Action object with generated ID
 */
export const createAddToastAction = (
  messageOrPayload: string | Omit<ToastPayload, 'id'>,
  type = 'info'
): Extract<GameAction, { type: typeof ActionTypes.ADD_TOAST }> => {
  if (
    messageOrPayload &&
    typeof messageOrPayload === 'object' &&
    !Array.isArray(messageOrPayload)
  ) {
    const {
      id: _ignoredId,
      type: payloadType,
      ...restPayload
    } = messageOrPayload as Omit<ToastPayload, 'id'> &
      Partial<Pick<ToastPayload, 'id'>>
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
export const createRemoveToastAction = (
  id: string
): Extract<GameAction, { type: typeof ActionTypes.REMOVE_TOAST }> => ({
  type: ActionTypes.REMOVE_TOAST,
  payload: id
})

/**
 * Creates a gig modifiers action
 * @param {Object|Function} payload - Modifiers or updater function
 * @returns {Object} Action object
 */
export const createSetGigModifiersAction = (
  payload:
    | Partial<GigModifiers>
    | ((prev: GigModifiers) => Partial<GigModifiers>)
): Extract<GameAction, { type: typeof ActionTypes.SET_GIG_MODIFIERS }> => ({
  type: ActionTypes.SET_GIG_MODIFIERS,
  payload
})

/**
 * Creates a load game action
 * @param {Object} data - Saved game data
 * @returns {Object} Action object
 */
export const createLoadGameAction = (
  data: Partial<GameState>
): Extract<GameAction, { type: typeof ActionTypes.LOAD_GAME }> => ({
  type: ActionTypes.LOAD_GAME,
  payload: data
})

/**
 * Creates a reset state action
 * @param {Object} [payload={}] - Data to preserve across reset (e.g. settings, unlocks)
 * @returns {Object} Action object
 */
export const createResetStateAction = (
  payload: ResetStatePayload = {}
): Extract<GameAction, { type: typeof ActionTypes.RESET_STATE }> => ({
  type: ActionTypes.RESET_STATE,
  payload
})

/**
 * Creates an event delta application action
 * @param {Object} delta - State delta to apply
 * @returns {Object} Action object
 */
export const createApplyEventDeltaAction = (
  delta: EventDeltaPayload
): Extract<GameAction, { type: typeof ActionTypes.APPLY_EVENT_DELTA }> => ({
  type: ActionTypes.APPLY_EVENT_DELTA,
  payload: delta
})

/**
 * Creates a pop pending event action
 * @returns {Object} Action object
 */
export const createPopPendingEventAction = (): Extract<
  GameAction,
  { type: typeof ActionTypes.POP_PENDING_EVENT }
> => ({
  type: ActionTypes.POP_PENDING_EVENT
})

/**
 * Creates a consume item action
 * @param {string} itemType - Item type to consume
 * @returns {Object} Action object
 */
export const createConsumeItemAction = (
  itemType: string
): Extract<GameAction, { type: typeof ActionTypes.CONSUME_ITEM }> => ({
  type: ActionTypes.CONSUME_ITEM,
  payload: itemType
})

/**
 * Creates an advance day action
 * @returns {Object} Action object
 */
export const createAdvanceDayAction = (): Extract<
  GameAction,
  { type: typeof ActionTypes.ADVANCE_DAY }
> => ({
  type: ActionTypes.ADVANCE_DAY
})

/**
 * Creates an add cooldown action
 * @param {string} eventId - Event ID to add to cooldowns
 * @returns {Object} Action object
 */
export const createAddCooldownAction = (
  eventId: string
): Extract<GameAction, { type: typeof ActionTypes.ADD_COOLDOWN }> => ({
  type: ActionTypes.ADD_COOLDOWN,
  payload: eventId
})

/**
 * Creates start travel minigame action
 * @param {string} targetNodeId - The destination node ID
 * @returns {Object} Action object
 */
export const createStartTravelMinigameAction = (
  targetNodeId: string
): Extract<GameAction, { type: typeof ActionTypes.START_TRAVEL_MINIGAME }> => ({
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
  damageTaken: number,
  itemsCollected: unknown[],
  rngValue?: number,
  contrabandId?: string,
  instanceId?: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_TRAVEL_MINIGAME }
> => ({
  type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
  payload: { damageTaken, itemsCollected, rngValue, contrabandId, instanceId }
})

/**
 * Creates start roadie minigame action
 * @param {string} gigId - The gig ID
 * @returns {Object} Action object
 */
export const createStartRoadieMinigameAction = (
  gigId: string
): Extract<GameAction, { type: typeof ActionTypes.START_ROADIE_MINIGAME }> => ({
  type: ActionTypes.START_ROADIE_MINIGAME,
  payload: { gigId }
})

/**
 * Creates complete roadie minigame action
 * @param {Object} results - Results { equipmentDamage }
 * @returns {Object} Action object
 */
export const createCompleteRoadieMinigameAction = (
  equipmentDamage: number
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_ROADIE_MINIGAME }
> => ({
  type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
  payload: { equipmentDamage }
})

/**
 * Creates start kabelsalat minigame action
 * @param {string} gigId
 * @returns {Object}
 */
export const createStartKabelsalatMinigameAction = (
  gigId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.START_KABELSALAT_MINIGAME }
> => ({
  type: ActionTypes.START_KABELSALAT_MINIGAME,
  payload: { gigId }
})

/**
 * Creates complete kabelsalat minigame action
 * @param {Object} results
 * @returns {Object}
 */
export const createCompleteKabelsalatMinigameAction = (
  results: unknown
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_KABELSALAT_MINIGAME }
> => ({
  type: ActionTypes.COMPLETE_KABELSALAT_MINIGAME,
  payload: { results }
})

/**
 * Action creator to start Amp Calibration minigame
 * @param {string} gigId - Target gig
 * @returns {Object} Action object
 */
export const createStartAmpCalibrationAction = (
  gigId: string
): Extract<GameAction, { type: typeof ActionTypes.START_AMP_CALIBRATION }> => ({
  type: ActionTypes.START_AMP_CALIBRATION,
  payload: { gigId }
})

/**
 * Action creator to complete Amp Calibration minigame
 * @param {number} score
 * @returns {Object} Action object
 */
export const createCompleteAmpCalibrationAction = (
  score: number
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_AMP_CALIBRATION }
> => ({
  type: ActionTypes.COMPLETE_AMP_CALIBRATION,
  payload: { score }
})

/**
 * Creates unlock trait action
 * @param {Object} payload - { memberId, traitId }
 * @returns {Object} Action object
 */
export const createUnlockTraitAction = (
  memberId: string,
  traitId: string
): Extract<GameAction, { type: typeof ActionTypes.UNLOCK_TRAIT }> => ({
  type: ActionTypes.UNLOCK_TRAIT,
  payload: { memberId, traitId }
})

/**
 * Creates an action to blacklist a venue.
 * The `handleAddVenueBlacklist` reducer handles it.
 * @param {string} venueId - The ID of the venue to blacklist.
 * @returns {Object} Action object
 */
export const createAddVenueBlacklistAction = (
  venueId: string
): Extract<GameAction, { type: typeof ActionTypes.ADD_VENUE_BLACKLIST }> => ({
  type: ActionTypes.ADD_VENUE_BLACKLIST,
  payload: { venueId, toastId: getSafeUUID() }
})

/**
 * Creates an action to add a new quest.
 * @param {Object} quest - The quest object to add.
 * @returns {Object} Action object
 */
export const createAddQuestAction = (
  quest: QuestState
): Extract<GameAction, { type: typeof ActionTypes.ADD_QUEST }> => ({
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
  questId: string,
  amount = 1,
  randomIdx: number | undefined = undefined
): Extract<GameAction, { type: typeof ActionTypes.ADVANCE_QUEST }> => ({
  type: ActionTypes.ADVANCE_QUEST,
  payload: { questId, amount, randomIdx }
})

/**
 * Creates an action to complete a quest.
 * The `handleCompleteQuest` reducer processes it.
 * @param {string} questId - The ID of the quest to complete.
 * @returns {Object} Action object
 */
export const createCompleteQuestAction = (
  questId: string,
  randomIdx: number | undefined = undefined
): Extract<GameAction, { type: typeof ActionTypes.COMPLETE_QUEST }> => ({
  type: ActionTypes.COMPLETE_QUEST,
  payload: { questId, randomIdx }
})

/**
 * Creates an action to fail expired quests.
 * It utilizes the `handleFailQuests` reducer.
 * @returns {Object} Action object
 */
export const createFailQuestsAction = (): Extract<
  GameAction,
  { type: typeof ActionTypes.FAIL_QUESTS }
> => ({
  type: ActionTypes.FAIL_QUESTS
})

/**
 * Creates an action to add an unlock to the state.
 * @param {string} unlockId - The ID of the unlock.
 * @returns {Object} Action object
 */
export const createAddUnlockAction = (
  unlockId: string
): Extract<GameAction, { type: typeof ActionTypes.ADD_UNLOCK }> => ({
  type: ActionTypes.ADD_UNLOCK,
  payload: unlockId
})

/**
 * Creates an action to add a contraband item to the stash.
 * @param {string} contrabandId - The ID of the contraband item.
 * @returns {Object} Action object
 */
export const createAddContrabandAction = (
  contrabandId: string
): Extract<GameAction, { type: typeof ActionTypes.ADD_CONTRABAND }> => ({
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
  instanceId: string,
  contrabandId: string,
  memberId?: string
): Extract<GameAction, { type: typeof ActionTypes.USE_CONTRABAND }> => ({
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
export const createClinicHealAction = (
  payload: ClinicActionPayload
): Extract<GameAction, { type: typeof ActionTypes.CLINIC_HEAL }> => ({
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
export const createClinicEnhanceAction = (
  payload: ClinicActionPayload
): Extract<GameAction, { type: typeof ActionTypes.CLINIC_ENHANCE }> => ({
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
export const createPirateBroadcastAction = (
  payload: PirateBroadcastPayload
): Extract<GameAction, { type: typeof ActionTypes.PIRATE_BROADCAST }> => ({
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
export const createBloodBankDonateAction = (
  payload: BloodBankDonatePayload
): Extract<GameAction, { type: typeof ActionTypes.BLOOD_BANK_DONATE }> => ({
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
export const createTradeVoidItemAction = (
  payload: TradeVoidItemPayload
): Extract<GameAction, { type: typeof ActionTypes.TRADE_VOID_ITEM }> => ({
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
export const createMerchPressAction = (
  payload: MerchPressPayload
): Extract<GameAction, { type: typeof ActionTypes.MERCH_PRESS }> => ({
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
