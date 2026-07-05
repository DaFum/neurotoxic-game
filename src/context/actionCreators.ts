import { createRngStream, nextSeed } from '../utils/seededRng'
import { RNG_BASE_BUFFER, RNG_ROLLS_PER_ASSET } from '../utils/assetConfig'
/**
 * Action Creators Module
 * Factory functions for creating dispatch actions.
 */

import { ActionTypes } from './actionTypes'
import type { QuestProgressEvent } from '../utils/questProgress'
import { getSafeUUID, secureRandom } from '../utils/crypto'
import { isForbiddenKey, isLooseRecord } from '../utils/objectUtils'
import { generateRivalBand, moveRivalBand } from '../utils/rivalEngine'
import { sanitizeRiskEventDescriptor } from './reducers/assetSanitizers'
import type { RivalBandState } from '../types'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel,
  clampBandHarmony,
  clampNonNegative,
  clampToNonNegativeInt,
  clamp0to100,
  clampUnitRandom,
  finiteNumberOr,
  isFiniteNumber
} from '../utils/gameState'
import type { RhythmSetlistEntry } from '../types/rhythmGame'
import type {
  BloodBankDonatePayload,
  ClinicActionPayload,
  GameAction,
  GameState,
  RelationshipChange,
  GameMap,
  GameEvent,
  GigModifiers,
  PostGigSummary,
  MerchPressPayload,
  PirateBroadcastPayload,
  QuestState,
  RawLoadedGame,
  ResetStatePayload,
  EventDeltaPayload,
  Venue,
  ToastPayload,
  TradeVoidItemPayload,
  UpdateBandPayload,
  UpdatePlayerPayload,
  SocialState,
  DarkWebLeakPayload,
  PurchaseItem
} from '../types'
import type { AssetKind, RiskEventDescriptor } from '../types/assets'

/**
 * Sanitizes a payload by clamping listed numeric fields to non-negative values
 * and stamping any `successToast` with a fresh UUID. Returns the payload
 * unchanged if it is not an object.
 *
 * Negative values for the listed `numericKeys` (e.g. `harmonyCost`,
 * `staminaCost`, `controversyGain`) are silently floored to `0` rather
 * than rejected. Reducers downstream re-clamp the final state and treat
 * `0` as a safe no-op, so the silent floor is intentional: callers can
 * pass best-effort costs without needing to short-circuit on bad inputs.
 */
const sanitizeNonNegativePayload = <
  T extends { successToast?: { id?: string } | undefined }
>(
  payload: T,
  numericKeys: ReadonlyArray<keyof T>
): T => {
  if (!payload || typeof payload !== 'object') return payload
  const sanitized = { ...payload }
  for (const key of numericKeys) {
    const raw = payload[key] as unknown
    const numeric = Number(raw)
    sanitized[key] = clampNonNegative(
      Number.isFinite(numeric) ? numeric : 0
    ) as T[typeof key]
  }
  sanitized.successToast = payload.successToast
    ? ({ ...payload.successToast, id: getSafeUUID() } as T['successToast'])
    : undefined
  return sanitized
}

/**
 * Creates a scene change action
 * @param scene - Target scene name
 */
export const createChangeSceneAction = (
  scene: GameState['currentScene']
): Extract<GameAction, { type: typeof ActionTypes.CHANGE_SCENE }> => ({
  type: ActionTypes.CHANGE_SCENE,
  payload: scene
})

/**
 * Creates a player update action
 * @param updates - Player state updates
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
  if (updates && typeof updates === 'object') {
    safeUpdates = { ...updates }
    if (Object.hasOwn(safeUpdates, 'money')) {
      const moneyValue = (safeUpdates as { money?: unknown }).money
      if (isFiniteNumber(moneyValue)) {
        safeUpdates.money = clampPlayerMoney(moneyValue)
      } else {
        delete safeUpdates.money
      }
    }
    if (Object.hasOwn(safeUpdates, 'fame')) {
      const fameValue = (safeUpdates as { fame?: unknown }).fame
      if (isFiniteNumber(fameValue)) {
        safeUpdates.fame = clampPlayerFame(fameValue)
        safeUpdates.fameLevel = calculateFameLevel(safeUpdates.fame)
      } else {
        delete safeUpdates.fame
        delete safeUpdates.fameLevel
      }
    }
  }
  return {
    type: ActionTypes.UPDATE_PLAYER,
    payload: safeUpdates
  }
}

/**
 * Creates an update-band action and clamps hostile harmony payloads.
 *
 * @param updates - Partial band update object or updater callback.
 * @returns UPDATE_BAND action with sanitized payload.
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
  if (updates && typeof updates === 'object') {
    safeUpdates = { ...updates }
    if (Object.hasOwn(safeUpdates, 'harmony')) {
      const harmonyValue = (safeUpdates as { harmony?: unknown }).harmony
      if (isFiniteNumber(harmonyValue)) {
        safeUpdates.harmony = clampBandHarmony(harmonyValue)
      } else {
        delete (safeUpdates as { harmony?: unknown }).harmony
      }
    }
  }
  return {
    type: ActionTypes.UPDATE_BAND,
    payload: safeUpdates
  }
}

/**
 * Creates an action that toggles the Neuro Decimator gig modifier.
 *
 * @param isActive - Whether the modifier should be active.
 * @returns Toggle action for the reducer.
 */
export const toggleNeuroDecimator = (
  isActive: boolean
): Extract<
  GameAction,
  { type: typeof ActionTypes.TOGGLE_NEURO_DECIMATOR }
> => ({
  type: ActionTypes.TOGGLE_NEURO_DECIMATOR,
  payload: { isActive }
})

const SOCIAL_NULLABLE_FIELDS = new Set([
  'lastGigDay',
  'lastGigDifficulty',
  'lastPirateBroadcastDay',
  'lastDarkWebLeakDay'
])

const SOCIAL_NUMERIC_FIELDS = new Set([
  'instagram',
  'tiktok',
  'youtube',
  'newsletter',
  'viral',
  'lastGigDay',
  'lastGigDifficulty',
  'lastPirateBroadcastDay',
  'lastDarkWebLeakDay',
  'controversyLevel',
  'loyalty',
  'zealotry',
  'reputationCooldown'
])

const ALLOWED_SETTINGS_KEYS = new Set([
  'crtEnabled',
  'tutorialSeen',
  'logLevel'
])

const sanitizeSocialUpdates = (
  updates: Partial<SocialState> | null | undefined
): Partial<SocialState> => {
  if (!updates || typeof updates !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const key in updates) {
    if (!Object.hasOwn(updates, key) || isForbiddenKey(key)) continue
    const value = (updates as Record<string, unknown>)[key]
    if (SOCIAL_NUMERIC_FIELDS.has(key)) {
      if (value === null) {
        if (SOCIAL_NULLABLE_FIELDS.has(key)) out[key] = null
        continue
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
    }
    out[key] = value
  }
  return out as Partial<SocialState>
}

/**
 * Creates a social update action
 * @param updates - Social media state updates
 */
export const createUpdateSocialAction = (
  updates: Partial<SocialState> | ((prev: SocialState) => Partial<SocialState>)
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_SOCIAL }> => {
  const payload =
    typeof updates === 'function'
      ? (prev: SocialState) => sanitizeSocialUpdates(updates(prev))
      : sanitizeSocialUpdates(updates)
  return {
    type: ActionTypes.UPDATE_SOCIAL,
    payload
  }
}

/**
 * Creates a settings update action
 * @param updates - Settings updates
 */
export const createUpdateSettingsAction = (
  updates: Record<string, unknown>
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_SETTINGS }> => {
  const filtered: Record<string, unknown> = {}
  if (updates && typeof updates === 'object') {
    for (const key of ALLOWED_SETTINGS_KEYS) {
      if (Object.hasOwn(updates, key)) {
        filtered[key] = updates[key]
      }
    }
  }
  return {
    type: ActionTypes.UPDATE_SETTINGS,
    payload: filtered
  }
}

/**
 * Replaces the persisted overworld map snapshot.
 * @param map - Generated map object, or null while no map is loaded.
 */
export const createSetMapAction = (
  map: GameMap | null
): Extract<GameAction, { type: typeof ActionTypes.SET_MAP }> => ({
  type: ActionTypes.SET_MAP,
  payload: map
})

/**
 * Replaces the current venue object.
 * @param gig - Venue to make current, or null to clear active gig context.
 */
export const createSetGigAction = (
  gig: Venue | null
): Extract<GameAction, { type: typeof ActionTypes.SET_GIG }> => ({
  type: ActionTypes.SET_GIG,
  payload: gig
})

/**
 * Starts a gig for the selected venue.
 *
 * @remarks
 * The reducer treats this as the boundary between pre-gig setup and active gig
 * state, including resetting gig modifiers to defaults.
 *
 * @param venue - Venue object that becomes `currentGig`.
 */
export const createStartGigAction = (
  venue: Venue
): Extract<GameAction, { type: typeof ActionTypes.START_GIG }> => ({
  type: ActionTypes.START_GIG,
  payload: venue
})

/**
 * Creates the action that replaces the active gig setlist.
 * @param list - Ordered rhythm setlist entries selected for the next gig.
 */
export const createSetSetlistAction = (
  list: RhythmSetlistEntry[]
): Extract<GameAction, { type: typeof ActionTypes.SET_SETLIST }> => ({
  type: ActionTypes.SET_SETLIST,
  payload: list
})

/**
 * Creates a last gig stats action
 * @param stats - Gig statistics
 */
export const createSetLastGigStatsAction = (
  stats: PostGigSummary | null
): Extract<GameAction, { type: typeof ActionTypes.SET_LAST_GIG_STATS }> => {
  const payloadWithToastId = stats
    ? {
        ...stats,
        // Only re-normalize numeric fields that are actually present so we
        // never introduce explicit `undefined` keys into the payload.
        ...(stats.score !== undefined && {
          score: finiteNumberOr(stats.score, 0)
        }),
        ...(stats.misses !== undefined && {
          misses: finiteNumberOr(stats.misses, 0)
        }),
        ...(stats.accuracy !== undefined && {
          accuracy: finiteNumberOr(stats.accuracy, 0)
        }),
        ...(stats.combo !== undefined && {
          combo: finiteNumberOr(stats.combo, 0)
        }),
        ...(stats.health !== undefined && {
          health: finiteNumberOr(stats.health, 0)
        }),
        ...(stats.overload !== undefined && {
          overload: finiteNumberOr(stats.overload, 0)
        }),
        ...(stats.maxCombo !== undefined && {
          maxCombo: finiteNumberOr(stats.maxCombo, 0)
        }),
        toastId: getSafeUUID()
      }
    : null
  return {
    type: ActionTypes.SET_LAST_GIG_STATS,
    payload: payloadWithToastId
  }
}

/**
 * Creates an active event action
 * @param event - Event object or null
 */
export const createSetActiveEventAction = (
  event: GameEvent | null
): Extract<GameAction, { type: typeof ActionTypes.SET_ACTIVE_EVENT }> => ({
  type: ActionTypes.SET_ACTIVE_EVENT,
  payload: event
})

/**
 * Creates a toast addition action
 * @param messageOrPayload - Toast message string or structured payload
 * @param type - Toast type (info, success, error, warning)
 * @returns Action object with generated ID
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
 * @param id - Toast ID to remove
 */
export const createRemoveToastAction = (
  id: string
): Extract<GameAction, { type: typeof ActionTypes.REMOVE_TOAST }> => ({
  type: ActionTypes.REMOVE_TOAST,
  payload: id
})

/**
 * Creates a gig modifiers action
 * @param payload - Modifiers or updater function
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
 * @param data - Saved game data
 */
export const createLoadGameAction = (
  data: RawLoadedGame
): Extract<GameAction, { type: typeof ActionTypes.LOAD_GAME }> => ({
  type: ActionTypes.LOAD_GAME,
  payload: data
})

/**
 * Creates a reset state action
 * @param payload - Data to preserve across reset (e.g. settings, unlocks) Defaults to `{}`.
 */
export const createResetStateAction = (
  payload: ResetStatePayload = {}
): Extract<GameAction, { type: typeof ActionTypes.RESET_STATE }> => ({
  type: ActionTypes.RESET_STATE,
  payload
})

/**
 * Stamps banter relationship changes that lack a finite timestamp with the
 * current time. Timestamps must be generated here (not in the reducer) so
 * `applyEventDelta` stays pure and deterministic.
 */
const stampBanterTimestamps = (delta: EventDeltaPayload): EventDeltaPayload => {
  const rawRC = delta.band?.relationshipChange as unknown
  if (!rawRC) return delta
  const needsStamp = (rc: unknown): rc is RelationshipChange =>
    isLooseRecord(rc) && rc.source === 'banter' && !isFiniteNumber(rc.timestamp)
  const hasUnstamped = Array.isArray(rawRC)
    ? rawRC.some(needsStamp)
    : needsStamp(rawRC)
  if (!hasUnstamped) return delta
  const now = Date.now()
  const stamp = (rc: unknown): unknown =>
    needsStamp(rc) ? { ...rc, timestamp: now } : rc
  const stamped = Array.isArray(rawRC) ? rawRC.map(stamp) : stamp(rawRC)
  return {
    ...delta,
    band: {
      ...delta.band,
      relationshipChange: stamped as RelationshipChange[]
    }
  }
}

/**
 * Creates an event delta application action
 * @param delta - State delta to apply
 */
export const createApplyEventDeltaAction = (
  delta: EventDeltaPayload
): Extract<GameAction, { type: typeof ActionTypes.APPLY_EVENT_DELTA }> => ({
  type: ActionTypes.APPLY_EVENT_DELTA,
  payload: stampBanterTimestamps(delta)
})

/**
 * Advances the pending-event queue by removing its head entry.
 */
export const createPopPendingEventAction = (): Extract<
  GameAction,
  { type: typeof ActionTypes.POP_PENDING_EVENT }
> => ({
  type: ActionTypes.POP_PENDING_EVENT
})

/**
 * Requests consumption of one inventory item by id.
 * @param itemType - Inventory item id to consume.
 */
export const createConsumeItemAction = (
  itemType: string
): Extract<GameAction, { type: typeof ActionTypes.CONSUME_ITEM }> => ({
  type: ActionTypes.CONSUME_ITEM,
  payload: itemType
})

/**
 * Adds an event id to the cooldown list.
 * @param eventId - Event id to suppress until cooldown expiry.
 */
export const createAddCooldownAction = (
  eventId: string
): Extract<GameAction, { type: typeof ActionTypes.ADD_COOLDOWN }> => ({
  type: ActionTypes.ADD_COOLDOWN,
  payload: eventId
})

/**
 * Creates start travel minigame action
 * @param targetNodeId - The destination node ID
 */
export const createStartTravelMinigameAction = (
  targetNodeId: string
): Extract<GameAction, { type: typeof ActionTypes.START_TRAVEL_MINIGAME }> => ({
  type: ActionTypes.START_TRAVEL_MINIGAME,
  payload: { targetNodeId }
})

/**
 * Completes the travel minigame with sanitized damage and loot data.
 *
 * @param damageTaken - Raw minigame damage. Non-finite values become `0` and
 * negative values are clamped away.
 * @param itemsCollected - Collected item payloads. Non-arrays are dispatched as
 * an empty collection.
 * @param rngValue - Optional secure random value for reducer-side drop logic,
 * clamped to the unit interval.
 */
export const createCompleteTravelMinigameAction = (
  damageTaken: number,
  itemsCollected: unknown[],
  rngValue?: number
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_TRAVEL_MINIGAME }
> => {
  const numericDamage = Number(damageTaken)
  return {
    type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
    payload: {
      damageTaken: Number.isFinite(numericDamage)
        ? Math.max(0, numericDamage)
        : 0,
      itemsCollected: Array.isArray(itemsCollected) ? itemsCollected : [],
      rngValue: clampUnitRandom(rngValue)
    }
  }
}

/**
 * Creates start roadie minigame action
 * @param gigId - Id of the gig the roadie minigame precedes.
 */
export const createStartRoadieMinigameAction = (
  gigId: string
): Extract<GameAction, { type: typeof ActionTypes.START_ROADIE_MINIGAME }> => ({
  type: ActionTypes.START_ROADIE_MINIGAME,
  payload: { gigId }
})

/**
 * Creates complete roadie minigame action
 * @param equipmentDamage - Raw equipment damage from the minigame.
 * @param contrabandDelivered - Optional delivered contraband count.
 * @param deliveredStashItemId - Optional real stash item id that was delivered as contraband.
 */
export const createCompleteRoadieMinigameAction = (
  equipmentDamage: number,
  contrabandDelivered?: number,
  deliveredStashItemId?: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_ROADIE_MINIGAME }
> => ({
  type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
  payload: {
    equipmentDamage: clamp0to100(Number(equipmentDamage) || 0),
    contrabandDelivered: clampNonNegative(Number(contrabandDelivered) || 0),
    // Only include the key when a valid stash id was delivered, so the payload
    // stays clean (no `deliveredStashItemId: undefined`) for normal completions.
    ...(typeof deliveredStashItemId === 'string' &&
    deliveredStashItemId.length > 0 &&
    !isForbiddenKey(deliveredStashItemId)
      ? { deliveredStashItemId }
      : {})
  }
})

/**
 * Creates start kabelsalat minigame action
 * @param gigId - Id of the gig the Kabelsalat minigame precedes.
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
 * Completes Kabelsalat while leaving result validation to the reducer.
 *
 * @param results - Raw completion result emitted by the Kabelsalat scene.
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
 * @param gigId - Target gig
 */
export const createStartAmpCalibrationAction = (
  gigId: string
): Extract<GameAction, { type: typeof ActionTypes.START_AMP_CALIBRATION }> => ({
  type: ActionTypes.START_AMP_CALIBRATION,
  payload: { gigId }
})

/**
 * Completes Amp Calibration with non-negative integer result counters.
 *
 * @param score - Raw calibration score before action-creator clamping.
 * @param voidResonance - Raw void-resonance count or score contribution.
 * @param purgesUsed - Number of interference purges used during calibration.
 * @param hijacksOverridden - Number of hijacks overridden during calibration.
 */
export const createCompleteAmpCalibrationAction = (
  score: number,
  voidResonance: number = 0,
  purgesUsed: number = 0,
  hijacksOverridden: number = 0
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_AMP_CALIBRATION }
> => {
  const safeScore = clampToNonNegativeInt(score)
  const safeResonance = clampToNonNegativeInt(voidResonance)
  const safePurgesUsed = clampToNonNegativeInt(purgesUsed)
  const safeHijacksOverridden = clampToNonNegativeInt(hijacksOverridden)

  return {
    type: ActionTypes.COMPLETE_AMP_CALIBRATION,
    payload: {
      score: safeScore,
      voidResonance: safeResonance,
      purgesUsed: safePurgesUsed,
      hijacksOverridden: safeHijacksOverridden
    }
  }
}

/**
 * Creates an action that spawns a rival band for the current day.
 *
 * @param state - Current game state used to derive rival power.
 * @returns Spawn-rival action with generated rival state.
 */
export const createSpawnRivalBandAction = (
  state: GameState
): Extract<GameAction, { type: typeof ActionTypes.SPAWN_RIVAL_BAND }> => {
  const day = Number.isFinite(state.player?.day) ? state.player.day : 1
  return {
    type: ActionTypes.SPAWN_RIVAL_BAND,
    payload: { rivalBand: generateRivalBand(day, secureRandom) }
  }
}

/**
 * Creates an action that moves a rival band on the current map.
 *
 * @param rivalBand - Current rival band state.
 * @param gameMap - Map used to choose the rival destination.
 * @returns Move-rival action with the computed rival state.
 */
export const createMoveRivalBandAction = (
  rivalBand: RivalBandState,
  gameMap: GameMap
): Extract<GameAction, { type: typeof ActionTypes.MOVE_RIVAL_BAND }> => ({
  type: ActionTypes.MOVE_RIVAL_BAND,
  payload: { rivalBand: moveRivalBand(rivalBand, gameMap, secureRandom) }
})

/**
 * Creates an action that checks whether the player encounters the rival band.
 *
 * @returns Rival-encounter check action.
 */
export const createCheckRivalEncounterAction = (): Extract<
  GameAction,
  { type: typeof ActionTypes.CHECK_RIVAL_ENCOUNTER }
> => ({
  type: ActionTypes.CHECK_RIVAL_ENCOUNTER
})

/**
 * Creates an action that sanitizes and applies rival-band field updates.
 *
 * @param payload - Partial rival-band fields to update.
 * @returns Rival-band update action.
 */
export const createUpdateRivalBandAction = (
  payload: Partial<RivalBandState>
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_RIVAL_BAND }> => {
  const safeUpdates: Partial<RivalBandState> = {}
  if (payload.id !== undefined) safeUpdates.id = payload.id
  if (payload.name !== undefined) safeUpdates.name = payload.name
  if (payload.alignment !== undefined) safeUpdates.alignment = payload.alignment
  if (payload.powerLevel !== undefined) {
    const raw = Number(payload.powerLevel)
    safeUpdates.powerLevel = Number.isFinite(raw) ? Math.max(0, raw) : 0
  }
  if (payload.currentLocationId !== undefined)
    safeUpdates.currentLocationId = payload.currentLocationId

  return {
    type: ActionTypes.UPDATE_RIVAL_BAND,
    payload: safeUpdates
  }
}

/**
 * Creates the action that unlocks one trait for one band member.
 * @param memberId - Target band member id.
 * @param traitId - Trait id to unlock.
 */
export const createUnlockTraitAction = (
  memberId: string,
  traitId: string
): Extract<GameAction, { type: typeof ActionTypes.UNLOCK_TRAIT }> => ({
  type: ActionTypes.UNLOCK_TRAIT,
  payload: { memberId, traitId }
})

/**
 * Creates an action to remove a venue from the blacklist ("make amends").
 * The `handleUnblacklistVenue` reducer charges the amends cost and is the final
 * authority on affordability; this creator only normalizes a hostile id to ''.
 * @param venueId - The ID of the venue to win back.
 */
export const createUnblacklistVenueAction = (
  venueId: string
): Extract<GameAction, { type: typeof ActionTypes.UNBLACKLIST_VENUE }> => ({
  type: ActionTypes.UNBLACKLIST_VENUE,
  payload: {
    venueId:
      typeof venueId === 'string' && !isForbiddenKey(venueId) ? venueId : '',
    toastId: getSafeUUID()
  }
})

/**
 * Creates an action to craft an item from a recipe. The `handleCraftItem`
 * reducer is the final authority on input availability; this creator only
 * normalizes a hostile recipe id to '' and stamps the crafted output with a
 * fresh contraband instance id.
 * @param recipeId - The crafting recipe id.
 * @param instanceId - Unique id assigned to the crafted contraband output.
 */
export const createCraftItemAction = (
  recipeId: string,
  instanceId: string = getSafeUUID()
): Extract<GameAction, { type: typeof ActionTypes.CRAFT_ITEM }> => {
  const safeInstanceId =
    typeof instanceId === 'string' && instanceId.length > 0
      ? instanceId
      : getSafeUUID()

  return {
    type: ActionTypes.CRAFT_ITEM,
    payload: {
      recipeId:
        typeof recipeId === 'string' && !isForbiddenKey(recipeId)
          ? recipeId
          : '',
      instanceId: safeInstanceId,
      toastId: getSafeUUID()
    }
  }
}

/**
 * Creates an action to add a new quest.
 * @param quest - The quest object to add.
 */
export const createAddQuestAction = (
  quest: QuestState
): Extract<GameAction, { type: typeof ActionTypes.ADD_QUEST }> => {
  const safeQuest = { ...(quest || {}) } as QuestState
  if (typeof safeQuest.id !== 'string' || isForbiddenKey(safeQuest.id)) {
    safeQuest.id = ''
  }

  if (safeQuest.moneyReward != null) {
    safeQuest.moneyReward = clampNonNegative(Number(safeQuest.moneyReward) || 0)
  }

  if (safeQuest.rewardData) {
    safeQuest.rewardData = { ...safeQuest.rewardData }
    if (safeQuest.rewardData.fame != null) {
      safeQuest.rewardData.fame = clampNonNegative(
        Number(safeQuest.rewardData.fame) || 0
      )
    }
    if (safeQuest.rewardData.harmony != null) {
      safeQuest.rewardData.harmony = clampNonNegative(
        Number(safeQuest.rewardData.harmony) || 0
      )
    }
  }

  return {
    type: ActionTypes.ADD_QUEST,
    payload: safeQuest
  }
}

/**
 * Creates an action to advance a quest's progress.
 * @param questId - Id of the quest whose progress advances.
 * @param amount - The amount to advance progress by. Defaults to `1`.
 */
export const createAdvanceQuestAction = (
  questId: string,
  amount = 1,
  randomIdx: number | undefined = undefined
): Extract<GameAction, { type: typeof ActionTypes.ADVANCE_QUEST }> => {
  const raw = Number(amount)
  const safeAmount = Number.isFinite(raw) ? Math.max(0, raw) : 0
  return {
    type: ActionTypes.ADVANCE_QUEST,
    payload: { questId, amount: safeAmount, randomIdx }
  }
}

/**
 * Adds a newly earned unlock id to state.
 * @param unlockId - Unlock id to persist.
 */
export const createAddUnlockAction = (
  unlockId: string
): Extract<GameAction, { type: typeof ActionTypes.ADD_UNLOCK }> => ({
  type: ActionTypes.ADD_UNLOCK,
  payload: unlockId
})

/**
 * Creates an action to use a contraband item from the stash.
 * @param instanceId - The unique instance ID of the contraband item in the stash.
 * @param contrabandId - The ID of the contraband item.
 * @param memberId - Optional. The ID of the band member to apply the effect to.
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
 *
 * @param payload - Clinic heal request. `staminaGain` and `moodGain` are
 * normalized to non-negative numbers before dispatch; reducer clamps remain the
 * final authority.
 * - `payload.memberId` - The ID of the band member.
 * - `payload.type` - Must be 'heal'. Used by the reducer to compute cost.
 * - `payload.staminaGain` - The amount of stamina to restore.
 * - `payload.moodGain` - The amount of mood to restore.
 * - `payload.successToast` - Optional. Toast object appended to state on success.
 */
export const createClinicHealAction = (
  payload: ClinicActionPayload
): Extract<GameAction, { type: typeof ActionTypes.CLINIC_HEAL }> => {
  const safePayload = { ...(payload || {}) } as ClinicActionPayload
  if (safePayload.staminaGain != null) {
    safePayload.staminaGain = clampNonNegative(
      Number(safePayload.staminaGain) || 0
    )
  }
  if (safePayload.moodGain != null) {
    safePayload.moodGain = clampNonNegative(Number(safePayload.moodGain) || 0)
  }
  if (safePayload.successToast) {
    // UUIDs are generated here so the reducer stays pure.
    safePayload.successToast = {
      ...safePayload.successToast,
      id: getSafeUUID()
    }
  }
  return {
    type: ActionTypes.CLINIC_HEAL,
    payload: safePayload
  }
}

/**
 * Creates an action to enhance a band member in the Void Clinic.
 * Cost is computed by the reducer from CLINIC_CONFIG and clinicVisits.
 * Payload is passed through because the reducer derives and clamps every
 * numeric effect; the creator only carries IDs and an optional toast.
 *
 * @param payload - Clinic enhancement request passed through for reducer-owned
 * validation and cost calculation.
 * - `payload.memberId` - The ID of the band member.
 * - `payload.type` - Must be 'enhance'. Used by the reducer to compute cost.
 * - `payload.trait` - The ID of the trait to graft.
 * - `payload.successToast` - Optional. Toast object appended to state on success.
 */
export const createClinicEnhanceAction = (
  payload: ClinicActionPayload
): Extract<GameAction, { type: typeof ActionTypes.CLINIC_ENHANCE }> => ({
  type: ActionTypes.CLINIC_ENHANCE,
  payload: payload?.successToast
    ? // UUIDs are generated here so the reducer stays pure.
      {
        ...payload,
        successToast: { ...payload.successToast, id: getSafeUUID() }
      }
    : payload
})

/**
 * Creates an action to trigger a pirate radio broadcast.
 *
 * @param payload - Broadcast cost and reward deltas. Numeric economy/social
 * fields are normalized as non-negative values before dispatch.
 * - `payload.cost` - Money cost.
 * - `payload.fameGain` - Fame gained.
 * - `payload.zealotryGain` - Zealotry gained.
 * - `payload.controversyGain` - Controversy gained.
 * - `payload.harmonyCost` - Band harmony lost.
 * - `payload.successToast` - Optional. Toast object appended to state on success.
 */
export const createPirateBroadcastAction = (
  payload: PirateBroadcastPayload
): Extract<GameAction, { type: typeof ActionTypes.PIRATE_BROADCAST }> => ({
  type: ActionTypes.PIRATE_BROADCAST,
  payload: sanitizeNonNegativePayload(payload, [
    'cost',
    'fameGain',
    'zealotryGain',
    'controversyGain',
    'harmonyCost'
  ])
})

/**
 * Creates an action to set pendingBandHQOpen
 * @param isOpen - Whether the Band HQ overlay should be queued to open.
 */
export const createSetPendingBandHQOpenAction = (
  isOpen: boolean
): Extract<
  GameAction,
  { type: typeof ActionTypes.SET_PENDING_BANDHQ_OPEN }
> => ({
  type: ActionTypes.SET_PENDING_BANDHQ_OPEN,
  payload: isOpen
})

/**
 * Creates an action that stores the pending supply-stop inventory.
 *
 * @param inventory - Supply-stop inventory or null to clear it.
 * @returns Pending supply-stop inventory action.
 */
export const createSetPendingSupplyStopInventoryAction = (
  inventory: PurchaseItem[] | null
): Extract<
  GameAction,
  { type: typeof ActionTypes.SET_PENDING_SUPPLY_STOP_INVENTORY }
> => ({
  type: ActionTypes.SET_PENDING_SUPPLY_STOP_INVENTORY,
  payload: Array.isArray(inventory) ? inventory : null
})

/**
 * Creates an action that dismisses a foreclosure notice for an asset kind.
 *
 * @param kind - Asset kind whose notice should be dismissed.
 * @returns Foreclosure-dismissal action.
 */
export const dismissForeclosureNotice = (
  kind: AssetKind
): Extract<
  GameAction,
  { type: typeof ActionTypes.DISMISS_FORECLOSURE_NOTICE }
> => ({
  type: ActionTypes.DISMISS_FORECLOSURE_NOTICE,
  payload: { kind }
})

/**
 * Creates an action that sets or clears the pending asset risk event.
 *
 * @param event - Risk event descriptor, or null to clear the pending event.
 * @returns Pending risk-event action, or null when descriptor sanitization fails.
 */
export const createSetPendingRiskEventAction = (
  event: RiskEventDescriptor | null
): Extract<
  GameAction,
  { type: typeof ActionTypes.SET_PENDING_RISK_EVENT }
> | null => {
  if (event === null) {
    return {
      type: ActionTypes.SET_PENDING_RISK_EVENT,
      payload: null
    }
  }

  const nextEvent = sanitizeRiskEventDescriptor(event)
  if (!nextEvent) return null

  return {
    type: ActionTypes.SET_PENDING_RISK_EVENT,
    payload: nextEvent
  }
}

/**
 * Creates an action to donate blood to the void clinic.
 *
 * @param payload - Donation rewards and costs. Numeric fields are normalized
 * as non-negative values before dispatch.
 * - `payload.moneyGain` - The money gained.
 * - `payload.harmonyCost` - The harmony lost.
 * - `payload.staminaCost` - The stamina lost per member.
 * - `payload.controversyGain` - The controversy gained.
 * - `payload.successToast` - Optional toast on success.
 */
export const createBloodBankDonateAction = (
  payload: BloodBankDonatePayload
): Extract<GameAction, { type: typeof ActionTypes.BLOOD_BANK_DONATE }> => ({
  type: ActionTypes.BLOOD_BANK_DONATE,
  payload: sanitizeNonNegativePayload(payload, [
    'moneyGain',
    'harmonyCost',
    'staminaCost',
    'controversyGain'
  ])
})

/**
 * Creates an action to trade fame for a void item (contraband).
 *
 * @param payload - Void-trader purchase request. `fameCost` is normalized as a
 * non-negative value and a fresh contraband instance id is added.
 * - `payload.contrabandId` - ID of the contraband item.
 * - `payload.fameCost` - Cost in fame to purchase.
 * - `payload.successToast` - Optional toast on success.
 */
export const createTradeVoidItemAction = (
  payload: TradeVoidItemPayload
): Extract<GameAction, { type: typeof ActionTypes.TRADE_VOID_ITEM }> => {
  const base = sanitizeNonNegativePayload(payload, ['fameCost'])
  return {
    type: ActionTypes.TRADE_VOID_ITEM,
    payload:
      base && typeof base === 'object'
        ? { ...base, instanceId: getSafeUUID() }
        : base
  }
}

/**
 * Creates an action to trigger a dark web leak.
 *
 * @param payload - Leak cost and reward deltas. Numeric economy/social fields
 * are normalized as non-negative values before dispatch.
 * - `payload.cost` - Money cost.
 * - `payload.fameGain` - Fame gained.
 * - `payload.zealotryGain` - Zealotry gained.
 * - `payload.controversyGain` - Controversy gained.
 * - `payload.harmonyCost` - Band harmony lost.
 * - `payload.successToast` - Optional. Toast object appended to state on success.
 */
export const createDarkWebLeakAction = (
  payload: DarkWebLeakPayload
): Extract<GameAction, { type: typeof ActionTypes.DARK_WEB_LEAK }> => ({
  type: ActionTypes.DARK_WEB_LEAK,
  payload: sanitizeNonNegativePayload(payload, [
    'cost',
    'fameGain',
    'zealotryGain',
    'controversyGain',
    'harmonyCost'
  ])
})

/**
 * Creates an action to press merch underground.
 *
 * @param payload - Merch-press cost and reward deltas. Numeric economy/social
 * fields are normalized as non-negative values before dispatch.
 * - `payload.cost` - Money cost.
 * - `payload.loyaltyGain` - Loyalty gained.
 * - `payload.controversyGain` - Controversy gained.
 * - `payload.fameGain` - Fame gained.
 * - `payload.harmonyCost` - Band harmony lost.
 * - `payload.successToast` - Optional. Toast object appended to state on success.
 */
export const createMerchPressAction = (
  payload: MerchPressPayload
): Extract<GameAction, { type: typeof ActionTypes.MERCH_PRESS }> => ({
  type: ActionTypes.MERCH_PRESS,
  payload: sanitizeNonNegativePayload(payload, [
    'cost',
    'loyaltyGain',
    'controversyGain',
    'fameGain',
    'harmonyCost'
  ])
})

/**
 * Creates the deterministic advance-day action with a pre-rolled RNG stream.
 *
 * @param state - Current game state containing assets and RNG seed.
 * @returns Advance-day action with day RNG stream and next seed.
 */
export const advanceDay = (
  state: GameState
): Extract<GameAction, { type: typeof ActionTypes.ADVANCE_DAY }> => {
  // Size the stream proportionally to the number of assets: each asset can
  // consume up to two rolls in rollAssetRiskEvents (trigger + event-type).
  // A constant buffer covers crowdfund jitter and any future tick stages so
  // the reducer never falls off the end (which the neutral 1.0 fallback in
  // rollAssetRiskEvents still defends against, but allocating correctly keeps
  // determinism tight).
  const assetCount = state.assets?.length ?? 0
  const streamLength = assetCount * RNG_ROLLS_PER_ASSET + RNG_BASE_BUFFER
  return {
    type: ActionTypes.ADVANCE_DAY,
    payload: {
      dayRngStream: createRngStream(state.rngSeed, streamLength),
      nextRngSeed: nextSeed(state.rngSeed)
    }
  }
}

/**
 * Creates an action that applies a quest progress event.
 *
 * @param event - Quest progress event emitted by gameplay.
 * @returns Apply-quest-event action.
 */
export const createApplyQuestEventAction = (
  event: QuestProgressEvent
): Extract<GameAction, { type: typeof ActionTypes.APPLY_QUEST_EVENT }> => ({
  type: ActionTypes.APPLY_QUEST_EVENT,
  payload: event
})

export const graftNeuroOverclock = (
  memberId: string
): Extract<GameAction, { type: 'GRAFT_NEURO_OVERCLOCK' }> => ({
  type: ActionTypes.GRAFT_NEURO_OVERCLOCK,
  payload: { memberId }
})
