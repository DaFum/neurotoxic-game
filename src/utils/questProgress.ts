import type {
  GameState,
  QuestEvent,
  QuestEventContext,
  QuestEventType,
  QuestProgressRule,
  QuestProgressRuleMatch,
  QuestProgressSource,
  QuestRepeatPolicy,
  QuestState,
  BrandDealType
} from '../types'
import { QuestLifecycle } from '../domain/questLifecycle'
import { getQuestDefinition } from '../data/questRegistry'
import { CANONICAL_QUEST_EVENT_TYPES } from '../data/questEventTypes'
import { isForbiddenKey, isLooseRecord } from './objectUtils'
import { finiteNumberOr, isFiniteNumber } from './finiteNumber'

const INVALID_THRESHOLD_PROGRESS = Number.NaN

/**
 * Legacy quest progress event shapes accepted for save and caller compatibility.
 */
export type LegacyQuestProgressEvent =
  | {
      type: 'gig_completed'
      score: number
      capacity: number
      venueId: string
      region: string
    }
  | {
      type: 'good_gig'
      score: number
      capacity: number
      venueId: string
      region: string
    }
  | {
      type: 'small_venue_good_gig'
      score: number
      capacity: number
      venueId: string
      region: string
    }
  | {
      type: 'social_post'
      postType: string
      followersGain: number
      platform?: string
      category?: string
      success?: boolean
    }
  | {
      type: 'followers_gained'
      amount: number
      platform?: string
      category?: string
    }
  | { type: 'fame_gained'; amount: number; region?: string }
  | { type: 'money_earned'; amount: number }
  | { type: 'harmony_recovered'; amount: number; newHarmony: number }
  | { type: 'item_collected'; itemId: string }
  | {
      type: 'brand_deal_completed'
      dealId: string
      dealType?: string
      brandAlignment?: string
    }
  | { type: 'travel_completed'; region: string }

export type QuestProgressEvent = QuestEvent | LegacyQuestProgressEvent

const LEGACY_EVENT_TYPES: Record<QuestProgressSource, QuestEventType> = {
  gig_completed: 'gig.completed',
  good_gig: 'gig.good',
  small_venue_good_gig: 'gig.smallVenueGood',
  social_post: 'social.postResolved',
  followers_gained: 'social.followersGained',
  fame_gained: 'fame.gained',
  money_earned: 'economy.moneyEarned',
  harmony_recovered: 'band.harmonyChanged',
  item_collected: 'item.collected',
  item_delivered: 'item.delivered',
  item_crafted: 'item.crafted',
  brand_deal_completed: 'brand.dealCompleted',
  brand_deal_failed: 'brand.dealFailed',
  brand_trust_changed: 'brand.trustChanged',
  travel_completed: 'travel.completed',
  minigame_perfected: 'minigame.perfect',
  asset_risk_triggered: 'asset.riskTriggered',
  asset_risk_resolved: 'asset.riskResolved',
  venue_blacklisted: 'venue.blacklisted',
  venue_unblacklisted: 'venue.unblacklisted',
  region_reputation_changed: 'region.reputationChanged',
  story_flag_added: 'story.flagAdded'
}

const CANONICAL_EVENT_TYPES = new Set<string>(CANONICAL_QUEST_EVENT_TYPES)
const BRAND_DEAL_TYPES = new Set<string>([
  'SPONSORSHIP',
  'ENDORSEMENT',
  'RECORD_DEAL'
])

const isBrandDealType = (value: string): value is BrandDealType =>
  BRAND_DEAL_TYPES.has(value)

const readOwnString = (
  record: Record<string, unknown>,
  key: string
): string | undefined => {
  if (!Object.hasOwn(record, key)) return undefined
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

const readOwnNumber = (
  record: Record<string, unknown>,
  key: string
): number | undefined => {
  if (!Object.hasOwn(record, key)) return undefined
  const value = record[key]
  return isFiniteNumber(value) ? value : undefined
}

const readOwnBoolean = (
  record: Record<string, unknown>,
  key: string
): boolean | undefined => {
  if (!Object.hasOwn(record, key)) return undefined
  const value = record[key]
  return typeof value === 'boolean' ? value : undefined
}

const readOwnStringArray = (
  record: Record<string, unknown>,
  key: string
): string[] | undefined => {
  if (!Object.hasOwn(record, key) || !Array.isArray(record[key])) {
    return undefined
  }
  const arr = record[key] as unknown[]
  const result: string[] = []
  for (let i = 0; i < arr.length; i++) {
    const entry = arr[i]
    if (typeof entry === 'string') {
      result.push(entry)
    }
  }
  return result
}

const canonicalizeEventType = (
  eventType: QuestEventType | QuestProgressSource | string
): QuestEventType | undefined => {
  if (CANONICAL_EVENT_TYPES.has(eventType)) {
    return eventType as QuestEventType
  }
  return LEGACY_EVENT_TYPES[eventType as QuestProgressSource]
}

/**
 * A quest event reduced to its canonical, hardened form.
 *
 * @remarks
 * Legacy and canonical event shapes are converted into this structure exactly
 * once per emitted event, so rule matching and progress calculation never
 * re-parse untrusted input.
 */
export type NormalizedQuestEvent = {
  type: QuestEventType
  context: QuestEventContext
  amount: number | undefined
  success: boolean | undefined
  tags: readonly string[]
}

const buildEventContext = (
  eventRecord: Record<string, unknown>
): QuestEventContext => {
  const context = Object.create(null) as QuestEventContext
  const rawContext = Object.hasOwn(eventRecord, 'context')
    ? eventRecord.context
    : undefined
  if (isLooseRecord(rawContext)) {
    for (const key of Object.keys(rawContext)) {
      if (isForbiddenKey(key)) continue
      context[key] = rawContext[key]
    }
  }

  const stringKeys = [
    'venueId',
    'region',
    'platform',
    'dealId',
    'brandAlignment',
    'assetId',
    'assetKind',
    'moduleId',
    'slotType',
    'riskType',
    'itemId',
    'minigameId',
    'grade',
    'flag'
  ] as const
  for (const key of stringKeys) {
    const value = readOwnString(eventRecord, key)
    if (value !== undefined) context[key] = value
  }
  const dealType = readOwnString(eventRecord, 'dealType')
  if (dealType !== undefined && isBrandDealType(dealType)) {
    context.dealType = dealType
  }

  const numberKeys = ['score', 'capacity'] as const
  for (const key of numberKeys) {
    const value = readOwnNumber(eventRecord, key)
    if (value !== undefined) context[key] = value
  }

  const category = readOwnString(eventRecord, 'category')
  if (category !== undefined) {
    context.category = category
    if (context.postCategory === undefined) context.postCategory = category
  } else if (
    typeof context.category === 'string' &&
    context.postCategory === undefined
  ) {
    context.postCategory = context.category
  }

  const postType = readOwnString(eventRecord, 'postType')
  if (postType !== undefined && context.postId === undefined) {
    context.postId = postType
  }

  const newHarmony = readOwnNumber(eventRecord, 'newHarmony')
  if (newHarmony !== undefined) context.harmony = newHarmony

  return context
}

/**
 * Converts a legacy or canonical quest event into its normalized form.
 *
 * @param event - Emitted quest event, possibly in a legacy shape.
 * @returns The normalized event, or `undefined` when the type is unknown.
 */
const normalizeQuestEvent = (
  event: QuestProgressEvent
): NormalizedQuestEvent | undefined => {
  const type = canonicalizeEventType(event.type)
  if (!type) return undefined
  const eventRecord = event as unknown as Record<string, unknown>
  return {
    type,
    context: buildEventContext(eventRecord),
    amount: readOwnNumber(eventRecord, 'amount'),
    success: readOwnBoolean(eventRecord, 'success'),
    tags: readOwnStringArray(eventRecord, 'tags') ?? []
  }
}

const withDefaultScope = (
  rule: QuestProgressRule,
  repeatPolicy: QuestRepeatPolicy | undefined
): QuestProgressRule => {
  if (rule.match?.scope || repeatPolicy == null) return rule
  if (repeatPolicy === 'perVenue') {
    return { ...rule, match: { ...(rule.match ?? {}), scope: 'venue' } }
  }
  if (repeatPolicy === 'perRegion') {
    return { ...rule, match: { ...(rule.match ?? {}), scope: 'region' } }
  }
  return rule
}

const normalizeProgressRules = (
  quest: QuestState,
  repeatPolicy: QuestRepeatPolicy | undefined
): QuestProgressRule[] => {
  // Single container: migrateLegacyQuestSchema folds the singular
  // progressRule and a bare progressSource into progressRules at the
  // addQuest and save-load boundaries, so this runs per event per quest
  // without re-deciding which of three shapes the quest uses.
  if (!Array.isArray(quest.progressRules)) return []
  return quest.progressRules.map(rule => withDefaultScope(rule, repeatPolicy))
}

const matchesString = (
  expected: string | string[] | undefined,
  actual: unknown
): boolean => {
  if (expected === undefined) return true
  if (typeof actual !== 'string') return false
  return Array.isArray(expected)
    ? expected.includes(actual)
    : expected === actual
}

const matchesScope = (
  quest: QuestState,
  match: QuestProgressRuleMatch | undefined,
  context: QuestEventContext
): boolean => {
  const scope = match?.scope
  if (!scope || scope === 'none') return true
  if (typeof quest.scopeKey !== 'string' || quest.scopeKey.length === 0) {
    return false
  }
  if (scope === 'venue') {
    return context.venueId === quest.scopeKey
  }
  if (scope === 'region') {
    return context.region === quest.scopeKey
  }
  return true
}

/**
 * Match fields whose rule key and event-context key are the same name and
 * compare with plain string equality.
 */
const STRING_MATCH_FIELDS = [
  'platform',
  'postCategory',
  'dealType',
  'brandId',
  'brandAlignment',
  'assetKind',
  'moduleId',
  'slotType',
  'riskType',
  'minigameId',
  'itemId',
  'recipeId'
] as const satisfies ReadonlyArray<
  keyof QuestProgressRuleMatch & keyof QuestEventContext
>

const questRuleMatchesEvent = (
  quest: QuestState,
  rule: QuestProgressRule,
  event: NormalizedQuestEvent
): boolean => {
  const ruleEvent = canonicalizeEventType(rule.event)
  if (!ruleEvent || ruleEvent !== event.type) return false

  const { context } = event
  const match = rule.match
  if (!matchesScope(quest, match, context)) return false
  if (!match) return true

  for (const field of STRING_MATCH_FIELDS) {
    if (!matchesString(match[field], context[field])) return false
  }
  // `category` falls back to the post category so social rules can match
  // either spelling.
  if (
    !matchesString(match.category, context.category ?? context.postCategory)
  ) {
    return false
  }

  if (match.success !== undefined && event.success !== match.success) {
    return false
  }

  if (match.minScore !== undefined) {
    if (
      !isFiniteNumber(match.minScore) ||
      !isFiniteNumber(context.score) ||
      context.score < match.minScore
    ) {
      return false
    }
  }

  if (Array.isArray(match.tags) && match.tags.length > 0) {
    if (!match.tags.every(tag => event.tags.includes(tag))) return false
  }

  return true
}

const getThresholdValue = (
  rule: QuestProgressRule,
  { context }: NormalizedQuestEvent
): number => {
  switch (rule.thresholdField) {
    case 'social.loyalty':
      return isFiniteNumber(context.loyalty)
        ? context.loyalty
        : INVALID_THRESHOLD_PROGRESS
    case 'asset.condition':
      return isFiniteNumber(context.condition)
        ? context.condition
        : INVALID_THRESHOLD_PROGRESS
    case 'band.harmony':
    default:
      return isFiniteNumber(context.harmony)
        ? context.harmony
        : INVALID_THRESHOLD_PROGRESS
  }
}

const calculateProgressAmount = (
  rule: QuestProgressRule,
  event: NormalizedQuestEvent
): number => {
  switch (rule.amount) {
    case 'event.amount':
      return event.amount ?? 0
    case 'event.score':
      return finiteNumberOr(event.context.score, 0)
    case 'threshold':
      return getThresholdValue(rule, event)
    case 'fixed':
    default:
      return typeof rule.fixedAmount === 'number' &&
        Number.isFinite(rule.fixedAmount)
        ? rule.fixedAmount
        : 1
  }
}

/**
 * Applies gameplay events to active quest progress rules.
 */
export const QuestProgress = {
  applyEvent: (state: GameState, event: QuestProgressEvent): GameState => {
    let nextState = { ...state }
    if (!nextState.activeQuests) return nextState

    // Parse the untrusted event once; every quest and rule reads the result.
    const normalizedEvent = normalizeQuestEvent(event)
    if (!normalizedEvent) return nextState

    for (const activeQuest of nextState.activeQuests) {
      if (!activeQuest) continue
      const registryEntry = getQuestDefinition(activeQuest.id)
      // Registry-backed active quests normally carry runtime fields only.
      // Ad-hoc/legacy quests keep inline rules because activeQuest spread wins.
      const quest: QuestState = registryEntry
        ? { ...(registryEntry as Partial<QuestState>), ...activeQuest }
        : activeQuest
      const repeatPolicy = quest.repeatPolicy
      const rules = normalizeProgressRules(quest, repeatPolicy)
      if (rules.length === 0) continue

      for (const rule of rules) {
        if (!questRuleMatchesEvent(quest, rule, normalizedEvent)) continue

        const amount = calculateProgressAmount(rule, normalizedEvent)
        if (rule.amount === 'threshold') {
          if (!Number.isFinite(amount)) break
          nextState = QuestLifecycle.setQuestProgress(nextState, {
            questId: quest.id,
            progress: amount
          })
        } else if (amount > 0) {
          nextState = QuestLifecycle.advanceQuest(nextState, {
            questId: quest.id,
            amount
          })
        }
        break
      }
    }

    return nextState
  }
}

/**
 * Public quest-event facade. Gameplay systems must go through this or the
 * `applyQuestEvent` action rather than targeting concrete quest ids.
 */
export const QuestEvents = {
  emit: (state: GameState, event: QuestProgressEvent): GameState =>
    QuestProgress.applyEvent(state, event)
}
