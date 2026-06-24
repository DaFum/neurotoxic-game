import type { QuestDefinition } from '../../types/quest'

export const quest_brand_ambassador = {
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
} as const satisfies QuestDefinition
