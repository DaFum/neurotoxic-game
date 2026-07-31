import type {
  QuestKind,
  QuestRepeatPolicy,
  QuestState,
  QuestStatus
} from '../types'
import { isForbiddenKey, isLooseRecord } from '../utils/gameState'
import { isFiniteNumber } from '../utils/finiteNumber'

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
const QUEST_STATUSES = new Set<QuestStatus>(['active', 'completed', 'failed'])
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

/**
 * Narrows a raw quest payload before it reaches lifecycle code.
 * Unknown benign fields are retained for legacy compatibility, while fields
 * consumed structurally by quest logic must have their declared container type.
 */
export const isQuestStateLike = (value: unknown): value is QuestState => {
  if (!isLooseRecord(value)) return false
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
  for (const field of STRING_FIELDS) {
    if (value[field] !== undefined && typeof value[field] !== 'string') {
      return false
    }
  }

  if (value.progressRule !== undefined && !isLooseRecord(value.progressRule)) {
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
