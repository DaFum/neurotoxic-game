import type { QuestDefinition } from '../../types/quest'

export const quest_band_pact = {
  kind: 'story',
  label: 'ui:quests.bandPact.title',
  description: 'ui:quests.bandPact.description',
  deadlineOffset: 7,
  repeatPolicy: 'never',
  progressSource: 'harmony_recovered',
  progressRules: [
    {
      event: 'band.harmonyChanged',
      amount: 'threshold',
      thresholdField: 'band.harmony'
    }
  ],
  required: 70,
  completionFlags: ['band_pact_complete'],
  failureFlags: ['band_pact_failed'],
  rewards: [{ type: 'band.harmony', amount: 15 }],
  failurePenalties: [{ type: 'band.harmony', amount: -10 }]
} as const satisfies QuestDefinition
