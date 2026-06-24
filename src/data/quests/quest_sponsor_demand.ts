import type { QuestDefinition } from '../../types/quest'

export const quest_sponsor_demand = {
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
      match: { dealType: 'SPONSORSHIP' }
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
    { type: 'quest.cooldown', days: 15 }
  ]
} as const satisfies QuestDefinition
