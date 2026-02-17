/**
 * Initial State Definition for the Game
 * This module defines the default state structure for the entire game.
 * @module initialState
 */

import { CHARACTERS } from '../data/characters.js'
import { LOG_LEVELS } from '../utils/logger.js'

/**
 * Default player state configuration
 * @type {Object}
 */
export const DEFAULT_PLAYER_STATE = {
  money: 500,
  day: 1,
  time: 12,
  location: 'Stendal',
  currentNodeId: 'node_0_0',
  tutorialStep: 0,
  score: 0,
  fame: 0,
  fameLevel: 0,
  totalTravels: 0,
  hqUpgrades: [],
  van: {
    fuel: 100,
    condition: 100,
    upgrades: [],
    breakdownChance: 0.05
  },
  passiveFollowers: 0
}

/**
 * Default band state configuration
 * @type {Object}
 */
export const DEFAULT_BAND_STATE = {
  members: [
    { ...CHARACTERS.MATZE, mood: 80, stamina: 100 },
    { ...CHARACTERS.LARS, mood: 80, stamina: 100 },
    { ...CHARACTERS.MARIUS, mood: 80, stamina: 100 }
  ],
  harmony: 80,
  harmonyRegenTravel: false,
  inventorySlots: 0,
  luck: 0,
  performance: {
    guitarDifficulty: 1.0,
    drumMultiplier: 1.0,
    crowdDecay: 1.0
  },
  inventory: {
    shirts: 50,
    hoodies: 20,
    patches: 100,
    cds: 30,
    vinyl: 10,
    strings: true,
    cables: true,
    drum_parts: true,
    golden_pick: false
  }
}

/**
 * Default social media state configuration
 * @type {Object}
 */
export const DEFAULT_SOCIAL_STATE = {
  instagram: 228,
  tiktok: 64,
  youtube: 14,
  newsletter: 0,
  viral: 0,
  lastGigDay: null
}

/**
 * Default gig modifiers configuration
 * @type {Object}
 */
export const DEFAULT_GIG_MODIFIERS = {
  promo: false,
  soundcheck: false,
  merch: false,
  catering: false,
  guestlist: false
}

/**
 * Default settings configuration
 * @type {Object}
 */
const savedSettings = (() => {
  try {
    return JSON.parse(
      localStorage.getItem('neurotoxic_global_settings') || '{}'
    )
  } catch (_e) {
    return {}
  }
})()

const DEFAULT_SETTINGS = {
  crtEnabled: true,
  tutorialSeen: false,
  logLevel: (import.meta.env?.DEV ?? true) ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN,
  ...savedSettings
}

/**
 * Complete initial state for the game
 * @type {Object}
 */
export const initialState = {
  currentScene: 'INTRO',
  player: { ...DEFAULT_PLAYER_STATE },
  band: { ...DEFAULT_BAND_STATE },
  social: { ...DEFAULT_SOCIAL_STATE },
  gameMap: null,
  currentGig: null,
  setlist: [],
  lastGigStats: null,
  activeEvent: null,
  toasts: [],
  activeStoryFlags: [],
  eventCooldowns: [],
  pendingEvents: [],
  reputationByRegion: {},
  settings: { ...DEFAULT_SETTINGS },
  npcs: {},
  gigModifiers: { ...DEFAULT_GIG_MODIFIERS }
}

/**
 * Creates a fresh copy of the initial state
 * @returns {Object} A new initial state object
 */
export const createInitialState = () => ({
  ...initialState,
  player: { ...DEFAULT_PLAYER_STATE, van: { ...DEFAULT_PLAYER_STATE.van } },
  band: {
    ...DEFAULT_BAND_STATE,
    members: DEFAULT_BAND_STATE.members.map(m => ({ ...m })),
    performance: { ...DEFAULT_BAND_STATE.performance },
    inventory: { ...DEFAULT_BAND_STATE.inventory }
  },
  social: { ...DEFAULT_SOCIAL_STATE },
  settings: { ...DEFAULT_SETTINGS },
  gigModifiers: { ...DEFAULT_GIG_MODIFIERS }
})
