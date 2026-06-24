import type { QuestDefinition } from '../../types/quest'

export const quest_harmony_project = {
  kind: 'side',
  label: 'events:quest_harmony_project.label',
  description: 'events:quest_harmony_project.desc',
  deadlineOffset: 4,
  repeatPolicy: 'never',
  progressSource: 'harmony_recovered',
  progressRules: [
    {
      event: 'band.harmonyChanged',
      amount: 'threshold',
      thresholdField: 'band.harmony'
    },
    {
      event: 'social.postResolved',
      amount: 'fixed',
      fixedAmount: 5,
      match: { postCategory: 'Lifestyle', success: true }
    }
  ],
  required: 75,
  offer: {
    trigger: 'random',
    category: 'band',
    chance: 0.3,
    condition: { band: { harmonyBelow: 60 } }
  },
  rewards: [{ type: 'band.harmony', amount: 20 }],
  failurePenalties: [{ type: 'band.harmony', amount: -10 }]
} as const satisfies QuestDefinition
