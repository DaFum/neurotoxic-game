import type { QuestDefinition } from '../../types/quest'

export const quest_crisis_manager = {
  kind: 'repeatable',
  label: 'events:quest_crisis_manager.label',
  description: 'events:quest_crisis_manager.desc',
  deadlineOffset: 20,
  repeatPolicy: 'cooldown',
  cooldownDays: 8,
  progressSource: 'asset_risk_resolved',
  progressRules: [
    { event: 'asset.riskResolved', amount: 'fixed', fixedAmount: 1 }
  ],
  required: 3,
  offer: {
    trigger: 'random',
    category: 'special',
    chance: 0.05,
    condition: { requiredAssetKind: 'bandhaus_chassis' }
  },
  rewards: [
    { type: 'brand.trust', alignment: 'corporate', amount: 10 },
    { type: 'fame', amount: 120 }
  ],
  failurePenalties: [
    { type: 'brand.trust', alignment: 'corporate', amount: -5 },
    { type: 'social.loyalty', amount: -5 }
  ]
} as const satisfies QuestDefinition
