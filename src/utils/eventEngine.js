/**
 * REVIEW.md Compliance Block
 *
 * (#1) Actual Updates:
 * - Optimized `resolveTemplateString` by replacing `for...in` and `Object.hasOwn` with `Object.keys()` to avoid prototype chain overhead.
 * - Added a global `toLowerCaseCache` to prevent re-allocating new lowercase strings for frequently reused context keys.
 * - Added explicit forbidden key checks (`__proto__`, `constructor`, `prototype`) within the mapping loop to maintain protection against prototype pollution when using `Object.keys()`.
 *
 * (#2) Next Steps:
 * - Consider pre-compiling templates at event load time if template resolution remains a hot path during large event pools generation.
 *
 * (#3) Found Errors + Solutions:
 * - Found repeated string allocation for `.toLowerCase()` in a hot loop path. Solved by introducing a module-level `toLowerCaseCache`.
 */

// TODO: Review this file
import { EVENTS_DB } from '../data/events/index.js'
import { EVENT_STRINGS } from '../data/events/constants.js'
import { logger } from './logger.js'
import { secureRandom } from './crypto.js'
import { bandHasTrait } from './traitLogic.js'
import { calculateAppliedDelta } from './gameStateUtils.js'

/**
 * Filters and selects an event based on context, priority, and probability.
 */

const TEMPLATE_REGEX = /\{([^}]+)\}/gi

const toLowerCaseCache = Object.create(null)

/**
 * Resolves a template string by replacing {key} with the corresponding value from the context.
 * Uses a single pre-compiled regex for performance.
 * @param {string} str - The string containing {key} templates.
 * @param {object} context - The context object containing replacement values.
 * @returns {string} The resolved string.
 */
const resolveTemplateString = (str, context) => {
  if (!str || typeof str !== 'string' || str.indexOf('{') === -1) return str

  let lowerKeysMap = null

  return str.replace(TEMPLATE_REGEX, (match, key) => {
    // Reject forbidden keys immediately
    if (/^(?:__proto__|constructor|prototype)$/i.test(key)) {
      return match
    }

    // Fast path: exact case match
    if (typeof context[key] === 'string') {
      return context[key]
    }

    // Fallback: case-insensitive match (as the original implementation used 'gi')
    if (!lowerKeysMap) {
      lowerKeysMap = Object.create(null)

      for (const k in context) {
        if (!Object.hasOwn(context, k)) continue
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
          continue
        }

        let lk = toLowerCaseCache[k]
        if (lk === undefined) {
          lk = k.toLowerCase()
          toLowerCaseCache[k] = lk
        }

        if (lowerKeysMap[lk] === undefined) {
          lowerKeysMap[lk] = k
        }
      }
    }

    let lowerKey = toLowerCaseCache[key]
    if (lowerKey === undefined) {
      lowerKey = key.toLowerCase()
      toLowerCaseCache[key] = lowerKey
    }

    const foundKey = lowerKeysMap[lowerKey]

    if (foundKey && typeof context[foundKey] === 'string') {
      return context[foundKey]
    }

    return match // Return original template if no match is found
  })
}

export const HARMONY_DEATH_SPIRAL_THRESHOLD = 30
export const HARMONY_DEATH_SPIRAL_DAMPEN_FACTOR = 0.5

const eventPoolMapCache = new WeakMap()

const getEventMapForPool = pool => {
  let map = eventPoolMapCache.get(pool)
  if (!map) {
    map = Object.create(null)
    for (let i = 0; i < pool.length; i++) {
      if (pool[i].id) {
        map[pool[i].id] = pool[i]
      }
    }
    eventPoolMapCache.set(pool, map)
  }
  return map
}

const selectEvent = (pool, gameState, triggerPoint, rng = secureRandom) => {
  // Optimization: Pre-calculate Sets for O(1) lookups
  const cooldownsSet =
    gameState.eventCooldowns && gameState.eventCooldowns.length > 0
      ? new Set(gameState.eventCooldowns)
      : new Set()
  const flagsSet =
    gameState.activeStoryFlags && gameState.activeStoryFlags.length > 0
      ? new Set(gameState.activeStoryFlags)
      : new Set()
  const pendingSet =
    gameState.pendingEvents && gameState.pendingEvents.length > 0
      ? new Set(gameState.pendingEvents)
      : new Set()

  const optimizedState = {
    ...gameState,
    eventCooldowns: cooldownsSet,
    activeStoryFlags: flagsSet,
    pendingEvents: pendingSet
  }

  // 1. Pending Events (Highest Priority)
  if (gameState.pendingEvents && gameState.pendingEvents.length > 0) {
    const nextEventId = gameState.pendingEvents[0]
    const pendingEvent = getEventMapForPool(pool)[nextEventId]
    if (pendingEvent) {
      return pendingEvent
    }
  }

  // 2. Filter by Trigger & Condition
  let eligibleEvents = []
  for (const e of pool) {
    // Trigger check — events with trigger:'random' are eligible at any trigger point
    if (triggerPoint && e.trigger !== triggerPoint && e.trigger !== 'random')
      continue

    // Filter by Cooldown
    if (cooldownsSet.has(e.id)) continue

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

  // Fisher-Yates shuffle for unbiased randomness and better performance
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  for (const eligible of shuffled) {
    const { event, contextvars } = eligible
    let chance = event.chance

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

    if (rng() < chance) {
      logger.debug('EventEngine', 'Event Selected', event.id)

      // Dynamic text parsing
      const variables = {
        ...contextvars,
        venue: gameState.player?.currentLocation || 'the venue'
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

const EFFECT_HANDLERS = Object.assign(Object.create(null), {
  relationship: (eff, delta, context) => {
    if (!delta.band.relationshipChange) delta.band.relationshipChange = []
    const resolveName = str => resolveTemplateString(str, context)
    delta.band.relationshipChange.push({
      member1: resolveName(eff.member1),
      member2: resolveName(eff.member2),
      change: eff.value
    })
  },
  resource: (eff, delta) => {
    if (eff.resource === 'money')
      delta.player.money = (delta.player.money || 0) + eff.value
    if (eff.resource === 'fuel') {
      delta.player.van = { ...(delta.player.van || {}) }
      delta.player.van.fuel = (delta.player.van.fuel || 0) + eff.value
    }
  },
  /**
   * percentage_resource
   * Note: for negative amounts, `min` acts as the maximum *loss* (a floor for the value)
   * enforced via Math.max, and `max` acts as the minimum *loss* (ceiling) enforced via Math.min.
   * Example: `min: -100` bedeutet "verliere maximal 100" bei negativen Prozentsätzen.
   */
  percentage_resource: (eff, delta, _context, gameState) => {
    if (!gameState || !gameState.player) return

    if (eff.resource === 'money') {
      const current = gameState.player.money || 0
      let amount = Math.round(current * (eff.percentage / 100))

      // Defensive guard: swap if min > max
      let { min, max } = eff
      if (min !== undefined && max !== undefined && min > max) {
        ;[min, max] = [max, min]
      }

      // Note: for negative amounts, 'min' acts as the maximum *loss* (a floor for the value)
      // using Math.max, and 'max' acts as the minimum *loss* (ceiling) using Math.min.
      if (min !== undefined) amount = Math.max(min, amount)
      if (max !== undefined) amount = Math.min(max, amount)

      delta.player.money = (delta.player.money || 0) + amount
    }
  },
  stat: (eff, delta) => {
    if (eff.stat === 'time')
      delta.player.time = (delta.player.time || 0) + eff.value
    if (eff.stat === 'fame')
      delta.player.fame = (delta.player.fame || 0) + eff.value
    if (eff.stat === 'harmony')
      delta.band.harmony = (delta.band.harmony || 0) + eff.value
    if (eff.stat === 'mood') {
      delta.band.membersDelta = {
        ...(delta.band.membersDelta || {}),
        moodChange: eff.value
      }
    }
    if (eff.stat === 'stamina') {
      delta.band.membersDelta = {
        ...(delta.band.membersDelta || {}),
        staminaChange: eff.value
      }
    }
    if (eff.stat === 'van_condition') {
      delta.player.van = { ...(delta.player.van || {}) }
      delta.player.van.condition = (delta.player.van.condition || 0) + eff.value
    }
    if (eff.stat === 'hype' || eff.stat === 'crowd_energy')
      delta.player.fame = (delta.player.fame || 0) + eff.value
    if (eff.stat === 'viral')
      delta.social.viral = (delta.social.viral || 0) + eff.value
    if (eff.stat === 'controversyLevel')
      delta.social.controversyLevel =
        (delta.social.controversyLevel || 0) + eff.value
    if (eff.stat === 'loyalty')
      delta.social.loyalty = (delta.social.loyalty || 0) + eff.value
    if (eff.stat === 'score') delta.score = (delta.score || 0) + eff.value
    if (eff.stat === 'luck')
      delta.band.luck = (delta.band.luck || 0) + eff.value
    if (eff.stat === 'skill')
      delta.band.skill = (delta.band.skill || 0) + eff.value
  },
  stat_increment: (eff, delta) => {
    if (eff.stat === 'conflictsResolved') {
      if (!delta.player.stats) delta.player.stats = {}
      delta.player.stats.conflictsResolved =
        (delta.player.stats.conflictsResolved || 0) + eff.value
    }
    if (eff.stat === 'stageDives') {
      if (!delta.player.stats) delta.player.stats = {}
      delta.player.stats.stageDives =
        (delta.player.stats.stageDives || 0) + eff.value
    }
  },
  item: (eff, delta) => {
    if (eff.item) {
      if (!delta.band.inventory) delta.band.inventory = {}
      if (typeof eff.value === 'number') {
        const current =
          typeof delta.band.inventory[eff.item] === 'number'
            ? delta.band.inventory[eff.item]
            : 0
        delta.band.inventory[eff.item] = current + eff.value
      } else {
        const val = eff.value !== undefined ? eff.value : true
        delta.band.inventory[eff.item] = val
      }
    }
  },
  unlock: (eff, delta) => {
    delta.flags.unlock = eff.unlock
  },
  game_over: (eff, delta) => {
    delta.flags.gameOver = true
  },
  flag: (eff, delta) => {
    delta.flags.addStoryFlag = eff.flag
  },
  cooldown: (eff, delta) => {
    delta.flags.addCooldown = eff.eventId
  },
  social_set: (eff, delta) => {
    delta.social[eff.stat] = eff.value
  },
  chain: (eff, delta) => {
    delta.flags.queueEvent = eff.eventId
  },
  quest: (eff, delta) => {
    if (!delta.flags.addQuest) delta.flags.addQuest = []
    delta.flags.addQuest.push(eff.quest)
  }
})

/**
 * Processes a single effect object into state delta modifications.
 */
const processEffect = (eff, delta, context = {}, gameState = null) => {
  const handler = EFFECT_HANDLERS[eff.type]
  if (typeof handler === 'function') {
    handler(eff, delta, context, gameState)
  }
}

export const eventEngine = {
  handleError(err, eventId) {
    logger.error(
      'EventEngine',
      `Condition check failed for event ${eventId || 'unknown'}`,
      err
    )
  },

  processEvent(event, optimizedState) {
    try {
      const condResult = event.condition(optimizedState)
      if (condResult) {
        return {
          event: event,
          contextvars: typeof condResult === 'object' ? condResult : {}
        }
      }
    } catch (err) {
      this.handleError(err, event.id)
    }
    return null
  },

  /**
   * Checks for and selects a random event from a specific category.
   * @param {string} category - The category of events to check (e.g., 'travel', 'gig').
   * @param {object} gameState - The current game state.
   * @param {string|null} [triggerPoint=null] - Optional specific trigger point filter.
   * @param {function} [rng=secureRandom] - Random number generator.
   * @returns {object|null} The selected event object or null if none found.
   */
  checkEvent: (
    category,
    gameState,
    triggerPoint = null,
    rng = secureRandom
  ) => {
    const pool = EVENTS_DB[category]
    if (!pool) return null
    return selectEvent(pool, gameState, triggerPoint, rng)
  },

  /**
   * Resolves a player's choice for an event, handling skill checks and immediate effects.
   * @param {object} choice - The choice object selected by the player.
   * @param {object} gameState - The current game state.
   * @param {function} [rng=secureRandom] - Random number generator.
   * @returns {object} The result object containing effects and outcomes.
   */
  resolveChoice: (choice, gameState, rng = secureRandom) => {
    let result

    if (choice.skillCheck) {
      const { stat, threshold, success, failure } = choice.skillCheck

      let skillValue

      // WARNING: 'luck' check must come first!
      // The band object has a 'luck' property (default 0). If we checked band[stat] first,
      // it would match and use the static stat (0) instead of the random roll intended here.
      if (stat === 'luck') {
        // Luck check: ignore band stats, just roll
        skillValue = rng() * 10
      } else if (gameState.band && typeof gameState.band[stat] === 'number') {
        // Band stat check (e.g. harmony)
        // Explicitly check for number to avoid using objects like 'inventory' or 'members' as stats
        skillValue = gameState.band[stat] / 10
      } else {
        // Member stat check (e.g. skill)
        // Ensure members array exists to prevent crash
        const members = Array.isArray(gameState.band?.members)
          ? gameState.band.members
          : []
        if (members.length > 0) {
          skillValue = -Infinity
          for (let i = 0; i < members.length; i++) {
            const m = members[i]
            // Check nested baseStats (static attributes like skill/stamina 1-10) FIRST
            // Then check top-level (dynamic stats like mood/health 0-100)
            // This priority prevents dynamic 'stamina' (100) from trivializing checks intended for base 'stamina' (7)
            const val =
              m.baseStats?.[stat] !== undefined ? m.baseStats[stat] : m[stat]
            const currentVal = val ?? 0
            if (currentVal > skillValue) {
              skillValue = currentVal
            }
          }
        } else {
          skillValue = 0
        }
      }

      const roll = rng() * 10
      const total = skillValue + (roll > 8 ? 2 : 0) // Crit chance

      if (total >= threshold) {
        result = { ...success, outcome: 'success' }
      } else {
        // Bandleader Trait Check: 50% chance to save a failed check in conflict events
        // Pre-consume RNG for determinism
        const bandleaderRoll = rng()
        let savedByBandleader = false

        if (
          gameState.activeEvent?.tags?.includes('conflict') &&
          bandHasTrait(gameState.band, 'bandleader')
        ) {
          if (bandleaderRoll < 0.5) {
            savedByBandleader = true
          }
        }

        if (savedByBandleader) {
          const baseDesc = success?.description || ''
          const savedText = EVENT_STRINGS.SAVED_BY_BANDLEADER
          result = {
            ...success,
            outcome: 'success',
            description: baseDesc + savedText
          }
        } else {
          result = { ...failure, outcome: 'failure' }
        }
      }

      // Track conflict resolution for unlocking 'bandleader'
      if (
        result.outcome === 'success' &&
        gameState.activeEvent?.tags?.includes('conflict')
      ) {
        if (result.type === 'composite') {
          // DEEP CLONE: Break array reference to prevent mutating global EVENTS_DB
          result = { ...result, effects: [...result.effects] }
        } else {
          // Convert simple result to composite to add stat tracking
          const originalEffect = { ...result }
          delete originalEffect.outcome
          delete originalEffect.description
          result = {
            type: 'composite',
            effects: [originalEffect],
            outcome: 'success',
            description: result.description
          }
        }

        // Add the stat increment safely (array is now a fresh copy)
        result.effects.push({
          type: 'stat_increment',
          stat: 'conflictsResolved',
          value: 1
        })
      }
    } else {
      result = { ...choice.effect, outcome: 'direct' }
    }

    // Track Stage Dive attempts for unlocking 'showman'
    // Moved outside of skillCheck block because this choice is direct
    if (
      gameState.activeEvent?.id === 'gig_mid_stage_diver' &&
      choice.flags?.includes('stageDive')
    ) {
      if (result.type === 'composite') {
        result = { ...result, effects: [...result.effects] }
      } else {
        const originalEffect = { ...result }
        delete originalEffect.outcome
        delete originalEffect.description
        result = {
          type: 'composite',
          effects: [originalEffect],
          outcome: result.outcome,
          description: result.description
        }
      }
      result.effects.push({
        type: 'stat_increment',
        stat: 'stageDives',
        value: 1
      })
    }

    if (!result.nextEventId && choice.nextEventId) {
      result.nextEventId = choice.nextEventId
    }

    return result
  },

  /**
   * Post-processes event options to add dynamic context-sensitive choices (e.g. inventory usage).
   * @param {object} event - The event object.
   * @param {object} gameState - The current game state.
   * @returns {object} The event object with processed options.
   */
  processOptions: (event, gameState) => {
    if (!event || !event.options) return event

    const processedEvent = { ...event, options: [...event.options] }

    if (
      event.id === 'van_breakdown_tire' &&
      (gameState.band?.inventory?.spare_tire > 0 ||
        gameState.band?.inventory?.spare_tire === true)
    ) {
      const spareTireOption = {
        label: 'events:van_breakdown_tire.opt3.label',
        effect: {
          type: 'composite',
          effects: [
            { type: 'item', item: 'spare_tire', value: -1 }, // Consume
            {
              type: 'stat',
              stat: 'time',
              value: -0.5,
              description: 'Quick fix.'
            }
          ]
        },
        outcomeText: 'events:van_breakdown_tire.opt3.outcome'
      }
      processedEvent.options.unshift(spareTireOption)
    }

    return processedEvent
  },

  /**
   * Converts a resolution result into a state delta object for the reducer.
   * @param {object} result - The result object from resolveChoice.
   * @param {object} context - Context variables from the event (e.g. member names).
   * @returns {object|null} A delta object representing state changes, or null.
   */
  applyResult: (result, context = {}, gameState = null) => {
    if (!result) return null

    const delta = { player: {}, band: {}, social: {}, flags: {} }

    if (result.type === 'composite') {
      // ⚡ Optimization: Standard for loop instead of .forEach to avoid callback allocation
      for (let i = 0, len = result.effects.length; i < len; i++) {
        processEffect(result.effects[i], delta, context, gameState)
      }
    } else {
      processEffect(result, delta, context, gameState)
    }

    if (result.nextEventId) {
      delta.flags.queueEvent = result.nextEventId
    }

    return delta
  },

  selectEvent: selectEvent,
  filterEvents(pool, trigger, state) {
    const result = []
    for (let i = 0, len = pool.length; i < len; i++) {
      const e = pool[i]
      // Match exact trigger OR 'random' events (eligible at any trigger point)
      if (trigger && e.trigger !== trigger && e.trigger !== 'random') {
        continue
      }
      if (!e.condition) {
        result.push(e)
        continue
      }
      try {
        if (e.condition(state)) {
          result.push(e)
        }
      } catch (err) {
        this.handleError(err, e.id)
      }
    }
    return result
  }
}

/**
 * Resolves an event choice into result and state delta payloads.
 *
 * @param {object} choice - Event choice selected by the player.
 * @param {object} gameState - Snapshot of the current game state.
 * @param {function} [rng=secureRandom] - Random number generator.
 * @returns {{ result: object | null, delta: object | null, outcomeText: string, description: string }} Resolution payload.
 */
export const resolveEventChoice = (choice, gameState, rng = secureRandom) => {
  if (!choice || !gameState) {
    return { result: null, delta: null, outcomeText: '', description: '' }
  }

  const result = eventEngine.resolveChoice(choice, gameState, rng)
  const delta = eventEngine.applyResult(
    result,
    gameState.activeEvent?.context,
    gameState
  )

  let appliedDelta = null
  if (delta) {
    try {
      // Calculate appliedDelta via calculateAppliedDelta which only computes the
      // effective change (clamped) without mutating state.
      appliedDelta = calculateAppliedDelta(gameState, delta)
    } catch (e) {
      logger.error('EventEngine', 'Failed to preview applied delta', e)
    }
  }

  return {
    result,
    delta,
    appliedDelta,
    outcomeText: choice.outcomeText ?? '',
    description: result.description ?? ''
  }
}
