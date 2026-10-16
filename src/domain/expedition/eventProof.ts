/**
 * Canonical evidence that an Expedition event option really produced a result.
 *
 * @remarks
 * Everything an Expedition event is allowed to cause - Condition wear, cargo,
 * Heat, a Pressure Director consequence - hangs off the
 * `<eventId>:<optionId>:<resultId>` triple the delta carries. That triple is
 * only evidence if the content registry declares it: an event with that id,
 * carrying an option with that id, whose own `expedition` effect names that
 * result. Without this check the triple is three caller-chosen strings, and a
 * forged `APPLY_EXPEDITION_EVENT_DELTA` authors its own proof.
 */

import { EVENTS_DB } from '../../data/events'
import { isExpeditionEventResultId } from './eventDeltas'
import type { GameState, UnknownRecord } from '../../types'

type OptionCondition = (state: GameState) => unknown

/**
 * Declared Expedition results and eligibility conditions, keyed
 * `<eventId>:<optionId>`.
 */
const buildOptionIndexes = (): {
  declaredResults: ReadonlyMap<string, ReadonlySet<string>>
  conditions: ReadonlyMap<string, OptionCondition>
} => {
  const declared = new Map<string, Set<string>>()
  const conditions = new Map<string, OptionCondition>()
  const collect = (effect: unknown, into: Set<string>): void => {
    if (!effect || typeof effect !== 'object') return
    if (Array.isArray(effect)) {
      for (const entry of effect) collect(entry, into)
      return
    }
    const record = effect as UnknownRecord
    if (record.type !== 'expedition') return
    if (isExpeditionEventResultId(record.result)) into.add(record.result)
  }
  for (const pool of Object.values(EVENTS_DB)) {
    for (const event of pool) {
      const eventId = event.id
      if (typeof eventId !== 'string') continue
      const options = event.options
      if (!Array.isArray(options)) continue
      for (const option of options) {
        if (!option || typeof option !== 'object') continue
        const optionRecord = option as UnknownRecord
        const optionId = optionRecord.id
        if (typeof optionId !== 'string') continue
        const key = `${eventId}:${optionId}`
        if (typeof optionRecord.condition === 'function') {
          conditions.set(key, optionRecord.condition as OptionCondition)
        }
        const results = new Set<string>()
        collect(optionRecord.effect, results)
        collect(optionRecord.effects, results)
        if (results.size > 0) declared.set(key, results)
      }
    }
  }
  return { declaredResults: declared, conditions }
}

const { declaredResults: DECLARED_RESULTS, conditions: OPTION_CONDITIONS } =
  buildOptionIndexes()

/**
 * Whether the registry declares this event option as producing this result.
 *
 * @param eventId - Candidate event id.
 * @param optionId - Candidate option id.
 * @param resultId - Candidate Expedition result id.
 * @returns True only when all three exist and belong together.
 */
export const isDeclaredExpeditionEventResult = (
  eventId: unknown,
  optionId: unknown,
  resultId: unknown
): boolean =>
  typeof eventId === 'string' &&
  typeof optionId === 'string' &&
  typeof resultId === 'string' &&
  (DECLARED_RESULTS.get(`${eventId}:${optionId}`)?.has(resultId) ?? false)

/**
 * Whether an event option's own `condition` allows choosing it in this state.
 *
 * @param state - State the option is being resolved against.
 * @param eventId - Candidate event id.
 * @param optionId - Candidate option id.
 * @returns True when the option declares no condition or its condition passes;
 * false when it fails or throws.
 *
 * @remarks
 * `EventModal` only disables a locked option. The reducer re-checks the same
 * condition so a direct dispatch cannot resolve an option the player could not
 * have picked (for example `tom_covers` below the Matze/Tom trust tier).
 */
export const isExpeditionEventOptionAvailable = (
  state: GameState,
  eventId: unknown,
  optionId: unknown
): boolean => {
  if (typeof eventId !== 'string' || typeof optionId !== 'string') return false
  const condition = OPTION_CONDITIONS.get(`${eventId}:${optionId}`)
  if (!condition) return true
  try {
    return Boolean(condition(state))
  } catch {
    return false
  }
}

/**
 * Whether a persisted `<eventId>:<optionId>:<resultId>:<routeStep>` proof is
 * structurally valid against the registry.
 *
 * @param value - Raw proof string from a save.
 * @returns True when the triple is declared and the route step is a
 * non-negative integer.
 *
 * @remarks
 * Ids never contain `:`, so the split is exact. A save that invents a proof
 * string therefore cannot name an event/option/result relationship the content
 * does not have.
 */
export const isValidExpeditionEventProofId = (value: unknown): boolean => {
  if (typeof value !== 'string') return false
  const parts = value.split(':')
  if (parts.length !== 4) return false
  const [eventId, optionId, resultId, routeStep] = parts
  if (!isDeclaredExpeditionEventResult(eventId, optionId, resultId))
    return false
  return /^\d+$/.test(routeStep ?? '')
}
