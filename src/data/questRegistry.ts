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
    followupQuestId: 'quest_back_from_pit',
    startFlags: ['prove_yourself_active'],
    clearFlagsOnComplete: ['prove_yourself_active'],
    clearFlagsOnFail: ['prove_yourself_active'],
    rewards: [{ type: 'flag.add', flag: 'prove_yourself_complete' }],
    failurePenalties: [
      { type: 'social.controversy', amount: 10 },
      { type: 'band.harmony', amount: -20 },
      { type: 'flag.add', flag: 'prove_yourself_failed' },
      { type: 'quest.cooldown', id: 'prove_yourself_retry', days: 20 }
    ]
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
    followupQuestId: 'quest_sincere_redemption',
    clearFlagsOnComplete: ['cancel_quest_active'],
    clearFlagsOnFail: ['cancel_quest_active'],
    rewards: [{ type: 'flag.add', flag: 'apology_tour_complete' }],
    failurePenalties: [
      { type: 'social.controversy', amount: 25 },
      { type: 'band.harmony', amount: -20 },
      { type: 'flag.add', flag: 'apology_tour_failed' },
      { type: 'quest.cooldown', id: 'apology_tour_retry', days: 14 }
    ]
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
    followupQuestId: 'quest_band_pact',
    clearFlagsOnComplete: ['breakup_quest_active'],
    clearFlagsOnFail: ['breakup_quest_active'],
    rewards: [{ type: 'flag.add', flag: 'ego_crisis_resolved' }],
    failurePenalties: [
      { type: 'social.controversy', amount: 10 },
      { type: 'social.loyalty', amount: -15 },
      { type: 'band.harmony', amount: -25 },
      { type: 'flag.add', flag: 'ego_crisis_failed' },
      { type: 'quest.cooldown', id: 'ego_management_retry', days: 10 }
    ]
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
    rewards: [
      { type: 'money', amount: 200 },
      { type: 'item.add', itemId: 'lucky_pick' }
    ],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [{ type: 'fame', amount: 500 }],
    failurePenalties: [
      { type: 'social.controversy', amount: 5 },
      { type: 'quest.cooldown', id: 'quest_viral_dance_retry', days: 7 }
    ]
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
    rewards: [
      { type: 'money', amount: 500 },
      { type: 'item.add', itemId: 'energy_drink' }
    ],
    failurePenalties: [
      { type: 'social.loyalty', amount: -10 },
      { type: 'quest.cooldown', id: 'quest_sponsor_demand_retry', days: 15 }
    ]
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
    rewards: [{ type: 'band.harmony', amount: 20 }],
    failurePenalties: [{ type: 'band.harmony', amount: -10 }]
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
    rewards: [{ type: 'money', amount: 300 }],
    failurePenalties: [{ type: 'band.harmony', amount: -5 }]
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
    rewards: [{ type: 'fame', amount: 250 }],
    failurePenalties: [{ type: 'social.controversy', amount: 3 }]
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
    rewards: [{ type: 'money', amount: 400 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -3 }]
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
    rewards: [
      { type: 'money', amount: 250 },
      { type: 'social.followers', platform: 'instagram', amount: 200 }
    ],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [{ type: 'fame', amount: 400 }],
    failurePenalties: [{ type: 'social.controversy', amount: 5 }]
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
    rewards: [{ type: 'money', amount: 150 }],
    failurePenalties: [{ type: 'social.controversy', amount: 5 }]
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
    rewards: [{ type: 'money', amount: 1500 }],
    failurePenalties: [
      { type: 'social.loyalty', amount: -10 },
      {
        type: 'quest.cooldown',
        id: 'quest_premium_endorsement_retry',
        days: 30
      }
    ]
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
    rewards: [{ type: 'social.loyalty', amount: 15 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [
      { type: 'flag.add', flag: 'back_from_pit_complete' },
      { type: 'fame', amount: 300 }
    ],
    failurePenalties: [
      { type: 'social.controversy', amount: 5 },
      { type: 'flag.add', flag: 'back_from_pit_failed' }
    ]
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
    rewards: [
      { type: 'flag.add', flag: 'sincere_redemption_complete' },
      { type: 'social.controversy', amount: -20 }
    ],
    failurePenalties: [
      { type: 'social.loyalty', amount: -5 },
      { type: 'flag.add', flag: 'sincere_redemption_failed' }
    ]
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
    rewards: [
      { type: 'flag.add', flag: 'band_pact_complete' },
      { type: 'band.harmony', amount: 15 }
    ],
    failurePenalties: [
      { type: 'band.harmony', amount: -10 },
      { type: 'flag.add', flag: 'band_pact_failed' }
    ]
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
    rewards: [{ type: 'skill_point', memberIndex: 0 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -15 }]
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
    rewards: [
      { type: 'venue.reputation', scope: 'current', amount: 15 },
      { type: 'fame', amount: 150 }
    ],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [{ type: 'money', amount: 300 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [{ type: 'fame', amount: 100 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [{ type: 'social.loyalty', amount: 10 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }],
    rewards: [
      { type: 'asset.repair', assetKind: 'rehearsal', amount: 20 },
      { type: 'money', amount: 250 }
    ]
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
    rewards: [
      { type: 'brand.trust', alignment: 'corporate', amount: 10 },
      { type: 'fame', amount: 120 }
    ],
    failurePenalties: [
      { type: 'brand.trust', alignment: 'corporate', amount: -5 },
      { type: 'social.loyalty', amount: -5 }
    ]
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
    rewards: [
      { type: 'trait.unlock', traitId: 'veteran' },
      { type: 'skill_point', memberIndex: 0 }
    ],
    failurePenalties: [
      { type: 'event.queue', eventId: 'event_bad_press' },
      { type: 'social.loyalty', amount: -5 }
    ]
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
    rewards: [{ type: 'fame', amount: 200 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [{ type: 'social.loyalty', amount: 10 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
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
    rewards: [{ type: 'social.loyalty', amount: 15 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
  },
  quest_venue_regular: {
    kind: 'repeatable',
    label: 'events:quest_venue_regular.label',
    description: 'events:quest_venue_regular.desc',
    deadlineOffset: 18,
    repeatPolicy: 'cooldown',
    cooldownDays: 12,
    progressSource: 'venue_reputation_changed',
    progressRules: [
      { event: 'venue.reputationChanged', amount: 'event.amount' }
    ],
    required: 30,
    offer: { trigger: 'random', category: 'gig', chance: 0.06 },
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }],
    rewards: [
      { type: 'venue.reputation', scope: 'current', amount: 15 },
      { type: 'fame', amount: 150 }
    ]
  },
  quest_brand_ambassador: {
    kind: 'repeatable',
    label: 'events:quest_brand_ambassador.label',
    description: 'events:quest_brand_ambassador.desc',
    deadlineOffset: 20,
    repeatPolicy: 'cooldown',
    cooldownDays: 14,
    progressSource: 'brand_trust_changed',
    progressRules: [{ event: 'brand.trustChanged', amount: 'event.amount' }],
    required: 20,
    offer: { trigger: 'random', category: 'financial', chance: 0.06 },
    rewards: [{ type: 'money', amount: 600 }],
    failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
  },
  quest_alchemist: {
    kind: 'repeatable',
    label: 'events:quest_alchemist.label',
    description: 'events:quest_alchemist.desc',
    deadlineOffset: 20,
    repeatPolicy: 'cooldown',
    cooldownDays: 8,
    progressSource: 'item_crafted',
    progressRules: [{ event: 'item.crafted', amount: 'fixed', fixedAmount: 1 }],
    required: 2,
    offer: { trigger: 'random', category: 'special', chance: 0.06 },
    rewards: [
      { type: 'brand.trust', alignment: 'corporate', amount: 10 },
      { type: 'fame', amount: 120 }
    ],
    failurePenalties: [
      { type: 'brand.trust', alignment: 'corporate', amount: -5 },
      { type: 'social.loyalty', amount: -5 }
    ]
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
