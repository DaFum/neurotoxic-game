import { UnknownRecord } from './kabelsalat'

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
}

/**
 * Tracks a `repeatPolicy: 'cooldown'` quest that may not be re-added until
 * the in-game day reaches `expiresOnDay`.
 */
export interface QuestCooldown {
  questId: string
  expiresOnDay: number
}
