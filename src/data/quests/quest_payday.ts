import type { QuestDefinition } from '../../types/quest'

export const quest_payday = {
  kind: 'repeatable',
  label: 'events:quest_payday.label',
  description: 'events:quest_payday.desc',
  deadlineOffset: 15,
  repeatPolicy: 'cooldown',
  cooldownDays: 5,
  progressSource: 'money_earned',
  progressRules: [{ event: 'economy.moneyEarned', amount: 'event.amount' }],
  required: 1000,
  offer: { trigger: 'random', category: 'special', chance: 0.06 },
  rewards: [{ type: 'fame', amount: 200 }],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
