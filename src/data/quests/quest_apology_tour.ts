import type { QuestDefinition } from '../../types/quest'
import { QUEST_SINCERE_REDEMPTION } from '../questsConstants'
import { FLAGS } from '../flags.registry'

export const quest_apology_tour = {
  kind: 'story',
  label: 'ui:quests.postgig.apologyTour.title',
  description: 'ui:quests.postgig.apologyTour.description',
  deadlineOffset: 14,
  repeatPolicy: 'never',
  progressSource: 'small_venue_good_gig',
  progressRules: [
    { event: 'gig.smallVenueGood', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 3,
  followupQuestId: QUEST_SINCERE_REDEMPTION,
  clearFlagsOnComplete: [FLAGS.CANCEL_QUEST_ACTIVE],
  clearFlagsOnFail: [FLAGS.CANCEL_QUEST_ACTIVE],
  completionFlags: [FLAGS.APOLOGY_TOUR_COMPLETE],
  failureFlags: [FLAGS.APOLOGY_TOUR_FAILED],
  failurePenalties: [
    { type: 'social.controversy', amount: 25 },
    { type: 'band.harmony', amount: -20 },
    { type: 'quest.cooldown', days: 14 }
  ]
} as const satisfies QuestDefinition
