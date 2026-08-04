import { logger } from '../logger'
import { secureRandom } from '../crypto'
import { finiteNumberOr, parseCooldownEntry } from '../gameState'
import { MODULE_REGISTRY } from '../assetModuleRegistry'
import { StateError } from '../errorHandler'
import { shuffleInPlace } from '../shuffleUtils'
import { resolveTemplateString } from './templateResolver'
import { toStringArray, processEvent } from './helpers'
import { BASE_BREAKDOWN_CHANCE } from '../upgradeUtils'
import type { EngineEvent, EngineGameState, TriggerPoint } from './types'

const HARMONY_DEATH_SPIRAL_THRESHOLD = 30
const HARMONY_DEATH_SPIRAL_DAMPEN_FACTOR = 0.5
const INFIGHTING_DAMPER_CHANCE_FACTOR = 0.5
// Cap matches the daily-tick worst case (condition < 30 plus controversy: 3.5x).
const BREAKDOWN_CHANCE_FACTOR_CAP = 4

type EventPoolById = Record<string, EngineEvent>

/**
 * WeakMap keyed by event pool array identity.
 *
 * Each cached value maps event ids from that pool to their event objects for
 * pending-event lookup.
 *
 * @remarks WeakMap keys are the pool arrays themselves, not event ids.
 */
const eventPoolMapCache = new WeakMap<EngineEvent[], EventPoolById>()

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

const getEventMapForPool = (pool: EngineEvent[]): EventPoolById => {
  const cachedMap = eventPoolMapCache.get(pool)
  if (cachedMap) return cachedMap

  const map: EventPoolById = Object.create(null)
  for (let i = 0; i < pool.length; i++) {
    const event = pool[i]
    const eventId = event?.id
    if (typeof eventId === 'string' && event) {
      map[eventId] = event
    }
  }
  eventPoolMapCache.set(pool, map)
  return map
}

/**
 * Resolves a selected event's dynamic title and description templates.
 *
 * @param eligible - Selected event with the context vars its condition produced.
 * @param gameState - State snapshot supplying the venue template variable.
 * @returns The event with resolved text and the context vars used.
 */
const resolveEventText = (
  eligible: { event: EngineEvent; contextvars: Record<string, string> },
  gameState: EngineGameState
) => {
  const { event, contextvars } = eligible
  logger.debug('EventEngine', 'Event Selected', event.id)

  // Dynamic text parsing
  const variables: Record<string, string> = {
    ...contextvars,
    venue: String(gameState.player?.location || 'the venue')
  }

  const title = resolveTemplateString(event.title || '', variables)
  const description = resolveTemplateString(event.description || '', variables)

  return { ...event, title, description, context: variables }
}

/**
 * Selects one eligible event from a pool using trigger, cooldown, flags, and chance.
 *
 * @param pool - Candidate events to evaluate.
 * @param gameState - State snapshot used for cooldowns, flags, assets, and event conditions.
 * @param triggerPoint - Trigger category currently requesting an event.
 * @param rng - Random number generator used for shuffling and chance rolls.
 * @returns The selected event with resolved template context, or `null` when none qualifies.
 */
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
    const parsed = parseCooldownEntry(cd)
    if (!parsed) continue
    if (parsed.expiryDay === null || currentDay < parsed.expiryDay) {
      activeCooldowns.push(parsed.key)
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
  //
  // Priority means skipping the chance roll, not the eligibility rules: a queued
  // event still has to clear its cooldown and its condition, and its text is
  // template-resolved like any other selected event. Returning the head
  // unchecked let a stale or duplicated entry replay a one-shot event whose
  // condition (`consequences_comeback_album` guards on COMEBACK_TRIGGERED) says
  // it is already done.
  //
  // The queue is scanned in order rather than head-only: an entry that is
  // ineligible right now (or belongs to another pool) must not hold up the
  // entries behind it. `POP_PENDING_EVENT` removes the played id wherever it
  // sits, so skipping ahead cannot leave a played event queued.
  //
  // The authored trigger point is deliberately NOT enforced here — a queued
  // event is a beat to surface at the next opportunity, not at one trigger.
  const eventsById = pendingEvents.length > 0 ? getEventMapForPool(pool) : null
  if (eventsById) {
    for (const pendingId of pendingEvents) {
      if (!pendingId || cooldownsSet.has(pendingId)) continue
      const pendingEvent = eventsById[pendingId]
      if (!pendingEvent) continue
      const processed = pendingEvent.condition
        ? processEvent(pendingEvent, optimizedState)
        : { event: pendingEvent, contextvars: {} }
      if (processed) return resolveEventText(processed, gameState)
    }
  }

  // 2. Filter by Trigger & Condition
  const eligibleEvents: Array<{
    event: EngineEvent
    contextvars: Record<string, string>
  }> = []
  for (const e of pool) {
    if (!e) continue

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

    const processed = processEvent(e, optimizedState)
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

  shuffleInPlace(shuffled, rng, (i, j) => {
    throw new StateError(
      `Dense array invariant violated at shuffle index i=${i}, j=${j}`
    )
  })

  // Weighted single-roll selection. Rolling each candidate in sequence and
  // taking the first success would make every event's odds conditional on all
  // earlier candidates failing, so an authored `chance` would shrink as soon as
  // another event is eligible. Accumulating the effective chances and spending
  // one roll keeps each `chance` as the event's final probability while the
  // pool total stays within 1, and degrades proportionally once it exceeds 1.
  const weighted: Array<{
    eligible: (typeof shuffled)[number]
    chance: number
  }> = []
  let totalChance = 0

  for (const eligible of shuffled) {
    const { event } = eligible
    let chance =
      typeof event.chance === 'function'
        ? event.chance(optimizedState)
        : (event.chance ?? 0)

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

    // Van wear matters: breakdown-tagged transport events scale with the
    // daily-computed van.breakdownChance relative to the unmodified baseline.
    // A fresh van (factor 1) keeps authored chances; low condition raises
    // them (up to the daily-tick cap), suspension upgrades lower them.
    if (event.tags?.includes('breakdown')) {
      const breakdownChance = finiteNumberOr(
        gameState.player?.van?.breakdownChance,
        BASE_BREAKDOWN_CHANCE
      )
      const factor = Math.min(
        BREAKDOWN_CHANCE_FACTOR_CAP,
        breakdownChance / BASE_BREAKDOWN_CHANCE
      )
      chance *= factor
    }

    if (!Number.isFinite(chance)) chance = 0
    if (chance > 1) chance = 1
    if (chance <= 0) continue

    totalChance += chance
    weighted.push({ eligible, chance })
  }

  if (totalChance <= 0) return null

  let roll = rng() * Math.max(1, totalChance)

  for (const { eligible, chance } of weighted) {
    roll -= chance
    if (roll >= 0) continue

    return resolveEventText(eligible, gameState)
  }
  return null
}

export { selectEvent }
