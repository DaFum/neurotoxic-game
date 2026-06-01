import type { AssetKind, QuestEvent } from '../../types'

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
