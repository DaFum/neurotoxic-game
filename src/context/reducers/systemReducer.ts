import type {
  GameState,
  PlayerState,
  BandState,
  BandMember,
  GameEvent,
  EventOption,
  SocialState,
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

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const finiteNumberOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const finiteOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

const copySafePrimitiveObject = (
  value: unknown
): Record<string, string | number | boolean | null> | undefined => {
  if (!isPlainRecord(value)) return undefined
  const copied: Record<string, string | number | boolean | null> = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const entry = value[key]
    if (
      typeof entry === 'string' ||
      typeof entry === 'boolean' ||
      entry === null ||
      (typeof entry === 'number' && Number.isFinite(entry))
    ) {
      copied[key] = entry
    }
  }
  return Object.keys(copied).length > 0 ? copied : undefined
}

const MAX_SAFE_JSON_COPY_DEPTH = 12

const copySafeJsonValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_SAFE_JSON_COPY_DEPTH) return undefined

  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    value === null ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      const copied = copySafeJsonValue(item, depth + 1)
      return copied === undefined ? [] : [copied]
    })
  }
  if (!isPlainRecord(value)) return undefined

  const copied: Record<string, unknown> = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const entry = copySafeJsonValue(value[key], depth + 1)
    if (entry !== undefined) copied[key] = entry
  }
  return Object.keys(copied).length > 0 ? copied : undefined
}

const copySafeEffectPayload = (
  value: unknown
):
  | Record<string, string | number | boolean | null>
  | Array<Record<string, string | number | boolean | null>>
  | undefined => {
  if (Array.isArray(value)) {
    const effects = value.flatMap(effect => {
      const copied = copySafePrimitiveObject(effect)
      return copied ? [copied] : []
    })
    return effects.length > 0 ? effects : undefined
  }
  return copySafePrimitiveObject(value)
}

const sanitizeBandInventory = (value: unknown): BandState['inventory'] => {
  const sanitized: BandState['inventory'] = { ...DEFAULT_BAND_STATE.inventory }
  if (!isPlainRecord(value)) return sanitized

  const defaultInventory = DEFAULT_BAND_STATE.inventory
  for (const key of Object.keys(defaultInventory)) {
    const fallback = defaultInventory[key]
    const raw = value[key]

    if (typeof fallback === 'number') {
      const numeric =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string' && raw.trim().length > 0
            ? Number(raw)
            : Number.NaN
      sanitized[key] = Number.isFinite(numeric) ? numeric : fallback
      continue
    }

    if (typeof fallback === 'boolean') {
      sanitized[key] = typeof raw === 'boolean' ? raw : fallback
      continue
    }

    sanitized[key] = fallback
  }

  return sanitized
}

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
  const playerData = isPlainRecord(loadedPlayer)
    ? (loadedPlayer as Record<string, unknown>)
    : {}
  const vanData = isPlainRecord(playerData.van) ? playerData.van : {}
  const statsData = isPlainRecord(playerData.stats) ? playerData.stats : {}

  const rawPlayer: PlayerState = {
    ...DEFAULT_PLAYER_STATE,
    playerId:
      typeof playerData.playerId === 'string' || playerData.playerId === null
        ? playerData.playerId
        : DEFAULT_PLAYER_STATE.playerId,
    playerName:
      typeof playerData.playerName === 'string'
        ? playerData.playerName
        : DEFAULT_PLAYER_STATE.playerName,
    money: finiteNumberOr(playerData.money, DEFAULT_PLAYER_STATE.money),
    day: finiteNumberOr(playerData.day, DEFAULT_PLAYER_STATE.day),
    time: finiteNumberOr(playerData.time, DEFAULT_PLAYER_STATE.time),
    location: Object.hasOwn(playerData, 'location')
      ? typeof playerData.location === 'string' ||
        playerData.location === null ||
        playerData.location === undefined
        ? (playerData.location as PlayerState['location'])
        : DEFAULT_PLAYER_STATE.location
      : DEFAULT_PLAYER_STATE.location,
    currentNodeId:
      typeof playerData.currentNodeId === 'string'
        ? playerData.currentNodeId
        : DEFAULT_PLAYER_STATE.currentNodeId,
    lastGigNodeId:
      typeof playerData.lastGigNodeId === 'string' ||
      playerData.lastGigNodeId === null
        ? playerData.lastGigNodeId
        : DEFAULT_PLAYER_STATE.lastGigNodeId,
    tutorialStep: finiteNumberOr(
      playerData.tutorialStep,
      DEFAULT_PLAYER_STATE.tutorialStep
    ),
    score: finiteNumberOr(playerData.score, DEFAULT_PLAYER_STATE.score),
    fame: finiteNumberOr(playerData.fame, DEFAULT_PLAYER_STATE.fame),
    fameLevel: DEFAULT_PLAYER_STATE.fameLevel,
    eventsTriggeredToday: finiteNumberOr(
      playerData.eventsTriggeredToday,
      DEFAULT_PLAYER_STATE.eventsTriggeredToday
    ),
    totalTravels: finiteNumberOr(
      playerData.totalTravels,
      DEFAULT_PLAYER_STATE.totalTravels
    ),
    hqUpgrades: sanitizeStringArray(playerData.hqUpgrades),
    clinicVisits: finiteNumberOr(
      playerData.clinicVisits,
      DEFAULT_PLAYER_STATE.clinicVisits
    ),
    van: {
      fuel: finiteNumberOr(vanData.fuel, DEFAULT_PLAYER_STATE.van.fuel),
      condition: finiteNumberOr(
        vanData.condition,
        DEFAULT_PLAYER_STATE.van.condition
      ),
      upgrades: sanitizeStringArray(vanData.upgrades),
      breakdownChance: finiteNumberOr(
        vanData.breakdownChance,
        DEFAULT_PLAYER_STATE.van.breakdownChance
      )
    },
    passiveFollowers: finiteNumberOr(
      playerData.passiveFollowers,
      DEFAULT_PLAYER_STATE.passiveFollowers
    ),
    stats: {
      totalDistance: finiteNumberOr(
        statsData.totalDistance,
        DEFAULT_PLAYER_STATE.stats.totalDistance
      ),
      conflictsResolved: finiteNumberOr(
        statsData.conflictsResolved,
        DEFAULT_PLAYER_STATE.stats.conflictsResolved
      ),
      stageDives: finiteNumberOr(
        statsData.stageDives,
        DEFAULT_PLAYER_STATE.stats.stageDives
      ),
      consecutiveBadShows: finiteNumberOr(
        statsData.consecutiveBadShows,
        DEFAULT_PLAYER_STATE.stats.consecutiveBadShows
      ),
      proveYourselfMode:
        typeof statsData.proveYourselfMode === 'boolean'
          ? statsData.proveYourselfMode
          : DEFAULT_PLAYER_STATE.stats.proveYourselfMode
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
  const bandData = isPlainRecord(loadedBand)
    ? (loadedBand as Record<string, unknown>)
    : {}
  const rawBand: BandState = {
    ...DEFAULT_BAND_STATE,
    harmony: finiteNumberOr(bandData.harmony, DEFAULT_BAND_STATE.harmony),
    harmonyRegenTravel:
      typeof bandData.harmonyRegenTravel === 'boolean'
        ? bandData.harmonyRegenTravel
        : DEFAULT_BAND_STATE.harmonyRegenTravel,
    inventorySlots: finiteNumberOr(
      bandData.inventorySlots,
      DEFAULT_BAND_STATE.inventorySlots
    ),
    luck: finiteNumberOr(bandData.luck, DEFAULT_BAND_STATE.luck),
    performance: {
      ...DEFAULT_BAND_STATE.performance,
      ...(isPlainRecord(bandData.performance)
        ? {
            guitarDifficulty: finiteNumberOr(
              bandData.performance.guitarDifficulty,
              DEFAULT_BAND_STATE.performance.guitarDifficulty
            ),
            drumMultiplier: finiteNumberOr(
              bandData.performance.drumMultiplier,
              DEFAULT_BAND_STATE.performance.drumMultiplier
            ),
            crowdDecay: finiteNumberOr(
              bandData.performance.crowdDecay,
              DEFAULT_BAND_STATE.performance.crowdDecay
            )
          }
        : {})
    },
    inventory: sanitizeBandInventory(bandData.inventory),
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
            const effectObj = isPlainRecord(effect)
              ? (effect as Record<string, unknown>)
              : {}
            return {
              ...(copySafePrimitiveObject(effectObj) ?? {}),
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

  for (const key of [
    'style',
    'tourSuccess',
    'gigModifier',
    'tempo',
    'practiceGain',
    'crit',
    'affinity',
    'crowdControl'
  ]) {
    const value = finiteOptionalNumber(bandData[key])
    if (value !== undefined) rawBand[key] = value
  }

  // Validate Band Members
  const memberSource = Array.isArray(bandData.members)
    ? bandData.members
    : DEFAULT_BAND_STATE.members
  const validatedMembers: BandMember[] = memberSource.flatMap(
    (rawMember, i) => {
      if (!isPlainRecord(rawMember)) return []
      const m = rawMember
      const id =
        typeof m.id === 'string'
          ? m.id
          : typeof m.name === 'string'
            ? m.name.toLowerCase()
            : typeof m.id === 'number' ||
                typeof m.id === 'boolean' ||
                typeof m.id === 'bigint' ||
                typeof m.id === 'symbol'
              ? String(m.id)
              : `member-${i}`
      const name = typeof m.name === 'string' ? m.name : undefined
      const selfRelationshipKeys = new Set([id, id.toLowerCase()])
      if (name !== undefined) {
        selfRelationshipKeys.add(name)
        selfRelationshipKeys.add(name.toLowerCase())
      }
      const staminaMax = finiteOptionalNumber(m.staminaMax)
      const member: BandMember = {
        id,
        traits: normalizeTraitMap(m.traits),
        mood: clampMemberMood(finiteNumberOr(m.mood, 50)),
        stamina: clampMemberStamina(finiteNumberOr(m.stamina, 100), staminaMax),
        baseStats: isPlainRecord(m.baseStats)
          ? (Object.fromEntries(
              Object.entries(m.baseStats).filter(
                ([, value]) =>
                  typeof value === 'number' && Number.isFinite(value)
              )
            ) as Record<string, number>)
          : {},
        equipment: copySafePrimitiveObject(m.equipment) ?? {},
        relationships: isPlainRecord(m.relationships)
          ? Object.fromEntries(
              Object.entries(m.relationships).filter(([key, value]) => {
                const normalizedKey = key.toLowerCase()
                if (
                  selfRelationshipKeys.has(key) ||
                  selfRelationshipKeys.has(normalizedKey)
                ) {
                  return false
                }
                return typeof value === 'number' && Number.isFinite(value)
              }) as Array<[string, number]>
            )
          : {}
      }
      if (name !== undefined) member.name = name
      if (typeof m.role === 'string') member.role = m.role
      if (staminaMax !== undefined) member.staminaMax = staminaMax
      for (const key of [
        'skill',
        'charisma',
        'technical',
        'improv',
        'composition'
      ]) {
        const value = finiteOptionalNumber(m[key])
        if (value !== undefined) member[key] = value
      }
      return [member]
    }
  )

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

const sanitizeSetlist = (rawSetlist: unknown): GameState['setlist'] => {
  if (!Array.isArray(rawSetlist)) return []
  const sanitized: GameState['setlist'] = []
  for (const entry of rawSetlist) {
    if (typeof entry === 'string') {
      sanitized.push(entry as GameState['setlist'][number])
      continue
    }
    const copied = copySafePrimitiveObject(entry)
    if (copied) sanitized.push(copied as GameState['setlist'][number])
  }
  return sanitized
}

const sanitizeReputationByRegion = (
  value: unknown
): GameState['reputationByRegion'] => {
  if (!isPlainRecord(value)) return {}
  const sanitized: GameState['reputationByRegion'] = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const reputation = value[key]
    if (typeof reputation === 'number' && Number.isFinite(reputation)) {
      sanitized[key] = reputation
    }
  }
  return sanitized
}

const sanitizeSocial = (value: unknown): SocialState => {
  const sanitized: SocialState = {
    ...DEFAULT_SOCIAL_STATE,
    activeDeals: [...DEFAULT_SOCIAL_STATE.activeDeals],
    brandReputation: { ...DEFAULT_SOCIAL_STATE.brandReputation },
    influencers: { ...DEFAULT_SOCIAL_STATE.influencers }
  }
  if (!isPlainRecord(value)) return sanitized

  for (const key of [
    'instagram',
    'tiktok',
    'youtube',
    'newsletter',
    'viral',
    'controversyLevel',
    'loyalty',
    'zealotry',
    'reputationCooldown'
  ] as const) {
    const parsed = finiteOptionalNumber(value[key])
    if (parsed !== undefined) sanitized[key] = parsed
  }

  for (const key of [
    'lastGigDay',
    'lastGigDifficulty',
    'lastPirateBroadcastDay',
    'lastDarkWebLeakDay'
  ] as const) {
    const raw = value[key]
    if (raw === null) {
      sanitized[key] = null
      continue
    }
    const parsed = finiteOptionalNumber(raw)
    if (parsed !== undefined) sanitized[key] = parsed
  }

  if (typeof value.egoFocus === 'string' || value.egoFocus === null) {
    sanitized.egoFocus = value.egoFocus
  }
  if (typeof value.trend === 'string') {
    sanitized.trend = value.trend
  }

  if (Array.isArray(value.activeDeals)) {
    sanitized.activeDeals = value.activeDeals.flatMap(deal => {
      const copied = copySafePrimitiveObject(deal)
      if (
        !copied ||
        typeof copied.id !== 'string' ||
        typeof copied.remainingGigs !== 'number'
      ) {
        return []
      }
      return [{ id: copied.id, remainingGigs: copied.remainingGigs }]
    })
  }

  if (isPlainRecord(value.brandReputation)) {
    sanitized.brandReputation = {}
    for (const key in value.brandReputation) {
      if (!Object.hasOwn(value.brandReputation, key)) continue
      if (isForbiddenKey(key)) continue
      const reputation = value.brandReputation[key]
      if (typeof reputation === 'number' && Number.isFinite(reputation)) {
        sanitized.brandReputation[key] = reputation
      }
    }
  }

  if (isPlainRecord(value.influencers)) {
    sanitized.influencers = {}
    for (const key in value.influencers) {
      if (!Object.hasOwn(value.influencers, key)) continue
      if (isForbiddenKey(key)) continue
      const influencer = value.influencers[key]
      if (!isPlainRecord(influencer)) continue
      const { tier, trait, score } = influencer
      if (
        typeof tier !== 'string' ||
        typeof trait !== 'string' ||
        typeof score !== 'number' ||
        !Number.isFinite(score)
      ) {
        continue
      }
      sanitized.influencers[key] = { tier, trait, score }
    }
  }

  return sanitized
}

const sanitizeActiveEventOption = (value: unknown): EventOption | null => {
  if (!isPlainRecord(value)) return null

  const option: EventOption = {}
  for (const key of [
    'id',
    'text',
    'textKey',
    'label',
    'outcomeText',
    'description',
    'nextEventId'
  ]) {
    if (typeof value[key] === 'string') option[key] = value[key]
  }
  for (const key of ['effects', 'effect']) {
    const copied = copySafeEffectPayload(value[key])
    if (copied !== undefined) option[key] = copied
  }
  const skillCheck = copySafeJsonValue(value.skillCheck)
  if (skillCheck !== undefined) option.skillCheck = skillCheck
  if (Array.isArray(value.flags)) {
    option.flags = sanitizeStringArray(value.flags)
  }
  if (typeof value.disabled === 'boolean') {
    option.disabled = value.disabled
  }

  return Object.keys(option).length > 0 ? option : null
}

const sanitizeActiveEvent = (value: unknown): GameState['activeEvent'] => {
  if (!isPlainRecord(value) || typeof value.id !== 'string') return null

  const event: GameEvent = { id: value.id }
  for (const key of [
    'category',
    'title',
    'titleKey',
    'description',
    'descriptionKey',
    'trigger'
  ]) {
    if (typeof value[key] === 'string') event[key] = value[key]
  }

  const context = copySafePrimitiveObject(value.context)
  if (context) event.context = context

  const effects = copySafeEffectPayload(value.effects)
  if (effects !== undefined) event.effects = effects as GameEvent['effects']

  if (Array.isArray(value.options)) {
    const options = value.options.flatMap(option => {
      const sanitized = sanitizeActiveEventOption(option)
      return sanitized ? [sanitized] : []
    })
    if (options.length > 0) event.options = options
  }

  return event
}

const sanitizeNpcs = (value: unknown): GameState['npcs'] => {
  if (!isPlainRecord(value)) return {}
  const sanitized: GameState['npcs'] = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const npc = value[key]
    if (!isPlainRecord(npc) || typeof npc.id !== 'string') continue
    if (isForbiddenKey(npc.id)) continue
    sanitized[key] = {
      id: npc.id,
      ...(typeof npc.name === 'string' ? { name: npc.name } : {}),
      ...(typeof npc.role === 'string' ? { role: npc.role } : {}),
      ...(Array.isArray(npc.traits)
        ? { traits: sanitizeStringArray(npc.traits) }
        : {}),
      ...(typeof npc.relationship === 'number' &&
      Number.isFinite(npc.relationship)
        ? { relationship: npc.relationship }
        : {})
    }
  }
  return sanitized
}

const sanitizeGigModifiers = (value: unknown): GameState['gigModifiers'] => {
  const sanitized = { ...DEFAULT_GIG_MODIFIERS }
  if (!isPlainRecord(value)) return sanitized
  for (const key of Object.keys(DEFAULT_GIG_MODIFIERS)) {
    if (typeof value[key] === 'boolean') {
      sanitized[key as keyof typeof DEFAULT_GIG_MODIFIERS] = value[
        key
      ] as boolean
    }
  }
  if (typeof value.energy === 'boolean') {
    sanitized.catering = value.energy
  }
  return sanitized
}

const sanitizeVenue = (value: unknown): GameState['currentGig'] => {
  if (!isPlainRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null
  }
  const venue: NonNullable<GameState['currentGig']> = {
    id: value.id,
    name: value.name
  }
  for (const key of ['city', 'region']) {
    if (typeof value[key] === 'string') venue[key] = value[key]
  }
  for (const key of ['capacity', 'difficulty', 'diff', 'reputation']) {
    const parsed = finiteOptionalNumber(value[key])
    if (parsed !== undefined) venue[key] = parsed
  }
  return venue
}

const sanitizeLastGigStats = (value: unknown): GameState['lastGigStats'] => {
  if (!isPlainRecord(value)) return null
  const sanitized: NonNullable<GameState['lastGigStats']> = {}
  for (const key of [
    'score',
    'misses',
    'accuracy',
    'combo',
    'health',
    'overload'
  ]) {
    const parsed = finiteOptionalNumber(value[key])
    if (parsed !== undefined) sanitized[key] = parsed
  }
  return Object.keys(sanitized).length > 0 ? sanitized : null
}

const sanitizeActiveQuests = (value: unknown): GameState['activeQuests'] => {
  if (!Array.isArray(value)) return []
  return value.flatMap(quest => {
    if (!isPlainRecord(quest) || typeof quest.id !== 'string') return []
    const sanitized: GameState['activeQuests'][number] = { id: quest.id }
    for (const key of ['label', 'rewardType', 'rewardFlag']) {
      if (typeof quest[key] === 'string') sanitized[key] = quest[key]
    }
    for (const key of ['deadline', 'progress', 'required']) {
      if (quest[key] === null && key === 'deadline') {
        sanitized.deadline = null
        continue
      }
      const parsed = finiteOptionalNumber(quest[key])
      if (parsed !== undefined) sanitized[key] = parsed
    }
    const rewardData = copySafePrimitiveObject(quest.rewardData)
    if (rewardData) sanitized.rewardData = rewardData
    const failurePenalty = copySafeJsonValue(quest.failurePenalty)
    if (failurePenalty) sanitized.failurePenalty = failurePenalty
    return [sanitized]
  })
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
  const mergedSocial = sanitizeSocial(loadedState.social)

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
    setlist: sanitizeSetlist(loadedState.setlist),
    activeStoryFlags: sanitizeStringArray(loadedState.activeStoryFlags),
    pendingEvents: sanitizeStringArray(loadedState.pendingEvents),
    eventCooldowns: sanitizeStringArray(loadedState.eventCooldowns),
    activeEvent: sanitizeActiveEvent(loadedState.activeEvent),
    toasts: sanitizeToasts(loadedState.toasts),
    reputationByRegion: sanitizeReputationByRegion(
      loadedState.reputationByRegion
    ),
    venueBlacklist: sanitizeStringArray(loadedState.venueBlacklist),
    activeQuests: sanitizeActiveQuests(loadedState.activeQuests),
    npcs: sanitizeNpcs(loadedState.npcs),
    gigModifiers: sanitizeGigModifiers(loadedState.gigModifiers),
    currentScene: GAME_PHASES.OVERWORLD,
    currentGig: sanitizeVenue(loadedState.currentGig),
    lastGigStats: sanitizeLastGigStats(loadedState.lastGigStats),
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
      ? sanitizeStringArray(loadedState.unlocks)
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
