import type { QuestDefinition } from '../../types/quest'
import { FLAGS } from '../flags.registry'

export const quest_sincere_redemption = {
  kind: 'story',
  label: 'ui:quests.sincereRedemption.title',
  description: 'ui:quests.sincereRedemption.description',
  deadlineOffset: 10,
  repeatPolicy: 'never',
  progressSource: 'good_gig',
  progressRules: [{ event: 'gig.good', amount: 'fixed', fixedAmount: 1 }],
  required: 2,
  completionFlags: [FLAGS.SINCERE_REDEMPTION_COMPLETE],
  failureFlags: [FLAGS.SINCERE_REDEMPTION_FAILED],
  rewards: [{ type: 'social.controversy', amount: -20 }],
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }]
} as const satisfies QuestDefinition
