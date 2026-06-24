import type { QuestDefinition } from '../../types/quest'

export const quest_venue_regular = {
  kind: 'repeatable',
  label: 'events:quest_venue_regular.label',
  description: 'events:quest_venue_regular.desc',
  deadlineOffset: 18,
  repeatPolicy: 'cooldown',
  cooldownDays: 12,
  progressSource: 'venue_reputation_changed',
  progressRules: [{ event: 'venue.reputationChanged', amount: 'event.amount' }],
  required: 30,
  offer: { trigger: 'random', category: 'gig', chance: 0.06 },
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }],
  rewards: [
    { type: 'venue.reputation', scope: 'current', amount: 15 },
    { type: 'fame', amount: 150 }
  ]
} as const satisfies QuestDefinition
