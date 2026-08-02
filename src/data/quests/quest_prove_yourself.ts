import type { QuestDefinition } from '../../types/quest'
import { QUEST_BACK_FROM_PIT } from '../questsConstants'
import { FLAGS } from '../flags.registry'

export const quest_prove_yourself = {
  kind: 'story',
  label: 'ui:quests.proveYourself.title',
  deadlineOffset: 20,
  repeatPolicy: 'never',
  progressSource: 'small_venue_good_gig',
  progressRules: [
    { event: 'gig.smallVenueGood', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 4,
  followupQuestId: QUEST_BACK_FROM_PIT,
  startFlags: [FLAGS.PROVE_YOURSELF_ACTIVE],
  clearFlagsOnComplete: [FLAGS.PROVE_YOURSELF_ACTIVE],
  clearFlagsOnFail: [FLAGS.PROVE_YOURSELF_ACTIVE],
  completionFlags: [FLAGS.PROVE_YOURSELF_COMPLETE],
  failureFlags: [FLAGS.PROVE_YOURSELF_FAILED],
  failurePenalties: [
    { type: 'social.controversy', amount: 10 },
    { type: 'band.harmony', amount: -20 },
    { type: 'quest.cooldown', days: 20 }
  ]
} as const satisfies QuestDefinition
