import type { QuestDefinition } from '../../types/quest'

export const quest_burned_bridges = {
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
} as const satisfies QuestDefinition
