import type { QuestDefinition } from '../../types/quest'

export const quest_special_delivery = {
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
} as const satisfies QuestDefinition
