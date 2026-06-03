import { logger } from '../logger'
import { secureRandom } from '../crypto'
import { finiteNumberOr } from '../gameStateUtils'
import { MODULE_REGISTRY } from '../assetModuleRegistry'
import { StateError } from '../errorHandler'
import { resolveTemplateString } from './templateResolver'
import { toStringArray } from './helpers'
import { eventEngine } from './eventEngineCore'
import type { EngineEvent, EngineGameState, TriggerPoint } from './types'

const HARMONY_DEATH_SPIRAL_THRESHOLD = 30
const HARMONY_DEATH_SPIRAL_DAMPEN_FACTOR = 0.5
const INFIGHTING_DAMPER_CHANCE_FACTOR = 0.5

const eventPoolMapCache = new WeakMap()

const hasInstalledAssetFlag = (
  gameState: EngineGameState,
  flag: 'infightingDamper'
): boolean => {
  const assets = Array.isArray(gameState.assets) ? gameState.assets : []
  for (const asset of assets) {
    if (!asset || typeof asset !== 'object') continue
    if (
      typeof asset.condition === 'number' &&
      Number.isFinite(asset.condition) &&
      asset.condition < 20
    ) {
      continue
    }

    const slots = Array.isArray(asset.slots) ? asset.slots : []
    for (const slot of slots) {
      const moduleId = slot?.installedModuleId
      if (typeof moduleId !== 'string') continue
      if (!Object.hasOwn(MODULE_REGISTRY, moduleId)) continue
      const module = MODULE_REGISTRY[moduleId]
      if (module?.boni?.[flag] === true) return true
    }
  }
  return false
}

const getEventMapForPool = (
  pool: EngineEvent[]
): Record<string, EngineEvent> => {
  let map = eventPoolMapCache.get(pool)
  if (!map) {
    map = Object.create(null)
    for (let i = 0; i < pool.length; i++) {
      const eventId = pool[i]?.id
      if (typeof eventId === 'string') {
        map[eventId] = pool[i]
      }
    }
    eventPoolMapCache.set(pool, map)
  }
  return map
}

const selectEvent = (
  pool: EngineEvent[],
  gameState: EngineGameState,
  triggerPoint: TriggerPoint,
  rng: () => number = secureRandom
) => {
  // Optimization: Pre-calculate Sets for O(1) lookups
  const eventCooldowns = toStringArray(gameState.eventCooldowns)
  const activeStoryFlags = toStringArray(gameState.activeStoryFlags)
  const pendingEvents = toStringArray(gameState.pendingEvents)
  const currentDay = finiteNumberOr(gameState.player?.day, 0)
  const activeCooldowns: string[] = []
  for (const cd of eventCooldowns) {
    const [key, expiryStr] = cd.split(':')
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10)
      if (!isNaN(expiry) && currentDay < expiry) {
        if (key) activeCooldowns.push(key)
      }
    } else {
      if (key) activeCooldowns.push(key)
    }
  }

  const cooldownsSet =
    activeCooldowns.length > 0
      ? new Set<string>(activeCooldowns)
      : new Set<string>()
  const flagsSet =
    activeStoryFlags.length > 0
      ? new Set<string>(activeStoryFlags)
      : new Set<string>()
  const pendingSet =
    pendingEvents.length > 0
      ? new Set<string>(pendingEvents)
      : new Set<string>()

  const optimizedState = {
    ...gameState,
    eventCooldowns: cooldownsSet,
    activeStoryFlags: flagsSet,
    pendingEvents: pendingSet
  }

  // 1. Pending Events (Highest Priority)
  if (pendingEvents.length > 0) {
    const nextEventId = pendingEvents[0]
    const pendingEvent =
      typeof nextEventId === 'string'
        ? getEventMapForPool(pool)[nextEventId]
        : undefined
    if (pendingEvent) {
      return pendingEvent
    }
  }

  // 2. Filter by Trigger & Condition
  const eligibleEvents: Array<{
    event: EngineEvent
    contextvars: Record<string, string>
  }> = []
  for (const e of pool) {
    // Trigger check — events with trigger:'random' are eligible at any trigger point
    if (triggerPoint && e.trigger !== triggerPoint && e.trigger !== 'random')
      continue

    // Filter by Cooldown
    if (typeof e.id === 'string' && cooldownsSet.has(e.id)) continue

    // Condition check
    if (!e.condition) {
      eligibleEvents.push({ event: e, contextvars: {} })
      continue
    }

    const processed = eventEngine.processEvent(e, optimizedState)
    if (processed) {
      eligibleEvents.push(processed)
    }
  }

  if (eligibleEvents.length === 0) return null

  // 4. Story Flag Weighting & Selection
  const shuffled = [...eligibleEvents]
  const infightingDamperActive = hasInstalledAssetFlag(
    gameState,
    'infightingDamper'
  )

  // Fisher-Yates shuffle for unbiased randomness and better performance
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = shuffled[i]
    const other = shuffled[j]
    if (!temp || !other)
      throw new StateError(
        `Dense array invariant violated at shuffle index i=${i}, j=${j}`
      )
    shuffled[i] = other
    shuffled[j] = temp
  }

  for (const eligible of shuffled) {
    const { event, contextvars } = eligible
    let chance = event.chance ?? 0

    // Boost chance if flag matches
    if (event.requiredFlag && flagsSet.has(event.requiredFlag)) {
      chance *= 5.0 // Huge boost
    }

    // Dampen random band events when harmony is critically low to prevent death spirals
    if (
      event.category === 'band' &&
      event.trigger === 'random' &&
      (gameState.band?.harmony ?? 100) < HARMONY_DEATH_SPIRAL_THRESHOLD
    ) {
      chance *= HARMONY_DEATH_SPIRAL_DAMPEN_FACTOR
    }

    if (infightingDamperActive && event.tags?.includes('conflict')) {
      chance *= INFIGHTING_DAMPER_CHANCE_FACTOR
    }

    if (rng() < chance) {
      logger.debug('EventEngine', 'Event Selected', event.id)

      // Dynamic text parsing
      const variables: Record<string, string> = {
        ...contextvars,
        venue: String(gameState.player?.currentLocation || 'the venue')
      }

      let title = event.title || ''
      let description = event.description || ''

      title = resolveTemplateString(title, variables)
      description = resolveTemplateString(description, variables)

      return { ...event, title, description, context: variables }
    }
  }
  return null
}


export { selectEvent, eventPoolMapCache }