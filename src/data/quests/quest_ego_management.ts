import type { QuestDefinition } from '../../types/quest'
import { QUEST_BAND_PACT } from '../questsConstants'
import { FLAGS } from '../flags.registry'

export const quest_ego_management = {
  kind: 'story',
  label: 'ui:quests.postgig.saveTheBand.title',
  description: 'ui:quests.postgig.saveTheBand.description',
  deadlineOffset: 5,
  repeatPolicy: 'never',
  progressSource: 'harmony_recovered',
  progressRules: [
    {
      event: 'band.harmonyChanged',
      amount: 'threshold',
      thresholdField: 'band.harmony'
    }
  ],
  required: 50,
  followupQuestId: QUEST_BAND_PACT,
  clearFlagsOnComplete: [FLAGS.BREAKUP_QUEST_ACTIVE],
  clearFlagsOnFail: [FLAGS.BREAKUP_QUEST_ACTIVE],
  completionFlags: [FLAGS.EGO_CRISIS_RESOLVED],
  failureFlags: [FLAGS.EGO_CRISIS_FAILED],
  failurePenalties: [
    { type: 'social.controversy', amount: 10 },
    { type: 'social.loyalty', amount: -15 },
    { type: 'band.harmony', amount: -25 },
    { type: 'quest.cooldown', days: 10 }
  ]
} as const satisfies QuestDefinition
