import { logger } from '../../utils/logger.js'
import {
  clampBandHarmony,
  clampPlayerMoney,
  calculateFameLevel
} from '../../utils/gameStateUtils.js'
import { calculateDailyUpdates } from '../../utils/simulationUtils.js'
import { generateDailyTrend } from '../../utils/socialEngine.js'
import { checkTraitUnlocks } from '../../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'
import { normalizeVenueId } from '../../utils/mapUtils.js'
import {
  createInitialState,
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE
} from '../initialState.js'
import { DEFAULT_MINIGAME_STATE } from '../gameConstants.js'
import { handleFailQuests } from './questReducer.js'

export const ALLOWED_SCENES = new Set([
  'OVERWORLD',
  'PREGIG',
  'GIG',
  'PRACTICE',
  'POSTGIG',
  'TRAVEL_MINIGAME',
  'PRE_GIG_MINIGAME',
  'GAMEOVER'
])

/**
 * Handles game load with migration and validation
 * @param {Object} state - Current state
 * @param {Object} payload - Loaded save data
 * @returns {Object} Updated state
 */
export const handleLoadGame = (state, payload) => {
  logger.info('GameState', 'Game Loaded')

  const loadedState = payload || {}

  // 1. Sanitize Player
  const mergedPlayer = {
    ...DEFAULT_PLAYER_STATE,
    ...loadedState.player,
    van: {
      ...DEFAULT_PLAYER_STATE.van,
      ...(loadedState.player?.van || {})
    },
    stats: {
      ...DEFAULT_PLAYER_STATE.stats,
      ...(loadedState.player?.stats || {})
    }
  }
  // Validate Player
  mergedPlayer.money = clampPlayerMoney(mergedPlayer.money)
  mergedPlayer.fame = Math.max(
    0,
    typeof mergedPlayer.fame === 'number' ? mergedPlayer.fame : 0
  )
  mergedPlayer.fameLevel = calculateFameLevel(mergedPlayer.fame)
  mergedPlayer.day = Math.max(
    1,
    typeof mergedPlayer.day === 'number' ? mergedPlayer.day : 1
  )
  if (mergedPlayer.van) {
    mergedPlayer.van.fuel = Math.max(
      0,
      Math.min(
        100,
        typeof mergedPlayer.van.fuel === 'number' ? mergedPlayer.van.fuel : 100
      )
    )
  }

  // 2. Sanitize Band
  const mergedBand = {
    ...DEFAULT_BAND_STATE,
    ...loadedState.band,
    performance: {
      ...DEFAULT_BAND_STATE.performance,
      ...(loadedState.band?.performance || {})
    },
    inventory: {
      ...DEFAULT_BAND_STATE.inventory,
      ...(loadedState.band?.inventory || {})
    }
  }
  // Validate Band Members
  if (Array.isArray(mergedBand.members)) {
    mergedBand.members = mergedBand.members.map(m => ({
      ...m,
      traits: Array.isArray(m.traits) ? m.traits : [],
      mood: Math.max(
        0,
        Math.min(100, typeof m.mood === 'number' ? m.mood : 50)
      ),
      stamina: Math.max(
        0,
        Math.min(100, typeof m.stamina === 'number' ? m.stamina : 100)
      )
    }))
  }
  mergedBand.harmony = clampBandHarmony(mergedBand.harmony)

  // 3. Sanitize Social
  const mergedSocial = { ...DEFAULT_SOCIAL_STATE, ...loadedState.social }

  // 4. Construct Safe State (Whitelist)
  const safeState = {
    ...state,
    player: mergedPlayer,
    band: mergedBand,
    social: mergedSocial,
    gameMap: loadedState.gameMap || state.gameMap,
    setlist: Array.isArray(loadedState.setlist) ? loadedState.setlist : [],

    // Arrays
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
    toasts: Array.isArray(loadedState.toasts)
      ? loadedState.toasts.reduce((acc, t) => {
          if (t && typeof t === 'object' && t.id && t.message) {
            const message = String(t.message).trim()
            if (message.length > 0) {
              acc.push({
                ...t,
                message,
                type: ['success', 'error', 'warning', 'info'].includes(t.type)
                  ? t.type
                  : 'info'
              })
            }
          }
          return acc
        }, [])
      : [],
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
    currentScene: 'OVERWORLD',
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

  // Migration: Legacy venue translation keys -> Raw IDs
  const migrateLegacyVenueId = id => {
    if (typeof id !== 'string') return id
    return normalizeVenueId(id) ?? id
  }

  // Apply venue migrations using spreads
  const migratedState = {
    ...safeState,
    player: {
      ...safeState.player,
      location:
        typeof safeState.player.location === 'string'
          ? migrateLegacyVenueId(safeState.player.location)
          : safeState.player.location
    },
    venueBlacklist: safeState.venueBlacklist.map(migrateLegacyVenueId)
  }

  // Migration: energy -> catering
  if (migratedState.gigModifiers.energy !== undefined) {
    const { energy, ...restModifiers } = migratedState.gigModifiers
    return {
      ...migratedState,
      gigModifiers: { ...restModifiers, catering: energy }
    }
  }

  return migratedState
}

export const handleResetState = (state, payload = {}) => {
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

export const handleUpdateSettings = (state, payload) => {
  if (!payload || typeof payload !== 'object') return state
  return { ...state, settings: { ...state.settings, ...payload } }
}

export const handleSetMap = (state, payload) => {
  logger.info('GameState', 'Map Generated')
  return { ...state, gameMap: payload }
}

export const handleAddToast = (state, payload) => {
  return { ...state, toasts: [...state.toasts, payload] }
}

export const handleRemoveToast = (state, payload) => {
  return {
    ...state,
    toasts: state.toasts.filter(t => t.id !== payload)
  }
}

/**
 * Handles day advancement
 * @param {Object} state - Current state
 * @returns {Object} Updated state
 */
export const handleAdvanceDay = (state, payload) => {
  const rng = payload?.rng || Math.random
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

  const newTrend = generateDailyTrend(rng)

  let nextState = {
    ...state,
    player: nextPlayer,
    band: traitResult.band,
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
export const handleAddUnlock = (state, unlockId) => {
  if (!unlockId || typeof unlockId !== 'string') return state
  if (state.unlocks?.includes(unlockId)) return state
  return { ...state, unlocks: [...(state.unlocks ?? []), unlockId] }
}
