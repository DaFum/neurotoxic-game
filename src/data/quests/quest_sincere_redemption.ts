import type { QuestDefinition } from '../../types/quest'

export const quest_sincere_redemption = {
  kind: 'story',
  label: 'ui:quests.sincereRedemption.title',
  description: 'ui:quests.sincereRedemption.description',
  deadlineOffset: 10,
  repeatPolicy: 'never',
  progressSource: 'good_gig',
  progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
  required: 2,
  completionFlags: ['sincere_redemption_complete'],
  failureFlags: ['sincere_redemption_failed'],
  rewards: [{ type: 'social.controversy', amount: -20 }],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
