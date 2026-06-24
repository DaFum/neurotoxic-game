import type { QuestDefinition } from '../../types/quest'

export const quest_flawless_run = {
  kind: 'repeatable',
  label: 'events:quest_flawless_run.label',
  description: 'events:quest_flawless_run.desc',
  deadlineOffset: 12,
  repeatPolicy: 'cooldown',
  cooldownDays: 6,
  progressSource: 'minigame_perfected',
  progressRules: [
    { event: 'minigame.perfect', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 3,
  offer: { trigger: 'random', category: 'band', chance: 0.08 },
  rewards: [
    { type: 'venue.reputation', scope: 'current', amount: 15 },
    { type: 'fame', amount: 150 }
  ],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
