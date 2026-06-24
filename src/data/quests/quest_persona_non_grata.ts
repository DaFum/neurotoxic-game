import type { QuestDefinition } from '../../types/quest'

export const quest_persona_non_grata = {
  kind: 'side',
  label: 'events:quest_persona_non_grata.label',
  description: 'events:quest_persona_non_grata.desc',
  deadlineOffset: 20,
  repeatPolicy: 'never',
  progressSource: 'venue_blacklisted',
  progressRules: [
    { event: 'venue.blacklisted', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 1,
  offer: { trigger: 'random', category: 'band', chance: 0.05 },
  rewards: [{ type: 'social.loyalty', amount: 10 }],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
