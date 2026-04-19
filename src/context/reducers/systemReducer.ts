// TODO: Review this file
import type {
  GameState,
  PlayerState,
  BandState,
  ToastPayload
} from '../../types/game'
import { logger } from '../../utils/logger'
import {
  clampBandHarmony,
  clampPlayerMoney,
  clampPlayerFame,
  clampMemberStamina,
  clampMemberMood,
  calculateFameLevel
} from '../../utils/gameStateUtils'
import { calculateDailyUpdates } from '../../utils/simulationUtils'
import { generateDailyTrend } from '../../utils/socialEngine'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks, normalizeTraitMap } from '../../utils/traitUtils'
import { normalizeVenueId } from '../../utils/mapUtils'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import {
  createInitialState,
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE
} from '../initialState'
import { DEFAULT_MINIGAME_STATE, GAME_PHASES } from '../gameConstants'
import { handleFailQuests } from './questReducer'
import { getSafeRandom } from '../../utils/crypto'

export const ALLOWED_SCENES = new Set([
  GAME_PHASES.OVERWORLD,
  GAME_PHASES.PRE_GIG,
  GAME_PHASES.GIG,
  GAME_PHASES.PRACTICE,
  GAME_PHASES.POST_GIG,
  GAME_PHASES.TRAVEL_MINIGAME,
  GAME_PHASES.PRE_GIG_MINIGAME,
  GAME_PHASES.GAMEOVER,
  GAME_PHASES.CLINIC
])

const ALLOWED_TOAST_TYPES = [
  'success',
  'error',
  'warning',
  'info'
] as const satisfies readonly ToastPayload['type'][]

const sanitizePlayer = (loadedPlayer: unknown): PlayerState => {
  const playerData =
    typeof loadedPlayer === 'object' && loadedPlayer !== null
      ? (loadedPlayer as Record<string, unknown>)
      : {}
  const rawPlayer = {
    ...DEFAULT_PLAYER_STATE,
    ...playerData,
    van: {
      ...DEFAULT_PLAYER_STATE.van,
      ...(typeof playerData.van === 'object' && playerData.van !== null
        ? (playerData.van as Record<string, unknown>)
        : {})
    },
    stats: {
      ...DEFAULT_PLAYER_STATE.stats,
      ...(typeof playerData.stats === 'object' && playerData.stats !== null
        ? (playerData.stats as Record<string, unknown>)
        : {})
    }
  }

  const validatedFame = clampPlayerFame(
    typeof rawPlayer.fame === 'number' ? rawPlayer.fame : 0
  )

  return {
    ...rawPlayer,
    money: clampPlayerMoney(rawPlayer.money),
    fame: validatedFame,
    fameLevel: calculateFameLevel(validatedFame),
    day: Math.max(1, typeof rawPlayer.day === 'number' ? rawPlayer.day : 1),
    van: {
      ...rawPlayer.van,
      fuel: Math.max(
        0,
        Math.min(
          100,
          typeof rawPlayer.van.fuel === 'number' ? rawPlayer.van.fuel : 100
        )
      )
    }
  }
}

const sanitizeBand = (loadedBand: unknown): BandState => {
  const bandData =
    typeof loadedBand === 'object' && loadedBand !== null
      ? (loadedBand as Record<string, unknown>)
      : {}
  const rawBand = {
    ...DEFAULT_BAND_STATE,
    ...bandData,
    performance: {
      ...DEFAULT_BAND_STATE.performance,
      ...(typeof bandData.performance === 'object' &&
      bandData.performance !== null
        ? (bandData.performance as Record<string, unknown>)
        : {})
    },
    inventory: {
      ...DEFAULT_BAND_STATE.inventory,
      ...(typeof bandData.inventory === 'object' && bandData.inventory !== null
        ? (bandData.inventory as Record<string, unknown>)
        : {})
    },
    stash: (() => {
      const defaultStash = Object.assign(
        Object.create(null),
        DEFAULT_BAND_STATE.stash
      )
      if (Array.isArray(bandData.stash)) {
        const stashArr = bandData.stash as unknown[]
        for (let i = 0; i < stashArr.length; i++) {
          const item = stashArr[i]
          if (!item || typeof item !== 'object' || Array.isArray(item)) continue
          const itemObj = item as Record<string, unknown>
          const baseItem = CONTRABAND_BY_ID.get(itemObj.id as string)
          if (!baseItem) continue
          if (Object.hasOwn(item, '__proto__')) continue
          const copy = { ...baseItem, ...itemObj }
          copy.id = itemObj.id as string
          if (
            Object.hasOwn(item, 'remainingDuration') &&
            Number.isFinite(itemObj.remainingDuration as number)
          ) {
            copy.remainingDuration = itemObj.remainingDuration as number | null
          } else {
            copy.remainingDuration = copy.duration || null
          }
          defaultStash[itemObj.id as string] = copy
        }
        return defaultStash
      } else if (
        typeof bandData.stash === 'object' &&
        bandData.stash !== null
      ) {
        const migrated = Object.create(null)
        const stashObj = bandData.stash as Record<string, unknown>
        for (const id in stashObj) {
          if (!Object.hasOwn(stashObj, id)) continue
          const item = stashObj[id]
          const baseItem = CONTRABAND_BY_ID.get(id)
          if (!baseItem) continue
          if (!item || typeof item !== 'object' || Array.isArray(item)) continue
          const itemObj = item as Record<string, unknown>
          if (Object.hasOwn(item, '__proto__')) continue
          const copy = { ...baseItem, ...itemObj }
          copy.id = id
          if (
            Object.hasOwn(item, 'remainingDuration') &&
            Number.isFinite(itemObj.remainingDuration as number)
          ) {
            copy.remainingDuration = itemObj.remainingDuration as number | null
          } else {
            copy.remainingDuration = copy.duration || null
          }
          migrated[id] = copy
        }
        return migrated
      }
      return defaultStash
    })(),
    activeContrabandEffects: Array.isArray(bandData.activeContrabandEffects)
      ? (bandData.activeContrabandEffects as unknown[]).map(
          (effect: unknown) => {
            const effectObj =
              typeof effect === 'object' && effect !== null
                ? (effect as Record<string, unknown>)
                : {}
            return {
              ...effectObj,
              remainingDuration:
                Number.isFinite(effectObj.remainingDuration as number) &&
                (effectObj.remainingDuration as number) >= 0
                  ? (effectObj.remainingDuration as number)
                  : 0
            }
          }
        )
      : [...DEFAULT_BAND_STATE.activeContrabandEffects]
  }

  // Validate Band Members
  const validatedMembers = Array.isArray(rawBand.members)
    ? rawBand.members.map(m => ({
        ...m,
        // Backfill id from name for saves created before id fields were added
        id:
          typeof m.id === 'string'
            ? m.id
            : typeof m.name === 'string'
              ? m.name.toLowerCase()
              : m.id,
        traits: normalizeTraitMap(m.traits),
        mood: clampMemberMood(typeof m.mood === 'number' ? m.mood : 50),
        stamina: clampMemberStamina(
          typeof m.stamina === 'number' ? m.stamina : 100,
          (m as Record<string, unknown>).staminaMax as number | undefined
        )
      }))
    : []

  return {
    ...rawBand,
    members: validatedMembers,
    harmony: clampBandHarmony(rawBand.harmony)
  }
}

const sanitizeToasts = (loadedToasts: unknown): ToastPayload[] => {
  if (!Array.isArray(loadedToasts)) return []
  const acc: ToastPayload[] = []
  for (const t of loadedToasts) {
    if (t && typeof t === 'object') {
      const toastObj = t as Record<string, unknown>
      const id = typeof toastObj.id === 'string' ? toastObj.id.trim() : ''
      if (id.length > 0 && toastObj.message) {
        const message = String(toastObj.message).trim()
        if (message.length > 0) {
          const toastType = String(toastObj.type)
          const type = ALLOWED_TOAST_TYPES.includes(
            toastType as ToastPayload['type']
          )
            ? (toastType as ToastPayload['type'])
            : 'info'
          const safeToast: ToastPayload = {
            id,
            message,
            type
          }
          if (typeof toastObj.messageKey === 'string') {
            safeToast.messageKey = toastObj.messageKey
          }
          if (
            typeof toastObj.options === 'object' &&
            toastObj.options !== null &&
            !Array.isArray(toastObj.options)
          ) {
            safeToast.options = toastObj.options as Record<string, unknown>
          }
          if (
            Number.isFinite(toastObj.timeout as number) &&
            (toastObj.timeout as number) >= 0
          ) {
            safeToast.timeout = toastObj.timeout as number
          }
          if (Number.isFinite(toastObj.createdAt as number)) {
            safeToast.createdAt = toastObj.createdAt as number
          }
          acc.push({
            ...safeToast
          })
        }
      }
    }
  }
  return acc
}

const migratePlayerLocation = (location: unknown): string => {
  if (typeof location !== 'string') return ''

  let legacyLocation = location
  if (!location.startsWith('venues:') && location.endsWith('.name')) {
    legacyLocation = location.slice(0, -5)
  }

  const normalizedLocation = normalizeVenueId(legacyLocation)
  if (!normalizedLocation || normalizedLocation === 'Unknown') {
    return location
  }

  return `venues:${normalizedLocation}.name`
}

const migrateLegacyVenueId = (id: unknown): string => {
  if (typeof id !== 'string') return ''
  return normalizeVenueId(id) ?? id
}

/**
 * Handles game load with migration and validation
 * @param {Object} state - Current state
 * @param {Object} payload - Loaded save data
 * @returns {Object} Updated state
 */
export const handleLoadGame = (
  state: GameState,
  payload: unknown
): GameState => {
  logger.info('GameState', 'Game Loaded')

  const loadedState: Record<string, unknown> = (
    typeof payload === 'object' && payload !== null ? payload : {}
  ) as Record<string, unknown>

  // 1. Sanitize Player
  const mergedPlayer = sanitizePlayer(loadedState.player)
  // 2. Sanitize Band
  const validatedBand = sanitizeBand(loadedState.band)
  // 3. Sanitize Social
  const mergedSocial = {
    ...DEFAULT_SOCIAL_STATE,
    ...(typeof loadedState.social === 'object' && loadedState.social !== null
      ? (loadedState.social as Record<string, unknown>)
      : {})
  }

  // 4. Construct Safe State (Whitelist)
  const rawVersion = Object.hasOwn(loadedState, 'version')
    ? loadedState.version
    : state.version
  const parsedVersion = Number(rawVersion)
  const explicitVersion = Number.isFinite(parsedVersion) ? parsedVersion : 0

  const safeState = {
    ...state,
    version: explicitVersion,
    player: mergedPlayer,
    band: validatedBand,
    social: mergedSocial,
    gameMap: loadedState.gameMap || state.gameMap,
    setlist: Array.isArray(loadedState.setlist) ? loadedState.setlist : [],
    activeStoryFlags: Array.isArray(loadedState.activeStoryFlags)
      ? loadedState.activeStoryFlags
      : [],
    pendingEvents: Array.isArray(loadedState.pendingEvents)
      ? loadedState.pendingEvents
      : [],
    eventCooldowns: Array.isArray(loadedState.eventCooldowns)
      ? loadedState.eventCooldowns
      : [],
    activeEvent: loadedState.activeEvent || null,
    toasts: sanitizeToasts(loadedState.toasts),
    reputationByRegion: loadedState.reputationByRegion || {},
    venueBlacklist: Array.isArray(loadedState.venueBlacklist)
      ? loadedState.venueBlacklist
      : [],
    activeQuests: Array.isArray(loadedState.activeQuests)
      ? loadedState.activeQuests
      : [],
    npcs: loadedState.npcs || {},
    gigModifiers: {
      ...DEFAULT_GIG_MODIFIERS,
      ...(loadedState.gigModifiers || {})
    },
    currentScene: GAME_PHASES.OVERWORLD,
    currentGig: loadedState.currentGig || null,
    lastGigStats: loadedState.lastGigStats || null,
    settings: {
      ...state.settings,
      ...(typeof loadedState.settings === 'object' &&
      loadedState.settings !== null &&
      !Array.isArray(loadedState.settings)
        ? loadedState.settings
        : {})
    },
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      ...(loadedState.minigame || {})
    },
    unlocks: Array.isArray(loadedState.unlocks)
      ? loadedState.unlocks
      : state.unlocks || []
  }

  // Apply venue migrations using spreads
  const migratedState = {
    ...safeState,
    player: {
      ...safeState.player,
      location:
        typeof safeState.player.location === 'string'
          ? migratePlayerLocation(safeState.player.location)
          : safeState.player.location
    },
    venueBlacklist: safeState.venueBlacklist
      .map(migrateLegacyVenueId)
      .filter((id): id is string => id.length > 0)
  }

  // Migration: energy -> catering
  if (migratedState.gigModifiers.energy !== undefined) {
    const { energy, ...restModifiers } = migratedState.gigModifiers
    migratedState.gigModifiers = { ...restModifiers, catering: energy }
  }

  // Version Migration Map
  if (migratedState.version < 2) {
    // 1.0 -> 2 additions (if any structured layout changes need applying)
    migratedState.version = 2
  }

  return migratedState
}

export const handleResetState = (
  state: GameState,
  payload: Record<string, unknown> = {}
): GameState => {
  logger.info('GameState', 'State Reset (Debug)')

  // Construct the data to preserve across reset
  const persistedData = {
    settings: payload.settings || state.settings,
    unlocks: Array.isArray(payload.unlocks) ? payload.unlocks : []
  }

  return {
    ...createInitialState(persistedData),
    settings: persistedData.settings
  }
}

export const handleUpdateSettings = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  return { ...state, settings: { ...state.settings, ...payload } }
}

export const handleSetMap = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  logger.info('GameState', 'Map Generated')
  return { ...state, gameMap: payload }
}

export const handleAddToast = (
  state: GameState,
  payload: ToastPayload
): GameState => {
  return { ...state, toasts: [...state.toasts, payload] }
}

export const handleRemoveToast = (
  state: GameState,
  payload: string
): GameState => {
  return {
    ...state,
    toasts: state.toasts.filter(t => t.id !== payload)
  }
}

const EFFECT_REVERTERS = {
  harmony: (band, value) => ({
    ...band,
    harmony: clampBandHarmony((band.harmony || 0) - value)
  }),
  guitar_difficulty: (band, value) => ({
    ...band,
    performance: {
      ...band.performance,
      guitarDifficulty: Math.max(
        0.1,
        (band.performance?.guitarDifficulty || 1) - value
      )
    }
  }),
  luck: (band, value) => ({
    ...band,
    luck: Math.max(0, (band.luck || 0) - value)
  }),
  stamina_max: (band, value) => ({
    ...band,
    members: (band.members || []).map(m => ({
      ...m,
      staminaMax: Math.max(0, (m.staminaMax || 100) - value)
    }))
  }),
  style: (band, value) => ({
    ...band,
    style: Math.max(0, (band.style || 0) - value)
  }),
  tour_success: (band, value) => ({
    ...band,
    tourSuccess: Math.max(0, (band.tourSuccess || 0) - value)
  }),
  gig_modifier: (band, value) => ({
    ...band,
    gigModifier: Math.max(0, (band.gigModifier || 0) - value)
  }),
  tempo: (band, value) => ({
    ...band,
    tempo: Math.max(0, (band.tempo || 0) - value)
  }),
  practice_gain: (band, value) => ({
    ...band,
    practiceGain: Math.max(0, (band.practiceGain || 0) - value)
  }),
  crit: (band, value) => ({
    ...band,
    crit: Math.max(0, (band.crit || 0) - value)
  }),
  affinity: (band, value) => ({
    ...band,
    affinity: Math.max(0, (band.affinity || 0) - value)
  }),
  crowd_control: (band, value) => ({
    ...band,
    crowdControl: Math.max(0, (band.crowdControl || 0) - value)
  })
}

/**
 * Processes contraband effect expiry and reversion as a pure function.
 * @param {Object} band - The current band state
 * @returns {Object} Updated band state
 */
const processContrabandExpiry = (band: BandState): BandState => {
  const activeEffects = band.activeContrabandEffects || []
  const stillActive = []
  const expired = []

  for (let i = 0; i < activeEffects.length; i++) {
    const updatedEffect = {
      ...activeEffects[i],
      remainingDuration: activeEffects[i].remainingDuration - 1
    }
    if (updatedEffect.remainingDuration > 0) {
      stillActive.push(updatedEffect)
    } else {
      expired.push(updatedEffect)
    }
  }

  let nextBand = { ...band }

  // Revert expired effects
  for (let i = 0; i < expired.length; i++) {
    const e = expired[i]
    const reverter = EFFECT_REVERTERS[e.effectType]
    if (reverter) {
      nextBand = reverter(nextBand, e.value, e)
    } else {
      logger.warn(
        'SystemReducer',
        `No reverter defined for expired effect type: ${e.effectType}`,
        { value: e.value, effect: e }
      )
    }

    // Unmark applied status in stash so relics can be used again
    if (nextBand.stash) {
      // Lazy clone stash once if needed
      if (nextBand.stash === band.stash) {
        nextBand.stash = Object.assign(Object.create(null), band.stash)
      }
      for (const itemKey in nextBand.stash) {
        if (!Object.hasOwn(nextBand.stash, itemKey)) continue
        const item = nextBand.stash[itemKey]
        if (item.instanceId === e.instanceId) {
          nextBand.stash[itemKey] = {
            ...item,
            applied: false
          }
          break
        }
      }
    }
  }

  nextBand.activeContrabandEffects = stillActive
  return nextBand
}

/**
 * Handles day advancement
 * @param {Object} state - Current state
 * @returns {Object} Updated state
 */
export const handleAdvanceDay = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  const rng = payload?.rng || getSafeRandom
  const { player, band, social, pendingFlags } = calculateDailyUpdates(
    state,
    rng
  )

  // Reset daily event counter immutably
  const nextPlayer = { ...player, eventsTriggeredToday: 0 }

  const nextBand = { ...band }
  if (typeof nextBand.harmony === 'number') {
    nextBand.harmony = clampBandHarmony(nextBand.harmony)
  }

  // Check Social Unlocks
  const socialUnlocks = checkTraitUnlocks(
    { player: nextPlayer, band: nextBand, social },
    { type: 'SOCIAL_UPDATE' }
  )

  const traitResult = applyTraitUnlocks(
    { band: nextBand, toasts: state.toasts },
    socialUnlocks
  )

  // --- Contraband expiry ---
  const finalBandState = processContrabandExpiry(traitResult.band)
  // -------------------------

  const newTrend = generateDailyTrend(rng)

  let nextState = {
    ...state,
    player: nextPlayer,
    band: finalBandState,
    social: { ...social, trend: newTrend },
    eventCooldowns: [],
    toasts: traitResult.toasts
  }

  nextState = handleFailQuests(nextState)

  if (pendingFlags?.scandal) {
    nextState.pendingEvents = [
      ...(nextState.pendingEvents || []),
      'consequences_bandmate_scandal'
    ]
  }

  logger.info('GameState', `Day Advanced to ${player.day}`)
  return nextState
}

/**
 * Handles adding an unlock
 * @param {Object} state - Current state
 * @param {string} unlockId - Unlock ID to add
 * @returns {Object} Updated state
 */
export const handleAddUnlock = (
  state: GameState,
  unlockId: string
): GameState => {
  if (!unlockId || typeof unlockId !== 'string') return state
  if (state.unlocks?.includes(unlockId)) return state
  return { ...state, unlocks: [...(state.unlocks ?? []), unlockId] }
}
