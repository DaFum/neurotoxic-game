import type { QuestDefinition } from '../../types/quest'

export const quest_merch_rush = {
  kind: 'side',
  label: 'ui:quests.merchRush.title',
  description: 'ui:quests.merchRush.description',
  deadlineOffset: 6,
  repeatPolicy: 'cooldown',
  progressSource: 'gig_completed',
  progressRules: [{ event: 'gig.completed', amount: 'fixed', fixedAmount: 1 }],
  required: 3,
  cooldownDays: 10,
  offer: {
    trigger: 'random',
    category: 'financial',
    chance: 0.07,
    condition: { requiredAssetKind: 'merch_workshop_chassis' }
  },
  rewards: [{ type: 'money', amount: 400 }],
  failurePenalties: [{ type: 'social.loyalty', amount: -3 }]
} as const satisfies QuestDefinition
