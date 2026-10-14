import type { QuestDefinition } from '../../types/quest'

/**
 * Rack up stage time on the venue circuit.
 *
 * @remarks
 * Every finished venue gig counts once, and a good one counts again through
 * its `venue.goodGig` event, so strong shows close the quest faster.
 */
export const quest_stage_time = {
  kind: 'repeatable',
  label: 'events:quest_stage_time.label',
  description: 'events:quest_stage_time.desc',
  progressSource: 'venue_gig_completed',
  deadlineOffset: 14,
  repeatPolicy: 'cooldown',
  cooldownDays: 10,
  progressRules: [
    { event: 'venue.gigCompleted', amount: 'fixed', fixedAmount: 1 },
    { event: 'venue.goodGig', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 5,
  offer: { trigger: 'random', category: 'gig', chance: 0.06 },
  rewards: [
    { type: 'money', amount: 300 },
    { type: 'fame', amount: 150 }
  ],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
