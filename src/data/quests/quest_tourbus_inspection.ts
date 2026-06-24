import type { QuestDefinition } from '../../types/quest'

export const quest_tourbus_inspection = {
  kind: 'side',
  label: 'ui:quests.tourbusInspection.title',
  description: 'ui:quests.tourbusInspection.description',
  deadlineOffset: 7,
  repeatPolicy: 'cooldown',
  progressSource: 'travel_completed',
  progressRules: [
    { event: 'travel.completed', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 2,
  cooldownDays: 14,
  offer: {
    trigger: 'random',
    category: 'transport',
    chance: 0.07,
    condition: { requiredAssetKind: 'tourbus_chassis' }
  },
  rewards: [{ type: 'money', amount: 300 }],
  failurePenalties: [{ type: 'band.harmony', amount: -5 }]
} as const satisfies QuestDefinition
