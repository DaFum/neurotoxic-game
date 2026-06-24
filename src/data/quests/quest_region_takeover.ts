import type { QuestDefinition } from '../../types/quest'

export const quest_region_takeover = {
  kind: 'repeatable',
  label: 'ui:quests.regionTakeover.title',
  description: 'ui:quests.regionTakeover.description',
  deadlineOffset: 30,
  repeatPolicy: 'perRegion',
  progressSource: 'good_gig',
  progressRules: [
    {
      event: 'gig.good',
      amount: 'fixed',
      fixedAmount: 1,
      match: { scope: 'region' }
    }
  ],
  required: 5,
  offer: {
    trigger: 'random',
    category: 'gig',
    chance: 0.05,
    condition: { requireLocation: true }
  },
  rewards: [{ type: 'fame', amount: 400 }],
  failurePenalties: [{ type: 'social.controversy', amount: 5 }]
} as const satisfies QuestDefinition
