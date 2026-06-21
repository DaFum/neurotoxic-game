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
  calculateChassisRepairCost,
  calculateChassisUpgradeCost,
  CHASSIS_CONFIG
} from '../../utils/assetConfig'
import {
  LOAN_PROFILES,
  calculateRefinanceFee,
  computeAmortization,
  isLoanProfileEligible
} from '../../utils/loanProfiles'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import {
  calculateChassisGrossSaleValue,
  hasActiveAssetAcquisition
} from '../../utils/assetSelectors'
import { clampPlayerMoney, finiteNumberOr } from '../../utils/gameState'
import { QuestEvents } from '../../utils/questProgress'
import {
  createAssetAcquiredQuestEvent,
  createAssetConditionChangedQuestEvent,
  createAssetModuleInstalledQuestEvent,
  createAssetRepairedQuestEvent
} from '../../quests/producers/assetQuestEvents'

/**
 * Adds a long-term chassis asset purchased with cash or a validated loan.
 *
 * @param state - Current game state before the purchase.
 * @param payload - Validated chassis purchase details, generated asset id, slot ids, and acquisition mode.
 * @returns Updated state with the asset, any liability, and quest progress applied, or the original state when validation fails.
 */
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
  // Final authority: only cash/loan payloads may add a chassis here. Any
  // other mode (e.g. 'crowdfund') would fall through both payment branches
  // below and mint a free asset; crowdfund materializes via its tick instead.
  if (mode !== 'cash' && mode !== 'loan') return state
  if (
    mode === 'cash' &&
    (!Number.isFinite(state.player.money) ||
      state.player.money < configTier.price)
  ) {
    return state
  }

  // Bounds-check slotIds: if the action creator under-allocated ids, we
  // generate a deterministic synthetic id so the asset stays consistent
  // rather than storing undefined in a string field.
  // ⚡ BOLT OPTIMIZATION: Replaced Array.map with a procedural loop
  // Why: Avoids intermediate array allocation and closure overhead.
  // Impact: Reduces GC pressure.
  const slots: AssetSlot[] = []
  for (let i = 0; i < configTier.slots.length; i++) {
    const slotType = configTier.slots[i]
    if (slotType !== undefined) {
      const slotId = slotIds[i] ?? `${id}_slot_${i}`
      slots.push({
        id: slotId,
        slotType,
        position: { x: 0, y: 0 },
        installedModuleId: null
      })
    }
  }

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

  let nextMoney = finiteNumberOr(state.player.money, 0)
  const nextLiabilities = { ...(state.liabilities || {}) }

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
    nextLiabilities[liability.id] = liability
  }

  const nextState = {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(nextMoney)
    },
    assets: [...(state.assets || []), asset],
    liabilities: nextLiabilities
  }

  return QuestEvents.emit(
    nextState,
    createAssetAcquiredQuestEvent({
      assetId: id,
      assetKind: kind,
      flavor,
      tier
    })
  )
}

/**
 * Installs an asset module into an empty compatible slot and deducts the combined module and install cost.
 *
 * @param state - Current game state before the install.
 * @param payload - Module install target plus any slot ids added by the module.
 * @returns Updated state with the installed module and quest progress, or the original state when the install cannot be applied.
 */
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
  // ⚡ BOLT OPTIMIZATION: Replaced Array.map with targeted array indexing
  // Why: Avoids unnecessary iterations and object allocations for unmodified items.
  // Impact: Reduces GC pressure in high-frequency update paths.
  let targetAssetIndex = -1
  let targetAsset = null
  for (let i = 0; i < state.assets.length; i++) {
    const asset = state.assets[i]
    if (asset && asset.id === assetId) {
      targetAssetIndex = i
      targetAsset = asset
      break
    }
  }

  if (targetAssetIndex === -1 || !targetAsset) return state

  let installed = false
  const nextSlots = targetAsset.slots ? [...targetAsset.slots] : []
  for (let i = 0; i < nextSlots.length; i++) {
    const slot = nextSlots[i]
    if (slot && slot.id === slotId && slot.installedModuleId === null) {
      installed = true
      nextSlots[i] = { ...slot, installedModuleId: moduleId }
      break
    }
  }

  if (!installed) return state

  if (newSlotIds && newSlotIds.length > 0 && moduleInfo.addsSlots) {
    const allowedSlotTypes: Record<string, number> = {}
    for (let i = 0; i < moduleInfo.addsSlots.length; i++) {
      const def = moduleInfo.addsSlots[i]
      if (def) {
        allowedSlotTypes[def.slotType] = def.count
      }
    }

    for (let i = 0; i < newSlotIds.length; i++) {
      const newSlot = newSlotIds[i]
      const count = newSlot && Object.hasOwn(allowedSlotTypes, newSlot.slotType) ? allowedSlotTypes[newSlot.slotType] : 0
      if (newSlot && count !== undefined && count > 0) {
        allowedSlotTypes[newSlot.slotType] = count - 1
        nextSlots.push({
          id: newSlot.id,
          slotType: newSlot.slotType,
          position: { x: 0, y: 0 },
          installedModuleId: null,
          addedByModuleId: moduleId
        })
      }
    }
  }

  const nextAssets = [...state.assets]
  nextAssets[targetAssetIndex] = { ...targetAsset, slots: nextSlots }

  let nextState: GameState = {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: clampPlayerMoney(
        finiteNumberOr(state.player.money, 0) - installCost
      )
    }
  }

  // ⚡ BOLT OPTIMIZATION: Replaced O(N) Array.find with a procedural loop
  // to avoid closure overhead and reduce GC pressure on hot paths.
  let assetForEvent: LongTermAsset | null = null
  for (let i = 0; i < state.assets.length; i++) {
    const asset = state.assets[i]
    if (asset && asset.id === assetId) {
      assetForEvent = asset
      break
    }
  }

  if (assetForEvent) {
    nextState = QuestEvents.emit(
      nextState,
      createAssetModuleInstalledQuestEvent({
        assetId,
        assetKind: assetForEvent.kind,
        moduleId,
        slotType: moduleInfo.slotType
      })
    )
  }

  return nextState
}

/**
 * Removes an installed module, removes its empty child slots, and refunds the configured removal value.
 *
 * @param state - Current game state before removal.
 * @param payload - Asset and slot ids identifying the module to remove.
 * @returns Updated state after removal, or the original state when child slots are still occupied or the target is missing.
 */
export const handleRemoveModule = (
  state: GameState,
  payload: { assetId: string; slotId: string }
): GameState => {
  const { assetId, slotId } = payload
  if (!state.assets) return state

  // ⚡ BOLT OPTIMIZATION: Replaced O(N) array methods (.find, .some, .map, .filter)
  // with procedural loops to avoid intermediate array allocations and reduce GC pressure.
  let targetAsset: LongTermAsset | null = null
  let targetAssetIndex = -1
  for (let i = 0; i < state.assets.length; i++) {
    const asset = state.assets[i]
    if (asset && asset.id === assetId) {
      targetAsset = asset
      targetAssetIndex = i
      break
    }
  }

  // Reject the removal if any child slot the module added is still occupied.
  // Silently destroying the installed children (and their refund eligibility)
  // would let players turbo-launder modules: install hitch → install trailer
  // addons → remove hitch → addons vanish without refund. Force the player
  // to uninstall children first.
  if (!targetAsset) return state

  let targetSlot: AssetSlot | null = null
  for (let i = 0; i < targetAsset.slots.length; i++) {
    const slot = targetAsset.slots[i]
    if (slot && slot.id === slotId) {
      targetSlot = slot
      break
    }
  }

  const removedModuleId = targetSlot?.installedModuleId ?? null
  if (removedModuleId) {
    let blocked = false
    for (let i = 0; i < targetAsset.slots.length; i++) {
      const s = targetAsset.slots[i]
      if (
        s &&
        s.addedByModuleId === removedModuleId &&
        Boolean(s.installedModuleId)
      ) {
        blocked = true
        break
      }
    }
    if (blocked) return state
  }

  let refund = 0
  if (targetSlot && targetSlot.installedModuleId) {
    const moduleInfo = MODULE_REGISTRY[targetSlot.installedModuleId]
    if (moduleInfo) {
      refund = moduleInfo.cost * moduleInfo.removalRefundFraction
    }
  }

  const nextSlots: AssetSlot[] = []
  for (let i = 0; i < targetAsset.slots.length; i++) {
    const slot = targetAsset.slots[i]
    if (!slot) continue
    if (removedModuleId && slot.addedByModuleId === removedModuleId) {
      continue
    }
    if (slot.id === slotId) {
      nextSlots.push({ ...slot, installedModuleId: null })
    } else {
      nextSlots.push(slot)
    }
  }

  const nextAssets = [...state.assets]
  nextAssets[targetAssetIndex] = { ...targetAsset, slots: nextSlots }

  const nextState: GameState = {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: clampPlayerMoney(finiteNumberOr(state.player.money, 0) + refund)
    }
  }
  return nextState
}

/**
 * Upgrades an existing chassis to a higher tier and adds newly unlocked slots.
 *
 * @param state - Current game state before the upgrade.
 * @param payload - Target asset id, desired tier, and pre-generated slot ids for added slots.
 * @returns Updated state with upgraded chassis stats and deducted cost, or the original state when validation fails.
 */
export const handleUpgradeChassisTier = (
  state: GameState,
  payload: UpgradeChassisTierPayload
): GameState => {
  const { assetId, targetTier, newSlotIds } = payload
  if (!state.assets) return state

  // Early-return when the target asset doesn't exist. Without this guard the
  // reducer would still spread state and rebuild player.money (with
  // upgradeCost staying at 0 — no functional damage today, but it wastes an
  // allocation and could mask a buggy dispatch from upstream). Note that to maintain
  // reducer purity, we do not log errors here; validation belongs in the action creator.
  // ⚡ BOLT OPTIMIZATION: Replaced O(N) array methods (.find, .map)
  // with procedural loops to avoid intermediate array allocations and reduce GC pressure.
  let targetAsset: LongTermAsset | null = null
  let targetAssetIndex = -1
  for (let i = 0; i < state.assets.length; i++) {
    const asset = state.assets[i]
    if (asset && asset.id === assetId) {
      targetAsset = asset
      targetAssetIndex = i
      break
    }
  }
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

  const nextSlots = [...targetAsset.slots]
  for (let i = 0; i < newSlotIds.length; i++) {
    const newSlot = newSlotIds[i]
    if (newSlot) {
      nextSlots.push({
        id: newSlot.id,
        slotType: newSlot.slotType,
        position: { x: 0, y: 0 },
        installedModuleId: null
      })
    }
  }

  const nextAssets = [...state.assets]
  nextAssets[targetAssetIndex] = {
    ...targetAsset,
    chassisTier: targetTier,
    baseUpkeep: targetConfigTier.upkeep,
    baseDailyRevenue: targetConfigTier.revenue,
    baseRiskEventChance: targetConfigTier.baseRiskEventChance,
    slots: nextSlots
  }

  const nextState: GameState = {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: clampPlayerMoney(
        finiteNumberOr(state.player.money, 0) - upgradeCost
      )
    }
  }
  return nextState
}

/**
 * Sells a chassis when its gross sale value can cover attached loan principal.
 *
 * @param state - Current game state before the sale.
 * @param payload - Asset id of the chassis to sell.
 * @returns Updated state with the asset and liabilities removed plus net proceeds, or the original state when sale rules fail.
 */
export const handleSellChassis = (
  state: GameState,
  payload: { assetId: string }
): GameState => {
  const { assetId } = payload
  if (!state.assets) return state

  // ⚡ BOLT OPTIMIZATION: Replaced O(N) Array.find with a procedural loop
  // to avoid closure overhead and reduce GC pressure on hot paths.
  let asset: LongTermAsset | null = null
  for (let i = 0; i < state.assets.length; i++) {
    const a = state.assets[i]
    if (a && a.id === assetId) {
      asset = a
      break
    }
  }
  if (!asset) return state

  // ⚡ BOLT OPTIMIZATION: Replaced chained .filter().reduce() with a single-pass loop to eliminate intermediate array allocations on hot paths.
  let rawTotalPrincipalRemaining = 0
  if (state.liabilities) {
    for (const l of Object.values(state.liabilities)) {
      if (l && l.assetId === assetId) {
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

  const gross = calculateChassisGrossSaleValue(asset, state.player.day)
  if (gross === null) return state

  if (gross < totalPrincipalRemaining) {
    return state
  }

  const net = gross - totalPrincipalRemaining

  const nextLiabilities: Record<string, Liability> = {}
  const currentLiabilities = state.liabilities || {}
  for (const id in currentLiabilities) {
    if (Object.hasOwn(currentLiabilities, id)) {
      const l = currentLiabilities[id]
      if (l && l.assetId !== assetId) {
        nextLiabilities[id] = l
      }
    }
  }

  const nextState: GameState = {
    ...state,
    assets: state.assets.filter(a => a && a.id !== assetId),
    liabilities: nextLiabilities,
    player: {
      ...state.player,
      money: clampPlayerMoney(finiteNumberOr(state.player.money, 0) + net)
    }
  }
  return nextState
}

/**
 * Repairs a chassis back to full condition and emits repair and condition-change quest events.
 *
 * @param state - Current game state before repair.
 * @param payload - Asset id of the chassis to repair.
 * @returns Updated state with repaired condition and deducted repair cost, or the original state when repair is unavailable.
 */
export const handleRepairChassis = (
  state: GameState,
  payload: { assetId: string }
): GameState => {
  const { assetId } = payload
  if (!state.assets) return state

  // Mirror the early-return pattern from handleUpgradeChassisTier: if no
  // asset matches, return state unchanged rather than allocating a fresh
  // state with a zero-cost repair.
  // ⚡ BOLT OPTIMIZATION: Replaced O(N) Array.find with a procedural loop
  // to avoid closure overhead and reduce GC pressure on hot paths.
  let targetAsset: LongTermAsset | null = null
  let targetAssetIndex = -1
  for (let i = 0; i < state.assets.length; i++) {
    const a = state.assets[i]
    if (a && a.id === assetId) {
      targetAsset = a
      targetAssetIndex = i
      break
    }
  }
  if (!targetAsset) return state

  const repairCost = calculateChassisRepairCost(targetAsset.condition)
  if (repairCost <= 0 || state.player.money < repairCost) return state

  // ⚡ BOLT OPTIMIZATION: Replaced Array.map with targeted array indexing
  // Why: Avoids recreating objects for unmodified items in the array.
  // Impact: Reduces GC overhead in update paths.
  const nextAssets = [...state.assets]
  if (targetAssetIndex !== -1) {
    nextAssets[targetAssetIndex] = { ...targetAsset, condition: 100 }
  }

  let nextState: GameState = {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: clampPlayerMoney(
        finiteNumberOr(state.player.money, 0) - repairCost
      )
    }
  }

  const repairAmount = 100 - targetAsset.condition
  nextState = QuestEvents.emit(
    nextState,
    createAssetRepairedQuestEvent({
      assetId,
      assetKind: targetAsset.kind,
      amount: repairAmount
    })
  )
  return QuestEvents.emit(
    nextState,
    createAssetConditionChangedQuestEvent({
      assetId,
      assetKind: targetAsset.kind,
      amount: repairAmount,
      condition: 100
    })
  )
}

/**
 * Refinances a loan liability through an eligible loan profile and charges the refinance fee.
 *
 * @param state - Current game state before refinancing.
 * @param payload - Loan liability id and replacement loan profile id.
 * @returns Updated state with recalculated loan terms, or the original state when eligibility or payment checks fail.
 */
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

  const targetLiability = state.liabilities[payload.liabilityId]
  if (!targetLiability || targetLiability.source !== 'loan') return state
  if (finiteNumberOr(targetLiability.defaultCounter, 0) > 0) return state

  const principal = Math.max(
    0,
    finiteNumberOr(targetLiability.principalRemaining, 0)
  )
  const fee = calculateRefinanceFee(principal)
  if (state.player.money < fee) return state

  const liabilities = { ...state.liabilities }
  liabilities[payload.liabilityId] = {
    ...targetLiability,
    interestRate: profile.interestRate,
    dailyPayment: computeAmortization(
      principal,
      profile.interestRate,
      profile.termDays
    ),
    termDaysRemaining: profile.termDays,
    defaultCounter: 0
  }

  return {
    ...state,
    player: {
      ...state.player,
      money: clampPlayerMoney(finiteNumberOr(state.player.money, 0) - fee)
    },
    liabilities
  }
}

/**
 * Starts a crowdfund campaign for an asset when that asset kind has no active acquisition.
 *
 * @param state - Current game state before campaign creation.
 * @param payload - Crowdfund campaign prepared by the action creator.
 * @returns Updated state with the campaign queued, or the original state when acquisition is already active.
 */
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

/**
 * Removes a foreclosed asset and any liabilities attached to it.
 *
 * @param state - Current game state before foreclosure.
 * @param payload - Asset id to remove.
 * @returns Updated state with the asset and related liabilities removed.
 */
export const handleAssetForeclosed = (
  state: GameState,
  payload: { assetId: string }
): GameState => {
  const nextLiabilities: Record<string, Liability> = {}
  const currentLiabilities = state.liabilities || {}
  for (const id in currentLiabilities) {
    if (Object.hasOwn(currentLiabilities, id)) {
      const l = currentLiabilities[id]
      if (l && l.assetId !== payload.assetId) {
        nextLiabilities[id] = l
      }
    }
  }

  return {
    ...state,
    assets: state.assets.filter(a => a.id !== payload.assetId),
    liabilities: nextLiabilities
  }
}

/**
 * Dismisses pending foreclosure notices for a specific asset kind.
 *
 * @param state - Current game state before dismissal.
 * @param payload - Asset kind whose foreclosure notices should be removed.
 * @returns Updated state with matching pending notices filtered out.
 */
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

/**
 * Leaves state unchanged for asset validation failure actions handled outside the reducer.
 *
 * @param state - Current game state.
 * @returns The original state reference.
 */
export const handleAssetFailedAction = (state: GameState): GameState => state
