import type {
  QuestKind,
  QuestRepeatPolicy,
  QuestState,
  QuestStatus
} from '../types'
import { isForbiddenKey, isLooseRecord } from '../utils/gameState'
import { hasForbiddenKeysDeep } from '../utils/objectUtils'
import { isFiniteNumber } from '../utils/finiteNumber'
import { CANONICAL_QUEST_EVENT_TYPES } from '../data/questEventTypes'
import { QUEST_PROGRESS_SOURCES } from '../data/questProgressSources'

const QUEST_KINDS = new Set<QuestKind>([
  'story',
  'side',
  'repeatable',
  'tutorial'
])
const QUEST_REPEAT_POLICIES = new Set<QuestRepeatPolicy>([
  'never',
  'cooldown',
  'perVenue',
  'perRegion'
])
const QUEST_STATUSES = new Set<QuestStatus>(['active'])
const ARRAY_FIELDS = [
  'progressRules',
  'rewards',
  'failurePenalties',
  'startFlags',
  'completionFlags',
  'failureFlags',
  'clearFlagsOnComplete',
  'clearFlagsOnFail'
] as const
const FINITE_NUMBER_FIELDS = [
  'deadlineOffset',
  'required',
  'moneyReward',
  'cooldownDays',
  'deadline',
  'progress',
  'startedOnDay'
] as const
const STRING_FIELDS = [
  'label',
  'description',
  'rewardType',
  'rewardFlag',
  'progressSource',
  'followupQuestId',
  'scopeKey'
] as const
const KNOWN_RULE_EVENTS: ReadonlySet<string> = new Set([
  ...CANONICAL_QUEST_EVENT_TYPES,
  ...QUEST_PROGRESS_SOURCES
])
const PROGRESS_AMOUNT_MODES: ReadonlySet<string> = new Set([
  'fixed',
  'event.amount',
  'event.score',
  'threshold'
])

/**
 * A rule only counts as valid when its event name is one a producer actually
 * emits: an inline quest carrying `event: 'gig.completedd'` would otherwise be
 * admitted, never match, and — without a deadline — hold its slot forever.
 * Legacy `progressSource` names are accepted because `migrateLegacyQuestSchema`
 * folds them into rules verbatim and the progress engine canonicalizes them.
 */
const isProgressRuleLike = (value: unknown): boolean => {
  if (!isLooseRecord(value)) return false
  if (typeof value.event !== 'string' || !KNOWN_RULE_EVENTS.has(value.event)) {
    return false
  }
  if (
    value.amount !== undefined &&
    (typeof value.amount !== 'string' ||
      !PROGRESS_AMOUNT_MODES.has(value.amount))
  ) {
    return false
  }
  if (value.match !== undefined && !isLooseRecord(value.match)) return false
  return true
}

/**
 * Narrows a raw quest payload before it reaches lifecycle code.
 * Unknown benign fields are retained for legacy compatibility, while fields
 * consumed structurally by quest logic must have their declared container type.
 */
export const isQuestStateLike = (value: unknown): value is QuestState => {
  if (!isLooseRecord(value)) return false
  if (hasForbiddenKeysDeep(value)) return false
  if (
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    isForbiddenKey(value.id)
  ) {
    return false
  }

  if (
    value.kind !== undefined &&
    (typeof value.kind !== 'string' ||
      !QUEST_KINDS.has(value.kind as QuestKind))
  ) {
    return false
  }
  if (
    value.repeatPolicy !== undefined &&
    (typeof value.repeatPolicy !== 'string' ||
      !QUEST_REPEAT_POLICIES.has(value.repeatPolicy as QuestRepeatPolicy))
  ) {
    return false
  }
  if (
    value.status !== undefined &&
    (typeof value.status !== 'string' ||
      !QUEST_STATUSES.has(value.status as QuestStatus))
  ) {
    return false
  }

  for (const field of ARRAY_FIELDS) {
    if (value[field] !== undefined && !Array.isArray(value[field])) return false
  }
  for (const field of FINITE_NUMBER_FIELDS) {
    const fieldValue = value[field]
    if (
      fieldValue !== undefined &&
      !(field === 'deadline' && fieldValue === null) &&
      !isFiniteNumber(fieldValue)
    ) {
      return false
    }
  }
  if (
    value.required !== undefined &&
    (!isFiniteNumber(value.required) || value.required <= 0)
  ) {
    return false
  }
  for (const field of STRING_FIELDS) {
    if (value[field] !== undefined && typeof value[field] !== 'string') {
      return false
    }
  }
  // A bare progressSource is migrated into a rule verbatim, so an unsupported
  // name would produce exactly the never-matching rule the rule guard rejects.
  if (
    value.progressSource !== undefined &&
    !QUEST_PROGRESS_SOURCES.has(value.progressSource as string)
  ) {
    return false
  }
  // `completeQuest` only writes a cooldown entry for a positive `cooldownDays`.
  // A 'cooldown' quest without one is not blocked by `completedQuestIds`
  // either, so it would be immediately re-acceptable — a repeatable quest
  // wearing a one-shot policy.
  if (
    value.repeatPolicy === 'cooldown' &&
    !(isFiniteNumber(value.cooldownDays) && value.cooldownDays > 0)
  ) {
    return false
  }

  // Element shape matters here, not just the container: `QuestProgress` maps
  // over every declared rule and dereferences `rule.match`, so a primitive
  // entry would throw on the next quest event instead of being inert.
  if (
    value.progressRules !== undefined &&
    !(value.progressRules as unknown[]).every(isProgressRuleLike)
  ) {
    return false
  }

  if (
    value.progressRule !== undefined &&
    !isProgressRuleLike(value.progressRule)
  ) {
    return false
  }
  if (value.offer !== undefined && !isLooseRecord(value.offer)) return false
  if (value.rewardData !== undefined && !isLooseRecord(value.rewardData)) {
    return false
  }
  if (
    value.failurePenalty !== undefined &&
    !isLooseRecord(value.failurePenalty)
  ) {
    return false
  }

  return true
}
