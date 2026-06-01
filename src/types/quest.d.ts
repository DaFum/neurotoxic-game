import type { UnknownRecord } from './game'

export type QuestKind = 'story' | 'side' | 'repeatable' | 'tutorial'
export type QuestStatus = 'active' | 'completed' | 'failed'
export type QuestRepeatPolicy =
  | 'never'
  | 'cooldown'
  | 'daily'
  | 'perVenue'
  | 'perRegion'

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
  | 'brand_deal_completed'
  | 'travel_completed'

export type QuestEventType =
  | 'gig.completed'
  | 'gig.good'
  | 'gig.smallVenueGood'
  | 'social.postResolved'
  | 'social.followersGained'
  | 'brand.dealCompleted'
  | 'asset.acquired'
  | 'asset.repaired'
  | 'asset.moduleInstalled'
  | 'asset.riskResolved'
  | 'item.collected'
  | 'item.used'
  | 'minigame.completed'
  | 'travel.completed'
  | 'economy.moneyEarned'
  | 'band.harmonyChanged'
  | 'venue.reputationChanged'
  | 'region.reputationChanged'
  | 'story.flagAdded'

export interface QuestEventContext extends UnknownRecord {
  venueId?: string
  region?: string
  cityId?: string
  capacity?: number
  platform?: string
  postId?: string
  postCategory?: string
  category?: string
  dealId?: string
  dealType?: string
  brandId?: string
  brandAlignment?: string
  assetId?: string
  assetKind?: string
  moduleId?: string
  slotType?: string
  riskType?: string
  itemId?: string
  minigameId?: string
  score?: number
  grade?: string
  memberId?: string
  traitId?: string
  flag?: string
  harmony?: number
  loyalty?: number
  condition?: number
}

export interface QuestEvent {
  type: QuestEventType
  amount?: number
  success?: boolean
  tags?: string[]
  context?: QuestEventContext
}

export type QuestProgressAmountMode =
  | 'fixed'
  | 'event.amount'
  | 'event.score'
  | 'threshold'

export interface QuestProgressRuleMatch {
  scope?: 'venue' | 'region' | 'none'
  platform?: string | string[]
  postCategory?: string | string[]
  category?: string | string[]
  dealType?: string | string[]
  brandAlignment?: string | string[]
  assetKind?: string | string[]
  minigameId?: string | string[]
  itemId?: string | string[]
  tags?: string[]
  minScore?: number
  success?: boolean
}

export interface QuestProgressRule {
  event: QuestEventType | QuestProgressSource
  amount?: QuestProgressAmountMode
  fixedAmount?: number
  thresholdField?: 'band.harmony' | 'social.loyalty' | 'asset.condition'
  match?: QuestProgressRuleMatch
}

export type QuestReward =
  | { type: 'money'; amount: number }
  | { type: 'fame'; amount: number }
  | { type: 'social.followers'; platform?: string; amount: number }
  | { type: 'social.loyalty'; amount: number }
  | { type: 'social.controversy'; amount: number }
  | { type: 'band.harmony'; amount: number }
  | { type: 'item.add'; itemId: string; amount?: number }
  | { type: 'skill_point'; memberIndex?: number }
  | { type: 'flag.add'; flag: string }

export type QuestPenalty =
  | { type: 'social.loyalty'; amount: number }
  | { type: 'social.controversy'; amount: number }
  | { type: 'band.harmony'; amount: number }
  | { type: 'flag.add'; flag: string }
  | { type: 'quest.cooldown'; days: number }

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

export interface QuestOfferDefinition {
  trigger: 'random' | 'post_gig' | 'story' | 'travel'
  category: string
  chance: number
  condition?: QuestOfferCondition
}

export interface QuestState extends UnknownRecord {
  id: string
  label?: string
  description?: string
  deadline?: number | null
  deadlineOffset?: number
  progress?: number
  required?: number
  rewardType?: string
  rewardData?: UnknownRecord
  rewardFlag?: string
  moneyReward?: number
  failurePenalty?: UnknownRecord

  kind?: QuestKind
  status?: QuestStatus
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

  /**
   * For `perVenue`/`perRegion` quests, the scope key (venue id or region name)
   * the quest instance is bound to. Stamped by `addQuest` from current state.
   */
  scopeKey?: string

  /**
   * Quest id automatically added when this quest completes. Lets story arcs
   * branch into follow-up quests without bespoke reducer hooks.
   */
  followupQuestId?: string
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
