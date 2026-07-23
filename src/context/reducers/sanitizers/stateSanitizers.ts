import {
  getCityKeyFromVenueId,
  deriveCityTraits
} from '../../../utils/mapGenerator'
import { CONTRABAND_BY_ID } from '../../../data/contraband'
import { DEFAULT_MERCH_PRICES } from '../../../utils/economy'
import { BRAND_DEALS_BY_ID } from '../../../data/brandDeals'
import { PRACTICE_RETURN_SCENES } from '../../gameConstants'
import { getQuestDefinition } from '../../../data/questRegistry'
import { normalizeVenueId } from '../../../utils/mapUtils'
import { DEFAULT_MINIGAME_STATE } from '../../gameConstants'
import { normalizeTraitMap } from '../../../utils/traitUtils'
import { clampMemberMood } from '../../../utils/gameState'
import { EXPENSE_CONSTANTS } from '../../../utils/economy'
import {
  DEFAULT_GIG_MODIFIERS,
  DEFAULT_PLAYER_STATE,
  DEFAULT_BAND_STATE,
  DEFAULT_SOCIAL_STATE,
  cloneDefaultInfluencers
} from '../../initialState'
import {
  isLooseRecord,
  isFiniteNumber,
  isForbiddenKey,
  isEmptyObject,
  copySafePrimitiveObject,
  sanitizeStringArray,
  finiteNumberOr,
  clampNonNegative,
  clampVanFuel,
  clampControversyLevel,
  clampLoyalty,
  clampZealotry,
  clampRelationship,
  calculateFameLevel,
  clampPlayerFame,
  clampMemberStamina,
  clampPlayerMoney,
  clampBandHarmony,
  clampBandStress,
  wrapClockHour
} from '../../../utils/gameState'
import { MINIGAME_TYPES } from '../../gameConstants'
import type { MinigameType } from '../../../types/game'
import { ALLOWED_TOAST_TYPES, sanitizeLoadedToast } from '../toastSanitizers'
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
  MapNodeType
} from '../../../types'

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
  'SUPPLY_STOP'
])

const isMapNodeType = (value: unknown): value is MapNodeType =>
  typeof value === 'string' && ALLOWED_MAP_NODE_TYPES.has(value as MapNodeType)

const inferLoadedMapNodeLayer = (
  nodeRecord: Record<string, unknown>,
  id: string
): number => {
  if (
    typeof nodeRecord.layer === 'number' &&
    isFiniteNumber(nodeRecord.layer)
  ) {
    return nodeRecord.layer
  }

  const boundedId = typeof id === 'string' ? id.slice(0, 50) : ''
  const layerMatch = /^node_(\d+)_/.exec(boundedId)
  const rawLayer = layerMatch?.[1]
  if (rawLayer !== undefined) {
    const parsedLayer = Number(rawLayer)
    if (isFiniteNumber(parsedLayer)) return parsedLayer
  }

  return 0
}

const inferLoadedMapNodeType = (
  nodeRecord: Record<string, unknown>,
  id: string
): MapNodeType => {
  // Legacy saves used the camelCase variant before the node-type naming was
  // unified to SCREAMING_SNAKE_CASE.
  if (nodeRecord.type === 'supplyStop') return 'SUPPLY_STOP'
  if (isMapNodeType(nodeRecord.type)) return nodeRecord.type
  if (id === 'start' || id === 'node_0_0') return 'START'
  if (
    typeof nodeRecord.venueId === 'string' ||
    typeof nodeRecord.venue === 'string' ||
    isLooseRecord(nodeRecord.venue)
  ) {
    return 'GIG'
  }
  return 'SPECIAL'
}

const finiteOptionalNumber = (value: unknown): number | undefined =>
  isFiniteNumber(value) ? value : undefined

const MAX_SAFE_JSON_COPY_DEPTH = 12

const copySafeJsonValue = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_SAFE_JSON_COPY_DEPTH) return undefined

  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    value === null ||
    isFiniteNumber(value)
  ) {
    return value
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => {
      const copied = copySafeJsonValue(item, depth + 1)
      return copied === undefined ? [] : [copied]
    })
  }
  if (!isLooseRecord(value)) return undefined

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

/**
 * Builds a sanitized stash entry from raw save data and its canonical
 * contraband definition. Strips forbidden keys, spreads the canonical
 * definition last so save data cannot override definition fields, clamps
 * `stacks` (capping non-stackable items at 1), and derives `remainingDuration`.
 * Shared by both the array and object stash-migration branches so a security
 * fix cannot land in one branch and miss the other.
 *
 * @param itemObj - Raw per-instance stash entry from the save.
 * @param baseItem - Canonical contraband definition for this id.
 * @param id - Resolved item id to stamp onto the entry.
 * @returns The sanitized stash entry.
 */
const sanitizeStashItem = (
  itemObj: Record<string, unknown>,
  baseItem: NonNullable<ReturnType<typeof CONTRABAND_BY_ID.get>>,
  id: string
): Record<string, unknown> => {
  // Spread the canonical definition last so save data cannot override
  // definition fields (value, effectType, duration, type, maxStacks);
  // per-instance runtime fields (instanceId, applied, stacks) survive.
  const safeItemObj: Record<string, unknown> = {}
  for (const k in itemObj) {
    if (Object.hasOwn(itemObj, k) && !isForbiddenKey(k)) {
      safeItemObj[k] = itemObj[k]
    }
  }
  const copy = { ...safeItemObj, ...baseItem } as Record<string, unknown>
  copy.id = id
  if (Object.hasOwn(itemObj, 'stacks')) {
    copy.stacks =
      Number.isInteger(itemObj.stacks) && (itemObj.stacks as number) > 0
        ? itemObj.stacks
        : 1
  }
  // Non-stackable definitions can hold at most one (legacy saves from before
  // a stackable→false change). Cap so confiscation/revert and UI never act on
  // a phantom stack count.
  if (baseItem.stackable === false && (copy.stacks as number) > 1) {
    copy.stacks = 1
  }
  if (
    Object.hasOwn(itemObj, 'remainingDuration') &&
    Number.isFinite(itemObj.remainingDuration as number)
  ) {
    copy.remainingDuration = itemObj.remainingDuration as number | null
  } else {
    copy.remainingDuration =
      typeof copy.duration === 'number' ? copy.duration : null
  }
  return copy
}

/**
 * Sanitizes untrusted inventory data into a valid band inventory structure.
 *
 * @remarks
 * Ensures item quantities are non-negative and properly mapped from the raw payload,
 * validating against allowed items.
 *
 * @param value - The raw untrusted payload for the band inventory
 * @returns A fully sanitized and valid inventory object
 */
export const sanitizeBandInventory = (
  value: unknown
): BandState['inventory'] => {
  const sanitized: BandState['inventory'] = { ...DEFAULT_BAND_STATE.inventory }
  if (!isLooseRecord(value)) return sanitized

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
      isFiniteNumber(entry) ||
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
          isFiniteNumber(entryValue) ||
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
      isFiniteNumber(entry) ||
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
  if (!isLooseRecord(effect)) return null

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

export const normalizeLoadedGameMap = (gameMap: unknown): GameMap | null => {
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
    finiteNumberOr(value, 0)
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
      const items: import('../../../types/components').PurchaseItem[] = []
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
        const sanitizedItem: import('../../../types/components').PurchaseItem =
          {}
        for (const itemKey in itemRecord) {
          if (!Object.hasOwn(itemRecord, itemKey)) continue
          if (isForbiddenKey(itemKey)) continue
          const v = itemRecord[itemKey]
          if (itemKey === 'id') {
            if (typeof v === 'string' || typeof v === 'number') {
              sanitizedItem.id = v
            }
          } else if (itemKey === 'cost' || itemKey === 'price') {
            if (isFiniteNumber(v)) {
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
            if (isFiniteNumber(v)) {
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
        isFiniteNumber(value) ||
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
      import('../../../types/game').CityTraitState
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
    import('../../../types/game').CityTraitState
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

/**
 * Sanitizes an untrusted player payload into a valid player state object.
 *
 * @remarks
 * Normalizes user details like name, cash balance, and limits values to valid bounds
 * to prevent corrupted or tampered values.
 *
 * @param loadedPlayer - The raw untrusted player state payload
 * @returns A safe, sanitized player state object
 */
export const sanitizePlayer = (loadedPlayer: unknown): PlayerState => {
  const playerData = isLooseRecord(loadedPlayer)
    ? Object.assign(Object.create(null), loadedPlayer)
    : {}
  const vanData = isLooseRecord(playerData.van) ? playerData.van : {}
  const statsData = isLooseRecord(playerData.stats) ? playerData.stats : {}

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
    location:
      typeof playerData?.location === 'string'
        ? playerData.location
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
      // Stats feed >= milestone/unlock checks; clamp corrupted negative
      // values from stale saves to keep eligibility evaluation sound.
      totalDistance: clampNonNegative(
        finiteNumberOr(
          statsData.totalDistance,
          DEFAULT_PLAYER_STATE.stats.totalDistance
        )
      ),
      conflictsResolved: clampNonNegative(
        finiteNumberOr(
          statsData.conflictsResolved,
          DEFAULT_PLAYER_STATE.stats.conflictsResolved
        )
      ),
      stageDives: clampNonNegative(
        finiteNumberOr(
          statsData.stageDives,
          DEFAULT_PLAYER_STATE.stats.stageDives
        )
      ),
      failedStageDives: clampNonNegative(
        finiteNumberOr(statsData.failedStageDives, 0)
      ),
      consecutiveBadShows: clampNonNegative(
        finiteNumberOr(
          statsData.consecutiveBadShows,
          DEFAULT_PLAYER_STATE.stats.consecutiveBadShows
        )
      ),
      proveYourselfMode:
        typeof statsData.proveYourselfMode === 'boolean'
          ? statsData.proveYourselfMode
          : DEFAULT_PLAYER_STATE.stats.proveYourselfMode,
      tourCompleted: statsData.tourCompleted === true
    }
  }

  const validatedFame = clampPlayerFame(rawPlayer.fame)

  return {
    ...rawPlayer,
    money: clampPlayerMoney(rawPlayer.money),
    fame: validatedFame,
    fameLevel: calculateFameLevel(validatedFame),
    day: Math.max(1, rawPlayer.day),
    time: wrapClockHour(rawPlayer.time),
    van: {
      ...rawPlayer.van,
      fuel: clampVanFuel(rawPlayer.van.fuel)
    }
  }
}

const parseNumericStats = (
  obj: unknown,
  valueTransformer?: (val: number) => number,
  ignoredKeys?: Set<string>
): Record<string, number> => {
  if (!isLooseRecord(obj)) return {}
  const result: Record<string, number> = {}
  for (const key of Object.keys(obj)) {
    if (isForbiddenKey(key)) continue
    if (ignoredKeys && ignoredKeys.has(key)) continue

    const normalizedKey = key.toLowerCase()
    if (ignoredKeys && ignoredKeys.has(normalizedKey)) continue

    const value = obj[key as keyof typeof obj]
    if (isFiniteNumber(value)) {
      result[key] = valueTransformer ? valueTransformer(value) : value
    }
  }
  return result
}

/**
 * Sanitizes a raw band configuration payload into a stable band state object.
 *
 * @remarks
 * Verifies core properties such as band name, reputation, harmony, and stamina.
 * Corrupt or out-of-bound numerical states are clamped or reset to baseline values.
 *
 * @param loadedBand - The raw untrusted band state payload
 * @returns A safe, sanitized band state object
 */
export const sanitizeBand = (loadedBand: unknown): BandState => {
  const bandData = isLooseRecord(loadedBand)
    ? Object.assign(Object.create(null), loadedBand)
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
      ...(isLooseRecord(bandData.performance)
        ? (() => {
            const perfData = Object.assign(
              Object.create(null),
              bandData.performance
            )
            return {
              guitarDifficulty: finiteNumberOr(
                perfData.guitarDifficulty,
                DEFAULT_BAND_STATE.performance.guitarDifficulty
              ),
              drumMultiplier: finiteNumberOr(
                perfData.drumMultiplier,
                DEFAULT_BAND_STATE.performance.drumMultiplier
              ),
              crowdDecay: finiteNumberOr(
                perfData.crowdDecay,
                DEFAULT_BAND_STATE.performance.crowdDecay
              )
            }
          })()
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
          const copy = sanitizeStashItem(
            itemObj,
            baseItem,
            (itemObj?.id ?? '') as string
          )
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
          const copy = sanitizeStashItem(itemObj, baseItem, id)
          migrated[id] = copy
        }
        return migrated
      }
      return defaultStash
    })(),
    activeContrabandEffects: (() => {
      // ⚡ BOLT OPTIMIZATION: Replaced .map() with procedural loop.
      // Why: Avoids closure allocation and intermediate arrays in hot paths.
      if (!Array.isArray(bandData.activeContrabandEffects)) {
        return [...DEFAULT_BAND_STATE.activeContrabandEffects]
      }
      const rawEffects = bandData.activeContrabandEffects as unknown[]
      const out = new Array(rawEffects.length)
      for (let i = 0; i < rawEffects.length; i++) {
        const effect = rawEffects[i]
        const effectObj = isLooseRecord(effect)
          ? (effect as Record<string, unknown>)
          : {}
        out[i] = {
          ...(copySafePrimitiveObject(effectObj) ?? {}),
          remainingDuration:
            Number.isFinite(effectObj.remainingDuration as number) &&
            (effectObj.remainingDuration as number) >= 0
              ? (effectObj.remainingDuration as number)
              : 0
        }
      }
      return out
    })()
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

  const loadedStress = finiteOptionalNumber(bandData.stress)
  if (loadedStress !== undefined) {
    rawBand.stress = clampBandStress(loadedStress)
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
      if (isFiniteNumber(v) && v >= 0) {
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
    (rawMember: unknown, i: number) => {
      if (!isLooseRecord(rawMember)) return []
      const m = rawMember
      let id =
        typeof m?.id === 'string'
          ? m.id
          : typeof m?.name === 'string'
            ? m.name.toLowerCase()
            : typeof m?.id === 'number' ||
                typeof m?.id === 'boolean' ||
                typeof m?.id === 'bigint' ||
                typeof m?.id === 'symbol'
              ? String(m.id)
              : `member-${i}`
      if (isForbiddenKey(id)) {
        id = `member-${i}`
      }
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
          const stats = m?.baseStats || {}
          if (!isLooseRecord(stats)) return {}
          const result: Record<string, number> = {}
          for (const key in stats) {
            if (!Object.hasOwn(stats, key)) continue
            if (isForbiddenKey(key)) continue
            const value = stats[key]
            if (isFiniteNumber(value)) {
              result[key] = value
            }
          }
          return result
        })(),
        equipment: copySafePrimitiveObject(m.equipment) ?? {},
        relationships: parseNumericStats(
          m.relationships,
          clampRelationship,
          selfRelationshipKeys
        )
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

/**
 * Sanitizes an array of toast notification payloads.
 *
 * @remarks
 * Filters out invalid toast entries and ensures that required properties (like message and id)
 * exist for each toast.
 *
 * @param loadedToasts - The raw untrusted toast payloads array
 * @returns An array of sanitized toast payloads
 */
export const sanitizeToasts = (loadedToasts: unknown): ToastPayload[] => {
  if (!Array.isArray(loadedToasts)) return []
  const acc: ToastPayload[] = []
  for (const t of loadedToasts) {
    const safeToast = sanitizeLoadedToast(t, ALLOWED_TOAST_TYPES)
    if (safeToast) acc.push(safeToast)
  }
  return acc
}

export const migratePlayerLocation = (location: unknown): string => {
  if (typeof location !== 'string') return ''

  let legacyLocation = location
  if (!location.startsWith('venues:') && location.endsWith('.name')) {
    legacyLocation = location.slice(0, -5)
  }

  const normalizedLocation = normalizeVenueId(legacyLocation)
  if (!normalizedLocation || normalizedLocation === 'Unknown') {
    return location as string
  }

  return `venues:${normalizedLocation}.name`
}

export const migrateLegacyVenueId = (id: unknown): string => {
  if (typeof id !== 'string') return ''
  return normalizeVenueId(id) ?? id
}

/**
 * Sanitizes the current minigame execution state.
 *
 * @remarks
 * Resets the minigame state to default if structural irregularities are found,
 * ensuring it has the correct active status, type, and progress data.
 *
 * @param rawMinigame - The untrusted minigame state payload
 * @returns A valid minigame state, falling back to default if invalid
 */
export const sanitizeMinigameState = (
  rawMinigame: unknown
): GameState['minigame'] => {
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

/**
 * Sanitizes an array of setlist entries.
 *
 * @remarks
 * Validates that each setlist item references a legitimate song identifier and filters out
 * unknown or corrupted entries.
 *
 * @param rawSetlist - The untrusted setlist payload array
 * @returns A sanitized list of song identifiers
 */
export const sanitizeSetlist = (rawSetlist: unknown): GameState['setlist'] => {
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

/**
 * Sanitizes regional reputation metrics mapped by region keys.
 *
 * @remarks
 * Iterates through the provided regional map, clamping reputation values to valid finite bounds.
 *
 * @param value - The raw untrusted regional reputation mapping
 * @returns A sanitized mapping of regional reputation values
 */
export const sanitizeReputationByRegion = (
  value: unknown
): GameState['reputationByRegion'] => {
  if (!isLooseRecord(value)) return {}
  const sanitized: GameState['reputationByRegion'] = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const reputation = value[key]
    if (isFiniteNumber(reputation)) {
      sanitized[key] = reputation
    }
  }
  return sanitized
}

/**
 * Sanitizes the broader social state encompassing followers, influencers, and brand interactions.
 *
 * @remarks
 * Deeply validates nested social structures, removing malicious payload keys and clamping
 * followers and sentiment to non-negative bounds.
 *
 * @param value - The raw untrusted social state payload
 * @returns A stable, sanitized social state object
 */
export const sanitizeSocial = (value: unknown): SocialState => {
  const sanitized: SocialState = {
    ...DEFAULT_SOCIAL_STATE,
    activeDeals: [...DEFAULT_SOCIAL_STATE.activeDeals],
    brandReputation: { ...DEFAULT_SOCIAL_STATE.brandReputation },
    influencers: cloneDefaultInfluencers()
  }
  if (!isLooseRecord(value)) return sanitized
  const safeValue = Object.assign(Object.create(null), value)

  for (const key of [
    'instagram',
    'tiktok',
    'youtube',
    'newsletter',
    'viral',
    'reputationCooldown'
  ] as const) {
    const parsed = finiteOptionalNumber(safeValue[key])
    if (parsed !== undefined) sanitized[key] = parsed
  }

  for (const [key, clampFn] of [
    ['controversyLevel', clampControversyLevel],
    ['loyalty', clampLoyalty],
    ['zealotry', clampZealotry]
  ] as const) {
    const parsed = finiteOptionalNumber(safeValue[key])
    if (parsed !== undefined) sanitized[key] = clampFn(parsed)
  }

  for (const key of [
    'lastGigDay',
    'lastGigDifficulty',
    'lastPirateBroadcastDay',
    'lastDarkWebLeakDay',
    'lastCultIndoctrinationDay'
  ] as const) {
    const raw = safeValue[key]
    if (raw === null) {
      sanitized[key] = null
      continue
    }
    const parsed = finiteOptionalNumber(raw)
    if (parsed !== undefined) sanitized[key] = parsed
  }

  if (typeof safeValue.egoFocus === 'string' || safeValue.egoFocus === null) {
    sanitized.egoFocus = safeValue.egoFocus
  }
  if (typeof safeValue.trend === 'string') {
    sanitized.trend = safeValue.trend
  }

  if (Array.isArray(safeValue.activeDeals)) {
    sanitized.activeDeals = safeValue.activeDeals.flatMap((deal: unknown) => {
      const copied = copySafePrimitiveObject(deal)
      if (
        !copied ||
        typeof copied.id !== 'string' ||
        typeof copied.remainingGigs !== 'number' ||
        !Number.isInteger(copied.remainingGigs) ||
        copied.remainingGigs <= 0
      ) {
        return []
      }
      // Rehydrate the full deal from the static registry: runtime consumers
      // (hasActiveSponsorship, per-gig payouts, sellout penalties) require
      // `type` and `offer`, which the persisted blob must not be trusted to
      // carry. Only `remainingGigs` is player progress and survives the load.
      // Ids without a registry entry (deals removed in a patch, hostile
      // saves) are dropped — a stub without type/offer matches no consumer.
      const registryDeal = BRAND_DEALS_BY_ID.get(copied.id)
      if (!registryDeal) {
        return []
      }
      return [
        {
          ...registryDeal,
          remainingGigs: copied.remainingGigs
        }
      ]
    })
  }

  if (isLooseRecord(safeValue.brandReputation)) {
    sanitized.brandReputation = {}
    for (const key in safeValue.brandReputation) {
      if (!Object.hasOwn(safeValue.brandReputation, key)) continue
      if (isForbiddenKey(key)) continue
      const reputation = safeValue.brandReputation[key]
      if (isFiniteNumber(reputation)) {
        sanitized.brandReputation[key] = reputation
      }
    }
  }

  if (isLooseRecord(safeValue.influencers)) {
    sanitized.influencers = {}
    for (const key in safeValue.influencers) {
      if (!Object.hasOwn(safeValue.influencers, key)) continue
      if (isForbiddenKey(key)) continue
      const influencer = safeValue.influencers[key]
      if (!isLooseRecord(influencer)) continue
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

/**
 * Sanitizes the active event option selected during an ongoing game event.
 *
 * @remarks
 * Ensures the event option references a known option structure with proper string keys and bounds.
 *
 * @param value - The raw untrusted active event option payload
 * @returns A sanitized event option or null if the payload is invalid
 */
export const sanitizeActiveEventOption = (
  value: unknown
): EventOption | null => {
  if (!isLooseRecord(value)) return null

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
    if (
      Object.hasOwn(value, key) &&
      typeof (value as Record<string, unknown>)[key] === 'string'
    )
      option[key as keyof EventOption] = (value as Record<string, unknown>)[key]
  }
  for (const key of ['effects', 'effect']) {
    if (!Object.hasOwn(value, key)) continue
    const copied = copySafeEffectPayload(
      (value as Record<string, unknown>)[key]
    )
    if (copied !== undefined) option[key] = copied
  }
  if (Object.hasOwn(value, 'skillCheck')) {
    const skillCheck = copySafeJsonValue(
      (value as Record<string, unknown>).skillCheck
    )
    if (skillCheck !== undefined) option.skillCheck = skillCheck
  }
  if (
    Object.hasOwn(value, 'flags') &&
    Array.isArray((value as Record<string, unknown>).flags)
  ) {
    option.flags = sanitizeStringArray((value as Record<string, unknown>).flags)
  }
  if (
    Object.hasOwn(value, 'disabled') &&
    typeof (value as Record<string, unknown>).disabled === 'boolean'
  ) {
    option.disabled = (value as Record<string, unknown>).disabled as boolean
  }

  return !isEmptyObject(option) ? option : null
}

/**
 * Sanitizes the active game event state.
 *
 * @remarks
 * Validates the event structure, including its identifiers and currently selected options,
 * guarding against prototype pollution and corrupted event chains.
 *
 * @param value - The raw untrusted active event state payload
 * @returns A valid active event state or null if no valid event exists
 */
export const sanitizeActiveEvent = (
  value: unknown
): GameState['activeEvent'] => {
  if (!isLooseRecord(value) || typeof value.id !== 'string') return null

  const event: GameEvent = { id: value.id }
  for (const key of [
    'category',
    'title',
    'titleKey',
    'description',
    'descriptionKey',
    'trigger'
  ]) {
    if (
      Object.hasOwn(value, key) &&
      typeof (value as Record<string, unknown>)[key] === 'string'
    )
      event[key as keyof GameEvent] = (value as Record<string, unknown>)[key]
  }

  if (Object.hasOwn(value, 'context')) {
    const context = copySafePrimitiveObject(
      (value as Record<string, unknown>).context
    )
    if (context) event.context = context
  }

  if (Object.hasOwn(value, 'effects')) {
    const effects = copySafeEffectPayload(
      (value as Record<string, unknown>).effects
    )
    if (effects !== undefined) event.effects = effects as GameEvent['effects']
  }

  if (
    Object.hasOwn(value, 'options') &&
    Array.isArray((value as Record<string, unknown>).options)
  ) {
    const options = (
      (value as Record<string, unknown>).options as unknown[]
    ).flatMap(option => {
      const sanitized = sanitizeActiveEventOption(option)
      return sanitized ? [sanitized] : []
    })
    if (options.length > 0) event.options = options
  }

  return event
}

/**
 * Sanitizes the state tracking persistent NPCs and relationships.
 *
 * @remarks
 * Validates that each NPC has a known ID, and clamps their relationship metrics to allowed bounds.
 *
 * @param value - The raw untrusted NPC tracking state
 * @returns A sanitized mapping of NPC identifiers to their corresponding states
 */
export const sanitizeNpcs = (value: unknown): GameState['npcs'] => {
  if (!isLooseRecord(value)) return {}
  const sanitized: GameState['npcs'] = {}
  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue
    if (isForbiddenKey(key)) continue
    const npc = value[key]
    if (!isLooseRecord(npc) || typeof npc.id !== 'string') continue
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

/**
 * Sanitizes modifiers applied to upcoming or active gigs.
 *
 * @remarks
 * Iterates through allowed gig modifiers, preserving valid boolean flags and handling legacy
 * aliases (e.g., merging `energy` flags into `catering`).
 *
 * @param value - The raw untrusted gig modifiers mapping
 * @returns A sanitized object containing valid gig modifiers
 */
export const sanitizeGigModifiers = (
  value: unknown
): GameState['gigModifiers'] => {
  const sanitized = { ...DEFAULT_GIG_MODIFIERS }
  if (!isLooseRecord(value)) return sanitized
  for (const key of Object.keys(DEFAULT_GIG_MODIFIERS)) {
    if (
      Object.hasOwn(value, key) &&
      typeof (value as Record<string, unknown>)[key] === 'boolean'
    ) {
      sanitized[key as keyof typeof DEFAULT_GIG_MODIFIERS] = (
        value as Record<string, unknown>
      )[key] as boolean
    }
  }
  // Legacy `energy` → `catering` migration: only applies when the save does
  // not already carry the current key, so `catering` always wins over the
  // stale alias.
  if (
    Object.hasOwn(value, 'energy') &&
    typeof (value as Record<string, unknown>).energy === 'boolean' &&
    (!Object.hasOwn(value, 'catering') ||
      typeof (value as Record<string, unknown>).catering !== 'boolean')
  ) {
    sanitized.catering = (value as Record<string, unknown>).energy as boolean
  }
  return sanitized
}

/**
 * Sanitizes the currently targeted or active gig venue context.
 *
 * @remarks
 * Ensures the venue has valid IDs, identifiers, and bounds for capacity and difficulty,
 * filtering out any polluted prototype properties.
 *
 * @param value - The raw untrusted venue context payload
 * @returns A sanitized venue object or null if invalid
 */
export const sanitizeVenue = (value: unknown): GameState['currentGig'] => {
  if (!isLooseRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null
  }
  const venue: NonNullable<GameState['currentGig']> = {
    id: value.id,
    name: value.name
  }
  for (const key of ['city', 'region']) {
    if (
      Object.hasOwn(value, key) &&
      typeof (value as Record<string, unknown>)[key] === 'string'
    )
      venue[key as keyof typeof venue] = (value as Record<string, unknown>)[
        key
      ] as never
  }
  for (const key of ['capacity', 'difficulty', 'diff', 'reputation']) {
    if (Object.hasOwn(value, key)) {
      const parsed = finiteOptionalNumber(
        (value as Record<string, unknown>)[key]
      )
      if (parsed !== undefined)
        venue[key as keyof typeof venue] = parsed as never
    }
  }
  if (
    Object.hasOwn(value, 'isPractice') &&
    typeof (value as Record<string, unknown>).isPractice === 'boolean'
  ) {
    venue.isPractice = (value as Record<string, unknown>).isPractice as boolean
  }
  if (
    Object.hasOwn(value, 'sourceScene') &&
    typeof (value as Record<string, unknown>).sourceScene === 'string' &&
    PRACTICE_RETURN_SCENES.has(
      (value as Record<string, unknown>).sourceScene as GamePhase
    )
  ) {
    venue.sourceScene = (value as Record<string, unknown>)
      .sourceScene as GamePhase
  }
  return venue
}

const VALID_BRAND_ALIGNMENTS = [
  'EVIL',
  'CORPORATE',
  'INDIE',
  'SUSTAINABLE',
  'GOOD',
  'NEUTRAL'
] as const satisfies readonly import('../../../types/social').BrandAlignment[]

/** Narrows an untrusted value to a finite {@link BrandAlignment} union member. */
const isBrandAlignment = (
  value: unknown
): value is import('../../../types/social').BrandAlignment =>
  typeof value === 'string' &&
  (VALID_BRAND_ALIGNMENTS as readonly string[]).includes(value)

/**
 * Sanitizes a raw `rivalBand` save entry into a valid `RivalBandState` or null.
 *
 * Whitelists fields individually and rejects hostile prototype-pollution keys.
 * `powerLevel` is clamped to a non-negative finite number; `alignment` falls
 * back to `'NEUTRAL'` when it is not a valid {@link BrandAlignment}; missing or
 * malformed required fields (`id`, `name`) cause the entry to be dropped
 * (returns null).
 */
export const sanitizeRivalBand = (value: unknown): GameState['rivalBand'] => {
  if (!isLooseRecord(value)) return null
  const raw = value as Record<string, unknown>

  if (!Object.hasOwn(raw, 'id')) return null
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null
  if (isForbiddenKey(raw.id)) return null

  if (!Object.hasOwn(raw, 'name')) return null
  if (typeof raw.name !== 'string' || raw.name.length === 0) return null

  const alignment =
    Object.hasOwn(raw, 'alignment') && isBrandAlignment(raw.alignment)
      ? raw.alignment
      : 'NEUTRAL'
  const powerLevel = Object.hasOwn(raw, 'powerLevel')
    ? Math.max(0, finiteNumberOr(raw.powerLevel, 0))
    : 0
  const currentLocationId =
    Object.hasOwn(raw, 'currentLocationId') &&
    typeof raw.currentLocationId === 'string'
      ? raw.currentLocationId
      : null

  return {
    id: raw.id,
    name: raw.name,
    alignment,
    powerLevel,
    currentLocationId
  }
}

/**
 * Sanitizes the performance statistics from the previously completed gig.
 *
 * @remarks
 * Clamps and validates numerical stats such as score, combo, and accuracy. It preserves
 * failure flags which persist across state transitions.
 *
 * @param value - The raw untrusted statistics payload from the last gig
 * @returns A sanitized gig statistics object or null if no valid stats exist
 */
export const sanitizeLastGigStats = (
  value: unknown
): GameState['lastGigStats'] => {
  if (!isLooseRecord(value)) return null
  const sanitized: NonNullable<GameState['lastGigStats']> = {}
  for (const key of [
    'score',
    'misses',
    'accuracy',
    'combo',
    'maxCombo',
    'health',
    'overload'
  ]) {
    const parsed = finiteOptionalNumber(value[key])
    if (parsed !== undefined) sanitized[key] = parsed
  }
  // Preserve the failed flag: post-gig event gating reads it, so it must
  // survive a save/load round-trip. Own-property check so a hostile
  // Object.prototype.failed cannot mark every loaded gig as failed.
  if (Object.hasOwn(value, 'failed') && value.failed === true) {
    sanitized.failed = true
  }
  return !isEmptyObject(sanitized) ? sanitized : null
}

/**
 * Sanitizes the array of active and ongoing player quests.
 *
 * @remarks
 * Normalizes quest progress against maximum bounds and correctly links active quests
 * to their backing registry definitions, dropping completely invalid items.
 *
 * @param value - The raw untrusted active quests array
 * @returns A sanitized array of valid active quests
 */
export const sanitizeActiveQuests = (
  value: unknown
): GameState['activeQuests'] => {
  if (!Array.isArray(value)) return []
  return value.flatMap(quest => {
    if (!isLooseRecord(quest) || typeof quest.id !== 'string') return []
    if (isForbiddenKey(quest.id)) return []
    const definition = getQuestDefinition(quest.id)
    if (definition) {
      if (
        (definition.repeatPolicy === 'perVenue' ||
          definition.repeatPolicy === 'perRegion') &&
        (typeof quest.scopeKey !== 'string' ||
          quest.scopeKey.length === 0 ||
          isForbiddenKey(quest.scopeKey))
      ) {
        return []
      }
      const startedOnDay = finiteNumberOr(quest.startedOnDay, 0)
      const sanitized: GameState['activeQuests'][number] = {
        id: quest.id,
        status: 'active',
        startedOnDay
      }
      if (quest.deadline == null) {
        const deadlineOffset = finiteOptionalNumber(definition.deadlineOffset)
        if (deadlineOffset !== undefined) {
          sanitized.deadline = startedOnDay + deadlineOffset
        } else if (quest.deadline === null) {
          sanitized.deadline = null
        }
      } else {
        const deadline = finiteOptionalNumber(quest.deadline)
        if (deadline !== undefined) sanitized.deadline = deadline
      }
      const progress = finiteOptionalNumber(quest.progress)
      sanitized.progress = isFiniteNumber(progress) ? progress : 0
      const required = finiteOptionalNumber(quest.required)
      if (required !== undefined) {
        sanitized.required = required
      } else if (typeof definition.required === 'number') {
        sanitized.required = definition.required
      }
      if (
        typeof quest.scopeKey === 'string' &&
        !isForbiddenKey(quest.scopeKey)
      ) {
        sanitized.scopeKey = quest.scopeKey
      }
      return [sanitized]
    }
    const sanitized: GameState['activeQuests'][number] = { id: quest.id }
    for (const key of ['label', 'description', 'rewardType', 'rewardFlag']) {
      if (Object.hasOwn(quest, key) && typeof quest[key] === 'string')
        sanitized[key as 'title' | 'description' | 'state'] = quest[
          key
        ] as never
    }
    for (const key of ['deadline', 'progress', 'required', 'moneyReward']) {
      if (!Object.hasOwn(quest, key)) continue
      if (
        (quest as Record<string, unknown>)[key] === null &&
        key === 'deadline'
      ) {
        sanitized.deadline = null
        continue
      }
      const parsed = finiteOptionalNumber(
        (quest as Record<string, unknown>)[key]
      )
      if (parsed !== undefined) sanitized[key] = parsed
    }
    if (Object.hasOwn(quest, 'rewardData')) {
      const rewardData = copySafePrimitiveObject(
        (quest as Record<string, unknown>).rewardData
      )
      if (rewardData !== undefined) sanitized.rewardData = rewardData
    }
    if (Object.hasOwn(quest, 'failurePenalty')) {
      const failurePenalty = copySafeJsonValue(
        (quest as Record<string, unknown>).failurePenalty
      )
      if (isLooseRecord(failurePenalty))
        sanitized.failurePenalty = failurePenalty
    }
    return [sanitized]
  })
}

/**
 * Sanitizes quest cooldown trackers to prevent premature quest recurrence.
 *
 * @remarks
 * Filters out malformed cooldown entries and ensures remaining cooldown durations are finite numbers.
 *
 * @param value - The raw untrusted quest cooldowns array
 * @returns A sanitized list of active quest cooldown entries
 */
export const sanitizeQuestCooldowns = (
  value: unknown
): GameState['questCooldowns'] => {
  if (!Array.isArray(value)) return []
  return value.flatMap(entry => {
    if (!isLooseRecord(entry) || typeof entry.questId !== 'string') return []
    if (isForbiddenKey(entry.questId)) return []
    const expiresOnDay = finiteOptionalNumber(entry.expiresOnDay)
    if (expiresOnDay === undefined) return []
    // Legacy saves may carry a decorative `id` label; cooldown matching is
    // keyed by questId alone, so it is dropped on load.
    return [{ questId: entry.questId, expiresOnDay }]
  })
}

/**
 * Sanitizes the tracking array representing completed quest scopes.
 *
 * @remarks
 * Validates the composite keys (questId and scopeKey) mapping to completed scopes, ignoring
 * invalid or polluted entries.
 *
 * @param value - The raw untrusted completed quest scopes array
 * @returns A sanitized list of valid completed quest scope entries
 */
export const sanitizeQuestScopes = (
  value: unknown
): GameState['completedQuestScopes'] => {
  if (!Array.isArray(value)) return []
  return value.flatMap(entry => {
    // Scope completions are keyed by questId + scopeKey only; unlike cooldowns,
    // they have no separate legacy id contract to preserve.
    if (
      !isLooseRecord(entry) ||
      typeof entry.questId !== 'string' ||
      typeof entry.scopeKey !== 'string' ||
      isForbiddenKey(entry.questId) ||
      isForbiddenKey(entry.scopeKey)
    )
      return []
    return [{ questId: entry.questId, scopeKey: entry.scopeKey }]
  })
}
