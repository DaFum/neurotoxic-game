import type { QuestDefinition } from '../../types/quest'

/**
 * Use up the van stash before it expires.
 *
 * @remarks
 * Counts consumed inventory items: the band reducer emits `item.used` only
 * when something was actually taken from the inventory.
 */
export const quest_best_before = {
  kind: 'repeatable',
  label: 'events:quest_best_before.label',
  description: 'events:quest_best_before.desc',
  progressSource: 'item_used',
  deadlineOffset: 10,
  repeatPolicy: 'cooldown',
  cooldownDays: 10,
  progressRules: [{ event: 'item.used', amount: 'fixed', fixedAmount: 1 }],
  required: 3,
  offer: { trigger: 'random', category: 'band', chance: 0.06 },
  rewards: [{ type: 'band.harmony', amount: 10 }],
  failurePenalties: [{ type: 'band.harmony', amount: -5 }]
} as const satisfies QuestDefinition
