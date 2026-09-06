import type { QuestDefinition } from '../../types/quest'

/**
 * Finish what you start, twice.
 *
 * @remarks
 * Only a completed Finale counts, not an extraction: the point is the run that
 * went all the way. Two of them cannot happen inside one tour, so this is the
 * slowest of the three and pays accordingly.
 */
export const quest_expedition_meta_unlock = {
  kind: 'repeatable',
  label: 'events:quest_expedition_meta_unlock.label',
  description: 'events:quest_expedition_meta_unlock.desc',
  deadlineOffset: 45,
  repeatPolicy: 'cooldown',
  cooldownDays: 25,
  progressRules: [
    { event: 'expedition.finaleCompleted', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 2,
  offer: { trigger: 'random', category: 'special', chance: 0.05 },
  rewards: [
    { type: 'money', amount: 2200 },
    { type: 'fame', amount: 600 }
  ],
  failurePenalties: [{ type: 'social.loyalty', amount: -6 }]
} as const satisfies QuestDefinition
