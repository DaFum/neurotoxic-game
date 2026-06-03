import type { QuestDefinition } from '../types/quest'

export const QUEST_REGISTRY = {
  quest_prove_yourself: {
    kind: 'story',
    label: 'ui:quests.proveYourself.title',
    deadlineOffset: 20,
    repeatPolicy: 'never',
    progressSource: 'small_venue_good_gig',
    progressRules: [
      { event: 'gig.smallVenueGood', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 4,
    rewardFlag: 'prove_yourself_complete',
    followupQuestId: 'quest_back_from_pit',
    startFlags: ['prove_yourself_active'],
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
    progressRules: [
      { event: 'gig.smallVenueGood', amount: 'fixed', fixedAmount: 1 }
    ],
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
    progressRules: [
      {
        event: 'band.harmonyChanged',
        amount: 'threshold',
        thresholdField: 'band.harmony'
      }
    ],
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
    progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
    required: 3,
    offer: { trigger: 'random', category: 'special', chance: 0.05 },
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
    progressRules: [
      {
        event: 'social.followersGained',
        amount: 'event.amount',
        match: { platform: 'tiktok' }
      }
    ],
    required: 500,
    cooldownDays: 7,
    offer: {
      trigger: 'random',
      category: 'band',
      chance: 0.1,
      condition: { social: { maxTiktok: 4999 } }
    },
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
    progressRules: [
      {
        event: 'brand.dealCompleted',
        amount: 'fixed',
        fixedAmount: 1,
        match: { dealType: ['SPONSORSHIP'] }
      }
    ],
    required: 2,
    cooldownDays: 15,
    offer: { trigger: 'random', category: 'financial', chance: 0.08 },
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
    progressRules: [
      {
        event: 'band.harmonyChanged',
        amount: 'threshold',
        thresholdField: 'band.harmony'
      },
      {
        event: 'social.postResolved',
        amount: 'fixed',
        fixedAmount: 5,
        match: { postCategory: 'Lifestyle', success: true }
      }
    ],
    required: 75,
    offer: {
      trigger: 'random',
      category: 'band',
      chance: 0.3,
      condition: { band: { harmonyBelow: 60 } }
    },
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
    progressRules: [
      { event: 'travel.completed', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 2,
    cooldownDays: 14,
    offer: {
      trigger: 'random',
      category: 'transport',
      chance: 0.07,
      condition: { requiredAssetKind: 'tourbus_chassis' }
    },
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
    progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
    required: 2,
    cooldownDays: 21,
    offer: {
      trigger: 'random',
      category: 'special',
      chance: 0.06,
      condition: { requiredAssetKind: 'studio_chassis' }
    },
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
    progressRules: [
      { event: 'gig.completed', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 3,
    cooldownDays: 10,
    offer: {
      trigger: 'random',
      category: 'financial',
      chance: 0.07,
      condition: { requiredAssetKind: 'merch_workshop_chassis' }
    },
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
    progressRules: [
      {
        event: 'gig.good',
        amount: 'fixed',
        fixedAmount: 1,
        match: { scope: 'venue' }
      }
    ],
    required: 3,
    offer: {
      trigger: 'random',
      category: 'gig',
      chance: 0.06,
      condition: { currentNodeType: 'GIG' }
    },
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
    progressRules: [
      {
        event: 'gig.good',
        amount: 'fixed',
        fixedAmount: 1,
        match: { scope: 'region' }
      }
    ],
    required: 5,
    offer: {
      trigger: 'random',
      category: 'gig',
      chance: 0.05,
      condition: { requireLocation: true }
    },
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
    progressRules: [
      {
        event: 'social.followersGained',
        amount: 'event.amount',
        match: { postCategory: 'Drama' }
      }
    ],
    required: 300,
    cooldownDays: 5,
    offer: { trigger: 'random', category: 'band', chance: 0.06 },
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
    progressRules: [
      {
        event: 'brand.dealCompleted',
        amount: 'fixed',
        fixedAmount: 1,
        match: { dealType: 'ENDORSEMENT' }
      }
    ],
    required: 3,
    cooldownDays: 21,
    offer: {
      trigger: 'random',
      category: 'financial',
      chance: 0.04,
      condition: { minFame: 200 }
    },
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
    progressRules: [
      {
        event: 'social.postResolved',
        amount: 'fixed',
        fixedAmount: 1,
        match: { postCategory: ['Lifestyle', 'Community'], success: true }
      }
    ],
    required: 4,
    cooldownDays: 7,
    offer: {
      trigger: 'random',
      category: 'band',
      chance: 0.08,
      condition: {
        social: { loyaltyBelow: 35, controversyAbove: 30 }
      }
    },
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
    progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
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
    progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
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
    progressRules: [
      {
        event: 'band.harmonyChanged',
        amount: 'threshold',
        thresholdField: 'band.harmony'
      }
    ],
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
    progressRules: [
      {
        event: 'region.reputationChanged',
        amount: 'event.amount',
        match: { scope: 'region' }
      }
    ],
    required: 500,
    offer: {
      trigger: 'random',
      category: 'special',
      chance: 0.07,
      condition: { requireLocation: true }
    },
    rewardType: 'skill_point',
    rewardData: { memberIndex: 0 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -15 }
    }
  },
  quest_flawless_run: {
    kind: 'repeatable',
    label: 'events:quest_flawless_run.label',
    description: 'events:quest_flawless_run.desc',
    deadlineOffset: 12,
    repeatPolicy: 'cooldown',
    cooldownDays: 6,
    progressSource: 'minigame_perfected',
    progressRules: [
      { event: 'minigame.perfect', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 3,
    offer: { trigger: 'random', category: 'band', chance: 0.08 },
    rewardType: 'fame',
    rewardData: { fame: 150 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_sticky_fingers: {
    kind: 'side',
    label: 'events:quest_sticky_fingers.label',
    description: 'events:quest_sticky_fingers.desc',
    deadlineOffset: 18,
    repeatPolicy: 'never',
    progressSource: 'item_collected',
    progressRules: [
      { event: 'item.collected', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 5,
    offer: { trigger: 'random', category: 'special', chance: 0.06 },
    moneyReward: 300,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_special_delivery: {
    kind: 'repeatable',
    label: 'events:quest_special_delivery.label',
    description: 'events:quest_special_delivery.desc',
    deadlineOffset: 14,
    repeatPolicy: 'cooldown',
    cooldownDays: 7,
    progressSource: 'item_delivered',
    progressRules: [{ event: 'item.delivered', amount: 'event.amount' }],
    required: 10,
    offer: { trigger: 'random', category: 'special', chance: 0.06 },
    rewardType: 'fame',
    rewardData: { fame: 100 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_persona_non_grata: {
    kind: 'side',
    label: 'events:quest_persona_non_grata.label',
    description: 'events:quest_persona_non_grata.desc',
    deadlineOffset: 20,
    repeatPolicy: 'never',
    progressSource: 'venue_blacklisted',
    progressRules: [
      { event: 'venue.blacklisted', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 1,
    offer: { trigger: 'random', category: 'band', chance: 0.05 },
    rewardType: 'loyalty',
    rewardData: { loyalty: 10 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_murphys_law: {
    kind: 'side',
    label: 'events:quest_murphys_law.label',
    description: 'events:quest_murphys_law.desc',
    deadlineOffset: 25,
    repeatPolicy: 'never',
    progressSource: 'asset_risk_triggered',
    progressRules: [
      { event: 'asset.riskTriggered', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 3,
    offer: {
      trigger: 'random',
      category: 'special',
      chance: 0.05,
      condition: { requiredAssetKind: 'rehearsal' }
    },
    moneyReward: 250,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_crisis_manager: {
    kind: 'repeatable',
    label: 'events:quest_crisis_manager.label',
    description: 'events:quest_crisis_manager.desc',
    deadlineOffset: 20,
    repeatPolicy: 'cooldown',
    cooldownDays: 8,
    progressSource: 'asset_risk_resolved',
    progressRules: [
      { event: 'asset.riskResolved', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 3,
    offer: {
      trigger: 'random',
      category: 'special',
      chance: 0.05,
      condition: { requiredAssetKind: 'rehearsal' }
    },
    rewardType: 'fame',
    rewardData: { fame: 120 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_chapter_marker: {
    kind: 'side',
    label: 'events:quest_chapter_marker.label',
    description: 'events:quest_chapter_marker.desc',
    deadlineOffset: 30,
    repeatPolicy: 'never',
    progressSource: 'story_flag_added',
    progressRules: [
      { event: 'story.flagAdded', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 3,
    offer: { trigger: 'random', category: 'special', chance: 0.05 },
    rewardType: 'skill_point',
    rewardData: { memberIndex: 0 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_payday: {
    kind: 'repeatable',
    label: 'events:quest_payday.label',
    description: 'events:quest_payday.desc',
    deadlineOffset: 15,
    repeatPolicy: 'cooldown',
    cooldownDays: 5,
    progressSource: 'money_earned',
    progressRules: [{ event: 'economy.moneyEarned', amount: 'event.amount' }],
    required: 1000,
    offer: { trigger: 'random', category: 'special', chance: 0.06 },
    rewardType: 'fame',
    rewardData: { fame: 200 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_make_amends: {
    kind: 'repeatable',
    label: 'events:quest_make_amends.label',
    description: 'events:quest_make_amends.desc',
    deadlineOffset: 20,
    repeatPolicy: 'cooldown',
    cooldownDays: 10,
    progressSource: 'venue_unblacklisted',
    progressRules: [
      { event: 'venue.unblacklisted', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 1,
    offer: { trigger: 'random', category: 'special', chance: 0.05 },
    rewardType: 'loyalty',
    rewardData: { loyalty: 10 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  },
  quest_burned_bridges: {
    kind: 'side',
    label: 'events:quest_burned_bridges.label',
    description: 'events:quest_burned_bridges.desc',
    deadlineOffset: 20,
    repeatPolicy: 'never',
    progressSource: 'brand_deal_failed',
    progressRules: [
      { event: 'brand.dealFailed', amount: 'fixed', fixedAmount: 1 }
    ],
    required: 1,
    offer: { trigger: 'random', category: 'financial', chance: 0.05 },
    rewardType: 'loyalty',
    rewardData: { loyalty: 15 },
    moneyReward: 0,
    failurePenalty: {
      social: { loyalty: -5 }
    }
  }
} as const satisfies Record<string, QuestDefinition>

/**
 * Looks up a quest's static definition by id. Returns `undefined` for unknown
 * ids so callers can fall back to inline payloads.
 */
export const isQuestRegistryId = (
  questId: string
): questId is keyof typeof QUEST_REGISTRY =>
  Object.hasOwn(QUEST_REGISTRY, questId)

export const getQuestDefinition = (
  questId: string
): QuestDefinition | undefined =>
  isQuestRegistryId(questId) ? QUEST_REGISTRY[questId] : undefined
