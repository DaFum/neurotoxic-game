import type { QuestDefinition } from '../../types/quest'

export const quest_community_outreach = {
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
} as const satisfies QuestDefinition
