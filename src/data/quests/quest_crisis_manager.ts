import { createCorporateQuest } from './utils/createCorporateQuest'

export const quest_crisis_manager = createCorporateQuest({
  label: 'events:quest_crisis_manager.label',
  description: 'events:quest_crisis_manager.desc',
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
  }
})
