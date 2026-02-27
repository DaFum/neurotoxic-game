import { EVENTS_DB } from '../data/events/index.js'
import { EVENT_STRINGS } from '../data/events/constants.js'
import { logger } from './logger.js'
import { secureRandom } from './crypto.js'
import { bandHasTrait } from './traitLogic.js'

/**
 * Filters and selects an event based on context, priority, and probability.
 */
const selectEvent = (pool, gameState, triggerPoint) => {
  // 1. Pending Events (Highest Priority)
  if (gameState.pendingEvents && gameState.pendingEvents.length > 0) {
    const nextEventId = gameState.pendingEvents[0]
    const pendingEvent = pool.find(e => e.id === nextEventId)
    if (pendingEvent) {
      return pendingEvent
    }
  }

  // 2. Filter by Trigger & Condition
  let eligibleEvents = []
  for (const e of pool) {
    // Trigger check
    if (triggerPoint && e.trigger !== triggerPoint) continue

    // Filter by Cooldown
    if (gameState.eventCooldowns && gameState.eventCooldowns.includes(e.id))
      continue

    // Condition check
    if (!e.condition) {
      eligibleEvents.push({ event: e, contextvars: {} })
      continue
    }

    try {
      const condResult = e.condition(gameState)
      if (condResult) {
        eligibleEvents.push({
          event: e,
          contextvars: typeof condResult === 'object' ? condResult : {}
        })
      }
    } catch (err) {
      logger.error(
        'EventEngine',
        `Condition check failed for event ${e.id}`,
        err
      )
    }
  }

  if (eligibleEvents.length === 0) return null

  // 4. Story Flag Weighting & Selection
  const storyFlags = gameState.activeStoryFlags || []
  const shuffled = [...eligibleEvents]

  // Fisher-Yates shuffle for unbiased randomness and better performance
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(secureRandom() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  for (const eligible of shuffled) {
    const { event, contextvars } = eligible
    let chance = event.chance

    // Boost chance if flag matches
    if (event.requiredFlag && storyFlags.includes(event.requiredFlag)) {
      chance *= 5.0 // Huge boost
    }

    if (secureRandom() < chance) {
      logger.debug('EventEngine', 'Event Selected', event.id)

      // Dynamic text parsing
      const variables = {
        ...contextvars,
        venue: gameState.player?.currentLocation || 'the venue'
      }

      let title = event.title || ''
      let description = event.description || ''
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{${key}}`, 'gi')
        title = title.replace(regex, value)
        description = description.replace(regex, value)
      })

      return { ...event, title, description, context: variables }
    }
  }
  return null
}

/**
 * Processes a single effect object into state delta modifications.
 */
const processEffect = (eff, delta, context = {}) => {
  switch (eff.type) {
    case 'relationship': {
      if (!delta.band.relationshipChange) delta.band.relationshipChange = []

      const resolveName = str => {
        if (!str || typeof str !== 'string') return str
        let resolved = str
        Object.entries(context).forEach(([key, value]) => {
          if (typeof value === 'string') {
            const regex = new RegExp(`{${key}}`, 'gi')
            resolved = resolved.replace(regex, value)
          }
        })
        return resolved
      }

      delta.band.relationshipChange.push({
        member1: resolveName(eff.member1),
        member2: resolveName(eff.member2),
        change: eff.value
      })
      break
    }
    case 'resource':
      if (eff.resource === 'money')
        delta.player.money = (delta.player.money || 0) + eff.value
      if (eff.resource === 'fuel') {
        delta.player.van = { ...(delta.player.van || {}) }
        delta.player.van.fuel = Math.max(
          0,
          Math.min(100, (delta.player.van.fuel || 0) + eff.value)
        )
      }
      break
    case 'stat':
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
        delta.player.van.condition = Math.max(
          0,
          Math.min(100, (delta.player.van.condition || 0) + eff.value)
        )
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
      break
    case 'stat_increment':
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
      break
    case 'item':
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
      break
    case 'unlock':
      delta.flags.unlock = eff.unlock
      break
    case 'game_over':
      delta.flags.gameOver = true
      break
    case 'flag':
      delta.flags.addStoryFlag = eff.flag
      break
    case 'cooldown':
      delta.flags.addCooldown = eff.eventId
      break
    case 'social_set':
      delta.social[eff.stat] = eff.value
      break
    case 'chain':
      delta.flags.queueEvent = eff.eventId
      break
  }
}

export const eventEngine = {
  /**
   * Checks for and selects a random event from a specific category.
   * @param {string} category - The category of events to check (e.g., 'travel', 'gig').
   * @param {object} gameState - The current game state.
   * @param {string|null} [triggerPoint=null] - Optional specific trigger point filter.
   * @returns {object|null} The selected event object or null if none found.
   */
  checkEvent: (category, gameState, triggerPoint = null) => {
    const pool = EVENTS_DB[category]
    if (!pool) return null
    return selectEvent(pool, gameState, triggerPoint)
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
          skillValue = Math.max(
            ...members.map(m => {
              // Check nested baseStats (static attributes like skill/stamina 1-10) FIRST
              // Then check top-level (dynamic stats like mood/health 0-100)
              // This priority prevents dynamic 'stamina' (100) from trivializing checks intended for base 'stamina' (7)
              const val =
                m.baseStats?.[stat] !== undefined ? m.baseStats[stat] : m[stat]
              return val ?? 0
            })
          )
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
      event.id.includes('van_breakdown') &&
      (gameState.band?.inventory?.spare_tire > 0 ||
        gameState.band?.inventory?.spare_tire === true)
    ) {
      const spareTireOption = {
        label: 'Use Spare Tire (Inventory)',
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
        outcomeText: 'You swapped the tire in record time.'
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
  applyResult: (result, context = {}) => {
    if (!result) return null

    const delta = { player: {}, band: {}, social: {}, flags: {} }

    if (result.type === 'composite') {
      result.effects.forEach(eff => processEffect(eff, delta, context))
    } else {
      processEffect(result, delta, context)
    }

    if (result.nextEventId) {
      delta.flags.queueEvent = result.nextEventId
    }

    return delta
  },

  selectEvent: selectEvent,
  filterEvents: (pool, trigger, state) =>
    pool.filter(e => {
      if (trigger && e.trigger !== trigger) return false
      return e.condition ? e.condition(state) : true
    })
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
  const delta = eventEngine.applyResult(result, gameState.activeEvent?.context)

  return {
    result,
    delta,
    outcomeText: choice.outcomeText ?? '',
    description: result.description ?? ''
  }
}
