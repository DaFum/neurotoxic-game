import type { QuestDefinition } from '../../types/quest'

export const quest_murphys_law = {
  kind: 'side',
  label: 'events:quest_murphys_law.label',
  description: 'events:quest_murphys_law.desc',
  deadlineOffset: 25,
  repeatPolicy: 'never',
  progressSource: 'asset_risk_triggered',
  progressRules: [
    { event: 'asset.riskTriggered', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 3,
  offer: {
    trigger: 'random',
    category: 'special',
    chance: 0.05,
    condition: { requiredAssetKind: 'bandhaus_chassis' }
  },
  failurePenalties: [{ type: 'social.loyalty', amount: -5 }],
  rewards: [
    { type: 'asset.repair', assetKind: 'bandhaus_chassis', amount: 20 },
    { type: 'money', amount: 250 }
  ]
} as const satisfies QuestDefinition
