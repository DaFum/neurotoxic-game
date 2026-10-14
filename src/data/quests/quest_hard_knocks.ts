import type { QuestDefinition } from '../../types/quest'

const PRE_GIG_MINIGAMES = ['ROADIE', 'AMP_CALIBRATION', 'KABELSALAT']

/**
 * Learn the roadie trade the hard way.
 *
 * @remarks
 * Every pre-gig setup attempt (roadie, amp calibration, kabelsalat) counts
 * exactly once: a successful run through its `minigame.completed` event, a
 * failed run through `minigame.failed` (its completed event carries
 * `success: false` and does not match). The tourbus minigame runs on every
 * trip, so it is excluded by the `minigameId` match. A failure earns no more
 * than a success, so botching runs on purpose does not pay.
 */
export const quest_hard_knocks = {
  kind: 'repeatable',
  label: 'events:quest_hard_knocks.label',
  description: 'events:quest_hard_knocks.desc',
  progressSource: 'minigame_completed',
  deadlineOffset: 10,
  repeatPolicy: 'cooldown',
  cooldownDays: 8,
  progressRules: [
    {
      event: 'minigame.completed',
      amount: 'fixed',
      fixedAmount: 1,
      match: { success: true, minigameId: PRE_GIG_MINIGAMES }
    },
    {
      event: 'minigame.failed',
      amount: 'fixed',
      fixedAmount: 1,
      match: { minigameId: PRE_GIG_MINIGAMES }
    }
  ],
  required: 4,
  offer: { trigger: 'random', category: 'band', chance: 0.06 },
  rewards: [
    { type: 'band.harmony', amount: 8 },
    { type: 'fame', amount: 100 }
  ],
  failurePenalties: [{ type: 'band.harmony', amount: -3 }]
} as const satisfies QuestDefinition
