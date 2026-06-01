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
