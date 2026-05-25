import type { GameState } from '../../types/game'
import type {
  PurchaseChassisPayload,
  InstallModulePayload,
  UpgradeChassisTierPayload,
  ResolveCrowdfundPayload,
  LongTermAsset,
  AssetSlot,
  Liability
} from '../../types/assets'
import {
  CHASSIS_CONFIG,
  UPGRADE_OVERHEAD,
  REPAIR_COST_PER_POINT,
  buildDiyTier
} from '../../utils/assetConfig'
import { LOAN_PROFILES, computeAmortization } from '../../utils/loanProfiles'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'

export const handlePurchaseChassis = (
  state: GameState,
  payload: PurchaseChassisPayload
): GameState => {
  const { id, kind, flavor, tier, mode, slotIds, loanProfileId, today } =
    payload

  let configTier:
    | import('../../utils/assetConfig').ChassisTierConfig
    | ReturnType<typeof buildDiyTier>
    | undefined
  if (flavor === 'legit') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configTier = (CHASSIS_CONFIG as Record<string, any>)[kind].legit[
      tier
    ] as import('../../utils/assetConfig').ChassisTierConfig
  } else {
    configTier = buildDiyTier(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((CHASSIS_CONFIG as Record<string, any>)[kind].legit[
        tier
      ] as import('../../utils/assetConfig').ChassisTierConfig)!
    )
  }

  const slots: AssetSlot[] = configTier!.slots.map(
    (st: import('../../types/assets').SlotType, i: number) => ({
      id: slotIds[i] as string,
      slotType: st,
      position: { x: 0, y: 0 },
      installedModuleId: null
    })
  )

  const asset: LongTermAsset = {
    id,
    kind,
    chassisFlavor: flavor,
    chassisTier: tier,
    condition: 100,
    baseUpkeep: configTier!.upkeep,
    baseDailyRevenue: configTier!.revenue,
    slots,
    acquiredOnDay: today,
    acquisitionMode: mode,
    baseRiskEventChance: configTier!.baseRiskEventChance
  }

  let nextMoney = state.player.money
  const nextLiabilities = [...(state.liabilities || [])]

  if (mode === 'cash') {
    nextMoney -= configTier!.price
  } else if (mode === 'loan' && loanProfileId) {
    const profile =
      LOAN_PROFILES[
        loanProfileId as import('../../utils/loanProfiles').LoanProfileId
      ]
    if (profile) {
      const dailyPayment = computeAmortization(
        configTier!.price,
        profile.interestRate,
        profile.termDays
      )
      const liability: Liability = {
        id: `loan_${id}`,
        source: 'loan',
        assetId: id,
        principalRemaining: configTier!.price,
        interestRate: profile.interestRate,
        dailyPayment,
        termDaysRemaining: profile.termDays,
        defaultCounter: 0
      }
      nextLiabilities.push(liability)
    }
  }

  return {
    ...state,
    player: {
      ...state.player,
      money: nextMoney
    },
    assets: [...(state.assets || []), asset],
    liabilities: nextLiabilities
  }
}

export const handleInstallModule = (
  state: GameState,
  payload: InstallModulePayload
): GameState => {
  const { assetId, slotId, moduleId, newSlotIds } = payload
  if (!state.assets) return state

  const moduleInfo = MODULE_REGISTRY[moduleId]
  if (!moduleInfo) return state

  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    const nextSlots = asset.slots.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, installedModuleId: moduleId }
      }
      return slot
    })

    if (newSlotIds && newSlotIds.length > 0) {
      newSlotIds.forEach(newSlot => {
        nextSlots.push({
          id: newSlot.id,
          slotType: newSlot.slotType,
          position: { x: 0, y: 0 },
          installedModuleId: null,
          addedByModuleId: moduleId
        })
      })
    }

    return { ...asset, slots: nextSlots }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - (moduleInfo.cost + moduleInfo.installCost)
    }
  }
}

export const handleRemoveModule = (
  state: GameState,
  payload: { assetId: string; slotId: string }
): GameState => {
  const { assetId, slotId } = payload
  if (!state.assets) return state

  let refund = 0
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    const targetSlot = asset.slots.find(s => s.id === slotId)
    if (targetSlot && targetSlot.installedModuleId) {
      const moduleInfo = MODULE_REGISTRY[targetSlot.installedModuleId]
      if (moduleInfo) {
        refund = moduleInfo.cost * moduleInfo.removalRefundFraction
      }
    }

    const removedModuleId = targetSlot?.installedModuleId

    let nextSlots = asset.slots.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, installedModuleId: null }
      }
      return slot
    })

    if (removedModuleId) {
      nextSlots = nextSlots.filter(s => s.addedByModuleId !== removedModuleId)
    }

    return { ...asset, slots: nextSlots }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money + refund
    }
  }
}

export const handleUpgradeChassisTier = (
  state: GameState,
  payload: UpgradeChassisTierPayload
): GameState => {
  const { assetId, targetTier, newSlotIds } = payload
  if (!state.assets) return state

  let upgradeCost = 0
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    let currentConfigTier:
      | import('../../utils/assetConfig').ChassisTierConfig
      | ReturnType<typeof buildDiyTier>
      | undefined
    if (asset.chassisFlavor === 'legit') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentConfigTier = (CHASSIS_CONFIG as Record<string, any>)[asset.kind]
        .legit[
        asset.chassisTier
      ] as import('../../utils/assetConfig').ChassisTierConfig
    } else {
      currentConfigTier = buildDiyTier(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((CHASSIS_CONFIG as Record<string, any>)[asset.kind].legit[
          asset.chassisTier
        ] as import('../../utils/assetConfig').ChassisTierConfig)!
      )
    }

    let targetConfigTier:
      | import('../../utils/assetConfig').ChassisTierConfig
      | ReturnType<typeof buildDiyTier>
      | undefined
    if (asset.chassisFlavor === 'legit') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targetConfigTier = (CHASSIS_CONFIG as Record<string, any>)[asset.kind]
        .legit[
        targetTier
      ] as import('../../utils/assetConfig').ChassisTierConfig
    } else {
      targetConfigTier = buildDiyTier(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((CHASSIS_CONFIG as Record<string, any>)[asset.kind].legit[
          targetTier
        ] as import('../../utils/assetConfig').ChassisTierConfig)!
      )
    }

    upgradeCost =
      targetConfigTier!.price - currentConfigTier!.price + UPGRADE_OVERHEAD

    const nextSlots = [...asset.slots]
    newSlotIds.forEach(newSlot => {
      nextSlots.push({
        id: newSlot.id,
        slotType: newSlot.slotType,
        position: { x: 0, y: 0 },
        installedModuleId: null
      })
    })

    return {
      ...asset,
      chassisTier: targetTier,
      baseUpkeep: targetConfigTier!.upkeep,
      baseDailyRevenue: targetConfigTier!.revenue,
      baseRiskEventChance: targetConfigTier!.baseRiskEventChance,
      slots: nextSlots
    }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - upgradeCost
    }
  }
}

export const handleSellChassis = (
  state: GameState,
  payload: { assetId: string }
): GameState => {
  const { assetId } = payload
  if (!state.assets) return state

  const asset = state.assets.find(a => a.id === assetId)
  if (!asset) return state

  const liability = state.liabilities?.find(l => l.assetId === assetId)
  const principalRemaining = liability?.principalRemaining || 0

  const daysOwned = Math.max(0, state.player.day - asset.acquiredOnDay)
  const conditionFactor = asset.condition / 100
  const depreciation = Math.max(0.4, 1 - (daysOwned / 365) * 0.4)

  let configTier:
    | import('../../utils/assetConfig').ChassisTierConfig
    | ReturnType<typeof buildDiyTier>
    | undefined
  if (asset.chassisFlavor === 'legit') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configTier = (CHASSIS_CONFIG as Record<string, any>)[asset.kind].legit[
      asset.chassisTier
    ] as import('../../utils/assetConfig').ChassisTierConfig
  } else {
    configTier = buildDiyTier(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((CHASSIS_CONFIG as Record<string, any>)[asset.kind].legit[
        asset.chassisTier
      ] as import('../../utils/assetConfig').ChassisTierConfig)!
    )
  }

  let moduleRefunds = 0
  asset.slots.forEach(slot => {
    if (slot.installedModuleId) {
      const moduleInfo = MODULE_REGISTRY[slot.installedModuleId]
      if (moduleInfo) {
        moduleRefunds += moduleInfo.cost * moduleInfo.removalRefundFraction
      }
    }
  })

  const gross =
    configTier!.price * conditionFactor * depreciation + moduleRefunds

  if (gross < principalRemaining) {
    return state
  }

  const net = gross - principalRemaining

  return {
    ...state,
    assets: state.assets.filter(a => a.id !== assetId),
    liabilities: state.liabilities?.filter(l => l.assetId !== assetId),
    player: {
      ...state.player,
      money: state.player.money + net
    }
  }
}

export const handleRepairChassis = (
  state: GameState,
  payload: { assetId: string }
): GameState => {
  const { assetId } = payload
  if (!state.assets) return state

  let repairCost = 0
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    repairCost = (100 - asset.condition) * REPAIR_COST_PER_POINT
    return { ...asset, condition: 100 }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - repairCost
    }
  }
}

export const handleStartCrowdfund = (
  state: GameState,
  payload: { campaign: import('../../types/assets').CrowdfundCampaign }
): GameState => {
  return {
    ...state,
    crowdfundCampaigns: [...(state.crowdfundCampaigns || []), payload.campaign]
  }
}

export const handleResolveCrowdfund = (
  state: GameState,
  payload: ResolveCrowdfundPayload
): GameState => {
  const { campaignId, outcome, newAssetId, newSlotIds } = payload
  if (!state.crowdfundCampaigns) return state

  const campaign = state.crowdfundCampaigns.find(c => c.id === campaignId)
  if (!campaign) return state

  const nextCampaigns = state.crowdfundCampaigns.filter(
    c => c.id !== campaignId
  )

  let nextFame = state.band.fame
  let nextAssets = state.assets || []

  if (outcome === 'success') {
    nextFame += campaign.fameStake

    if (newAssetId && newSlotIds) {
      let configTier:
        | import('../../utils/assetConfig').ChassisTierConfig
        | ReturnType<typeof buildDiyTier>
        | undefined
      if (campaign.assetSpec.flavor === 'legit') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configTier = (CHASSIS_CONFIG as Record<string, any>)[
          campaign.assetSpec.kind
        ].legit[
          campaign.assetSpec.chassisTier
        ] as import('../../utils/assetConfig').ChassisTierConfig
      } else {
        configTier = buildDiyTier(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((CHASSIS_CONFIG as Record<string, any>)[campaign.assetSpec.kind]
            .legit[
            campaign.assetSpec.chassisTier
          ] as import('../../utils/assetConfig').ChassisTierConfig)!
        )
      }

      const slots: AssetSlot[] = configTier!.slots.map(
        (st: import('../../types/assets').SlotType, i: number) => ({
          id: (newSlotIds || [])[i]?.id as string,
          slotType: st,
          position: { x: 0, y: 0 },
          installedModuleId: null
        })
      )

      const asset: LongTermAsset = {
        id: newAssetId,
        kind: campaign.assetSpec.kind,
        chassisFlavor: campaign.assetSpec.flavor,
        chassisTier: campaign.assetSpec.chassisTier,
        condition: 100,
        baseUpkeep: configTier!.upkeep,
        baseDailyRevenue: configTier!.revenue,
        slots,
        acquiredOnDay: state.player.day,
        acquisitionMode: 'crowdfund',
        baseRiskEventChance: configTier!.baseRiskEventChance
      }
      nextAssets = [...nextAssets, asset]
    }
  } else {
    nextFame = Math.max(0, nextFame - campaign.fameStake)
  }

  return {
    ...state,
    band: {
      ...state.band,
      fame: nextFame
    },
    assets: nextAssets,
    crowdfundCampaigns: nextCampaigns
  }
}

export const handleAssetForeclosed = (
  state: GameState,
  payload: { assetId: string }
): GameState => {
  return {
    ...state,
    assets: state.assets?.filter(a => a.id !== payload.assetId),
    liabilities: state.liabilities?.filter(l => l.assetId !== payload.assetId)
  }
}

export const handleAssetRiskEventTriggered = (
  state: GameState,
  payload: {
    assetId: string
    eventType: import('../../types/assets').RiskEventType
  }
): GameState => {
  if (!state.assets) return state
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== payload.assetId) return asset
    return {
      ...asset,
      condition: Math.max(0, Math.min(100, asset.condition - 15))
    }
  })

  return {
    ...state,
    assets: nextAssets
  }
}

export const handleAssetFailedAction = (state: GameState): GameState => state
