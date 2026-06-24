import type { QuestDefinition } from '../../types/quest'

export const quest_make_amends = {
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
} as const satisfies QuestDefinition
