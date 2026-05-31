import { QuestState } from '../types/quest'

export const QUEST_REGISTRY = {
  quest_prove_yourself: {
    kind: 'story',
    repeatPolicy: 'never',
    progressSource: 'small_venue_good_gig',
    required: 4,
    rewardFlag: 'prove_yourself_complete',
    failurePenalty: {
      social: { controversyLevel: 10 },
      band: { harmony: -20 },
      flags: ['prove_yourself_failed'],
      cooldowns: [{ id: 'prove_yourself_retry', days: 20 }]
    },
    clearFlagsOnComplete: ['prove_yourself_active'],
    clearFlagsOnFail: ['prove_yourself_active']
  },
  quest_apology_tour: {
    kind: 'story',
    repeatPolicy: 'never',
    progressSource: 'small_venue_good_gig',
    required: 3,
    rewardFlag: 'apology_tour_complete',
    failurePenalty: {
      social: { controversyLevel: 25 },
      band: { harmony: -20 },
      flags: ['apology_tour_failed'],
      cooldowns: [{ id: 'apology_tour_retry', days: 14 }]
    },
    clearFlagsOnComplete: ['cancel_quest_active'],
    clearFlagsOnFail: ['cancel_quest_active']
  },
  quest_ego_management: {
    kind: 'story',
    repeatPolicy: 'never',
    progressSource: 'harmony_recovered',
    required: 1,
    rewardFlag: 'ego_crisis_resolved',
    failurePenalty: {
      band: { harmony: -25 },
      social: { controversyLevel: 10, loyalty: -15 },
      flags: ['ego_crisis_failed'],
      cooldowns: [{ id: 'ego_management_retry', days: 10 }]
    },
    clearFlagsOnComplete: ['breakup_quest_active'],
    clearFlagsOnFail: ['breakup_quest_active']
  },
  quest_pick_of_destiny: {
    kind: 'side',
    repeatPolicy: 'never',
    progressSource: 'good_gig',
    required: 3,
    rewardType: 'item',
    rewardData: { item: 'lucky_pick' },
    moneyReward: 200,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_viral_dance: {
    kind: 'repeatable',
    repeatPolicy: 'cooldown',
    progressSource: 'followers_gained',
    required: 500,
    rewardType: 'fame',
    rewardData: { fame: 500 },
    moneyReward: 0,
    failurePenalty: {
      social: { controversyLevel: 5 },
      cooldowns: [{ id: 'quest_viral_dance_retry', days: 7 }]
    }
  },
  quest_sponsor_demand: {
    kind: 'repeatable',
    repeatPolicy: 'cooldown',
    progressSource: 'brand_deal_completed',
    required: 2,
    rewardType: 'item',
    rewardData: { item: 'energy_drink' },
    moneyReward: 500,
    failurePenalty: {
      social: { loyalty: -10 },
      cooldowns: [{ id: 'quest_sponsor_demand_retry', days: 15 }]
    }
  },
  quest_harmony_project: {
    kind: 'side',
    repeatPolicy: 'never',
    progressSource: 'harmony_recovered',
    required: 1,
    rewardType: 'harmony',
    rewardData: { harmony: 20 },
    moneyReward: 0,
    failurePenalty: {
      band: { harmony: -10 }
    }
  },
  quest_local_legend: {
    kind: 'repeatable',
    repeatPolicy: 'perRegion',
    progressSource: 'small_venue_good_gig',
    required: 2,
    rewardType: 'skill_point',
    rewardData: { memberIndex: 0 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -15 }
    }
  }
} as const satisfies Record<string, Partial<QuestState>>
