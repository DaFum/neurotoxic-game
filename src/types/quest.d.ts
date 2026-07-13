import type { UnknownRecord } from './game'
import type { BrandDealType } from './social'

/**
 * Quest category used for story, side, repeatable, and tutorial flows.
 */
export type QuestKind = 'story' | 'side' | 'repeatable' | 'tutorial'
/**
 * Lifecycle status of a quest instance.
 */
export type QuestStatus = 'active' | 'completed' | 'failed'
/**
 * Policy controlling when a quest can be offered again.
 */
export type QuestRepeatPolicy = 'never' | 'cooldown' | 'perVenue' | 'perRegion'

/**
 * Legacy progress source identifiers accepted by quest rules.
 */
export type QuestProgressSource =
  | 'gig_completed'
  | 'good_gig'
  | 'small_venue_good_gig'
  | 'social_post'
  | 'followers_gained'
  | 'fame_gained'
  | 'money_earned'
  | 'harmony_recovered'
  | 'item_collected'
  | 'item_delivered'
  | 'item_crafted'
  | 'brand_deal_completed'
  | 'brand_deal_failed'
  | 'brand_trust_changed'
  | 'travel_completed'
  | 'minigame_perfected'
  | 'asset_risk_triggered'
  | 'asset_risk_resolved'
  | 'venue_blacklisted'
  | 'venue_unblacklisted'
  | 'venue_reputation_changed'
  | 'story_flag_added'

/**
 * Canonical quest event identifiers emitted by gameplay systems.
 */
export type QuestEventType =
  | 'gig.completed'
  | 'gig.good'
  | 'gig.smallVenueGood'
  | 'social.postResolved'
  | 'social.followersGained'
  | 'social.loyaltyChanged'
  | 'social.controversyChanged'
  | 'social.trendMatched'
  | 'brand.offerAccepted'
  | 'brand.dealCompleted'
  | 'brand.dealFailed'
  | 'brand.trustChanged'
  | 'asset.acquired'
  | 'asset.repaired'
  | 'asset.moduleInstalled'
  | 'asset.riskTriggered'
  | 'asset.riskResolved'
  | 'asset.conditionChanged'
  | 'item.collected'
  | 'item.used'
  | 'item.crafted'
  | 'item.delivered'
  | 'minigame.completed'
  | 'minigame.perfect'
  | 'minigame.failed'
  | 'travel.completed'
  | 'economy.moneyEarned'
  | 'fame.gained'
  | 'band.harmonyChanged'
  | 'venue.gigCompleted'
  | 'venue.goodGig'
  | 'venue.reputationChanged'
  | 'venue.blacklisted'
  | 'venue.unblacklisted'
  | 'region.reputationChanged'
  | 'story.flagAdded'

/**
 * Structured context attached to quest events for rule matching.
 */
export interface QuestEventContext extends UnknownRecord {
  venueId?: string
  region?: string
  cityId?: string
  capacity?: number
  platform?: string
  postId?: string
  postCategory?: string
  reason?: string
  trendId?: string
  category?: string
  dealId?: string
  dealType?: BrandDealType
  brandId?: string
  brandAlignment?: string
  assetId?: string
  assetKind?: string
  flavor?: string
  tier?: number
  moduleId?: string
  slotType?: string
  riskType?: string
  itemId?: string
  recipeId?: string
  minigameId?: string
  score?: number
  grade?: string
  damage?: number
  memberId?: string
  traitId?: string
  flag?: string
  harmony?: number
  loyalty?: number
  condition?: number
}

/**
 * Quest event payload emitted into the quest-progress system.
 */
export interface QuestEvent {
  type: QuestEventType
  amount?: number
  success?: boolean
  tags?: string[]
  context?: QuestEventContext
}

/**
 * Mode for deriving progress increments from quest events.
 */
export type QuestProgressAmountMode =
  'fixed' | 'event.amount' | 'event.score' | 'threshold'

/**
 * Optional filters that narrow which quest events match a rule.
 */
export interface QuestProgressRuleMatch {
  scope?: 'venue' | 'region' | 'none'
  platform?: string | string[]
  postCategory?: string | string[]
  category?: string | string[]
  dealType?: BrandDealType | BrandDealType[]
  brandId?: string | string[]
  brandAlignment?: string | string[]
  assetKind?: string | string[]
  moduleId?: string | string[]
  slotType?: string | string[]
  riskType?: string | string[]
  minigameId?: string | string[]
  itemId?: string | string[]
  recipeId?: string | string[]
  tags?: string[]
  minScore?: number
  success?: boolean
}

/**
 * Rule that converts matching quest events into progress.
 */
export interface QuestProgressRule {
  event: QuestEventType | QuestProgressSource
  amount?: QuestProgressAmountMode
  fixedAmount?: number
  thresholdField?: 'band.harmony' | 'social.loyalty' | 'asset.condition'
  match?: QuestProgressRuleMatch
}

/**
 * Effect variants shared by both quest rewards and penalties (the sign/meaning
 * of `amount` is interpreted by the applying reducer). Extracted so the common
 * variants are declared once instead of in each union.
 */
export type QuestEffectCommon =
  | { type: 'social.loyalty'; amount: number }
  | { type: 'social.controversy'; amount: number }
  | { type: 'band.harmony'; amount: number }
  | { type: 'venue.reputation'; amount: number; scope?: 'current' | string }
  | { type: 'region.reputation'; amount: number; scope?: 'current' | string }
  | {
      type: 'brand.trust'
      brandId?: string
      alignment?: string
      amount: number
    }
  | { type: 'flag.add'; flag: string }
  | { type: 'event.queue'; eventId: string }

/**
 * Reward effects applied when a quest completes.
 */
export type QuestReward =
  | QuestEffectCommon
  | { type: 'money'; amount: number }
  | { type: 'fame'; amount: number }
  | { type: 'social.followers'; platform?: string; amount: number }
  | {
      type: 'asset.repair'
      assetId?: string
      assetKind?: string
      amount: number
    }
  | { type: 'item.add'; itemId: string; amount?: number }
  | { type: 'trait.unlock'; memberId?: string; traitId: string }
  | { type: 'skill_point'; memberIndex?: number }

/**
 * Penalty effects applied when a quest fails.
 */
export type QuestPenalty =
  | QuestEffectCommon
  | {
      type: 'asset.damage'
      assetId?: string
      assetKind?: string
      amount: number
    }
  | { type: 'quest.cooldown'; days: number }

/**
 * State predicates that gate random or contextual quest offers.
 */
export interface QuestOfferCondition {
  band?: {
    harmonyBelow?: number
  }
  social?: {
    loyaltyBelow?: number
    controversyAbove?: number
    minTiktok?: number
    maxTiktok?: number
  }
  currentNodeType?: string
  requiredAssetKind?: string
  minFame?: number
  requireLocation?: boolean
}

/**
 * Configuration for when and how a quest can be offered.
 */
export interface QuestOfferDefinition {
  trigger: 'random' | 'post_gig' | 'story' | 'travel'
  category: string
  chance: number
  condition?: QuestOfferCondition
}

/**
 * Fields shared by the static {@link QuestDefinition} and the persisted
 * {@link QuestState}. Declared once so a new quest field is added in a single
 * place rather than being duplicated (and silently dropped from one side).
 */
interface QuestCommon extends UnknownRecord {
  label?: string
  description?: string
  deadlineOffset?: number
  required?: number
  rewardType?: string
  rewardData?: UnknownRecord
  rewardFlag?: string
  moneyReward?: number
  failurePenalty?: UnknownRecord

  kind?: QuestKind
  repeatPolicy?: QuestRepeatPolicy
  progressSource?: QuestProgressSource
  progressRule?: QuestProgressRule
  progressRules?: QuestProgressRule[]
  rewards?: QuestReward[]
  failurePenalties?: QuestPenalty[]
  offer?: QuestOfferDefinition
  startFlags?: string[]
  completionFlags?: string[]
  failureFlags?: string[]
  clearFlagsOnComplete?: string[]
  clearFlagsOnFail?: string[]
  cooldownDays?: number
  followupQuestId?: string
}

/**
 * Static quest definition merged into runtime quest state.
 */
export interface QuestDefinition extends QuestCommon {
  id?: string
}

/**
 * Runtime state for an active quest shown to the player.
 */
export interface ActiveQuestState extends UnknownRecord {
  id: string
  progress?: number
  required?: number
  deadline?: number | null
  scopeKey?: string
  status?: 'active'
  startedOnDay?: number
}

/**
 * Persisted quest instance with definition and runtime fields.
 */
export interface QuestState extends QuestCommon {
  id: string
  deadline?: number | null
  progress?: number
  status?: QuestStatus

  /**
   * For `perVenue`/`perRegion` quests, the scope key (venue id or region name)
   * the quest instance is bound to. Stamped by `addQuest` from current state.
   */
  scopeKey?: string
  startedOnDay?: number
}

/**
 * Tracks a `repeatPolicy: 'cooldown'` quest that may not be re-added until
 * the in-game day reaches `expiresOnDay`.
 */
export interface QuestCooldown {
  questId: string
  expiresOnDay: number
}

/**
 * Tracks completed scoped quests (per-venue / per-region). A quest id paired
 * with the scope key it was completed for; re-adding for the same scope is
 * refused, but other scopes remain available.
 */
export interface QuestScopeCompletion {
  questId: string
  scopeKey: string
}
