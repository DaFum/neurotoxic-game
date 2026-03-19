/**
 * Crisis Event Validation Utility
 * Validates event objects against the expected structure and types.
 */

const VALID_CATEGORIES = ['band', 'financial', 'special']
const VALID_TRIGGERS = ['post_gig', 'travel', 'random']

/**
 * Validates a single crisis event object.
 * @param {object} event - The crisis event to validate.
 * @throws {Error} If validation fails.
 * @returns {boolean} True if valid.
 */
const validateEffect = (effect, eventId, idx) => {
  if (!effect || typeof effect !== 'object') {
    throw new Error(`Effect must be an object at index ${idx} for event ${eventId}`)
  }
  if (!effect.type) {
    throw new Error(`Effect must have a type at index ${idx} for event ${eventId}`)
  }
  if (effect.type === 'composite') {
    if (!Array.isArray(effect.effects) || effect.effects.length === 0) {
      throw new Error(
        `Composite effect must have a non-empty effects array at index ${idx} for event ${eventId}`
      )
    }
    effect.effects.forEach((childEffect, childIdx) => {
      try {
        validateEffect(childEffect, eventId, idx)
      } catch (err) {
        throw new Error(`Invalid child effect at composite index ${childIdx} for option index ${idx} in event ${eventId}: ${err.message}`)
      }
    })
  } else if (effect.type === 'skillCheck') {
    if (!effect.success || typeof effect.success !== 'object') {
      throw new Error(`SkillCheck effect must have a success object at index ${idx} for event ${eventId}`)
    }
    if (!effect.failure || typeof effect.failure !== 'object') {
      throw new Error(`SkillCheck effect must have a failure object at index ${idx} for event ${eventId}`)
    }
  }
}

export const validateCrisisEvent = event => {
  if (!event || typeof event !== 'object') {
    throw new Error('Event must be an object')
  }

  if (typeof event.id !== 'string' || !event.id.startsWith('crisis_')) {
    throw new Error(`Invalid event id: ${event.id}`)
  }

  if (!VALID_CATEGORIES.includes(event.category)) {
    throw new Error(`Invalid category: ${event.category} for event ${event.id}`)
  }

  if (!Array.isArray(event.tags) || !event.tags.includes('crisis')) {
    throw new Error(`Event ${event.id} must have "crisis" tag`)
  }

  if (typeof event.title !== 'string' || !event.title.startsWith('events:')) {
    throw new Error(`Invalid title key: ${event.title} for event ${event.id}`)
  }

  if (
    typeof event.description !== 'string' ||
    !event.description.startsWith('events:')
  ) {
    throw new Error(
      `Invalid description key: ${event.description} for event ${event.id}`
    )
  }

  if (!VALID_TRIGGERS.includes(event.trigger)) {
    throw new Error(`Invalid trigger: ${event.trigger} for event ${event.id}`)
  }

  if (typeof event.chance !== 'number' || event.chance < 0 || event.chance > 1) {
    throw new Error(`Invalid chance: ${event.chance} for event ${event.id}`)
  }

  if (event.condition && typeof event.condition !== 'function') {
    throw new Error(`Condition must be a function for event ${event.id}`)
  }

  if (!Array.isArray(event.options) || event.options.length === 0) {
    throw new Error(`Event ${event.id} must have at least one option`)
  }

  event.options.forEach((opt, idx) => {
    if (typeof opt.label !== 'string' || !opt.label.startsWith('events:')) {
      throw new Error(
        `Invalid option label at index ${idx} for event ${event.id}`
      )
    }

    if (
      typeof opt.outcomeText !== 'string' ||
      !opt.outcomeText.startsWith('events:')
    ) {
      throw new Error(
        `Invalid outcomeText at index ${idx} for event ${event.id}`
      )
    }

    if (!opt.effect && !opt.skillCheck) {
      throw new Error(
        `Option at index ${idx} for event ${event.id} must have effect or skillCheck`
      )
    }

    if (opt.effect) {
      validateEffect(opt.effect, event.id, idx)
    }

    if (opt.skillCheck) {
      const { stat, threshold, success, failure } = opt.skillCheck
      if (typeof stat !== 'string')
        throw new Error(`SkillCheck stat must be a string in event ${event.id}`)
      if (typeof threshold !== 'number')
        throw new Error(
          `SkillCheck threshold must be a number in event ${event.id}`
        )
      if (!success || typeof success !== 'object')
        throw new Error(
          `SkillCheck success must be an object in event ${event.id}`
        )
      if (!failure || typeof failure !== 'object')
        throw new Error(
          `SkillCheck failure must be an object in event ${event.id}`
        )
      validateEffect(success, event.id, idx)
      validateEffect(failure, event.id, idx)
    }
  })

  return true
}
