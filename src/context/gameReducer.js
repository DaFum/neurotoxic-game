/**
 * Game Reducer Module
 * Handles all state mutations through a centralized reducer pattern.
 * @module gameReducer
 */

import { applyEventDelta } from '../utils/gameStateUtils.js'
import { calculateDailyUpdates } from '../utils/simulationUtils.js'
import { logger } from '../utils/logger.js'
import {
  initialState,
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE
} from './initialState.js'

/**
 * Action Types Enum
 * Centralizes all action type strings to prevent typos.
 * @readonly
 * @enum {string}
 */
export const ActionTypes = {
  CHANGE_SCENE: 'CHANGE_SCENE',
  UPDATE_PLAYER: 'UPDATE_PLAYER',
  UPDATE_BAND: 'UPDATE_BAND',
  UPDATE_SOCIAL: 'UPDATE_SOCIAL',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_MAP: 'SET_MAP',
  SET_GIG: 'SET_GIG',
  START_GIG: 'START_GIG',
  SET_SETLIST: 'SET_SETLIST',
  SET_LAST_GIG_STATS: 'SET_LAST_GIG_STATS',
  SET_ACTIVE_EVENT: 'SET_ACTIVE_EVENT',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_GIG_MODIFIERS: 'SET_GIG_MODIFIERS',
  LOAD_GAME: 'LOAD_GAME',
  RESET_STATE: 'RESET_STATE',
  APPLY_EVENT_DELTA: 'APPLY_EVENT_DELTA',
  POP_PENDING_EVENT: 'POP_PENDING_EVENT',
  CONSUME_ITEM: 'CONSUME_ITEM',
  ADVANCE_DAY: 'ADVANCE_DAY'
}

/**
 * Handles scene change actions
 * @param {Object} state - Current state
 * @param {string} payload - New scene name
 * @returns {Object} Updated state
 */
const handleChangeScene = (state, payload) => {
  logger.info('GameState', `Scene Change: ${state.currentScene} -> ${payload}`)
  return { ...state, currentScene: payload }
}

/**
 * Handles player update actions
 * Clamps player.money to ensure it never goes negative
 * @param {Object} state - Current state
 * @param {Object} payload - Player updates
 * @returns {Object} Updated state
 */
const handleUpdatePlayer = (state, payload) => {
  logger.debug('GameState', 'Update Player', payload)
  const mergedPlayer = { ...state.player, ...payload }

  // Clamp money to prevent negative values
  if (typeof mergedPlayer.money === 'number') {
    mergedPlayer.money = Math.max(0, mergedPlayer.money)
  }

  return { ...state, player: mergedPlayer }
}

/**
 * Handles band update actions
 * Clamps band.harmony to valid range 0-100
 * @param {Object} state - Current state
 * @param {Object} payload - Band updates
 * @returns {Object} Updated state
 */
const handleUpdateBand = (state, payload) => {
  logger.debug('GameState', 'Update Band', payload)
  const mergedBand = { ...state.band, ...payload }

  // Clamp harmony to valid range 0-100
  if (typeof mergedBand.harmony === 'number') {
    mergedBand.harmony = Math.max(0, Math.min(100, mergedBand.harmony))
  }

  return { ...state, band: mergedBand }
}

/**
 * Handles gig modifier updates
 * @param {Object} state - Current state
 * @param {Object|Function} payload - Modifiers update
 * @returns {Object} Updated state
 */
const handleSetGigModifiers = (state, payload) => {
  const updates =
    (typeof payload === 'function' ? payload(state.gigModifiers) : payload) ||
    {}
  return { ...state, gigModifiers: { ...state.gigModifiers, ...updates } }
}

/**
 * Handles game load with migration and validation
 * @param {Object} state - Current state
 * @param {Object} payload - Loaded save data
 * @returns {Object} Updated state
 */
const handleLoadGame = (state, payload) => {
  logger.info('GameState', 'Game Loaded')

  const loadedState = { ...payload }

  // Migration: energy -> catering
  if (loadedState.gigModifiers) {
    if (loadedState.gigModifiers.energy !== undefined) {
      loadedState.gigModifiers.catering = loadedState.gigModifiers.energy
      delete loadedState.gigModifiers.energy
    }
    loadedState.gigModifiers = {
      ...DEFAULT_GIG_MODIFIERS,
      ...loadedState.gigModifiers
    }
  }

  // Safe Merge for Nested Objects
  const mergedPlayer = {
    ...DEFAULT_PLAYER_STATE,
    ...loadedState.player,
    van: {
      ...DEFAULT_PLAYER_STATE.van,
      ...loadedState.player?.van
    }
  }

  // Ensure positive money
  if (mergedPlayer.money) {
    mergedPlayer.money = Math.max(0, mergedPlayer.money)
  }

  const mergedBand = {
    ...DEFAULT_BAND_STATE,
    ...loadedState.band,
    performance: {
      ...DEFAULT_BAND_STATE.performance,
      ...(loadedState.band ? loadedState.band.performance : {})
    },
    inventory: {
      ...DEFAULT_BAND_STATE.inventory,
      ...(loadedState.band ? loadedState.band.inventory : {})
    }
  }

  const mergedSocial = { ...DEFAULT_SOCIAL_STATE, ...loadedState.social }

  // Ensure harmony is clamped
  if (mergedBand.harmony) {
    mergedBand.harmony = Math.max(0, mergedBand.harmony)
  }

  return {
    ...state,
    ...loadedState,
    player: mergedPlayer,
    band: mergedBand,
    social: mergedSocial
  }
}

/**
 * Handles item consumption
 * @param {Object} state - Current state
 * @param {string} payload - Item type to consume
 * @returns {Object} Updated state
 */
const handleConsumeItem = (state, payload) => {
  const itemType = payload
  const nextBand = { ...state.band }
  // Deep clone inventory
  nextBand.inventory = { ...state.band.inventory }

  if (nextBand.inventory[itemType] === true) {
    nextBand.inventory[itemType] = false
  } else if (typeof nextBand.inventory[itemType] === 'number') {
    nextBand.inventory[itemType] = Math.max(0, nextBand.inventory[itemType] - 1)
  }

  return { ...state, band: nextBand }
}

/**
 * Handles day advancement
 * @param {Object} state - Current state
 * @returns {Object} Updated state
 */
const handleAdvanceDay = state => {
  const { player, band, social } = calculateDailyUpdates(state)
  logger.info('GameState', `Day Advanced to ${player.day}`)
  return { ...state, player, band, social }
}

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

    case ActionTypes.UPDATE_SOCIAL:
      return { ...state, social: { ...state.social, ...action.payload } }

    case ActionTypes.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case ActionTypes.SET_MAP:
      logger.info('GameState', 'Map Generated')
      return { ...state, gameMap: action.payload }

    case ActionTypes.SET_GIG:
      logger.info('GameState', 'Set Current Gig', action.payload?.name)
      return { ...state, currentGig: action.payload }

    case ActionTypes.START_GIG:
      logger.info('GameState', 'Starting Gig Sequence', action.payload?.name)
      return { ...state, currentGig: action.payload, currentScene: 'PREGIG' }

    case ActionTypes.SET_SETLIST:
      return { ...state, setlist: action.payload }

    case ActionTypes.SET_LAST_GIG_STATS:
      return { ...state, lastGigStats: action.payload }

    case ActionTypes.SET_ACTIVE_EVENT:
      if (action.payload) {
        logger.info('GameState', 'Event Triggered', action.payload.title)
      }
      return { ...state, activeEvent: action.payload }

    case ActionTypes.ADD_TOAST:
      return { ...state, toasts: [...state.toasts, action.payload] }

    case ActionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload)
      }

    case ActionTypes.SET_GIG_MODIFIERS:
      return handleSetGigModifiers(state, action.payload)

    case ActionTypes.LOAD_GAME:
      return handleLoadGame(state, action.payload)

    case ActionTypes.RESET_STATE:
      logger.info('GameState', 'State Reset (Debug)')
      return { ...initialState }

    case ActionTypes.APPLY_EVENT_DELTA:
      logger.info('GameState', 'Applying Event Delta', action.payload)
      return applyEventDelta(state, action.payload)

    case ActionTypes.POP_PENDING_EVENT:
      return { ...state, pendingEvents: state.pendingEvents.slice(1) }

    case ActionTypes.CONSUME_ITEM:
      return handleConsumeItem(state, action.payload)

    case ActionTypes.ADVANCE_DAY:
      return handleAdvanceDay(state)

    default:
      return state
  }
}
