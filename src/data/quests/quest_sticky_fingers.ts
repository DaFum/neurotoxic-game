import type { QuestDefinition } from '../../types/quest'

export const quest_sticky_fingers = {
  kind: 'side',
  label: 'events:quest_sticky_fingers.label',
  description: 'events:quest_sticky_fingers.desc',
  deadlineOffset: 18,
  repeatPolicy: 'never',
  progressSource: 'item_collected',
  progressRules: [{ event: 'item.collected', amount: 'fixed', fixedAmount: 1 }],
  required: 5,
  offer: { trigger: 'random', category: 'special', chance: 0.06 },
  rewards: [{ type: 'money', amount: 300 }],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
