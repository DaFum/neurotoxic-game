import type { QuestDefinition } from '../../types/quest'

export const quest_alchemist = {
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
} as const satisfies QuestDefinition
