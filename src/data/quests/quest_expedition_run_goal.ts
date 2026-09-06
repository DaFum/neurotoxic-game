import type { QuestDefinition } from '../../types/quest'

/**
 * Get deep into a tour rather than turning back at the first bad node.
 *
 * @remarks
 * Sized against one route: the fixture tour runs eight steps, so five resolved
 * nodes is a run that committed rather than one that extracted early. Repeats
 * on a cooldown because it is a per-tour goal, not a one-off milestone.
 */
export const quest_expedition_run_goal = {
  kind: 'repeatable',
  label: 'events:quest_expedition_run_goal.label',
  description: 'events:quest_expedition_run_goal.desc',
  deadlineOffset: 14,
  repeatPolicy: 'cooldown',
  cooldownDays: 8,
  progressRules: [
    { event: 'expedition.nodeResolved', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 5,
  offer: { trigger: 'random', category: 'transport', chance: 0.08 },
  rewards: [
    { type: 'money', amount: 900 },
    { type: 'fame', amount: 200 }
  ],
  failurePenalties: [{ type: 'social.loyalty', amount: -4 }]
} as const satisfies QuestDefinition
