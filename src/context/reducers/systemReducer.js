import { logger } from '../../utils/logger.js'
import {
  clampBandHarmony,
  clampPlayerMoney
} from '../../utils/gameStateUtils.js'
import { calculateDailyUpdates } from '../../utils/simulationUtils.js'
import { checkTraitUnlocks } from '../../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'
import {
  createInitialState,
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE
} from '../initialState.js'
import { handleFailQuests } from './questReducer.js'

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
    currentScene: loadedState.currentScene || 'OVERWORLD',
    currentGig: loadedState.currentGig || null,
    lastGigStats: loadedState.lastGigStats || null
  }

  // Security: Only allow valid gameplay scenes from save
  const ALLOWED_SCENES = [
    'OVERWORLD',
    'PREGIG',
    'GIG',
    'PRACTICE',
    'POSTGIG',
    'HQ',
    'BAND_HQ'
  ]
  if (!ALLOWED_SCENES.includes(safeState.currentScene)) {
    safeState.currentScene = state.currentScene
  }

  // Migration: energy -> catering
  if (safeState.gigModifiers.energy !== undefined) {
    const { energy, ...restModifiers } = safeState.gigModifiers
    return {
      ...safeState,
      gigModifiers: { ...restModifiers, catering: energy }
    }
  }

  return safeState
}

export const handleResetState = state => {
  logger.info('GameState', 'State Reset (Debug)')
  return { ...createInitialState(), settings: state.settings }
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
  const nextBand = { ...band }
  if (typeof nextBand.harmony === 'number') {
    nextBand.harmony = clampBandHarmony(nextBand.harmony)
  }

  // Check Social Unlocks
  const socialUnlocks = checkTraitUnlocks(
    { player, band: nextBand, social },
    { type: 'SOCIAL_UPDATE' }
  )

  const traitResult = applyTraitUnlocks(
    { band: nextBand, toasts: state.toasts },
    socialUnlocks
  )

  let nextState = {
    ...state,
    player,
    band: traitResult.band,
    social,
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
