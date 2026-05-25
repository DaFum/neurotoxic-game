/**
 * Action creators for the long-term asset system.
 *
 * All creators in this file follow three rules:
 *
 * 1. **Reducer purity**: every random value (UUIDs, RNG rolls) is generated
 *    here in the action creator, not in the reducer. The reducer receives them
 *    pre-baked via the action payload and applies them deterministically.
 *
 * 2. **Validation up front**: when the player's action would be rejected (DIY
 *    chassis financed via loan, slot-type mismatch, locked module, etc.) the
 *    creator returns a typed `*_FAILED` action instead of throwing. The reducer
 *    handles `*_FAILED` as a no-op (toast dispatching is the responsibility of
 *    UI middleware listening for these action types).
 *
 * 3. **Payload sanitization**: numeric fields run through `finiteNumberOr`
 *    before being placed in the payload; unknown enum values are rejected with
 *    `*_FAILED`. This is the first line of defense; the reducer re-validates.
 */

import { ActionTypes } from './actionTypes'
import { CHASSIS_CONFIG } from '../utils/assetConfig'
import { MODULE_REGISTRY } from '../utils/assetModuleRegistry'
import { LOAN_PROFILES, type LoanProfileId } from '../utils/loanProfiles'
import { getSlotConflicts, isModuleUnlocked } from '../utils/assetSelectors'
import { finiteNumberOr } from '../utils/gameStateUtils'
import { getSafeUUID } from '../utils/crypto'
import type { GameState, GameAction } from '../types'
import type {
  AcquisitionMode,
  AssetFlavor,
  AssetKind,
  ChassisTier,
  InstallModuleFailureReason,
  NewSlotEntry,
  PurchaseFailureReason,
  SlotType
} from '../types/assets'

type Extract2<T, V> = Extract<T, { type: V }>

type PurchaseChassisAction = Extract2<
  GameAction,
  typeof ActionTypes.PURCHASE_CHASSIS
>
type PurchaseChassisFailedAction = Extract2<
  GameAction,
  typeof ActionTypes.PURCHASE_CHASSIS_FAILED
>
type InstallModuleAction = Extract2<
  GameAction,
  typeof ActionTypes.INSTALL_MODULE
>
type InstallModuleFailedAction = Extract2<
  GameAction,
  typeof ActionTypes.INSTALL_MODULE_FAILED
>
type RemoveModuleAction = Extract2<GameAction, typeof ActionTypes.REMOVE_MODULE>
type UpgradeChassisTierAction = Extract2<
  GameAction,
  typeof ActionTypes.UPGRADE_CHASSIS_TIER
>
type SellChassisAction = Extract2<GameAction, typeof ActionTypes.SELL_CHASSIS>
type RepairChassisAction = Extract2<
  GameAction,
  typeof ActionTypes.REPAIR_CHASSIS
>
type StartCrowdfundAction = Extract2<
  GameAction,
  typeof ActionTypes.START_CROWDFUND
>
type ResolveCrowdfundAction = Extract2<
  GameAction,
  typeof ActionTypes.RESOLVE_CROWDFUND
>
type AssetForeclosedAction = Extract2<
  GameAction,
  typeof ActionTypes.ASSET_FORECLOSED
>
type AssetRiskEventAction = Extract2<
  GameAction,
  typeof ActionTypes.ASSET_RISK_EVENT_TRIGGERED
>

const VALID_KINDS: ReadonlySet<string> = new Set([
  'tourbus_chassis',
  'studio_chassis',
  'bandhaus_chassis',
  'merch_workshop_chassis'
])
const VALID_FLAVORS: ReadonlySet<string> = new Set(['legit', 'diy'])
const VALID_TIERS: ReadonlySet<number> = new Set([1, 2, 3])
const VALID_MODES: ReadonlySet<string> = new Set(['cash', 'loan', 'crowdfund'])

/**
 * Composes the pre-generated `NewSlotEntry` array for a module that uses
 * `addsSlots` to dynamically extend the chassis (e.g., a trailer hitch
 * exposing two trailer addon slots).
 */
const buildAddedSlotEntries = (moduleId: string): NewSlotEntry[] => {
  const m = MODULE_REGISTRY[moduleId]
  if (!m || !m.addsSlots) return []
  const out: NewSlotEntry[] = []
  for (const block of m.addsSlots) {
    for (let i = 0; i < block.count; i++) {
      out.push({ slotType: block.slotType, id: getSafeUUID() })
    }
  }
  return out
}

export interface PurchaseChassisInput {
  kind: AssetKind
  flavor: AssetFlavor
  tier: ChassisTier
  mode: AcquisitionMode
  loanProfileId?: LoanProfileId
}

/**
 * Creates a chassis purchase action. Validates flavor/mode combinations,
 * funds available, and (for loans) profile existence. Returns
 * `PURCHASE_CHASSIS_FAILED` on rejection so middleware can surface a toast.
 */
export const purchaseChassis = (
  raw: PurchaseChassisInput,
  state: GameState
): PurchaseChassisAction | PurchaseChassisFailedAction => {
  const fail = (
    reason: PurchaseFailureReason
  ): PurchaseChassisFailedAction => ({
    type: ActionTypes.PURCHASE_CHASSIS_FAILED,
    payload: { reason }
  })

  if (
    !VALID_KINDS.has(raw.kind) ||
    !VALID_FLAVORS.has(raw.flavor) ||
    !VALID_TIERS.has(raw.tier) ||
    !VALID_MODES.has(raw.mode)
  ) {
    return fail('UNKNOWN_KIND_OR_TIER')
  }
  // DIY chassis can't be financed via loan — banks won't underwrite squats.
  if (raw.flavor === 'diy' && raw.mode === 'loan') {
    return fail('DIY_LOAN_NOT_ALLOWED')
  }
  const cfg = CHASSIS_CONFIG[raw.kind]?.[raw.flavor]?.[raw.tier]
  if (!cfg || cfg.price <= 0) {
    return fail('UNKNOWN_KIND_OR_TIER')
  }
  if (raw.mode === 'cash' && state.player.money < cfg.price) {
    return fail('INSUFFICIENT_FUNDS')
  }
  if (raw.mode === 'loan') {
    if (!raw.loanProfileId) return fail('UNKNOWN_KIND_OR_TIER')
    const profile = LOAN_PROFILES[raw.loanProfileId]
    if (!profile) return fail('UNKNOWN_KIND_OR_TIER')
    if (
      profile.minFameRequired !== undefined &&
      state.band.fame < profile.minFameRequired
    ) {
      return fail('LOAN_PROFILE_INELIGIBLE')
    }
    if (
      profile.minScenePresenceRequired !== undefined &&
      (state.social?.scenePresence ?? 0) < profile.minScenePresenceRequired
    ) {
      return fail('LOAN_PROFILE_INELIGIBLE')
    }
  }
  const slotIds = cfg.slots.map(() => getSafeUUID())
  return {
    type: ActionTypes.PURCHASE_CHASSIS,
    payload: {
      id: getSafeUUID(),
      kind: raw.kind,
      flavor: raw.flavor,
      tier: raw.tier,
      mode: raw.mode,
      slotIds,
      ...(raw.loanProfileId !== undefined
        ? { loanProfileId: raw.loanProfileId }
        : {}),
      today: finiteNumberOr(state.player.day, 0)
    }
  }
}

export interface InstallModuleInput {
  assetId: string
  slotId: string
  moduleId: string
}

/**
 * Creates an INSTALL_MODULE action after running every validation rule:
 * slot exists and is empty, slot type matches module, module is unlocked,
 * no exclusivity conflict with already-installed modules, and the
 * `maxPerAsset` cap is not exceeded. Returns `INSTALL_MODULE_FAILED` with a
 * structured reason on rejection.
 */
export const installModule = (
  raw: InstallModuleInput,
  state: GameState
): InstallModuleAction | InstallModuleFailedAction => {
  const fail = (
    reason: InstallModuleFailureReason
  ): InstallModuleFailedAction => ({
    type: ActionTypes.INSTALL_MODULE_FAILED,
    payload: { reason }
  })

  const module = MODULE_REGISTRY[raw.moduleId]
  if (!module) return fail('UNKNOWN_MODULE')
  const asset = state.assets.find(a => a.id === raw.assetId)
  if (!asset) return fail('UNKNOWN_ASSET')
  const slot = asset.slots.find(s => s.id === raw.slotId)
  if (!slot) return fail('UNKNOWN_SLOT')
  if (slot.installedModuleId !== null) return fail('SLOT_OCCUPIED')
  if (slot.slotType !== module.slotType) return fail('SLOT_TYPE_MISMATCH')
  if (!isModuleUnlocked(module, state)) return fail('LOCKED')
  const conflicts = getSlotConflicts(asset, raw.moduleId)
  if (!conflicts.canInstall) return fail('EXCLUSIVITY')
  const cap = module.maxPerAsset ?? 1
  const currentCount = asset.slots.filter(
    s => s.installedModuleId === raw.moduleId
  ).length
  if (currentCount >= cap) return fail('MAX_PER_ASSET')

  const newSlotIds = buildAddedSlotEntries(raw.moduleId)
  return {
    type: ActionTypes.INSTALL_MODULE,
    payload: {
      assetId: raw.assetId,
      slotId: raw.slotId,
      moduleId: raw.moduleId,
      ...(newSlotIds.length > 0 ? { newSlotIds } : {})
    }
  }
}

export const removeModule = (
  assetId: string,
  slotId: string
): RemoveModuleAction => ({
  type: ActionTypes.REMOVE_MODULE,
  payload: { assetId, slotId }
})

/**
 * Creates an UPGRADE_CHASSIS_TIER action. Pre-generates ids for the slots
 * that the new tier introduces (slot types present in the higher-tier
 * config but not in the current asset).
 */
export const upgradeChassisTier = (
  assetId: string,
  targetTier: ChassisTier,
  state: GameState
): UpgradeChassisTierAction | null => {
  const asset = state.assets.find(a => a.id === assetId)
  if (!asset) return null
  if (asset.chassisTier >= targetTier) return null
  const targetCfg =
    CHASSIS_CONFIG[asset.kind]?.[asset.chassisFlavor]?.[targetTier]
  if (!targetCfg) return null

  // Count existing chassis-tier slots per slotType (skip dynamically-added
  // slots from modules — those don't belong to the chassis layout). Diff
  // against the target tier's per-type count and only pre-generate ids for
  // the missing instances.
  const existingByType = new Map<string, number>()
  for (const s of asset.slots) {
    if (s.addedByModuleId !== undefined) continue
    existingByType.set(s.slotType, (existingByType.get(s.slotType) ?? 0) + 1)
  }
  const targetByType = new Map<string, number>()
  for (const slotType of targetCfg.slots) {
    targetByType.set(slotType, (targetByType.get(slotType) ?? 0) + 1)
  }
  const newSlotIds: NewSlotEntry[] = []
  for (const [slotType, targetCount] of targetByType) {
    const existing = existingByType.get(slotType) ?? 0
    for (let i = existing; i < targetCount; i++) {
      newSlotIds.push({ slotType: slotType as SlotType, id: getSafeUUID() })
    }
  }
  return {
    type: ActionTypes.UPGRADE_CHASSIS_TIER,
    payload: { assetId, targetTier, newSlotIds }
  }
}

export const sellChassis = (assetId: string): SellChassisAction => ({
  type: ActionTypes.SELL_CHASSIS,
  payload: { assetId }
})

export const repairChassis = (assetId: string): RepairChassisAction => ({
  type: ActionTypes.REPAIR_CHASSIS,
  payload: { assetId }
})

export interface StartCrowdfundInput {
  kind: AssetKind
  flavor: AssetFlavor
  tier: ChassisTier
  targetAmount: number
  fameStake: number
  daysRemaining: number
  /** Pre-rolled 0..1 success roll from the seeded RNG stream. */
  plannedSuccessRoll: number
  /**
   * Success threshold to stamp on the campaign (= the probability the UI
   * showed the player). Tick resolves success when `roll < probability`.
   */
  plannedSuccessProbability: number
}

export const startCrowdfund = (
  raw: StartCrowdfundInput
): StartCrowdfundAction | null => {
  if (
    !VALID_KINDS.has(raw.kind) ||
    !VALID_FLAVORS.has(raw.flavor) ||
    !VALID_TIERS.has(raw.tier)
  ) {
    return null
  }
  // Pre-generate the materialized-asset ids here so processCrowdfundTick
  // stays pure (reducer-purity invariant). The number of slot ids matches
  // the chassis-config slot count for this kind/flavor/tier. If the section
  // plan hasn't populated CHASSIS_CONFIG yet (foundation phase: cfg.slots
  // empty), the slot-ids list is also empty — the tick will materialize an
  // empty-slot asset, which sanitizer + reducer flows handle gracefully.
  const cfg = CHASSIS_CONFIG[raw.kind]?.[raw.flavor]?.[raw.tier]
  const slotCount = cfg?.slots.length ?? 0
  const materializedAssetId = getSafeUUID()
  const materializedSlotIds: string[] = []
  for (let i = 0; i < slotCount; i++) {
    materializedSlotIds.push(getSafeUUID())
  }
  return {
    type: ActionTypes.START_CROWDFUND,
    payload: {
      campaign: {
        id: getSafeUUID(),
        assetSpec: {
          kind: raw.kind,
          flavor: raw.flavor,
          chassisTier: raw.tier
        },
        targetAmount: finiteNumberOr(raw.targetAmount, 0),
        fameStake: finiteNumberOr(raw.fameStake, 0),
        daysRemaining: finiteNumberOr(raw.daysRemaining, 0),
        materializedAssetId,
        materializedSlotIds,
        // Clamp to [0, 1] — defensively. The roll is meant to come from
        // mulberry32 (always in [0, 1)), but a malformed call site shouldn't
        // be able to plant a roll outside that range and skew resolution.
        plannedSuccessRoll: Math.max(
          0,
          Math.min(1, finiteNumberOr(raw.plannedSuccessRoll, 0))
        ),
        plannedSuccessProbability: Math.max(
          0.05,
          Math.min(0.95, finiteNumberOr(raw.plannedSuccessProbability, 0.5))
        )
      }
    }
  }
}

export const resolveCrowdfund = (
  campaignId: string,
  outcome: 'success' | 'fail',
  /** Provided when outcome === 'success' to pre-generate the resulting asset's ids. */
  successContext?: {
    kind: AssetKind
    flavor: AssetFlavor
    tier: ChassisTier
  }
): ResolveCrowdfundAction => {
  if (outcome === 'fail' || !successContext) {
    return {
      type: ActionTypes.RESOLVE_CROWDFUND,
      payload: { campaignId, outcome }
    }
  }
  const targetCfg =
    CHASSIS_CONFIG[successContext.kind]?.[successContext.flavor]?.[
      successContext.tier
    ]
  if (!targetCfg) {
    return {
      type: ActionTypes.RESOLVE_CROWDFUND,
      payload: { campaignId, outcome: 'fail' }
    }
  }
  return {
    type: ActionTypes.RESOLVE_CROWDFUND,
    payload: {
      campaignId,
      outcome: 'success',
      newAssetId: getSafeUUID(),
      newSlotIds: targetCfg.slots.map(slotType => ({
        slotType,
        id: getSafeUUID()
      }))
    }
  }
}

export const assetForeclosed = (assetId: string): AssetForeclosedAction => ({
  type: ActionTypes.ASSET_FORECLOSED,
  payload: { assetId }
})

export const assetRiskEventTriggered = (
  assetId: string,
  eventType: AssetRiskEventAction['payload']['eventType'],
  conditionLoss: number
): AssetRiskEventAction => ({
  type: ActionTypes.ASSET_RISK_EVENT_TRIGGERED,
  payload: {
    assetId,
    eventType,
    conditionLoss: finiteNumberOr(conditionLoss, 0)
  }
})
