import type { QuestDefinition } from '../../types/quest'

/**
 * Learn the roadie trade the hard way.
 *
 * @remarks
 * Every minigame attempt counts exactly once: a successful run through its
 * `minigame.completed` event, a failed run through `minigame.failed` (its
 * completed event carries `success: false` and does not match). A failure
 * earns no more than a success, so botching runs on purpose does not pay.
 */
export const quest_hard_knocks = {
  kind: 'repeatable',
  label: 'events:quest_hard_knocks.label',
  description: 'events:quest_hard_knocks.desc',
  deadlineOffset: 10,
  repeatPolicy: 'cooldown',
  cooldownDays: 8,
  progressRules: [
    {
      event: 'minigame.completed',
      amount: 'fixed',
      fixedAmount: 1,
      match: { success: true }
    },
    { event: 'minigame.failed', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 4,
  offer: { trigger: 'random', category: 'band', chance: 0.06 },
  rewards: [
    { type: 'band.harmony', amount: 8 },
    { type: 'fame', amount: 100 }
  ],
  failurePenalties: [{ type: 'band.harmony', amount: -3 }]
} as const satisfies QuestDefinition
