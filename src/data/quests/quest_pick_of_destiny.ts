import type { QuestDefinition } from '../../types/quest'

export const quest_pick_of_destiny = {
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
} as const satisfies QuestDefinition
