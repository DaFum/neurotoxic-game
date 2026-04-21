/**
 * Initial State Definition for the Game
 * This module defines the default state structure for the entire game.
 * @module initialState
 */

import { CHARACTERS } from '../data/characters'
import { LOG_LEVELS } from '../utils/logger'
import { isPlainObject } from '../utils/gameStateUtils'
import { DEFAULT_MINIGAME_STATE, GAME_PHASES } from './gameConstants'
import { normalizeTraitMap } from '../utils/traitUtils'
import type { GameState, GameSettings } from '../types/game'

/**
 * Brand alignment constants
 */
export const BRAND_ALIGNMENTS = {
  EVIL: 'EVIL',
  CORPORATE: 'CORPORATE',
  INDIE: 'INDIE',
  SUSTAINABLE: 'SUSTAINABLE',
  GOOD: 'GOOD',
  NEUTRAL: 'NEUTRAL'
}

/**
 * Default player state configuration
 * @type {Object}
 */
export const DEFAULT_PLAYER_STATE = {
  playerId: null,
  playerName: '',
  money: 500,
  day: 1,
  time: 12,
  location: 'stendal',
  currentNodeId: 'node_0_0',
  lastGigNodeId: null,
  tutorialStep: 0,
  score: 0,
  fame: 0,
  fameLevel: 0,
  eventsTriggeredToday: 0,
  totalTravels: 0,
  hqUpgrades: [],
  clinicVisits: 0,
  van: {
    fuel: 100,
    condition: 100,
    upgrades: [],
    breakdownChance: 0.05
  },
  passiveFollowers: 0,
  stats: {
    totalDistance: 0,
    conflictsResolved: 0,
    stageDives: 0,
    consecutiveBadShows: 0,
    proveYourselfMode: false
  }
}

/**
 * Default band state configuration
 * @type {Object}
 */
export const DEFAULT_BAND_STATE = {
  members: [
    {
      ...CHARACTERS.MATZE,
      mood: 80,
      stamina: 100,
      traits: Object.create(null),
      relationships: { Marius: 50, Lars: 50 } satisfies Record<string, number>
    },
    {
      ...CHARACTERS.MARIUS,
      mood: 80,
      stamina: 100,
      traits: Object.create(null),
      relationships: { Matze: 50, Lars: 50 } satisfies Record<string, number>
    },
    {
      ...CHARACTERS.LARS,
      mood: 80,
      stamina: 100,
      traits: Object.create(null),
      relationships: { Matze: 50, Marius: 50 } satisfies Record<string, number>
    }
  ],
  harmony: 80,
  harmonyRegenTravel: false,
  inventorySlots: 0,
  luck: 0,
  stash: Object.create(null),
  activeContrabandEffects: [],
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
  lastGigDay: null,
  lastGigDifficulty: null,
  lastPirateBroadcastDay: null,
  lastDarkWebLeakDay: null,
  controversyLevel: 0,
  loyalty: 0,
  zealotry: 0,
  reputationCooldown: 0,
  egoFocus: null,
  trend: 'NEUTRAL', // 'NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME'
  activeDeals: [], // List of { id, remainingGigs, ... }
  brandReputation: {}, // { [ALIGNMENT]: 0-100 }
  influencers: {
    tech_reviewer_01: { tier: 'Macro', trait: 'tech_savvy', score: 0 },
    drama_queen_99: { tier: 'Mega', trait: 'drama_magnet', score: 0 },
    local_scene_kid: { tier: 'Micro', trait: 'tastemaker', score: 0 }
  }
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
const getSavedSettings = () => {
  try {
    return JSON.parse(
      localStorage.getItem('neurotoxic_global_settings') || '{}'
    )
  } catch (_e) {
    return {}
  }
}

const DEFAULT_SETTINGS = {
  crtEnabled: true,
  tutorialSeen: false,
  logLevel:
    ((import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? true)
      ? LOG_LEVELS.DEBUG
      : LOG_LEVELS.WARN
}

const sanitizeSettings = (
  input: unknown
): {
  crtEnabled?: boolean
  tutorialSeen?: boolean
  logLevel?: number
} => {
  if (!isPlainObject(input)) return {}

  const next: {
    crtEnabled?: boolean
    tutorialSeen?: boolean
    logLevel?: number
  } = {}

  if ('crtEnabled' in input) {
    next.crtEnabled = Boolean(input.crtEnabled)
  }
  if ('tutorialSeen' in input) {
    next.tutorialSeen = Boolean(input.tutorialSeen)
  }
  if ('logLevel' in input) {
    const numeric = Number(input.logLevel)
    if (
      Number.isFinite(numeric) &&
      Number.isInteger(numeric) &&
      numeric >= LOG_LEVELS.DEBUG &&
      numeric <= LOG_LEVELS.NONE
    ) {
      next.logLevel = numeric
    }
  }

  return next
}

/**
 * Complete initial state for the game
 * @type {Object}
 */
export const initialState: GameState = {
  version: 2,
  currentScene: GAME_PHASES.INTRO,
  player: { ...DEFAULT_PLAYER_STATE },
  band: { ...DEFAULT_BAND_STATE },
  social: { ...DEFAULT_SOCIAL_STATE },
  gameMap: null,
  currentGig: null,
  setlist: [],
  lastGigStats: null,
  activeEvent: null,
  pendingEvents: [],
  isScreenshotMode: false,
  toasts: [],
  activeStoryFlags: [],
  eventCooldowns: [],
  venueBlacklist: [],
  activeQuests: [],
  reputationByRegion: {},
  settings: { ...DEFAULT_SETTINGS },
  npcs: {},
  gigModifiers: { ...DEFAULT_GIG_MODIFIERS },
  minigame: { ...DEFAULT_MINIGAME_STATE },
  unlocks: []
}

/**
 * Creates a fresh copy of the initial state
 * @param {Object} [persistedData={}] - Persisted data to inject (e.g. unlocks, settings)
 * @returns {Object} A new initial state object
 */
export const createInitialState = (
  persistedData: { settings?: Partial<GameSettings>; unlocks?: string[] } = {}
): GameState => ({
  ...initialState,
  player: structuredClone(DEFAULT_PLAYER_STATE),
  venueBlacklist: [],
  activeQuests: [],
  band: {
    ...DEFAULT_BAND_STATE,
    members: DEFAULT_BAND_STATE.members.map(m => ({
      ...m,
      traits: normalizeTraitMap(m.traits),
      relationships: { ...m.relationships }
    })),
    performance: { ...DEFAULT_BAND_STATE.performance },
    inventory: { ...DEFAULT_BAND_STATE.inventory },
    stash: Object.assign(Object.create(null), DEFAULT_BAND_STATE.stash),
    activeContrabandEffects: [...DEFAULT_BAND_STATE.activeContrabandEffects]
  },
  social: {
    ...DEFAULT_SOCIAL_STATE,
    activeDeals: [...DEFAULT_SOCIAL_STATE.activeDeals],
    brandReputation: { ...DEFAULT_SOCIAL_STATE.brandReputation }
  },
  settings: {
    ...DEFAULT_SETTINGS,
    ...sanitizeSettings(getSavedSettings()),
    ...sanitizeSettings(persistedData.settings)
  },
  gigModifiers: { ...DEFAULT_GIG_MODIFIERS },
  minigame: { ...DEFAULT_MINIGAME_STATE },
  unlocks: Array.isArray(persistedData.unlocks)
    ? [...persistedData.unlocks]
    : []
})
