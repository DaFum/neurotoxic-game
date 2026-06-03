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
import { isForbiddenKey, isLooseRecord } from './objectUtils'

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
  fame_gained: 'region.reputationChanged',
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
  venue_reputation_changed: 'venue.reputationChanged',
  story_flag_added: 'story.flagAdded'
}

const CANONICAL_EVENT_TYPE_VALUES = [
  'gig.completed',
  'gig.good',
  'gig.smallVenueGood',
  'social.postResolved',
  'social.followersGained',
  'social.loyaltyChanged',
  'social.controversyChanged',
  'social.trendMatched',
  'brand.offerAccepted',
  'brand.dealCompleted',
  'brand.dealFailed',
  'brand.trustChanged',
  'asset.acquired',
  'asset.repaired',
  'asset.moduleInstalled',
  'asset.riskTriggered',
  'asset.riskResolved',
  'asset.conditionChanged',
  'item.collected',
  'item.used',
  'item.crafted',
  'item.delivered',
  'minigame.completed',
  'minigame.perfect',
  'minigame.failed',
  'travel.completed',
  'economy.moneyEarned',
  'band.harmonyChanged',
  'venue.gigCompleted',
  'venue.goodGig',
  'venue.reputationChanged',
  'venue.blacklisted',
  'venue.unblacklisted',
  'region.reputationChanged',
  'story.flagAdded'
] as const satisfies readonly QuestEventType[]

const CANONICAL_EVENT_TYPES = new Set<string>(CANONICAL_EVENT_TYPE_VALUES)
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
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
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
  return (record[key] as unknown[]).filter(
    (entry): entry is string => typeof entry === 'string'
  )
}

const canonicalizeEventType = (
  eventType: QuestEventType | QuestProgressSource | string
): QuestEventType | undefined => {
  if (CANONICAL_EVENT_TYPES.has(eventType)) {
    return eventType as QuestEventType
  }
  return LEGACY_EVENT_TYPES[eventType as QuestProgressSource]
}

const getEventRecord = (event: QuestProgressEvent): Record<string, unknown> =>
  event as unknown as Record<string, unknown>

const getEventContext = (event: QuestProgressEvent): QuestEventContext => {
  const eventRecord = getEventRecord(event)
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

const getEventAmount = (event: QuestProgressEvent): number | undefined =>
  readOwnNumber(getEventRecord(event), 'amount')

const getEventSuccess = (event: QuestProgressEvent): boolean | undefined =>
  readOwnBoolean(getEventRecord(event), 'success')

const getEventTags = (event: QuestProgressEvent): string[] => {
  const tags = readOwnStringArray(getEventRecord(event), 'tags')
  return tags ?? []
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

const legacyProgressAmount = (
  source: QuestProgressSource
): QuestProgressRule['amount'] => {
  switch (source) {
    case 'followers_gained':
    case 'fame_gained':
    case 'money_earned':
      return 'event.amount'
    case 'harmony_recovered':
      return 'threshold'
    default:
      return 'fixed'
  }
}

const normalizeProgressRules = (
  quest: QuestState,
  repeatPolicy: QuestRepeatPolicy | undefined
): QuestProgressRule[] => {
  const declaredRules = Array.isArray(quest.progressRules)
    ? quest.progressRules
    : quest.progressRule
      ? [quest.progressRule]
      : []
  if (declaredRules.length > 0) {
    return declaredRules.map(rule => withDefaultScope(rule, repeatPolicy))
  }

  if (!quest.progressSource) return []
  return [
    withDefaultScope(
      {
        event: quest.progressSource,
        amount: legacyProgressAmount(quest.progressSource),
        fixedAmount: 1,
        thresholdField:
          quest.progressSource === 'harmony_recovered'
            ? 'band.harmony'
            : undefined
      },
      repeatPolicy
    )
  ]
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

const questRuleMatchesEvent = (
  quest: QuestState,
  rule: QuestProgressRule,
  event: QuestProgressEvent
): boolean => {
  const ruleEvent = canonicalizeEventType(rule.event)
  const actualEvent = canonicalizeEventType(event.type)
  if (!ruleEvent || !actualEvent || ruleEvent !== actualEvent) return false

  const context = getEventContext(event)
  const match = rule.match
  if (!matchesScope(quest, match, context)) return false
  if (!match) return true

  if (!matchesString(match.platform, context.platform)) return false
  if (!matchesString(match.postCategory, context.postCategory)) return false
  if (
    !matchesString(match.category, context.category ?? context.postCategory)
  ) {
    return false
  }
  if (!matchesString(match.dealType, context.dealType)) return false
  if (!matchesString(match.brandId, context.brandId)) return false
  if (!matchesString(match.brandAlignment, context.brandAlignment)) return false
  if (!matchesString(match.assetKind, context.assetKind)) return false
  if (!matchesString(match.moduleId, context.moduleId)) return false
  if (!matchesString(match.slotType, context.slotType)) return false
  if (!matchesString(match.riskType, context.riskType)) return false
  if (!matchesString(match.minigameId, context.minigameId)) return false
  if (!matchesString(match.itemId, context.itemId)) return false
  if (!matchesString(match.recipeId, context.recipeId)) return false

  if (match.success !== undefined) {
    const success = getEventSuccess(event)
    if (success !== match.success) return false
  }

  if (typeof match.minScore === 'number') {
    if (typeof context.score !== 'number' || context.score < match.minScore) {
      return false
    }
  }

  if (Array.isArray(match.tags) && match.tags.length > 0) {
    const tags = getEventTags(event)
    if (!match.tags.every(tag => tags.includes(tag))) return false
  }

  return true
}

const getThresholdValue = (
  rule: QuestProgressRule,
  event: QuestProgressEvent
): number => {
  const context = getEventContext(event)
  switch (rule.thresholdField) {
    case 'social.loyalty':
      return typeof context.loyalty === 'number' ? context.loyalty : 0
    case 'asset.condition':
      return typeof context.condition === 'number' ? context.condition : 0
    case 'band.harmony':
    default:
      return typeof context.harmony === 'number' ? context.harmony : 0
  }
}

const calculateProgressAmount = (
  rule: QuestProgressRule,
  event: QuestProgressEvent
): number => {
  switch (rule.amount) {
    case 'event.amount':
      return getEventAmount(event) ?? 0
    case 'event.score': {
      const score = getEventContext(event).score
      return typeof score === 'number' ? score : 0
    }
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

export const QuestProgress = {
  applyEvent: (state: GameState, event: QuestProgressEvent): GameState => {
    let nextState = { ...state }
    if (!nextState.activeQuests) return nextState

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
        if (!questRuleMatchesEvent(quest, rule, event)) continue

        const amount = calculateProgressAmount(rule, event)
        if (rule.amount === 'threshold') {
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
