import type { QuestDefinition } from '../../types/quest'
import { FLAGS } from '../flags.registry'

export const quest_back_from_pit = {
  kind: 'story',
  label: 'ui:quests.backFromPit.title',
  description: 'ui:quests.backFromPit.description',
  deadlineOffset: 14,
  repeatPolicy: 'never',
  progressSource: 'good_gig',
  progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
  required: 3,
  completionFlags: [FLAGS.BACK_FROM_PIT_COMPLETE],
  failureFlags: [FLAGS.BACK_FROM_PIT_FAILED],
  rewards: [{ type: 'fame', amount: 300 }],
  failurePenalties: [{ type: 'social.controversy', amount: 5 }]
} as const satisfies QuestDefinition
