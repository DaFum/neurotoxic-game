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
  GamePhase,
  GameSettings,
  RawGameSettings,
  ResetStatePayload,
  MapNodeType
} from '../../types'
import { logger } from '../../utils/logger'
import {
  clampBandHarmony,
  clampPlayerMoney,
  clampPlayerFame,
  clampMemberStamina,
  clampMemberMood,
  calculateFameLevel,
  isForbiddenKey,
  clampVanFuel,
  clampRelationship,
  isPlainObject,
  isEmptyObject
} from '../../utils/gameStateUtils'
import { calculateDailyUpdates } from '../../utils/simulationUtils'
import {
  DEFAULT_MERCH_PRICES,
  EXPENSE_CONSTANTS
} from '../../utils/economyEngine'
import { generateDailyTrend } from '../../utils/socialEngine'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks, normalizeTraitMap } from '../../utils/traitUtils'
import { normalizeVenueId } from '../../utils/mapUtils'
import {
  getCityKeyFromVenueId,
  deriveCityTraits
} from '../../utils/mapGenerator'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import {
  createInitialState,
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE
} from '../initialState'
import {
  DEFAULT_MINIGAME_STATE,
  GAME_PHASES,
  MINIGAME_TYPES,
  PRACTICE_RETURN_SCENES
} from '../gameConstants'
import type { MinigameType } from '../../types/game'
import { QuestLifecycle } from '../../domain/questLifecycle'
import { getSafeRandom } from '../../utils/crypto'
import { ALLOWED_TOAST_TYPES, sanitizeLoadedToast } from './toastSanitizers'

const ALLOWED_MINIGAME_TYPES = new Set<MinigameType>(
  Object.values(MINIGAME_TYPES)
)

const isMinigameType = (value: unknown): value is MinigameType =>
  typeof value === 'string' && ALLOWED_MINIGAME_TYPES.has(value as MinigameType)

const ALLOWED_MAP_NODE_TYPES = new Set<MapNodeType>([
  'START',
  'GIG',
  'SPECIAL',
  'REST_STOP',
  'FESTIVAL',
  'FINALE',
  'CITY',
  'REST',
  'supplyStop'
])

const isMapNodeType = (value: unknown): value is MapNodeType =>
  typeof value === 'string' && ALLOWED_MAP_NODE_TYPES.has(value as MapNodeType)

const inferLoadedMapNodeLayer = (
  nodeRecord: Record<string, unknown>,
  id: string
): number => {
  if (
    typeof nodeRecord.layer === 'number' &&
    Number.isFinite(nodeRecord.layer)
  ) {
    return nodeRecord.layer
  }

  const layerMatch = /^node_(\d+)_/.exec(id)
  const rawLayer = layerMatch?.[1]
  if (rawLayer !== undefined) {
    const parsedLayer = Number(rawLayer)
    if (Number.isFinite(parsedLayer)) return parsedLayer
  }

  return 0
}

const inferLoadedMapNodeType = (
  nodeRecord: Record<string, unknown>,
  id: string
): MapNodeType => {
  if (isMapNodeType(nodeRecord.type)) return nodeRecord.type
  if (id === 'start' || id === 'node_0_0') return 'START'
  if (
    typeof nodeRecord.venueId === 'string' ||
    typeof nodeRecord.venue === 'string' ||
    isPlainObject(nodeRecord.venue)
  ) {
    return 'GIG'
  }
  return 'SPECIAL'
}

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
  if (!isPlainObject(value)) return undefined
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
  return !isEmptyObject(copied) ? copied : undefined
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
  if (!isPlainObject(value)) return undefined

  const copied: Record<string, unknown> = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const entry = copySafeJsonValue(value[key], depth + 1)
    if (entry !== undefined) copied[key] = entry
  }
  return !isEmptyObject(copied) ? copied : undefined
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
  if (!isPlainObject(value)) return sanitized

  const defaultInventory = DEFAULT_BAND_STATE.inventory
  for (const key in defaultInventory) {
    if (!Object.hasOwn(defaultInventory, key)) continue
    const fallback = defaultInventory[key as keyof typeof defaultInventory]
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
      if (!isEmptyObject(copiedEntry)) {
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
  return !isEmptyObject(copied) ? copied : null
}

/**
 * Validates a purchase effect object from a loaded save.
 * Validates required fields per effect type and ensures finite numeric values.
 * Returns safe-copied primitives for the effect if valid, null otherwise.
 */
const validateLoadedEffect = (
  effect: unknown
): Record<string, unknown> | null => {
  if (!isPlainObject(effect)) return null

  const effectObj = effect as Record<string, unknown>
  const typeStr = typeof effectObj.type === 'string' ? effectObj.type : ''

  if (typeStr === 'inventory_add') {
    // Must have string item and finite non-negative numeric value
    if (typeof effectObj.item !== 'string') return null
    const value =
      typeof effectObj.value === 'number' ? effectObj.value : undefined
    if (value === undefined || !Number.isFinite(value) || value < 0) return null
  } else if (typeStr === 'inventory_set') {
    // Must have string item
    if (typeof effectObj.item !== 'string') return null
  } else if (typeStr === 'unlock_upgrade' || typeStr === 'unlock_hq') {
    // Must have string id
    if (typeof effectObj.id !== 'string') return null
  } else if (typeStr === 'stat_modifier' || typeStr === 'passive') {
    // Must have string key
    if (typeof effectObj.key !== 'string') return null
  } else {
    // Unknown effect type — reject to avoid corrupted state
    return null
  }

  // Copy safe primitives and return
  return copySafeFlatObject(effectObj)
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
    const sanitizedNode: GameMap['nodes'][string] = {
      id,
      x,
      y,
      layer: inferLoadedMapNodeLayer(nodeRecord, id),
      type: inferLoadedMapNodeType(nodeRecord, id)
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
    if (Array.isArray(nodeRecord.shopInventory)) {
      const items: import('../../types/components').PurchaseItem[] = []
      // Whitelist of PurchaseItem fields preserved on load. Anything else from
      // untrusted save data is dropped rather than coerced into the item shape.
      const STRING_KEYS = new Set([
        'name',
        'currency',
        'category',
        'description',
        'img',
        'imgPrompt',
        'rarity'
      ])
      const NUMBER_KEYS = new Set(['maxStacks'])
      const BOOLEAN_KEYS = new Set([
        'oneTime',
        'requiresReputation',
        'stackable'
      ])
      for (let i = 0; i < nodeRecord.shopInventory.length; i++) {
        const raw = nodeRecord.shopInventory[i]
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
        const itemRecord = raw as Record<string, unknown>
        const sanitizedItem: import('../../types/components').PurchaseItem = {}
        for (const itemKey in itemRecord) {
          if (!Object.hasOwn(itemRecord, itemKey)) continue
          if (isForbiddenKey(itemKey)) continue
          const v = itemRecord[itemKey]
          if (itemKey === 'id') {
            if (typeof v === 'string' || typeof v === 'number') {
              sanitizedItem.id = v
            }
          } else if (itemKey === 'cost' || itemKey === 'price') {
            if (typeof v === 'number' && Number.isFinite(v)) {
              ;(sanitizedItem as Record<string, unknown>)[itemKey] = Math.max(
                0,
                v
              )
            }
          } else if (STRING_KEYS.has(itemKey)) {
            if (typeof v === 'string') {
              ;(sanitizedItem as Record<string, unknown>)[itemKey] = v
            }
          } else if (NUMBER_KEYS.has(itemKey)) {
            if (typeof v === 'number' && Number.isFinite(v)) {
              ;(sanitizedItem as Record<string, unknown>)[itemKey] = v
            }
          } else if (BOOLEAN_KEYS.has(itemKey)) {
            if (typeof v === 'boolean') {
              ;(sanitizedItem as Record<string, unknown>)[itemKey] = v
            }
          } else if (itemKey === 'effect') {
            const validEffect = validateLoadedEffect(v)
            if (validEffect) sanitizedItem.effect = validEffect as never
          } else if (itemKey === 'effects' && Array.isArray(v)) {
            const flatEffects: Array<Record<string, unknown>> = []
            for (let j = 0; j < v.length; j++) {
              const validEffect = validateLoadedEffect(v[j])
              if (validEffect) flatEffects.push(validEffect)
            }
            if (flatEffects.length > 0) {
              sanitizedItem.effects = flatEffects as never
            }
          }
        }
        if (!isEmptyObject(sanitizedItem as Record<string, unknown>)) {
          items.push(sanitizedItem)
        }
      }
      sanitizedNode.shopInventory = items
    }

    for (const key in nodeRecord) {
      if (!Object.hasOwn(nodeRecord, key)) continue
      if (
        isForbiddenKey(key) ||
        key === 'id' ||
        key === 'x' ||
        key === 'y' ||
        key === 'layer' ||
        key === 'type' ||
        key === 'venueId' ||
        key === 'neighbors' ||
        key === 'shopInventory'
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

  if (
    mapRecord.cityStates &&
    typeof mapRecord.cityStates === 'object' &&
    !Array.isArray(mapRecord.cityStates)
  ) {
    const cityStatesRecord = mapRecord.cityStates as Record<string, unknown>
    const sanitizedCityStates: Record<
      string,
      import('../../types/game').CityTraitState
    > = {}

    for (const city in cityStatesRecord) {
      if (!Object.hasOwn(cityStatesRecord, city)) continue
      if (isForbiddenKey(city)) continue

      const cityTrait = cityStatesRecord[city]
      if (
        cityTrait &&
        typeof cityTrait === 'object' &&
        !Array.isArray(cityTrait)
      ) {
        const cityTraitRecord = cityTrait as Record<string, unknown>
        if (
          typeof cityTraitRecord.genreBias === 'string' &&
          Number.isFinite(cityTraitRecord.attentionSpan) &&
          typeof cityTraitRecord.barSpendingProfile === 'string'
        ) {
          sanitizedCityStates[city] = {
            genreBias: cityTraitRecord.genreBias,
            attentionSpan: cityTraitRecord.attentionSpan as number,
            barSpendingProfile: cityTraitRecord.barSpendingProfile
          }
        }
      }
    }

    if (!isEmptyObject(sanitizedCityStates)) {
      sanitizedMap.cityStates = sanitizedCityStates
    }
  }

  // Backfill cityStates for saves that predate the city-intel feature so the
  // tooltip is not silently empty on existing tours. Traits derive from a
  // stable hash of the city key, so each city stays consistent across loads.
  const backfilledCityStates: Record<
    string,
    import('../../types/game').CityTraitState
  > = sanitizedMap.cityStates ?? {}
  let cityStatesGrew = false
  for (const nodeId in sanitizedNodes) {
    if (!Object.hasOwn(sanitizedNodes, nodeId)) continue
    const node = sanitizedNodes[nodeId]
    const venueId = normalizeVenueId(node?.venueId ?? node?.venue)
    if (!venueId) continue
    const cityKey = getCityKeyFromVenueId(venueId)
    if (!cityKey) continue
    if (!Object.hasOwn(backfilledCityStates, cityKey)) {
      backfilledCityStates[cityKey] = deriveCityTraits(cityKey)
      cityStatesGrew = true
    }
  }
  if (cityStatesGrew) {
    sanitizedMap.cityStates = backfilledCityStates
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
  const playerData = isPlainObject(loadedPlayer)
    ? (loadedPlayer as Record<string, unknown>)
    : {}
  const vanData = isPlainObject(playerData.van) ? playerData.van : {}
  const statsData = isPlainObject(playerData.stats) ? playerData.stats : {}

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
      fuel: finiteNumberOr(vanData.fuel, EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL),
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
      fuel: clampVanFuel(rawPlayer.van.fuel)
    }
  }
}

const sanitizeBand = (loadedBand: unknown): BandState => {
  const bandData = isPlainObject(loadedBand)
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
      ...(isPlainObject(bandData.performance)
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
            const effectObj = isPlainObject(effect)
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

  if (
    bandData.merchPrices &&
    typeof bandData.merchPrices === 'object' &&
    !Array.isArray(bandData.merchPrices)
  ) {
    const raw = bandData.merchPrices as Record<string, unknown>
    const sanitized: Record<string, number> = {}
    for (const k of Object.keys(DEFAULT_MERCH_PRICES)) {
      if (!Object.hasOwn(raw, k)) continue
      const v = raw[k]
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        sanitized[k] = v
      }
    }
    rawBand.merchPrices = sanitized
  }
  // Validate Band Members
  const memberSource = Array.isArray(bandData.members)
    ? bandData.members
    : DEFAULT_BAND_STATE.members
  const validatedMembers: BandMember[] = memberSource.flatMap(
    (rawMember, i) => {
      if (!isPlainObject(rawMember)) return []
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
        baseStats: (() => {
          const stats = m.baseStats
          if (!isPlainObject(stats)) return {}
          const result: Record<string, number> = {}
          for (const key in stats) {
            if (!Object.hasOwn(stats, key)) continue
            const value = stats[key]
            if (typeof value === 'number' && Number.isFinite(value)) {
              result[key] = value
            }
          }
          return result
        })(),
        equipment: copySafePrimitiveObject(m.equipment) ?? {},
        relationships: isPlainObject(m.relationships)
          ? Object.fromEntries(
              (
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
              ).map(([key, value]) => [key, clampRelationship(value)])
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
      ] as const) {
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
    nextMinigame.type = isMinigameType(minigameObj.type)
      ? minigameObj.type
      : null
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
  if (!isPlainObject(value)) return {}
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
  if (!isPlainObject(value)) return sanitized

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

  if (isPlainObject(value.brandReputation)) {
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

  if (isPlainObject(value.influencers)) {
    sanitized.influencers = {}
    for (const key in value.influencers) {
      if (!Object.hasOwn(value.influencers, key)) continue
      if (isForbiddenKey(key)) continue
      const influencer = value.influencers[key]
      if (!isPlainObject(influencer)) continue
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
  if (!isPlainObject(value)) return null

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

  return !isEmptyObject(option) ? option : null
}

const sanitizeActiveEvent = (value: unknown): GameState['activeEvent'] => {
  if (!isPlainObject(value) || typeof value.id !== 'string') return null

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
  if (!isPlainObject(value)) return {}
  const sanitized: GameState['npcs'] = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const npc = value[key]
    if (!isPlainObject(npc) || typeof npc.id !== 'string') continue
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
        ? { relationship: clampRelationship(npc.relationship) }
        : {})
    }
  }
  return sanitized
}

const sanitizeGigModifiers = (value: unknown): GameState['gigModifiers'] => {
  const sanitized = { ...DEFAULT_GIG_MODIFIERS }
  if (!isPlainObject(value)) return sanitized
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
  if (!isPlainObject(value)) return null
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
  if (typeof value.isPractice === 'boolean') {
    venue.isPractice = value.isPractice
  }
  if (
    typeof value.sourceScene === 'string' &&
    PRACTICE_RETURN_SCENES.has(value.sourceScene as GamePhase)
  ) {
    venue.sourceScene = value.sourceScene as GamePhase
  }
  return venue
}

const sanitizeLastGigStats = (value: unknown): GameState['lastGigStats'] => {
  if (!isPlainObject(value)) return null
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
  return !isEmptyObject(sanitized) ? sanitized : null
}

const sanitizeActiveQuests = (value: unknown): GameState['activeQuests'] => {
  if (!Array.isArray(value)) return []
  return value.flatMap(quest => {
    if (!isPlainObject(quest) || typeof quest.id !== 'string') return []
    const sanitized: GameState['activeQuests'][number] = { id: quest.id }
    for (const key of ['label', 'description', 'rewardType', 'rewardFlag']) {
      if (typeof quest[key] === 'string') sanitized[key] = quest[key]
    }
    for (const key of ['deadline', 'progress', 'required', 'moneyReward']) {
      if (quest[key] === null && key === 'deadline') {
        sanitized.deadline = null
        continue
      }
      const parsed = finiteOptionalNumber(quest[key])
      if (parsed !== undefined) sanitized[key] = parsed
    }
    const rewardData = copySafePrimitiveObject(quest.rewardData)
    if (rewardData !== undefined) sanitized.rewardData = rewardData
    const failurePenalty = copySafeJsonValue(quest.failurePenalty)
    if (isPlainObject(failurePenalty)) sanitized.failurePenalty = failurePenalty
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
      : (state.unlocks ?? []),
    completedMilestones: Array.isArray(loadedState.completedMilestones)
      ? sanitizeStringArray(loadedState.completedMilestones)
      : (state.completedMilestones ?? [])
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
    logger.info('GameState', 'Map generation null fallback applied')
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
    harmony: clampBandHarmony((band.harmony ?? 1) - (value as number))
  }),
  guitar_difficulty: (band: BandState, value: unknown) => ({
    ...band,
    performance: {
      ...band.performance,
      guitarDifficulty: Math.max(
        0.1,
        (band.performance?.guitarDifficulty ?? 1) - (value as number)
      )
    }
  }),
  luck: (band: BandState, value: unknown) => ({
    ...band,
    luck: Math.max(0, ((band.luck as number) ?? 0) - (value as number))
  }),
  stamina_max: (band: BandState, value: unknown) => ({
    ...band,
    members: (band.members || []).map((m: BandMember) => ({
      ...m,
      staminaMax: Math.max(
        0,
        ((m.staminaMax as number) ?? 100) - (value as number)
      )
    }))
  }),
  style: (band: BandState, value: unknown) => ({
    ...band,
    style: Math.max(0, ((band.style as number) ?? 0) - (value as number))
  }),
  tour_success: (band: BandState, value: unknown) => ({
    ...band,
    tourSuccess: Math.max(
      0,
      ((band.tourSuccess as number) ?? 0) - (value as number)
    )
  }),
  gig_modifier: (band: BandState, value: unknown) => ({
    ...band,
    gigModifier: Math.max(
      0,
      ((band.gigModifier as number) ?? 0) - (value as number)
    )
  }),
  tempo: (band: BandState, value: unknown) => ({
    ...band,
    tempo: Math.max(0, ((band.tempo as number) ?? 0) - (value as number))
  }),
  practice_gain: (band: BandState, value: unknown) => ({
    ...band,
    practiceGain: Math.max(
      0,
      ((band.practiceGain as number) ?? 0) - (value as number)
    )
  }),
  crit: (band: BandState, value: unknown) => ({
    ...band,
    crit: Math.max(0, ((band.crit as number) ?? 0) - (value as number))
  }),
  affinity: (band: BandState, value: unknown) => ({
    ...band,
    affinity: Math.max(0, ((band.affinity as number) ?? 0) - (value as number))
  }),
  crowd_control: (band: BandState, value: unknown) => ({
    ...band,
    crowdControl: Math.max(
      0,
      ((band.crowdControl as number) ?? 0) - (value as number)
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
        if (e.instanceId != null && itemObj.instanceId === e.instanceId) {
          nextBand.stash[itemKey] = {
            ...itemObj,
            stacks: typeof itemObj.stacks === 'number' ? itemObj.stacks : 1,
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
  payload?: { rng?: () => number }
): GameState => {
  const rng = typeof payload?.rng === 'function' ? payload.rng : getSafeRandom
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

  nextState = QuestLifecycle.checkDeadlines(nextState)

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

/**
 * Handles setting the pendingBandHQOpen flag
 * @param {Object} state - Current state
 * @param {boolean} isOpen - new flag value
 * @returns {Object} Updated state
 */
export const handleSetPendingBandHQOpen = (
  state: GameState,
  isOpen: boolean
): GameState => {
  if (state.pendingBandHQOpen === isOpen) return state
  return { ...state, pendingBandHQOpen: isOpen }
}

export const handleSetPendingSupplyStopInventory = (
  state: GameState,
  inventory: GameState['pendingSupplyStopInventory']
): GameState => {
  const nextInventory = Array.isArray(inventory) ? inventory : null
  if (state.pendingSupplyStopInventory === nextInventory) return state

  return {
    ...state,
    pendingSupplyStopInventory: nextInventory
  }
}
