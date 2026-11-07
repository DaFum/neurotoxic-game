/**
 * Crisis Event Validation Utility
 * Validates event objects against the expected structure and types.
 */
import { EVENT_CATEGORIES } from '../data/events/categories'
import { isFiniteNumber } from './finiteNumber'
import { isLooseRecord } from './objectUtils'
import {
  isValidItemTarget,
  isValidSocialSetTarget
} from './eventEngine/effectTargets'

const VALID_CATEGORIES = new Set<string>(EVENT_CATEGORIES)
const VALID_TRIGGERS = [
  'post_gig',
  'travel',
  'random',
  'special_location',
  'gig_intro',
  'gig_mid'
]
const VALID_TRIGGERS_SET = new Set(VALID_TRIGGERS)

/**
 * Validates a single crisis event object.
 * @param event - The crisis event to validate.
 * @throws If validation fails.
 * @returns True if valid.
 */
const validateEffect = (
  effect: unknown,
  eventId: string,
  idx: number,
  ancestors = new WeakSet<object>()
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
  if (ancestors.has(effect)) {
    throw new Error('Cyclic effect at index ' + idx + ' for event ' + eventId)
  }
  ancestors.add(effect)
  const ef = effect as Record<string, unknown>
  if (!ef.type) {
    throw new Error(
      'Effect must have a type at index ' + idx + ' for event ' + eventId
    )
  }
  if (ef.type === 'composite') {
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
        validateEffect(childEffect, eventId, idx, ancestors)
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
  } else if (ef.type === 'skillCheck') {
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
        validateEffect(nestedEffect, eventId, idx, ancestors)
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
  } else if (ef.type === 'social_set') {
    // A numeric counter target is accepted, but it is applied additively
    // (see the `social_set` handler in eventEngine/eventEffectHandlers.ts).
    if (!isValidSocialSetTarget(ef.stat, ef.value)) {
      throw new Error(
        'social_set effect has an invalid stat or value for "' +
          String(ef.stat) +
          '" at index ' +
          idx +
          ' for event ' +
          eventId
      )
    }
  } else if (ef.type === 'item') {
    if (!isValidItemTarget(ef.item, ef.value)) {
      throw new Error(
        'item effect has an unknown item or invalid value for "' +
          String(ef.item) +
          '" at index ' +
          idx +
          ' for event ' +
          eventId
      )
    }
  }
  ancestors.delete(effect)
}

/** Whether a value is a localization key in the `events:` namespace. */
const isEventsKey = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('events:')

type SkillCheckField = 'stat' | 'threshold' | 'success' | 'failure'

/**
 * Builds the caller's diagnostic for a malformed option-level skillCheck field.
 * `requirement` is the shared wording ("a string", "an object", ...).
 */
type SkillCheckError = (field: SkillCheckField, requirement: string) => Error

/**
 * Validates an option-level skillCheck shared by both public validators.
 *
 * Fields are read in the order they are checked (stat, threshold, then both
 * branches). Branch effect errors propagate unwrapped from `validateEffect`.
 * Presence and diagnostics stay with the caller.
 */
const validateOptionSkillCheck = (
  sc: Record<string, unknown>,
  eventId: string,
  idx: number,
  toError: SkillCheckError
): void => {
  if (typeof sc.stat !== 'string') throw toError('stat', 'a string')
  if (!isFiniteNumber(sc.threshold)) {
    throw toError('threshold', 'a finite number')
  }
  const success = sc.success
  const failure = sc.failure
  if (!isLooseRecord(success)) throw toError('success', 'an object')
  if (!isLooseRecord(failure)) throw toError('failure', 'an object')
  validateEffect(success, eventId, idx)
  validateEffect(failure, eventId, idx)
}

/**
 * Validates crisis event data and throws a descriptive error on failure.
 */
export const validateCrisisEvent = (event: unknown): boolean => {
  if (!event || typeof event !== 'object') {
    throw new Error('Event must be an object')
  }

  const e = event as Record<string, unknown>

  if (typeof e.id !== 'string' || !e.id.startsWith('crisis_')) {
    throw new Error('Invalid event id: ' + String(e.id))
  }

  if (typeof e.category !== 'string' || !VALID_CATEGORIES.has(e.category)) {
    throw new Error(
      'Invalid category: ' + String(e.category) + ' for event ' + String(e.id)
    )
  }

  if (!Array.isArray(e.tags) || !(e.tags as unknown[]).includes('crisis')) {
    throw new Error('Event ' + String(e.id) + ' must have "crisis" tag')
  }

  if (typeof e.trigger !== 'string' || !VALID_TRIGGERS_SET.has(e.trigger)) {
    throw new Error(
      'Invalid trigger: ' + String(e.trigger) + ' for event ' + String(e.id)
    )
  }

  if (e.condition !== undefined && typeof e.condition !== 'function') {
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
    typeof e.chance !== 'function' &&
    (typeof e.chance !== 'number' ||
      !Number.isFinite(e.chance) ||
      (e.chance as number) < 0 ||
      (e.chance as number) > 1)
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
    // Crisis options have no object guard: null/undefined options surface the
    // native TypeError and primitives fail the label check.
    const opt = options[idx] as Record<string, unknown>
    if (!isEventsKey(opt.label)) {
      throw new Error(
        'Invalid option label at index ' + idx + ' for event ' + String(e.id)
      )
    }

    if (!isEventsKey(opt.outcomeText)) {
      throw new Error(
        'Invalid outcomeText at index ' + idx + ' for event ' + String(e.id)
      )
    }

    // Crisis presence policy: truthiness, inherited values count.
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
      // Crisis reads every skillCheck field before checking any of them.
      const fields = {
        stat: sc.stat,
        threshold: sc.threshold,
        success: sc.success,
        failure: sc.failure
      }
      validateOptionSkillCheck(
        fields,
        String(e.id),
        idx,
        (field, requirement) =>
          new Error(
            'SkillCheck ' +
              field +
              ' must be ' +
              requirement +
              ' in event ' +
              String(e.id)
          )
      )
    }
  }

  return true
}

/**
 * Validates general game event data and throws a descriptive error on failure.
 */
export const validateGameEvent = (event: unknown): boolean => {
  if (!event || typeof event !== 'object') {
    throw new Error('Event must be an object')
  }

  const e = event as Record<string, unknown>

  if (typeof e.id !== 'string' || e.id.trim() === '') {
    throw new Error(
      `Event id must be a non-empty string (got: ${JSON.stringify(e.id)})`
    )
  }

  if (typeof e.title !== 'string' || !e.title.startsWith('events:')) {
    throw new Error(
      `Event "${e.id}": title must start with 'events:' (got: ${JSON.stringify(e.title)})`
    )
  }

  if (
    typeof e.description !== 'string' ||
    !e.description.startsWith('events:')
  ) {
    throw new Error(
      `Event "${e.id}": description must start with 'events:' (got: ${JSON.stringify(e.description)})`
    )
  }

  if (!Array.isArray(e.options) || e.options.length === 0) {
    throw new Error(`Event "${e.id}": options must be a non-empty array`)
  }

  for (let i = 0; i < e.options.length; i++) {
    const opt = e.options[i]
    if (!isLooseRecord(opt)) {
      throw new Error(`Event "${e.id}" option[${i}]: must be a non-null object`)
    }
    const o = opt
    if (!isEventsKey(o.label)) {
      throw new Error(
        `Event "${e.id}" option[${i}]: label must start with 'events:' (got: ${JSON.stringify(o.label)})`
      )
    }
    if (!isEventsKey(o.outcomeText)) {
      throw new Error(
        `Event "${e.id}" option[${i}]: outcomeText must start with 'events:' (got: ${JSON.stringify(o.outcomeText)})`
      )
    }
    // General presence policy: own and not undefined; falsey values are
    // selected and rejected by the shape checks.
    const hasEffect = Object.hasOwn(o, 'effect') && o.effect !== undefined
    const hasSkillCheck =
      Object.hasOwn(o, 'skillCheck') && o.skillCheck !== undefined
    if (!hasEffect && !hasSkillCheck) {
      throw new Error(
        `Event "${e.id}" option[${i}]: must have either an effect or a skillCheck`
      )
    }

    if (hasEffect) {
      validateEffect(o.effect, String(e.id), i)
    }
    if (hasSkillCheck) {
      validateOptionSkillCheck(
        o.skillCheck as Record<string, unknown>,
        String(e.id),
        i,
        (field, requirement) =>
          new Error(
            `Event "${e.id}" option[${i}]: skillCheck.${field} must be ${requirement}`
          )
      )
    }
  }

  // Events with 'crisis' tags use either a bounded static chance or a dynamic chance.
  if (Array.isArray(e.tags) && (e.tags as string[]).includes('crisis')) {
    if (typeof e.id !== 'string' || !e.id.startsWith('crisis_')) {
      throw new Error(
        `Crisis-tagged event id must start with 'crisis_' (got: ${JSON.stringify(e.id)})`
      )
    }
    const chance = e.chance
    if (
      typeof chance !== 'function' &&
      (typeof chance !== 'number' ||
        !Number.isFinite(chance) ||
        chance < 0 ||
        chance > 1)
    ) {
      throw new Error(
        `Crisis-tagged event "${e.id}": chance must be a number in [0, 1] or a function`
      )
    }
  }

  // Events with a prerequisiteEventId field must have it non-empty
  if (Object.hasOwn(e, 'prerequisiteEventId')) {
    if (
      typeof e.prerequisiteEventId !== 'string' ||
      e.prerequisiteEventId.trim() === ''
    ) {
      throw new Error(
        `Event "${e.id}": prerequisiteEventId must be a non-empty string when present`
      )
    }
  }

  // Events with a questId field must have it non-empty
  if (Object.hasOwn(e, 'questId')) {
    if (typeof e.questId !== 'string' || e.questId.trim() === '') {
      throw new Error(
        `Event "${e.id}": questId must be a non-empty string when present`
      )
    }
  }

  return true
}
