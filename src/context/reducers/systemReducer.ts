import type {
  GameState,
  PlayerState,
  BandState,
  BandMember,
  ToastPayload,
  GameMap,
  GameSettings,
  RawGameSettings,
  ResetStatePayload
} from '../../types/game'
import { logger } from '../../utils/logger'
import {
  clampBandHarmony,
  clampPlayerMoney,
  clampPlayerFame,
  clampMemberStamina,
  clampMemberMood,
  calculateFameLevel,
  isForbiddenKey
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
import { ALLOWED_TOAST_TYPES, sanitizeLoadedToast } from './toastSanitizers'

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

const normalizeLoadedGameMap = (gameMap: unknown): GameMap | null => {
  if (typeof gameMap !== 'object' || gameMap === null) {
    return null
  }
  const mapRecord = gameMap as Record<string, unknown>
  if (
    typeof mapRecord.nodes !== 'object' ||
    mapRecord.nodes === null ||
    Array.isArray(mapRecord.nodes)
  ) {
    return null
  }
  const nodesRecord = mapRecord.nodes as Record<string, unknown>
  const sanitizedNodes = Object.create(null) as Record<
    string,
    GameMap['nodes'][string]
  >

  const normalizeCoordinate = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0
  // Note: copySafeArray always returns an array (which is truthy), even if all items are filtered out.
  // copySafeFlatObject returns null if all items are filtered out.
  // This asymmetry preserves array identity for map data node properties while dropping empty objects.
  // Also note that copySafeArray silently drops nested arrays and non-primitive/non-object entries.
  const copySafeArray = (
    value: unknown
  ): Array<
    | string
    | number
    | boolean
    | null
    | Record<string, string | number | boolean | null>
  > | null => {
    if (!Array.isArray(value)) return null
    const copied: Array<
      | string
      | number
      | boolean
      | null
      | Record<string, string | number | boolean | null>
    > = []
    for (let i = 0; i < value.length; i++) {
      const entry = value[i]
      if (
        typeof entry === 'string' ||
        typeof entry === 'number' ||
        typeof entry === 'boolean' ||
        entry === null
      ) {
        copied.push(entry)
      } else if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        const entryRecord = entry as Record<string, unknown>
        const copiedEntry: Record<string, string | number | boolean | null> = {}
        for (const entryKey in entryRecord) {
          if (!Object.hasOwn(entryRecord, entryKey)) continue
          if (isForbiddenKey(entryKey)) continue
          const entryValue = entryRecord[entryKey]
          if (
            typeof entryValue === 'string' ||
            typeof entryValue === 'number' ||
            typeof entryValue === 'boolean' ||
            entryValue === null
          ) {
            copiedEntry[entryKey] = entryValue
          }
        }
        if (Object.keys(copiedEntry).length > 0) {
          copied.push(copiedEntry)
        }
      }
    }
    return copied
  }
  const copySafeFlatObject = (
    value: unknown
  ): Record<string, string | number | boolean | null> | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null
    }
    const source = value as Record<string, unknown>
    const copied: Record<string, string | number | boolean | null> = {}
    for (const key in source) {
      if (!Object.hasOwn(source, key)) continue
      if (isForbiddenKey(key)) continue
      const entry = source[key]
      if (
        typeof entry === 'string' ||
        typeof entry === 'number' ||
        typeof entry === 'boolean' ||
        entry === null
      ) {
        copied[key] = entry
      }
    }
    return Object.keys(copied).length > 0 ? copied : null
  }

  for (const nodeKey in nodesRecord) {
    if (!Object.hasOwn(nodesRecord, nodeKey)) continue
    if (isForbiddenKey(nodeKey)) continue
    const rawNode = nodesRecord[nodeKey]
    if (!rawNode || typeof rawNode !== 'object' || Array.isArray(rawNode)) {
      continue
    }
    const nodeRecord = rawNode as Record<string, unknown>
    const x = normalizeCoordinate(nodeRecord.x)
    const y = normalizeCoordinate(nodeRecord.y)

    const id =
      typeof nodeRecord.id === 'string' && nodeRecord.id.length > 0
        ? nodeRecord.id
        : nodeKey
    if (isForbiddenKey(id)) continue
    const sanitizedNode: GameMap['nodes'][string] = { id, x, y }

    if (
      typeof nodeRecord.layer === 'number' &&
      Number.isFinite(nodeRecord.layer)
    ) {
      sanitizedNode.layer = nodeRecord.layer
    }
    if (typeof nodeRecord.venueId === 'string') {
      sanitizedNode.venueId = nodeRecord.venueId
    }
    if (Array.isArray(nodeRecord.neighbors)) {
      const neighbors: string[] = []
      for (let i = 0; i < nodeRecord.neighbors.length; i++) {
        const neighbor = nodeRecord.neighbors[i]
        if (typeof neighbor === 'string') {
          neighbors.push(neighbor)
        }
      }
      sanitizedNode.neighbors = neighbors
    }
    for (const key in nodeRecord) {
      if (!Object.hasOwn(nodeRecord, key)) continue
      if (
        isForbiddenKey(key) ||
        key === 'id' ||
        key === 'x' ||
        key === 'y' ||
        key === 'layer' ||
        key === 'venueId' ||
        key === 'neighbors'
      ) {
        continue
      }
      const value = nodeRecord[key]
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
      ) {
        sanitizedNode[key] = value
        continue
      }
      const copiedArray = copySafeArray(value)
      if (copiedArray) {
        sanitizedNode[key] = copiedArray
        continue
      }
      const copiedObject = copySafeFlatObject(value)
      if (copiedObject) {
        sanitizedNode[key] = copiedObject
      }
    }

    sanitizedNodes[id] = sanitizedNode
  }

  const sanitizedConnections: Array<{ from: string; to: string }> = []
  if (Array.isArray(mapRecord.connections)) {
    for (let i = 0; i < mapRecord.connections.length; i++) {
      const entry = mapRecord.connections[i]
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
      const entryRecord = entry as Record<string, unknown>
      if (
        (typeof entryRecord.from === 'string' ||
          typeof entryRecord.from === 'number') &&
        (typeof entryRecord.to === 'string' ||
          typeof entryRecord.to === 'number')
      ) {
        sanitizedConnections.push({
          from: String(entryRecord.from),
          to: String(entryRecord.to)
        })
      }
    }
  }

  const sanitizedMap: GameMap = {
    nodes: sanitizedNodes,
    connections: sanitizedConnections
  }

  if (typeof mapRecord.name === 'string') {
    sanitizedMap.name = mapRecord.name
  }
  if (
    typeof mapRecord.version === 'string' ||
    typeof mapRecord.version === 'number'
  ) {
    sanitizedMap.version = mapRecord.version
  }

  return sanitizedMap
}

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
          const copy = { ...baseItem, ...itemObj } as Record<string, unknown>
          copy.id = itemObj.id as string
          if (
            Object.hasOwn(item, 'remainingDuration') &&
            Number.isFinite(itemObj.remainingDuration as number)
          ) {
            copy.remainingDuration = itemObj.remainingDuration as number | null
          } else {
            copy.remainingDuration =
              typeof copy.duration === 'number' ? copy.duration : null
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
          const copy = { ...baseItem, ...itemObj } as Record<string, unknown>
          copy.id = id
          if (
            Object.hasOwn(item, 'remainingDuration') &&
            Number.isFinite(itemObj.remainingDuration as number)
          ) {
            copy.remainingDuration = itemObj.remainingDuration as number | null
          } else {
            copy.remainingDuration =
              typeof copy.duration === 'number' ? copy.duration : null
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
  const validatedMembers: BandMember[] = Array.isArray(rawBand.members)
    ? (rawBand.members.map((m, i) => ({
        ...m,
        // Backfill id from name for saves created before id fields were added
        id:
          typeof m.id === 'string'
            ? m.id
            : typeof m.name === 'string'
              ? m.name.toLowerCase()
              : typeof m.id === 'number' ||
                  typeof m.id === 'boolean' ||
                  typeof m.id === 'bigint' ||
                  typeof m.id === 'symbol'
                ? String(m.id)
                : `member-${i}`,
        traits: normalizeTraitMap(m.traits),
        mood: clampMemberMood(typeof m.mood === 'number' ? m.mood : 50),
        stamina: clampMemberStamina(
          typeof m.stamina === 'number' ? m.stamina : 100,
          (m as Record<string, unknown>).staminaMax as number | undefined
        ),
        ...(typeof m.baseStats === 'object' &&
        m.baseStats !== null
          ? {
              baseStats: Object.fromEntries(
                Object.entries(m.baseStats as Record<string, unknown>).filter(
                  ([, value]) =>
                    typeof value === 'number' && Number.isFinite(value)
                )
              )
            }
          : {}),
        ...(typeof m.skill === 'number' && Number.isFinite(m.skill)
          ? { skill: m.skill }
          : {}),
        ...(typeof m.charisma === 'number' && Number.isFinite(m.charisma)
          ? { charisma: m.charisma }
          : {}),
        ...(typeof m.technical === 'number' && Number.isFinite(m.technical)
          ? { technical: m.technical }
          : {}),
        ...(typeof m.improv === 'number' && Number.isFinite(m.improv)
          ? { improv: m.improv }
          : {}),
        ...(typeof m.composition === 'number' && Number.isFinite(m.composition)
          ? { composition: m.composition }
          : {}),
        ...(typeof m.role === 'string' ? { role: m.role } : {}),
        ...(typeof m.equipment === 'object' && m.equipment !== null
          ? { equipment: m.equipment as Record<string, unknown> }
          : {}),
        relationships:
          m.relationships && typeof m.relationships === 'object'
            ? (m.relationships as unknown as Record<string, number>)
            : ({} as Record<string, number>)
      })) as BandMember[])
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
    const safeToast = sanitizeLoadedToast(t, ALLOWED_TOAST_TYPES)
    if (safeToast) acc.push(safeToast)
  }
  return acc
}

const sanitizeSettingsPayload = (
  rawSettings: RawGameSettings | Record<string, unknown>
): Partial<GameSettings> => {
  const sanitized: Partial<GameSettings> = {}

  if (
    Object.hasOwn(rawSettings, 'crtEnabled') &&
    typeof rawSettings.crtEnabled === 'boolean'
  ) {
    sanitized.crtEnabled = rawSettings.crtEnabled
  }
  if (
    Object.hasOwn(rawSettings, 'tutorialSeen') &&
    typeof rawSettings.tutorialSeen === 'boolean'
  ) {
    sanitized.tutorialSeen = rawSettings.tutorialSeen
  }
  if (
    Object.hasOwn(rawSettings, 'logLevel') &&
    typeof rawSettings.logLevel === 'number' &&
    Number.isFinite(rawSettings.logLevel)
  ) {
    sanitized.logLevel = Math.floor(rawSettings.logLevel)
  }

  return sanitized
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

const sanitizeMinigameState = (rawMinigame: unknown): GameState['minigame'] => {
  if (
    typeof rawMinigame !== 'object' ||
    rawMinigame === null ||
    Array.isArray(rawMinigame)
  ) {
    return { ...DEFAULT_MINIGAME_STATE }
  }

  const minigameObj = rawMinigame as Record<string, unknown>
  const nextMinigame = { ...DEFAULT_MINIGAME_STATE }

  if (
    Object.hasOwn(minigameObj, 'active') &&
    typeof minigameObj.active === 'boolean'
  ) {
    nextMinigame.active = minigameObj.active
  }
  if (
    Object.hasOwn(minigameObj, 'type') &&
    (typeof minigameObj.type === 'string' || minigameObj.type === null)
  ) {
    nextMinigame.type = minigameObj.type
  }
  if (
    Object.hasOwn(minigameObj, 'targetDestination') &&
    (typeof minigameObj.targetDestination === 'string' ||
      minigameObj.targetDestination === null)
  ) {
    nextMinigame.targetDestination = minigameObj.targetDestination
  }
  if (
    Object.hasOwn(minigameObj, 'gigId') &&
    (typeof minigameObj.gigId === 'string' || minigameObj.gigId === null)
  ) {
    nextMinigame.gigId = minigameObj.gigId
  }
  if (
    Object.hasOwn(minigameObj, 'equipmentRemaining') &&
    typeof minigameObj.equipmentRemaining === 'number' &&
    Number.isFinite(minigameObj.equipmentRemaining)
  ) {
    nextMinigame.equipmentRemaining = minigameObj.equipmentRemaining
  }
  if (
    Object.hasOwn(minigameObj, 'accumulatedDamage') &&
    typeof minigameObj.accumulatedDamage === 'number' &&
    Number.isFinite(minigameObj.accumulatedDamage)
  ) {
    nextMinigame.accumulatedDamage = minigameObj.accumulatedDamage
  }
  if (
    Object.hasOwn(minigameObj, 'score') &&
    typeof minigameObj.score === 'number' &&
    Number.isFinite(minigameObj.score)
  ) {
    nextMinigame.score = minigameObj.score
  }

  return nextMinigame
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

  const safeState: GameState = {
    ...state,
    version: explicitVersion,
    player: mergedPlayer,
    band: validatedBand,
    social: mergedSocial,
    gameMap: normalizeLoadedGameMap(loadedState.gameMap) ?? state.gameMap,
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
    activeEvent: (loadedState.activeEvent as GameState['activeEvent']) || null,
    toasts: sanitizeToasts(loadedState.toasts),
    reputationByRegion:
      (loadedState.reputationByRegion as Record<string, number>) || {},
    venueBlacklist: Array.isArray(loadedState.venueBlacklist)
      ? (loadedState.venueBlacklist as string[])
      : [],
    activeQuests: Array.isArray(loadedState.activeQuests)
      ? loadedState.activeQuests
      : [],
    npcs: (loadedState.npcs as GameState['npcs']) || {},
    gigModifiers: {
      ...DEFAULT_GIG_MODIFIERS,
      ...((loadedState.gigModifiers as Record<string, boolean>) || {})
    },
    currentScene: GAME_PHASES.OVERWORLD,
    currentGig: (loadedState.currentGig as GameState['currentGig']) || null,
    lastGigStats:
      (loadedState.lastGigStats as GameState['lastGigStats']) || null,
    settings: {
      ...state.settings,
      ...(typeof loadedState.settings === 'object' &&
      loadedState.settings !== null &&
      !Array.isArray(loadedState.settings)
        ? sanitizeSettingsPayload(
            loadedState.settings as Record<string, unknown>
          )
        : {})
    },
    minigame: sanitizeMinigameState(loadedState.minigame),
    unlocks: Array.isArray(loadedState.unlocks)
      ? (loadedState.unlocks as string[])
      : state.unlocks || []
  }

  // Apply venue migrations using spreads
  const migratedState: GameState = {
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
  const gigModifiersLegacy = migratedState.gigModifiers as Record<
    string,
    boolean
  >
  if (gigModifiersLegacy.energy !== undefined) {
    const { energy, ...restModifiers } = gigModifiersLegacy
    migratedState.gigModifiers = {
      ...DEFAULT_GIG_MODIFIERS,
      ...restModifiers,
      catering: energy
    }
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
  payload: ResetStatePayload = {}
): GameState => {
  logger.info('GameState', 'State Reset (Debug)')

  // Construct the data to preserve across reset
  const persistedData: {
    settings?: Partial<GameSettings>
    unlocks?: string[]
  } = {
    settings:
      payload.settings !== null &&
      payload.settings !== undefined &&
      typeof payload.settings === 'object' &&
      !Array.isArray(payload.settings)
        ? sanitizeSettingsPayload(payload.settings as RawGameSettings)
        : state.settings,
    unlocks: Array.isArray(payload.unlocks)
      ? (payload.unlocks as string[])
      : (state.unlocks ?? [])
  }

  return createInitialState(persistedData)
}

export const handleUpdateSettings = (
  state: GameState,
  payload: Record<string, unknown>
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  return {
    ...state,
    settings: { ...state.settings, ...sanitizeSettingsPayload(payload) }
  }
}

export const handleSetMap = (
  state: GameState,
  payload: GameMap | null
): GameState => {
  if (payload) {
    logger.info('GameState', 'Map Generated')
  } else {
    logger.warn('GameState', 'Map generation failed, null fallback applied')
  }
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

const EFFECT_REVERTERS: Record<
  string,
  (band: BandState, value: unknown) => BandState
> = {
  harmony: (band: BandState, value: unknown) => ({
    ...band,
    harmony: clampBandHarmony((band.harmony || 0) - (value as number))
  }),
  guitar_difficulty: (band: BandState, value: unknown) => ({
    ...band,
    performance: {
      ...band.performance,
      guitarDifficulty: Math.max(
        0.1,
        (band.performance?.guitarDifficulty || 1) - (value as number)
      )
    }
  }),
  luck: (band: BandState, value: unknown) => ({
    ...band,
    luck: Math.max(0, ((band.luck as number) || 0) - (value as number))
  }),
  stamina_max: (band: BandState, value: unknown) => ({
    ...band,
    members: (band.members || []).map((m: BandMember) => ({
      ...m,
      staminaMax: Math.max(
        0,
        ((m.staminaMax as number) || 100) - (value as number)
      )
    }))
  }),
  style: (band: BandState, value: unknown) => ({
    ...band,
    style: Math.max(0, ((band.style as number) || 0) - (value as number))
  }),
  tour_success: (band: BandState, value: unknown) => ({
    ...band,
    tourSuccess: Math.max(
      0,
      ((band.tourSuccess as number) || 0) - (value as number)
    )
  }),
  gig_modifier: (band: BandState, value: unknown) => ({
    ...band,
    gigModifier: Math.max(
      0,
      ((band.gigModifier as number) || 0) - (value as number)
    )
  }),
  tempo: (band: BandState, value: unknown) => ({
    ...band,
    tempo: Math.max(0, ((band.tempo as number) || 0) - (value as number))
  }),
  practice_gain: (band: BandState, value: unknown) => ({
    ...band,
    practiceGain: Math.max(
      0,
      ((band.practiceGain as number) || 0) - (value as number)
    )
  }),
  crit: (band: BandState, value: unknown) => ({
    ...band,
    crit: Math.max(0, ((band.crit as number) || 0) - (value as number))
  }),
  affinity: (band: BandState, value: unknown) => ({
    ...band,
    affinity: Math.max(0, ((band.affinity as number) || 0) - (value as number))
  }),
  crowd_control: (band: BandState, value: unknown) => ({
    ...band,
    crowdControl: Math.max(
      0,
      ((band.crowdControl as number) || 0) - (value as number)
    )
  })
}

/**
 * Processes contraband effect expiry and reversion as a pure function.
 * @param {Object} band - The current band state
 * @returns {Object} Updated band state
 */
const processContrabandExpiry = (band: BandState): BandState => {
  const activeEffects = band.activeContrabandEffects || []
  const stillActive: unknown[] = []
  const expired: Record<string, unknown>[] = []

  for (let i = 0; i < activeEffects.length; i++) {
    const effect = activeEffects[i]
    if (typeof effect !== 'object' || effect === null) continue
    const effectObj = effect as Record<string, unknown>
    const updatedEffect = {
      ...effectObj,
      remainingDuration: (effectObj.remainingDuration as number) - 1
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
    if (!e) continue
    const effectType = e.effectType as string
    const reverter = EFFECT_REVERTERS[effectType]
    if (reverter) {
      nextBand = reverter(nextBand, e.value)
    } else {
      logger.warn(
        'SystemReducer',
        `No reverter defined for expired effect type: ${effectType}`,
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
        if (typeof item !== 'object' || item === null) continue
        const itemObj = item as Record<string, unknown>
        if (itemObj.instanceId === e.instanceId) {
          nextBand.stash[itemKey] = {
            ...itemObj,
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
  const rng =
    typeof payload?.rng === 'function'
      ? (payload.rng as () => number)
      : getSafeRandom
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

  const socialUnlockState: Pick<GameState, 'player' | 'band' | 'social'> = {
    player: nextPlayer,
    band: nextBand,
    social
  }

  // Check Social Unlocks
  const socialUnlocks = checkTraitUnlocks(socialUnlockState, {
    type: 'SOCIAL_UPDATE'
  })

  const traitResult = applyTraitUnlocks(
    { band: nextBand, toasts: state.toasts },
    socialUnlocks
  )

  // --- Contraband expiry ---
  const finalBandState = processContrabandExpiry(traitResult.band)
  // -------------------------

  const newTrend = generateDailyTrend(rng)

  let nextState: GameState = {
    ...state,
    player: nextPlayer,
    band: finalBandState,
    social: { ...social, trend: newTrend },
    eventCooldowns: [],
    toasts: traitResult.toasts
  }

  nextState = handleFailQuests(nextState)

  const pendingFlagsObj =
    typeof pendingFlags === 'object' && pendingFlags !== null
      ? (pendingFlags as Record<string, unknown>)
      : null
  if (pendingFlagsObj?.scandal) {
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
