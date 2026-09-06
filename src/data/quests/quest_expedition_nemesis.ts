import type { QuestDefinition } from '../../types/quest'

/**
 * Keep the feud going across tours.
 *
 * @remarks
 * A Rival outcome resolves at most once per run, so three of them is a
 * deliberately cross-run goal — the same shape as the Nemesis ladder it tracks.
 * The deadline is generous for exactly that reason.
 */
export const quest_expedition_nemesis = {
  kind: 'repeatable',
  label: 'events:quest_expedition_nemesis.label',
  description: 'events:quest_expedition_nemesis.desc',
  deadlineOffset: 40,
  repeatPolicy: 'cooldown',
  cooldownDays: 20,
  progressRules: [
    { event: 'expedition.rivalOutcome', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 3,
  offer: { trigger: 'random', category: 'band', chance: 0.06 },
  rewards: [
    { type: 'fame', amount: 450 },
    { type: 'social.followers', amount: 1500 }
  ],
  failurePenalties: [{ type: 'social.controversy', amount: 5 }]
} as const satisfies QuestDefinition
