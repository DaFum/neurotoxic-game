import type { QuestDefinition } from '../../types/quest'

export const quest_venue_residency = {
  kind: 'repeatable',
  label: 'ui:quests.venueResidency.title',
  description: 'ui:quests.venueResidency.description',
  deadlineOffset: 21,
  repeatPolicy: 'perVenue',
  progressSource: 'good_gig',
  progressRules: [
    {
      event: 'gig.good',
      amount: 'fixed',
      fixedAmount: 1,
      match: { scope: 'venue' }
    }
  ],
  required: 3,
  offer: {
    trigger: 'random',
    category: 'gig',
    chance: 0.06,
    condition: { currentNodeType: 'GIG' }
  },
  rewards: [
    { type: 'money', amount: 250 },
    { type: 'social.followers', platform: 'instagram', amount: 200 }
  ],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
