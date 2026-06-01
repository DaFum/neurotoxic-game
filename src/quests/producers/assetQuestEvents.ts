import type { AssetKind, QuestEvent } from '../../types'

export const createAssetAcquiredQuestEvent = ({
  assetId,
  assetKind,
  flavor,
  tier
}: {
  assetId: string
  assetKind: AssetKind | string
  flavor: string
  tier: number
}): QuestEvent => ({
  type: 'asset.acquired',
  amount: 1,
  success: true,
  context: { assetId, assetKind, flavor, tier },
  tags: [assetKind, flavor, String(tier)]
})

export const createAssetRepairedQuestEvent = ({
  assetId,
  assetKind,
  amount
}: {
  assetId: string
  assetKind: AssetKind | string
  amount: number
}): QuestEvent => ({
  type: 'asset.repaired',
  amount,
  success: true,
  context: { assetId, assetKind }
})

export const createAssetModuleInstalledQuestEvent = ({
  assetId,
  assetKind,
  moduleId,
  slotType
}: {
  assetId: string
  assetKind: AssetKind | string
  moduleId: string
  slotType?: string
}): QuestEvent => ({
  type: 'asset.moduleInstalled',
  amount: 1,
  success: true,
  context: { assetId, assetKind, moduleId, slotType },
  tags: [assetKind, moduleId, slotType].filter(
    (entry): entry is string => typeof entry === 'string'
  )
})

export const createAssetRiskTriggeredQuestEvent = ({
  assetId,
  assetKind,
  riskType
}: {
  assetId: string
  assetKind: AssetKind | string
  riskType: string
}): QuestEvent => ({
  type: 'asset.riskTriggered',
  amount: 1,
  success: true,
  context: { assetId, assetKind, riskType },
  tags: [assetKind, riskType]
})

export const createAssetRiskResolvedQuestEvent = ({
  assetId,
  assetKind,
  riskType,
  success
}: {
  assetId: string
  assetKind: AssetKind | string
  riskType: string
  success: boolean
}): QuestEvent => ({
  type: 'asset.riskResolved',
  amount: 1,
  success,
  context: { assetId, assetKind, riskType },
  tags: [assetKind, riskType]
})

export const createAssetConditionChangedQuestEvent = ({
  assetId,
  assetKind,
  amount,
  condition
}: {
  assetId: string
  assetKind: AssetKind | string
  amount: number
  condition: number
}): QuestEvent => ({
  type: 'asset.conditionChanged',
  amount,
  success: amount >= 0,
  context: { assetId, assetKind, condition },
  tags: [assetKind]
})
