import type { QuestDefinition } from '../../types/quest'

export const quest_local_legend = {
  kind: 'repeatable',
  label: 'events:quest_local_legend.label',
  description: 'events:quest_local_legend.desc',
  deadlineOffset: 10,
  repeatPolicy: 'perRegion',
  progressSource: 'fame_gained',
  progressRules: [
    {
      event: 'fame.gained',
      amount: 'event.amount',
      match: { scope: 'region' }
    }
  ],
  required: 500,
  offer: {
    trigger: 'random',
    category: 'special',
    chance: 0.07,
    condition: { requireLocation: true }
  },
  rewards: [{ type: 'skill_point', memberIndex: 0 }],
  failurePenalties: [{ type: 'social.loyalty', amount: -15 }]
} as const satisfies QuestDefinition
