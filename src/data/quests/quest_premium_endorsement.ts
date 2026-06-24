import type { QuestDefinition } from '../../types/quest'

export const quest_premium_endorsement = {
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
    { type: 'quest.cooldown', days: 30 }
  ]
} as const satisfies QuestDefinition
