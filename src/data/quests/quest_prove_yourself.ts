import type { QuestDefinition } from '../../types/quest'

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
  followupQuestId: 'quest_back_from_pit',
  startFlags: ['prove_yourself_active'],
  clearFlagsOnComplete: ['prove_yourself_active'],
  clearFlagsOnFail: ['prove_yourself_active'],
  completionFlags: ['prove_yourself_complete'],
  failureFlags: ['prove_yourself_failed'],
  failurePenalties: [
    { type: 'social.controversy', amount: 10 },
    { type: 'band.harmony', amount: -20 },
    { type: 'quest.cooldown', days: 20 }
  ]
} as const satisfies QuestDefinition
