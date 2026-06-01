import { QuestState } from '../types/quest'

export const QUEST_REGISTRY = {
  quest_prove_yourself: {
    kind: 'story',
    label: 'ui:quests.proveYourself.title',
    deadlineOffset: 20,
    repeatPolicy: 'never',
    progressSource: 'small_venue_good_gig',
    required: 4,
    rewardFlag: 'prove_yourself_complete',
    followupQuestId: 'quest_back_from_pit',
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
    label: 'ui:quests.postgig.apologyTour.title',
    description: 'ui:quests.postgig.apologyTour.description',
    deadlineOffset: 14,
    repeatPolicy: 'never',
    progressSource: 'small_venue_good_gig',
    required: 3,
    rewardFlag: 'apology_tour_complete',
    followupQuestId: 'quest_sincere_redemption',
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
    label: 'ui:quests.postgig.saveTheBand.title',
    description: 'ui:quests.postgig.saveTheBand.description',
    deadlineOffset: 5,
    repeatPolicy: 'never',
    progressSource: 'harmony_recovered',
    required: 50,
    rewardFlag: 'ego_crisis_resolved',
    followupQuestId: 'quest_band_pact',
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
    label: 'events:quest_pick_of_destiny.label',
    description: 'events:quest_pick_of_destiny.desc',
    deadlineOffset: 15,
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
    label: 'events:quest_viral_dance.label',
    description: 'events:quest_viral_dance.desc',
    deadlineOffset: 5,
    repeatPolicy: 'cooldown',
    progressSource: 'followers_gained',
    required: 500,
    cooldownDays: 7,
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
    label: 'events:quest_sponsor_demand.label',
    description: 'events:quest_sponsor_demand.desc',
    deadlineOffset: 7,
    repeatPolicy: 'cooldown',
    progressSource: 'brand_deal_completed',
    required: 2,
    cooldownDays: 15,
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
    label: 'events:quest_harmony_project.label',
    description: 'events:quest_harmony_project.desc',
    deadlineOffset: 4,
    repeatPolicy: 'never',
    progressSource: 'harmony_recovered',
    required: 75,
    rewardType: 'harmony',
    rewardData: { harmony: 20 },
    moneyReward: 0,
    failurePenalty: {
      band: { harmony: -10 }
    }
  },
  quest_tourbus_inspection: {
    kind: 'side',
    label: 'ui:quests.tourbusInspection.title',
    description: 'ui:quests.tourbusInspection.description',
    deadlineOffset: 7,
    repeatPolicy: 'cooldown',
    progressSource: 'travel_completed',
    required: 2,
    cooldownDays: 14,
    moneyReward: 300,
    failurePenalty: {
      band: { harmony: -5 }
    }
  },
  quest_studio_demo: {
    kind: 'side',
    label: 'ui:quests.studioDemo.title',
    description: 'ui:quests.studioDemo.description',
    deadlineOffset: 14,
    repeatPolicy: 'cooldown',
    progressSource: 'good_gig',
    required: 2,
    cooldownDays: 21,
    rewardType: 'fame',
    rewardData: { fame: 250 },
    failurePenalty: {
      social: { controversyLevel: 3 }
    }
  },
  quest_merch_rush: {
    kind: 'side',
    label: 'ui:quests.merchRush.title',
    description: 'ui:quests.merchRush.description',
    deadlineOffset: 6,
    repeatPolicy: 'cooldown',
    progressSource: 'gig_completed',
    required: 3,
    cooldownDays: 10,
    moneyReward: 400,
    failurePenalty: {
      social: { loyalty: -3 }
    }
  },
  quest_venue_residency: {
    kind: 'repeatable',
    label: 'ui:quests.venueResidency.title',
    description: 'ui:quests.venueResidency.description',
    deadlineOffset: 21,
    repeatPolicy: 'perVenue',
    progressSource: 'good_gig',
    required: 3,
    rewardType: 'fans',
    rewardData: { fans: 200 },
    moneyReward: 250,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_region_takeover: {
    kind: 'repeatable',
    label: 'ui:quests.regionTakeover.title',
    description: 'ui:quests.regionTakeover.description',
    deadlineOffset: 30,
    repeatPolicy: 'perRegion',
    progressSource: 'good_gig',
    required: 5,
    rewardType: 'fame',
    rewardData: { fame: 400 },
    failurePenalty: {
      social: { controversyLevel: 5 }
    }
  },
  quest_drama_post: {
    kind: 'repeatable',
    label: 'ui:quests.dramaPost.title',
    description: 'ui:quests.dramaPost.description',
    deadlineOffset: 4,
    repeatPolicy: 'cooldown',
    progressSource: 'followers_gained',
    required: 300,
    cooldownDays: 5,
    moneyReward: 150,
    failurePenalty: {
      social: { controversyLevel: 5 }
    }
  },
  quest_premium_endorsement: {
    kind: 'repeatable',
    label: 'ui:quests.premiumEndorsement.title',
    description: 'ui:quests.premiumEndorsement.description',
    deadlineOffset: 14,
    repeatPolicy: 'cooldown',
    progressSource: 'brand_deal_completed',
    required: 3,
    cooldownDays: 21,
    moneyReward: 1500,
    failurePenalty: {
      social: { loyalty: -10 },
      cooldowns: [{ id: 'quest_premium_endorsement_retry', days: 30 }]
    }
  },
  quest_community_outreach: {
    kind: 'repeatable',
    label: 'ui:quests.communityOutreach.title',
    description: 'ui:quests.communityOutreach.description',
    deadlineOffset: 6,
    repeatPolicy: 'cooldown',
    progressSource: 'social_post',
    required: 4,
    cooldownDays: 7,
    rewardType: 'loyalty',
    rewardData: { loyalty: 15 },
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_back_from_pit: {
    kind: 'story',
    label: 'ui:quests.backFromPit.title',
    description: 'ui:quests.backFromPit.description',
    deadlineOffset: 14,
    repeatPolicy: 'never',
    progressSource: 'good_gig',
    required: 3,
    rewardFlag: 'back_from_pit_complete',
    rewardType: 'fame',
    rewardData: { fame: 300 },
    failurePenalty: {
      social: { controversyLevel: 5 },
      flags: ['back_from_pit_failed']
    }
  },
  quest_sincere_redemption: {
    kind: 'story',
    label: 'ui:quests.sincereRedemption.title',
    description: 'ui:quests.sincereRedemption.description',
    deadlineOffset: 10,
    repeatPolicy: 'never',
    progressSource: 'good_gig',
    required: 2,
    rewardFlag: 'sincere_redemption_complete',
    rewardType: 'controversy_reduction',
    rewardData: { controversy: 20 },
    failurePenalty: {
      social: { loyalty: -5 },
      flags: ['sincere_redemption_failed']
    }
  },
  quest_band_pact: {
    kind: 'story',
    label: 'ui:quests.bandPact.title',
    description: 'ui:quests.bandPact.description',
    deadlineOffset: 7,
    repeatPolicy: 'never',
    progressSource: 'harmony_recovered',
    required: 70,
    rewardFlag: 'band_pact_complete',
    rewardType: 'harmony',
    rewardData: { harmony: 15 },
    failurePenalty: {
      band: { harmony: -10 },
      flags: ['band_pact_failed']
    }
  },
  quest_local_legend: {
    kind: 'repeatable',
    label: 'events:quest_local_legend.label',
    description: 'events:quest_local_legend.desc',
    deadlineOffset: 10,
    repeatPolicy: 'perRegion',
    progressSource: 'fame_gained',
    required: 500,
    rewardType: 'skill_point',
    rewardData: { memberIndex: 0 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -15 }
    }
  }
} as const satisfies Record<string, Partial<QuestState>>

/**
 * Static configuration shape for a registry quest entry. Mirrors the subset of
 * `QuestState` that quests declare statically; runtime-only fields such as the
 * computed `deadline` and live `progress` are layered on by `addQuest`.
 */
export type QuestDefinition =
  (typeof QUEST_REGISTRY)[keyof typeof QUEST_REGISTRY]

/**
 * Looks up a quest's static definition by id. Returns `undefined` for unknown
 * ids so callers can fall back to inline payloads.
 */
export const getQuestDefinition = (
  questId: string
): QuestDefinition | undefined =>
  QUEST_REGISTRY[questId as keyof typeof QUEST_REGISTRY]
