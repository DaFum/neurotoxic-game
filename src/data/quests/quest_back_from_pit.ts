import type { QuestDefinition } from '../../types/quest'

export const quest_back_from_pit = {
  kind: 'story',
  label: 'ui:quests.backFromPit.title',
  description: 'ui:quests.backFromPit.description',
  deadlineOffset: 14,
  repeatPolicy: 'never',
  progressSource: 'good_gig',
  progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
  required: 3,
  completionFlags: ['back_from_pit_complete'],
  failureFlags: ['back_from_pit_failed'],
  rewards: [{ type: 'fame', amount: 300 }],
  failurePenalties: [{ type: 'social.controversy', amount: 5 }]
} as const satisfies QuestDefinition
