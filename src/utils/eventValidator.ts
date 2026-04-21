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
const validateEffect = (
  effect: unknown,
  eventId: string,
  idx: number
): void => {
  if (!effect || typeof effect !== 'object' || Array.isArray(effect)) {
    const message = Array.isArray(effect)
      ? 'Effect must be a plain object, not an array at index ' +
        idx +
        ' for event ' +
        eventId
      : 'Effect must be an object at index ' + idx + ' for event ' + eventId
    throw new Error(message)
  }
  const ef = effect as Record<string, unknown>
  if (!ef.type) {
    throw new Error(
      'Effect must have a type at index ' + idx + ' for event ' + eventId
    )
  }
  if (effect.type === 'composite') {
    if (!Array.isArray(ef.effects) || (ef.effects as unknown[]).length === 0) {
      throw new Error(
        'Composite effect must have a non-empty effects array at index ' +
          idx +
          ' for event ' +
          eventId
      )
    }
    const effects = ef.effects as unknown[]
    for (let childIdx = 0, len = effects.length; childIdx < len; childIdx++) {
      const childEffect = effects[childIdx]
      try {
        validateEffect(childEffect, eventId, idx)
      } catch (err) {
        const causeMsg = err instanceof Error ? err.message : String(err)
        throw new Error(
          'Invalid child effect at composite index ' +
            childIdx +
            ' for option index ' +
            idx +
            ' in event ' +
            eventId +
            ': ' +
            causeMsg,
          { cause: err }
        )
      }
    }
  } else if (effect.type === 'skillCheck') {
    for (const effectName of ['success', 'failure']) {
      const nestedEffect = ef[effectName]
      if (
        !nestedEffect ||
        typeof nestedEffect !== 'object' ||
        Array.isArray(nestedEffect)
      ) {
        throw new Error(
          'SkillCheck effect must have a ' +
            effectName +
            ' object at index ' +
            idx +
            ' for event ' +
            eventId
        )
      }
      try {
        validateEffect(nestedEffect, eventId, idx)
      } catch (err) {
        const causeMsg = err instanceof Error ? err.message : String(err)
        throw new Error(
          'Invalid ' +
            effectName +
            ' effect in skillCheck at option index ' +
            idx +
            ' for event ' +
            eventId +
            ': ' +
            causeMsg,
          { cause: err }
        )
      }
    }
  }
}

export const validateCrisisEvent = (event: unknown): boolean => {
  if (!event || typeof event !== 'object') {
    throw new Error('Event must be an object')
  }

  const e = event as Record<string, unknown>

  if (typeof e.id !== 'string' || !e.id.startsWith('crisis_')) {
    throw new Error('Invalid event id: ' + String(e.id))
  }

  if (!VALID_CATEGORIES.includes(String(e.category))) {
    throw new Error(
      'Invalid category: ' + String(e.category) + ' for event ' + String(e.id)
    )
  }


  if (typeof e.trigger !== 'string' || !VALID_TRIGGERS.includes(e.trigger as string)) {
    throw new Error('Invalid trigger: ' + String(e.trigger) + ' for event ' + String(e.id))
  }

  if (!Array.isArray(e.tags) || !(e.tags as unknown[]).includes('crisis')) {
    throw new Error('Event ' + String(e.id) + ' must have "crisis" tag')
  }


  if (Object.hasOwn(e, 'condition') && typeof e.condition !== 'function') {
    throw new Error('Condition must be a function for event ' + String(e.id))
  }

  if (typeof e.title !== 'string' || !e.title.startsWith('events:')) {
    throw new Error(
      'Invalid title key: ' + String(e.title) + ' for event ' + String(e.id)
    )
  }

  if (
    typeof e.description !== 'string' ||
    !e.description.startsWith('events:')
  ) {
    throw new Error(
      'Invalid description key: ' +
        String(e.description) +
        ' for event ' +
        String(e.id)
    )
  }

  if (
    typeof e.chance !== 'number' ||
    (e.chance as number) < 0 ||
    (e.chance as number) > 1
  ) {
    throw new Error(
      'Invalid chance: ' + String(e.chance) + ' for event ' + String(e.id)
    )
  }

  if (!Array.isArray(e.options) || (e.options as unknown[]).length === 0) {
    throw new Error('Event ' + String(e.id) + ' must have at least one option')
  }

  const options = e.options as unknown[]
  for (let idx = 0, len = options.length; idx < len; idx++) {
    const opt = options[idx] as Record<string, unknown>
    if (typeof opt.label !== 'string' || !opt.label.startsWith('events:')) {
      throw new Error(
        'Invalid option label at index ' + idx + ' for event ' + String(e.id)
      )
    }

    if (
      typeof opt.outcomeText !== 'string' ||
      !opt.outcomeText.startsWith('events:')
    ) {
      throw new Error(
        'Invalid outcomeText at index ' + idx + ' for event ' + String(e.id)
      )
    }

    if (!opt.effect && !opt.skillCheck) {
      throw new Error(
        'Option at index ' +
          idx +
          ' for event ' +
          String(e.id) +
          ' must have effect or skillCheck'
      )
    }

    if (opt.effect) {
      validateEffect(opt.effect, String(e.id), idx)
    }

    if (opt.skillCheck) {
      const sc = opt.skillCheck as Record<string, unknown>
      const stat = sc.stat
      const threshold = sc.threshold
      const success = sc.success
      const failure = sc.failure
      if (typeof stat !== 'string')
        throw new Error(
          'SkillCheck stat must be a string in event ' + String(e.id)
        )
      if (typeof threshold !== 'number')
        throw new Error(
          'SkillCheck threshold must be a number in event ' + String(e.id)
        )
      if (!success || typeof success !== 'object' || Array.isArray(success))
        throw new Error(
          'SkillCheck success must be an object in event ' + String(e.id)
        )
      if (!failure || typeof failure !== 'object' || Array.isArray(failure))
        throw new Error(
          'SkillCheck failure must be an object in event ' + String(e.id)
        )
      validateEffect(success, String(e.id), idx)
      validateEffect(failure, String(e.id), idx)
    }
  }

  return true
}
