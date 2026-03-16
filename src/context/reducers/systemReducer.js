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
import { CONTRABAND_BY_ID } from '../../data/contraband.js'
import {
  createInitialState,
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE
} from '../initialState.js'
import { DEFAULT_MINIGAME_STATE, GAME_PHASES } from '../gameConstants.js'
import { handleFailQuests } from './questReducer.js'

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
  const rawPlayer = {
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

  const validatedFame = Math.max(
    0,
    typeof rawPlayer.fame === 'number' ? rawPlayer.fame : 0
  )

  // Validate Player
  const mergedPlayer = {
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

  // 2. Sanitize Band
  const rawBand = {
    ...DEFAULT_BAND_STATE,
    ...loadedState.band,
    performance: {
      ...DEFAULT_BAND_STATE.performance,
      ...(loadedState.band?.performance || {})
    },
    inventory: {
      ...DEFAULT_BAND_STATE.inventory,
      ...(loadedState.band?.inventory || {})
    },
    stash: (() => {
      const defaultStash = Object.assign(
        Object.create(null),
        DEFAULT_BAND_STATE.stash
      )
      if (Array.isArray(loadedState.band?.stash)) {
        return loadedState.band.stash.reduce((acc, item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item))
            return acc
          if (!CONTRABAND_BY_ID.has(item.id)) return acc
          if (Object.hasOwn(item, '__proto__')) return acc
          const copy = { ...item }
          copy.remainingDuration =
            Number.isFinite(item.remainingDuration) &&
            item.remainingDuration > 0
              ? item.remainingDuration
              : item.duration || null
          acc[item.id] = copy
          return acc
        }, defaultStash)
      } else if (
        loadedState.band?.stash &&
        typeof loadedState.band.stash === 'object'
      ) {
        const migrated = Object.create(null)
        for (const [id, item] of Object.entries(loadedState.band.stash)) {
          if (!CONTRABAND_BY_ID.has(id)) continue
          if (!item || typeof item !== 'object' || Array.isArray(item)) continue
          if (Object.hasOwn(item, '__proto__')) continue
          const copy = { ...item }
          copy.remainingDuration =
            Number.isFinite(item.remainingDuration) &&
            item.remainingDuration > 0
              ? item.remainingDuration
              : item.duration || null
          migrated[id] = copy
        }
        return migrated
      }
      return defaultStash
    })(),
    activeContrabandEffects: Array.isArray(
      loadedState.band?.activeContrabandEffects
    )
      ? loadedState.band.activeContrabandEffects.map(effect => ({
          ...effect,
          remainingDuration:
            Number.isFinite(effect.remainingDuration) &&
            effect.remainingDuration >= 0
              ? effect.remainingDuration
              : 0
        }))
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
    : []

  const validatedBand = {
    ...rawBand,
    members: validatedMembers,
    harmony: clampBandHarmony(rawBand.harmony)
  }

  // 3. Sanitize Social
  const mergedSocial = { ...DEFAULT_SOCIAL_STATE, ...loadedState.social }

  // 4. Construct Safe State (Whitelist)
  const incomingVersion =
    loadedState.version !== undefined ? loadedState.version : state.version
  const parsedVersion = parseInt(incomingVersion, 10)
  const explicitVersion = Number.isFinite(parsedVersion) ? parsedVersion : 0

  const safeState = {
    ...state,
    version: explicitVersion,
    player: mergedPlayer,
    band: validatedBand,
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
    toasts: (() => {
      if (!Array.isArray(loadedState.toasts)) return []
      const acc = []
      for (let i = 0; i < loadedState.toasts.length; i++) {
        const t = loadedState.toasts[i]
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
      }
      return acc
    })(),
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

  // Migration: support older raw venue IDs while preserving current venues:* keys.
  const migratePlayerLocation = location => {
    if (typeof location !== 'string') return location

    let rawId = location
    if (rawId.startsWith('venues:')) {
      rawId = rawId.slice(7)
    }
    if (rawId.endsWith('.name')) {
      rawId = rawId.slice(0, -5)
    }

    const normalizedLocation = normalizeVenueId(rawId)
    if (!normalizedLocation || normalizedLocation === 'Unknown') {
      return location
    }

    return `venues:${normalizedLocation}.name`
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
          ? migratePlayerLocation(safeState.player.location)
          : safeState.player.location
    },
    venueBlacklist: safeState.venueBlacklist.map(migrateLegacyVenueId)
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

  // --- Contraband expiry ---
  let activeEffects = traitResult.band.activeContrabandEffects || []
  activeEffects = activeEffects.map(e => ({
    ...e,
    remainingDuration: e.remainingDuration - 1
  }))

  const stillActive = activeEffects.filter(e => e.remainingDuration > 0)
  const expired = activeEffects.filter(e => e.remainingDuration <= 0)

  let stashCloned = false

  // Revert expired effects if needed
  expired.forEach(e => {
    // Revert the temporary state applied in bandReducer.js
    if (e.effectType === 'harmony') {
      traitResult.band.harmony = clampBandHarmony(
        (traitResult.band.harmony || 0) - e.value
      )
    } else if (e.effectType === 'guitar_difficulty') {
      traitResult.band.performance = {
        ...traitResult.band.performance,
        guitarDifficulty: Math.max(
          0.1,
          (traitResult.band.performance.guitarDifficulty || 1) - e.value
        )
      }
    } else if (e.effectType === 'luck') {
      traitResult.band.luck = Math.max(
        0,
        (traitResult.band.luck || 0) - e.value
      )
    } else if (e.effectType === 'stamina_max') {
      traitResult.band.members = traitResult.band.members.map(m => ({
        ...m,
        staminaMax: Math.max(0, (m.staminaMax || 100) - e.value)
      }))
    } else if (e.effectType === 'style') {
      traitResult.band.style = Math.max(
        0,
        (traitResult.band.style || 0) - e.value
      )
    } else if (e.effectType === 'tour_success') {
      traitResult.band.tourSuccess = Math.max(
        0,
        (traitResult.band.tourSuccess || 0) - e.value
      )
    } else if (e.effectType === 'gig_modifier') {
      traitResult.band.gigModifier = Math.max(
        0,
        (traitResult.band.gigModifier || 0) - e.value
      )
    } else if (e.effectType === 'tempo') {
      traitResult.band.tempo = Math.max(
        0,
        (traitResult.band.tempo || 0) - e.value
      )
    } else if (e.effectType === 'practice_gain') {
      traitResult.band.practiceGain = Math.max(
        0,
        (traitResult.band.practiceGain || 0) - e.value
      )
    } else if (e.effectType === 'crit') {
      traitResult.band.crit = Math.max(
        0,
        (traitResult.band.crit || 0) - e.value
      )
    } else if (e.effectType === 'affinity') {
      traitResult.band.affinity = Math.max(
        0,
        (traitResult.band.affinity || 0) - e.value
      )
    } else if (e.effectType === 'crowd_control') {
      traitResult.band.crowdControl = Math.max(
        0,
        (traitResult.band.crowdControl || 0) - e.value
      )
    }

    // Unmark applied status in stash so relics can be used again
    if (traitResult.band.stash) {
      if (!stashCloned) {
        traitResult.band.stash = Object.assign(
          Object.create(null),
          traitResult.band.stash
        )
        stashCloned = true
      }
      for (const itemKey in traitResult.band.stash) {
        if (!Object.hasOwn(traitResult.band.stash, itemKey)) continue
        const i = traitResult.band.stash[itemKey]
        if (i.instanceId === e.instanceId) {
          traitResult.band.stash[itemKey] = {
            ...i,
            applied: false
          }
          break
        }
      }
    }
  })

  traitResult.band.activeContrabandEffects = stillActive
  // -------------------------

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
