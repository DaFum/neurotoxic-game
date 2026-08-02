import type { QuestDefinition } from '../../types/quest'
import { FLAGS } from '../flags.registry'

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
  completionFlags: [FLAGS.BAND_PACT_COMPLETE],
  failureFlags: [FLAGS.BAND_PACT_FAILED],
  rewards: [{ type: 'band.harmony', amount: 15 }],
  failurePenalties: [{ type: 'band.harmony', amount: -10 }]
} as const satisfies QuestDefinition
