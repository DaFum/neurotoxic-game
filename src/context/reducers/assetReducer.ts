import type { GameState } from '../../types/game'
import type {
  PurchaseChassisPayload,
  InstallModulePayload,
  RefinanceLiabilityPayload,
  UpgradeChassisTierPayload,
  LongTermAsset,
  AssetSlot,
  Liability,
  AssetKind
} from '../../types/assets'
import {
  calculateChassisUpgradeCost,
  CHASSIS_CONFIG,
  REPAIR_COST_PER_POINT
} from '../../utils/assetConfig'
import {
  LOAN_PROFILES,
  calculateRefinanceFee,
  computeAmortization,
  isLoanProfileEligible
} from '../../utils/loanProfiles'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import { hasActiveAssetAcquisition } from '../../utils/assetSelectors'
import { finiteNumberOr } from '../../utils/gameStateUtils'

export const handlePurchaseChassis = (
  state: GameState,
  payload: PurchaseChassisPayload
): GameState => {
  const { id, kind, flavor, tier, mode, slotIds, loanProfileId, today } =
    payload

  if (hasActiveAssetAcquisition(state, kind)) return state

  // CHASSIS_CONFIG is fully typed — Record<AssetKind, ChassisKindConfig> with
  // ChassisFlavorConfig nested under each flavor. Direct access without
  // `any` casts; if the action-creator validation passed, the entry exists.
  const configTier = CHASSIS_CONFIG[kind]?.[flavor]?.[tier]
  if (!configTier) return state

  // Bounds-check slotIds: if the action creator under-allocated ids, we
  // generate a deterministic synthetic id so the asset stays consistent
  // rather than storing undefined in a string field.
  const slots: AssetSlot[] = configTier.slots.map((slotType, i) => {
    const slotId = slotIds[i] ?? `${id}_slot_${i}`
    return {
      id: slotId,
      slotType,
      position: { x: 0, y: 0 },
      installedModuleId: null
    }
  })

  const asset: LongTermAsset = {
    id,
    kind,
    chassisFlavor: flavor,
    chassisTier: tier,
    condition: 100,
    baseUpkeep: configTier.upkeep,
    baseDailyRevenue: configTier.revenue,
    slots,
    acquiredOnDay: today,
    acquisitionMode: mode,
    baseRiskEventChance: configTier.baseRiskEventChance
  }

  let nextMoney = state.player.money
  const nextLiabilities = [...(state.liabilities || [])]

  if (mode === 'cash') {
    nextMoney -= configTier.price
  } else if (mode === 'loan') {
    // Loan-mode payloads must reference a real LoanProfile. The action
    // creator already enforces this, but a malformed dispatch (replay tools,
    // hostile inputs) must not be able to mint a free chassis by sending
    // mode: 'loan' without a profile id.
    if (!loanProfileId) return state
    const profile =
      LOAN_PROFILES[
        loanProfileId as import('../../utils/loanProfiles').LoanProfileId
      ]
    if (!profile) return state
    const dailyPayment = computeAmortization(
      configTier.price,
      profile.interestRate,
      profile.termDays
    )
    const liability: Liability = {
      id: `loan_${id}`,
      source: 'loan',
      assetId: id,
      principalRemaining: configTier.price,
      interestRate: profile.interestRate,
      dailyPayment,
      termDaysRemaining: profile.termDays,
      defaultCounter: 0
    }
    nextLiabilities.push(liability)
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
  const installCost = moduleInfo.cost + moduleInfo.installCost
  if (state.player.money < installCost) return state

  // Track whether the install actually landed. If the assetId/slotId in the
  // payload doesn't match anything live (replay against a stale state, hostile
  // dispatch), we must NOT deduct money — otherwise the player pays for an
  // install that never happened.
  let installed = false

  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    const nextSlots = asset.slots.map(slot => {
      if (slot.id === slotId && slot.installedModuleId === null) {
        installed = true
        return { ...slot, installedModuleId: moduleId }
      }
      return slot
    })

    if (installed && newSlotIds && newSlotIds.length > 0) {
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

  if (!installed) return state

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - installCost
    }
  }
}

export const handleRemoveModule = (
  state: GameState,
  payload: { assetId: string; slotId: string }
): GameState => {
  const { assetId, slotId } = payload
  if (!state.assets) return state

  // Reject the removal if any child slot the module added is still occupied.
  // Silently destroying the installed children (and their refund eligibility)
  // would let players turbo-launder modules: install hitch → install trailer
  // addons → remove hitch → addons vanish without refund. Force the player
  // to uninstall children first.
  const targetAsset = state.assets.find(a => a.id === assetId)
  if (!targetAsset) return state
  const targetSlot = targetAsset.slots.find(s => s.id === slotId)
  const removedModuleId = targetSlot?.installedModuleId ?? null
  if (removedModuleId) {
    const blocked = targetAsset.slots.some(
      s => s.addedByModuleId === removedModuleId && Boolean(s.installedModuleId)
    )
    if (blocked) return state
  }

  let refund = 0
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    if (targetSlot && targetSlot.installedModuleId) {
      const moduleInfo = MODULE_REGISTRY[targetSlot.installedModuleId]
      if (moduleInfo) {
        refund = moduleInfo.cost * moduleInfo.removalRefundFraction
      }
    }

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

  // Early-return when the target asset doesn't exist. Without this guard the
  // reducer would still spread state and rebuild player.money (with
  // upgradeCost staying at 0 — no functional damage today, but it wastes an
  // allocation and could mask a buggy dispatch from upstream).
  const targetAsset = state.assets.find(a => a.id === assetId)
  if (!targetAsset) return state

  if (targetTier <= targetAsset.chassisTier) return state
  const currentConfigTier =
    CHASSIS_CONFIG[targetAsset.kind]?.[targetAsset.chassisFlavor]?.[
      targetAsset.chassisTier
    ]
  const targetConfigTier =
    CHASSIS_CONFIG[targetAsset.kind]?.[targetAsset.chassisFlavor]?.[targetTier]
  if (!currentConfigTier || !targetConfigTier) return state
  const upgradeCost = calculateChassisUpgradeCost(
    currentConfigTier,
    targetConfigTier
  )
  if (state.player.money < upgradeCost) return state

  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

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
      baseUpkeep: targetConfigTier.upkeep,
      baseDailyRevenue: targetConfigTier.revenue,
      baseRiskEventChance: targetConfigTier.baseRiskEventChance,
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

  // ⚡ BOLT OPTIMIZATION: Replaced chained .filter().reduce() with a single-pass loop to eliminate intermediate array allocations on hot paths.
  let rawTotalPrincipalRemaining = 0
  if (state.liabilities) {
    for (let i = 0; i < state.liabilities.length; i++) {
      const l = state.liabilities[i]
      if (!l) continue
      if (l.assetId === assetId) {
        rawTotalPrincipalRemaining += Math.max(
          0,
          finiteNumberOr(l.principalRemaining, 0)
        )
      }
    }
  }
  const totalPrincipalRemaining = Math.max(
    0,
    finiteNumberOr(rawTotalPrincipalRemaining, 0)
  )

  const daysOwned = Math.max(0, state.player.day - asset.acquiredOnDay)
  const conditionFactor = asset.condition / 100
  const depreciation = Math.max(0.4, 1 - (daysOwned / 365) * 0.4)

  const configTier =
    CHASSIS_CONFIG[asset.kind]?.[asset.chassisFlavor]?.[asset.chassisTier]
  if (!configTier) return state

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
    configTier.price * conditionFactor * depreciation + moduleRefunds

  if (gross < totalPrincipalRemaining) {
    return state
  }

  const net = gross - totalPrincipalRemaining

  return {
    ...state,
    assets: state.assets.filter(a => a.id !== assetId),
    liabilities: (state.liabilities || []).filter(l => l.assetId !== assetId),
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

  // Mirror the early-return pattern from handleUpgradeChassisTier: if no
  // asset matches, return state unchanged rather than allocating a fresh
  // state with a zero-cost repair.
  const targetAsset = state.assets.find(a => a.id === assetId)
  if (!targetAsset) return state

  const repairCost = (100 - targetAsset.condition) * REPAIR_COST_PER_POINT
  if (repairCost <= 0 || state.player.money < repairCost) return state

  const nextAssets = state.assets.map(asset =>
    asset.id === assetId ? { ...asset, condition: 100 } : asset
  )

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - repairCost
    }
  }
}

export const handleRefinanceLiability = (
  state: GameState,
  payload: RefinanceLiabilityPayload
): GameState => {
  const profile =
    LOAN_PROFILES[
      payload.loanProfileId as import('../../utils/loanProfiles').LoanProfileId
    ]
  if (!profile) return state
  if (
    !isLoanProfileEligible(profile, {
      fame: state.player.fame,
      scenePresence: state.social?.scenePresence ?? 0
    })
  ) {
    return state
  }

  const targetLiability = state.liabilities.find(
    liability =>
      liability.id === payload.liabilityId && liability.source === 'loan'
  )
  if (!targetLiability) return state
  if (finiteNumberOr(targetLiability.defaultCounter, 0) > 0) return state

  const principal = Math.max(
    0,
    finiteNumberOr(targetLiability.principalRemaining, 0)
  )
  const fee = calculateRefinanceFee(principal)
  if (state.player.money < fee) return state

  const liabilities = state.liabilities.map(liability => {
    if (liability.id !== payload.liabilityId) return liability

    return {
      ...liability,
      interestRate: profile.interestRate,
      dailyPayment: computeAmortization(
        principal,
        profile.interestRate,
        profile.termDays
      ),
      termDaysRemaining: profile.termDays,
      defaultCounter: 0
    }
  })

  return {
    ...state,
    player: {
      ...state.player,
      money: state.player.money - fee
    },
    liabilities
  }
}

export const handleStartCrowdfund = (
  state: GameState,
  payload: { campaign: import('../../types/assets').CrowdfundCampaign }
): GameState => {
  if (hasActiveAssetAcquisition(state, payload.campaign.assetSpec.kind)) {
    return state
  }
  return {
    ...state,
    crowdfundCampaigns: [...(state.crowdfundCampaigns || []), payload.campaign]
  }
}

export const handleAssetForeclosed = (
  state: GameState,
  payload: { assetId: string }
): GameState => {
  return {
    ...state,
    assets: state.assets.filter(a => a.id !== payload.assetId),
    liabilities: (state.liabilities || []).filter(
      l => l.assetId !== payload.assetId
    )
  }
}

export const handleDismissForeclosureNotice = (
  state: GameState,
  payload: { kind: AssetKind }
): GameState => {
  return {
    ...state,
    pendingForeclosureNotices: (state.pendingForeclosureNotices ?? []).filter(
      kind => kind !== payload.kind
    )
  }
}

export const handleAssetFailedAction = (state: GameState): GameState => state
