/**
 * Game Reducer Module
 * Handles all state mutations through a centralized reducer pattern.
 * @module gameReducer
 */

import {
  applyEventDelta,
  applyInventoryItemDelta,
  clampBandHarmony,
  clampPlayerMoney
} from '../utils/gameStateUtils.js'
import { calculateDailyUpdates } from '../utils/simulationUtils.js'
import {
  calculateTravelExpenses,
  calculateTravelMinigameResult,
  calculateRoadieMinigameResult
} from '../utils/economyEngine.js'
import { checkTraitUnlocks } from '../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../utils/traitUtils.js'
import { logger } from '../utils/logger.js'
import {
  createInitialState,
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE
} from './initialState.js'
import { GAME_PHASES, MINIGAME_TYPES, DEFAULT_MINIGAME_STATE, DEFAULT_EQUIPMENT_COUNT } from './gameConstants.js'

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
  ADVANCE_DAY: 'ADVANCE_DAY',
  ADD_COOLDOWN: 'ADD_COOLDOWN',
  START_TRAVEL_MINIGAME: 'START_TRAVEL_MINIGAME',
  COMPLETE_TRAVEL_MINIGAME: 'COMPLETE_TRAVEL_MINIGAME',
  START_ROADIE_MINIGAME: 'START_ROADIE_MINIGAME',
  COMPLETE_ROADIE_MINIGAME: 'COMPLETE_ROADIE_MINIGAME',
  UNLOCK_TRAIT: 'UNLOCK_TRAIT'
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
    mergedPlayer.money = clampPlayerMoney(mergedPlayer.money)
  }

  return { ...state, player: mergedPlayer }
}

/**
 * Handles band update actions
 * Clamps band.harmony to valid range 1-100
 * @param {Object} state - Current state
 * @param {Object} payload - Band updates
 * @returns {Object} Updated state
 */
const handleUpdateBand = (state, payload) => {
  logger.debug('GameState', 'Update Band', payload)
  const mergedBand = { ...state.band, ...payload }

  // Clamp harmony to valid range 1-100
  if (typeof mergedBand.harmony === 'number') {
    mergedBand.harmony = clampBandHarmony(mergedBand.harmony)
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
    nextBand.inventory[itemType] = applyInventoryItemDelta(
      nextBand.inventory[itemType],
      -1
    )
  }

  return { ...state, band: nextBand }
}

/**
 * Handles day advancement
 * @param {Object} state - Current state
 * @returns {Object} Updated state
 */
const handleAdvanceDay = (state, payload) => {
  const rng = payload?.rng || Math.random
  const { player, band, social } = calculateDailyUpdates(state, rng)
  const nextBand = { ...band }
  if (typeof nextBand.harmony === 'number') {
    nextBand.harmony = clampBandHarmony(nextBand.harmony)
  }

  // Check Social Unlocks
  const socialUnlocks = checkTraitUnlocks(
    { player, band: nextBand, social },
    { type: 'SOCIAL_UPDATE' }
  )

  const traitResult = applyTraitUnlocks({ band: nextBand, toasts: state.toasts }, socialUnlocks)

  logger.info('GameState', `Day Advanced to ${player.day}`)
  return {
    ...state,
    player,
    band: traitResult.band,
    social,
    eventCooldowns: [],
    toasts: traitResult.toasts
  }
}

const handleStartTravelMinigame = (state, payload) => {
  const { targetNodeId } = payload
  logger.info('GameState', `Starting Travel Minigame to ${targetNodeId}`)
  return {
    ...state,
    currentScene: GAME_PHASES.TRAVEL_MINIGAME,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.TOURBUS,
      targetDestination: targetNodeId
    }
  }
}

const handleCompleteTravelMinigame = (state, payload) => {
  const { damageTaken, itemsCollected } = payload
  logger.info('GameState', 'Travel Minigame Complete', payload)

  // Apply Travel Results
  const targetId = state.minigame.targetDestination
  const targetNode = state.gameMap?.nodes?.[targetId]
  const currentNode = state.gameMap?.nodes?.[state.player.currentNodeId]

  if (!targetNode) {
    logger.error('GameState', 'Complete Travel: Invalid Target', targetId)
    return {
      ...state,
      minigame: { ...DEFAULT_MINIGAME_STATE },
      currentScene: GAME_PHASES.OVERWORLD
    }
  }

  const { dist, totalCost, fuelLiters } = calculateTravelExpenses(targetNode, currentNode, state.player, state.band)
  const { conditionLoss } = calculateTravelMinigameResult(damageTaken, itemsCollected)

  const nextPlayer = {
    ...state.player,
    money: clampPlayerMoney(state.player.money - totalCost),
    location: targetNode.venue?.name || 'Unknown',
    currentNodeId: targetNode.id,
    totalTravels: state.player.totalTravels + 1,
    van: {
      ...state.player.van,
      fuel: Math.max(0, Math.min(100, state.player.van.fuel - fuelLiters)),
      condition: Math.max(0, state.player.van.condition - conditionLoss)
    },
    stats: {
      ...state.player.stats,
      totalDistance: (state.player.stats?.totalDistance || 0) + dist
    }
  }

  // Check Travel Unlocks
  const travelUnlocks = checkTraitUnlocks(
    { ...state, player: nextPlayer },
    { type: 'TRAVEL_COMPLETE' }
  )

  const traitResult = applyTraitUnlocks({ band: state.band, toasts: state.toasts }, travelUnlocks)

  return {
    ...state,
    player: nextPlayer,
    band: traitResult.band,
    toasts: traitResult.toasts,
    minigame: { ...DEFAULT_MINIGAME_STATE }
  }
}

const handleStartRoadieMinigame = (state, payload) => {
  const { gigId } = payload
  logger.info('GameState', `Starting Roadie Minigame for Gig ${gigId}`)
  return {
    ...state,
    currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
    minigame: {
      ...DEFAULT_MINIGAME_STATE,
      active: true,
      type: MINIGAME_TYPES.ROADIE,
      gigId: gigId,
      equipmentRemaining: DEFAULT_EQUIPMENT_COUNT
    }
  }
}

const handleCompleteRoadieMinigame = (state, payload) => {
  const { equipmentDamage } = payload
  logger.info('GameState', 'Roadie Minigame Complete', payload)

  // Apply Results
  const { stress, repairCost } = calculateRoadieMinigameResult(
    equipmentDamage,
    state.band
  )

  const nextBand = {
    ...state.band,
    harmony: clampBandHarmony(state.band.harmony - stress)
  }

  const nextPlayer = {
    ...state.player,
    money: clampPlayerMoney(state.player.money - repairCost)
  }

  // Pass damage to gig modifiers or stats?
  const nextModifiers = { ...state.gigModifiers }
  if (equipmentDamage > 50) {
    // Apply a penalty for heavily damaged gear
    logger.warn('GameState', 'Heavy equipment damage applied: damaged_gear active')
    nextModifiers.damaged_gear = true
  }

  return {
    ...state,
    band: nextBand,
    player: nextPlayer,
    gigModifiers: nextModifiers,
    minigame: { ...DEFAULT_MINIGAME_STATE }
    // Scene transition handled by UI overlay
  }
}

/**
 * Handles explicit trait unlocking via action.
 * @param {Object} state - Current state
 * @param {Object} payload - { memberId, traitId }
 * @returns {Object} Updated state
 */
const handleUnlockTrait = (state, payload) => {
  const { memberId, traitId } = payload
  const traitResult = applyTraitUnlocks(state, [{ memberId, traitId }])

  return {
    ...state,
    band: traitResult.band,
    toasts: traitResult.toasts
  }
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

    case ActionTypes.UPDATE_SOCIAL: {
      if (!action.payload || typeof action.payload !== 'object') return state
      const updates = { ...action.payload }

      // Validate special fields
      if (updates.trend !== undefined) {
        const ALLOWED_TRENDS = ['NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME']
        if (!ALLOWED_TRENDS.includes(updates.trend)) {
          logger.warn('GameState', `Invalid trend update: ${updates.trend}`)
          delete updates.trend
        }
      }

      if (updates.sponsorActive !== undefined && typeof updates.sponsorActive !== 'boolean') {
        logger.warn('GameState', 'Invalid sponsorActive update (must be boolean)')
        delete updates.sponsorActive
      }

      if (updates.activeDeals !== undefined) {
        if (!Array.isArray(updates.activeDeals)) {
          logger.warn('GameState', 'Invalid activeDeals update (must be array)')
          delete updates.activeDeals
        } else {
          // Validate structure of items
          const validDeals = updates.activeDeals.filter(d =>
            d && typeof d === 'object' && typeof d.id === 'string' && typeof d.remainingGigs === 'number'
          )
          if (validDeals.length !== updates.activeDeals.length) {
             logger.warn('GameState', 'Filtered invalid deals from activeDeals update')
          }
          updates.activeDeals = validDeals
        }
      }

      return { ...state, social: { ...state.social, ...updates } }
    }

    case ActionTypes.UPDATE_SETTINGS: {
      if (!action.payload || typeof action.payload !== 'object') return state
      return { ...state, settings: { ...state.settings, ...action.payload } }
    }

    case ActionTypes.SET_MAP:
      logger.info('GameState', 'Map Generated')
      return { ...state, gameMap: action.payload }

    case ActionTypes.SET_GIG:
      logger.info('GameState', 'Set Current Gig', action.payload?.name)
      return { ...state, currentGig: action.payload }

    case ActionTypes.START_GIG:
      logger.info('GameState', 'Starting Gig Sequence', action.payload?.name)
      return {
        ...state,
        currentGig: action.payload,
        currentScene: 'PREGIG',
        gigModifiers: { ...DEFAULT_GIG_MODIFIERS }
      }

    case ActionTypes.SET_SETLIST:
      return { ...state, setlist: action.payload }

    case ActionTypes.SET_LAST_GIG_STATS: {
      // Prevent trait unlocks during practice mode
      if (state.currentGig?.isPractice) {
        return {
          ...state,
          lastGigStats: action.payload
        }
      }
      const performanceUnlocks = checkTraitUnlocks(state, { type: 'GIG_COMPLETE', gigStats: action.payload })
      const traitResult = applyTraitUnlocks(state, performanceUnlocks)
      return {
        ...state,
        lastGigStats: action.payload,
        band: traitResult.band,
        toasts: traitResult.toasts
      }
    }

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
      return { ...createInitialState(), settings: state.settings }

    case ActionTypes.APPLY_EVENT_DELTA: {
      logger.info('GameState', 'Applying Event Delta', action.payload)
      const nextState = applyEventDelta(state, action.payload)

      const eventUnlocks = checkTraitUnlocks(nextState, { type: 'EVENT_RESOLVED' })
      const traitResult = applyTraitUnlocks({ band: nextState.band, toasts: nextState.toasts }, eventUnlocks)

      return {
        ...nextState,
        band: traitResult.band,
        toasts: traitResult.toasts
      }
    }

    case ActionTypes.POP_PENDING_EVENT:
      return { ...state, pendingEvents: state.pendingEvents.slice(1) }

    case ActionTypes.CONSUME_ITEM:
      return handleConsumeItem(state, action.payload)

    case ActionTypes.ADVANCE_DAY:
      return handleAdvanceDay(state, action.payload)

    case ActionTypes.ADD_COOLDOWN:
      if (action.payload && !state.eventCooldowns.includes(action.payload)) {
        return {
          ...state,
          eventCooldowns: [...state.eventCooldowns, action.payload]
        }
      }
      return state

    case ActionTypes.START_TRAVEL_MINIGAME:
      return handleStartTravelMinigame(state, action.payload)

    case ActionTypes.COMPLETE_TRAVEL_MINIGAME:
      return handleCompleteTravelMinigame(state, action.payload)

    case ActionTypes.START_ROADIE_MINIGAME:
      return handleStartRoadieMinigame(state, action.payload)

    case ActionTypes.COMPLETE_ROADIE_MINIGAME:
      return handleCompleteRoadieMinigame(state, action.payload)

    case ActionTypes.UNLOCK_TRAIT:
      return handleUnlockTrait(state, action.payload)

    default:
      return state
  }
}
