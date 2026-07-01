import type { QuestDefinition } from '../../types/quest'
import { QUEST_BAND_PACT } from '../questsConstants'

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
  clearFlagsOnComplete: ['breakup_quest_active'],
  clearFlagsOnFail: ['breakup_quest_active'],
  completionFlags: ['ego_crisis_resolved'],
  failureFlags: ['ego_crisis_failed'],
  failurePenalties: [
    { type: 'social.controversy', amount: 10 },
    { type: 'social.loyalty', amount: -15 },
    { type: 'band.harmony', amount: -25 },
    { type: 'quest.cooldown', days: 10 }
  ]
} as const satisfies QuestDefinition
