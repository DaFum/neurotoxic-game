import { EVENTS_DB } from '../data/events.js'
import { logger } from './logger.js'

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
  let eligibleEvents = pool.filter(
    e => !triggerPoint || e.trigger === triggerPoint
  )
  eligibleEvents = eligibleEvents.filter(e => {
    if (!e.condition) return true
    try {
      return e.condition(gameState)
    } catch (err) {
      logger.error(
        'EventEngine',
        `Condition check failed for event ${e.id}`,
        err
      )
      return false
    }
  })

  // 3. Filter by Cooldown
  if (gameState.eventCooldowns) {
    eligibleEvents = eligibleEvents.filter(
      e => !gameState.eventCooldowns.includes(e.id)
    )
  }

  if (eligibleEvents.length === 0) return null

  // 4. Story Flag Weighting & Selection
  const storyFlags = gameState.activeStoryFlags || []
  const shuffled = [...eligibleEvents].sort(() => Math.random() - 0.5)

  for (const event of shuffled) {
    let chance = event.chance

    // Boost chance if flag matches
    if (event.requiredFlag && storyFlags.includes(event.requiredFlag)) {
      chance *= 5.0 // Huge boost
    }

    if (Math.random() < chance) {
      logger.debug('EventEngine', 'Event Selected', event.id)
      return event
    }
  }
  return null
}

/**
 * Processes a single effect object into state delta modifications.
 */
const processEffect = (eff, delta) => {
  switch (eff.type) {
    case 'resource':
      if (eff.resource === 'money')
        delta.player.money = (delta.player.money || 0) + eff.value
      if (eff.resource === 'fuel') {
        delta.player.van = { ...(delta.player.van || {}) }
        delta.player.van.fuel = (delta.player.van.fuel || 0) + eff.value
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
        delta.player.van.condition =
          (delta.player.van.condition || 0) + eff.value
      }
      if (eff.stat === 'crowd_energy') delta.flags.crowdEnergy = eff.value
      if (eff.stat === 'viral')
        delta.social.viral = (delta.social.viral || 0) + eff.value
      if (eff.stat === 'score') delta.flags.score = eff.value
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
   * @returns {object} The result object containing effects and outcomes.
   */
  resolveChoice: (choice, gameState) => {
    let result = null

    if (choice.skillCheck) {
      const { stat, threshold, success, failure } = choice.skillCheck

      let skillValue = 0
      const maxMemberSkill = Math.max(
        ...gameState.band.members.map(m => m[stat] || 0)
      )

      if (stat === 'luck') skillValue = Math.random() * 10
      else if (gameState.band[stat] !== undefined)
        skillValue = gameState.band[stat] / 10
      else skillValue = maxMemberSkill

      const roll = Math.random() * 10
      const total = skillValue + (roll > 8 ? 2 : 0) // Crit chance

      if (total >= threshold) {
        result = { ...success, outcome: 'success' }
      } else {
        result = { ...failure, outcome: 'failure' }
      }
    } else {
      result = { ...choice.effect, outcome: 'direct' }
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
   * @returns {object|null} A delta object representing state changes, or null.
   */
  applyResult: result => {
    if (!result) return null

    const delta = { player: {}, band: {}, social: {}, flags: {} }

    if (result.type === 'composite') {
      result.effects.forEach(eff => processEffect(eff, delta))
    } else {
      processEffect(result, delta)
    }

    if (result.nextEventId) {
      delta.flags.queueEvent = result.nextEventId
    }

    return delta
  }
}
