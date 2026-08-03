import type { QuestState } from '../types'
import { isForbiddenKey, isLooseRecord } from '../utils/gameState'
import { hasForbiddenKeysDeep } from '../utils/objectUtils'
import { isFiniteNumber } from '../utils/finiteNumber'
import { isQuestStateLike } from './questValidation'
import { getQuestDefinition } from '../data/questRegistry'

/**
 * A quest referenced by registry id alone.
 */
interface QuestIdPayload {
  kind: 'id'
  id: string
}

/**
 * A quest supplied inline as a full payload.
 */
interface InlineQuestPayload {
  kind: 'inline'
  id: string
  quest: QuestState
}

/**
 * Quest payload accepted at the resolver boundary.
 *
 * @remarks
 * A discriminated union rather than a loose record: the two shapes an event
 * can hand the resolver — a bare registry id and a full inline quest — need
 * different downstream handling, and `kind` makes the reducer's obligations
 * explicit at each call site instead of implicit in a `typeof` check.
 */
export type QuestPayload = QuestIdPayload | InlineQuestPayload

/**
 * Why a raw quest payload was rejected.
 *
 * @remarks
 * Rejection reasons are deliberately coarse and non-reflective: they name the
 * rule that failed, never the hostile value, so a crafted payload cannot write
 * itself into logs.
 */
type QuestPayloadRejection =
  /** Neither a non-empty string nor an object. */
  | 'not-a-quest'
  /** Missing, empty, or prototype-polluting `id`. */
  | 'invalid-id'
  /** `__proto__`, `constructor`, or `prototype` anywhere in the payload. */
  | 'forbidden-keys'
  /** `deadlineOffset` present but not a finite number. */
  | 'invalid-deadline-offset'
  /** Failed the structural quest guard. */
  | 'malformed-quest'
  /** Bare id that no registry definition backs. */
  | 'unknown-id'

/**
 * Result of narrowing a raw quest payload.
 */
export type QuestPayloadResult =
  | { ok: true; payload: QuestPayload }
  | { ok: false; reason: QuestPayloadRejection }

/**
 * Normalizes a `deadlineOffset` that may arrive as a number or numeric string.
 *
 * @param raw - Raw offset value.
 * @returns The finite offset, or `null` when it cannot be trusted.
 */
const normalizeDeadlineOffset = (raw: unknown): number | null => {
  if (isFiniteNumber(raw)) return raw
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const parsed = Number(raw)
    return isFiniteNumber(parsed) ? parsed : null
  }
  return null
}

/**
 * Narrows an untrusted quest payload at the resolver boundary.
 *
 * @param raw - Untrusted value from an event resolution delta.
 * @param currentDay - Day used to resolve a relative `deadlineOffset`.
 * @returns The narrowed payload, or the rule that rejected it.
 *
 * @remarks
 * `unknown` in, narrowed type out. The guard rejects hostile payloads rather
 * than coercing them into something plausible: a quest with a
 * prototype-polluting key, an unparseable deadline, or a structurally invalid
 * body is dropped, never repaired. The reducer stays authoritative — this is a
 * first gate, not a replacement for its own checks.
 */
export const parseQuestPayload = (
  raw: unknown,
  currentDay: number
): QuestPayloadResult => {
  if (typeof raw === 'string') {
    if (raw.length === 0 || isForbiddenKey(raw)) {
      return { ok: false, reason: 'invalid-id' }
    }
    // The id variant is by definition a registry reference: it carries no
    // rules, requirement, or deadline of its own, so an unbacked id (a typo, a
    // removed quest) would be added as an inert quest that can neither progress
    // nor expire while it holds a quest slot.
    if (!getQuestDefinition(raw)) return { ok: false, reason: 'unknown-id' }
    return { ok: true, payload: { kind: 'id', id: raw } }
  }

  if (!isLooseRecord(raw)) return { ok: false, reason: 'not-a-quest' }
  if (hasForbiddenKeysDeep(raw)) return { ok: false, reason: 'forbidden-keys' }

  const id = Object.hasOwn(raw, 'id') ? raw.id : undefined
  if (typeof id !== 'string' || id.length === 0 || isForbiddenKey(id)) {
    return { ok: false, reason: 'invalid-id' }
  }

  const quest: Record<string, unknown> = { ...raw }

  // A relative offset is resolved here so the reducer only ever sees an
  // absolute `deadline`; an offset it cannot resolve is a rejection, not a
  // quest that silently never expires.
  if (quest.deadlineOffset != null) {
    const offset = normalizeDeadlineOffset(quest.deadlineOffset)
    if (offset === null) {
      return { ok: false, reason: 'invalid-deadline-offset' }
    }
    quest.deadline = currentDay + offset
    delete quest.deadlineOffset
  }

  if (!isQuestStateLike(quest)) {
    return { ok: false, reason: 'malformed-quest' }
  }

  return { ok: true, payload: { kind: 'inline', id, quest } }
}

/**
 * Collapses a narrowed payload to the quest object the reducer accepts.
 *
 * @param payload - Narrowed quest payload.
 * @returns The inline quest, or a minimal `{ id }` for the id-only variant.
 */
export const toQuestState = (payload: QuestPayload): QuestState =>
  payload.kind === 'inline' ? payload.quest : ({ id: payload.id } as QuestState)
