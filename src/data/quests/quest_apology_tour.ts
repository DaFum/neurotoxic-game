import type { QuestDefinition } from '../../types/quest'

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
  followupQuestId: 'quest_sincere_redemption',
  clearFlagsOnComplete: ['cancel_quest_active'],
  clearFlagsOnFail: ['cancel_quest_active'],
  completionFlags: ['apology_tour_complete'],
  failureFlags: ['apology_tour_failed'],
  failurePenalties: [
    { type: 'social.controversy', amount: 25 },
    { type: 'band.harmony', amount: -20 },
    { type: 'quest.cooldown', days: 14 }
  ]
} as const satisfies QuestDefinition
