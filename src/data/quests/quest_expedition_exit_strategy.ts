import type { QuestDefinition } from '../../types/quest'

/**
 * Get out of a tour alive, with the loot.
 *
 * @remarks
 * Only a voluntary extraction counts, the counterweight to the run goal.
 * Extraction windows sit mid-route, so an offer rolled after the last window
 * cannot be met on the same run; the deadline spans into the next tour.
 */
export const quest_expedition_exit_strategy = {
  kind: 'repeatable',
  label: 'events:quest_expedition_exit_strategy.label',
  description: 'events:quest_expedition_exit_strategy.desc',
  deadlineOffset: 30,
  repeatPolicy: 'cooldown',
  cooldownDays: 15,
  progressRules: [
    { event: 'expedition.extracted', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 1,
  offer: {
    trigger: 'random',
    category: 'transport',
    chance: 0.06,
    condition: { requireActiveExpedition: true }
  },
  rewards: [
    { type: 'money', amount: 600 },
    { type: 'fame', amount: 150 }
  ],
  failurePenalties: [{ type: 'social.loyalty', amount: -3 }]
} as const satisfies QuestDefinition
