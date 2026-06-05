/**
 * Asset chassis families that own their own slot layout, modules, and section UI.
 */
export type AssetKind =
  | 'tourbus_chassis'
  | 'studio_chassis'
  | 'bandhaus_chassis'
  | 'merch_workshop_chassis'

/**
 * Acquisition flavor for chassis and compatible modules.
 */
export type AssetFlavor = 'legit' | 'diy'
/**
 * Numeric chassis tiers used for pricing, slot layouts, and module unlock gates.
 */
export type ChassisTier = 1 | 2 | 3
/**
 * Ways a chassis can be acquired.
 */
export type AcquisitionMode = 'cash' | 'loan' | 'crowdfund'

/**
 * Module slot identifiers scoped by asset family; a module fits only matching slot types.
 */
export type SlotType =
  // Tourbus
  | 'tb_roof'
  | 'tb_front'
  | 'tb_side'
  | 'tb_interior_driver'
  | 'tb_interior_cabin'
  | 'tb_audio'
  | 'tb_decal'
  | 'tb_trailer_mount'
  | 'tb_trailer_addon'
  // Studio
  | 'st_control'
  | 'st_outboard'
  | 'st_mic'
  | 'st_monitoring'
  | 'st_treatment'
  | 'st_software'
  | 'st_vibe'
  | 'st_iso'
  // Bandhaus
  | 'bh_stage'
  | 'bh_sleeping'
  | 'bh_kitchen'
  | 'bh_lounge'
  | 'bh_backyard'
  | 'bh_security'
  | 'bh_identity'
  | 'bh_secret'
  // Merch workshop
  | 'mw_print'
  | 'mw_drying'
  | 'mw_cutting'
  | 'mw_packaging'
  | 'mw_storage'
  | 'mw_specialty'
  | 'mw_sales'
  | 'mw_automation'

/**
 * Installable slot on a long-term asset chassis.
 */
export interface AssetSlot {
  id: string
  slotType: SlotType
  /** Normalized position over the background image, in the `0..1` range. */
  position: { x: number; y: number }
  installedModuleId: string | null
  /** Module id that dynamically added this slot. */
  addedByModuleId?: string
}

/**
 * Optional stat, economy, and risk modifiers provided by modules.
 */
export interface AssetBoni {
  // Cashflow bonuses
  baseDailyRevenueDelta?: number
  upkeepDelta?: number
  // Multiplicative bonuses default to 1.0
  fuelMultiplier?: number
  merchCostMultiplier?: number
  songCostMultiplier?: number
  trainingCostMultiplier?: number
  // Additive bonuses default to 0
  staminaRegenBonusPerDay?: number
  travelStaminaRegen?: number
  merchCapacityBonus?: number
  songQualityBonus?: number
  /** Multiplicative merch-sale-price bonus expressed as `+X%`. */
  avgMerchSalePriceBonus?: number
  famePassivePerDay?: number
  bandMoodPerDay?: number
  tipBonusGigs?: number
  baseRiskChanceMultiplier?: number // Default 1.0
  // Flags (Default false)
  infightingDamper?: boolean
  enablesReRecording?: boolean
  enablesLimitedEditions?: boolean
  enablesBulkProduction?: boolean
  reducesTheftRiskTravel?: boolean
  /** Modular risk multiplier; defaults to `1.0` and multiplies existing DIY risk. */
  diyRiskMultiplier?: number
}

/**
 * Unlock requirements that gate module availability.
 */
export interface ModuleUnlockReq {
  // All fields are AND-combined; every provided requirement must pass.
  minFame?: number
  minMoney?: number
  minScenePresence?: number
  minChassisTier?: ChassisTier
  /** Story flags that all must be active. */
  requiredStoryFlags?: readonly string[]
  requiredMemberSkill?: {
    /** When omitted, any member with the required skill satisfies the gate. */
    memberId?: string
    skill: string
    tier: number
  }
  // String: this exact module must be installed on any asset.
  // Array: OR-set of acceptable module ids; any one installed module is enough.
  requiredOtherModuleInstalled?: string | readonly string[]
}

/**
 * Long-term asset module catalogue entry.
 */
export interface AssetModule {
  /** Stable lower_snake id, for example `tb_solar_panel`. */
  id: string
  ownerKind: AssetKind
  slotType: SlotType
  flavor: AssetFlavor
  cost: number
  installCost: number
  /** Fraction of module cost refunded on removal, in the `0..1` range. */
  removalRefundFraction: number
  boni: AssetBoni
  unlock: ModuleUnlockReq
  /** Shared group key that makes matching modules mutually exclusive. */
  exclusiveWithGroup?: string
  addsSlots?: ReadonlyArray<{ slotType: SlotType; count: number }>
  // Constraint: a module whose own slotType also appears in addsSlots is rejected
  // by the build-time validator to prevent self-stacking.
  /** Optional per-asset hard cap; defaults to `1`. */
  maxPerAsset?: number
  riskEventTypes?: readonly RiskEventType[]
  /** Key in `MODULE_PROMPTS`; multiple modules may share the same prompt key. */
  imagePromptKey: string
}

/**
 * Persisted player-owned long-term asset instance.
 */
export interface LongTermAsset {
  id: string
  kind: AssetKind
  chassisFlavor: AssetFlavor
  chassisTier: ChassisTier
  condition: number // 0..100
  baseUpkeep: number
  baseDailyRevenue: number
  slots: AssetSlot[]
  acquiredOnDay: number
  acquisitionMode: AcquisitionMode
  baseRiskEventChance: number
}

/**
 * Persisted debt or crowdfund liability tied to an asset.
 */
export interface Liability {
  id: string
  source: 'loan' | 'crowdfund'
  assetId: string
  principalRemaining: number
  interestRate: number
  dailyPayment: number
  termDaysRemaining: number
  defaultCounter: number
  crowdfundFamePromised?: number
}

/**
 * Active crowdfund campaign state until resolution.
 */
export interface CrowdfundCampaign {
  id: string
  assetSpec: {
    kind: AssetKind
    flavor: AssetFlavor
    chassisTier: ChassisTier
  }
  targetAmount: number
  fameStake: number
  daysRemaining: number
  /** Deterministic roll stamped at campaign start, in the `0..1` range. */
  plannedSuccessRoll: number
  /**
   * Success threshold stamped at campaign creation, mirroring what the setup
   * modal showed the player. `processCrowdfundTick` resolves success when
   * `plannedSuccessRoll < plannedSuccessProbability`, so the displayed odds
   * ARE the realized odds. Clamped to [0.05, 0.95] in the action creator.
   */
  plannedSuccessProbability: number
  /**
   * Pre-generated id for the asset that materializes on success. Stamped by
   * `startCrowdfund` so `processCrowdfundTick` stays pure (no UUID generation
   * inside the reducer). On failure, this id is simply discarded.
   */
  materializedAssetId: string
  /**
   * Pre-generated slot ids matching the chassis-config slot order for
   * `assetSpec.kind`/`flavor`/`chassisTier`. Used by `processCrowdfundTick`
   * on success; ignored on failure.
   */
  materializedSlotIds: readonly string[]
  // Undefined while daysRemaining > 0. processCrowdfundTick sets the value at
  // daysRemaining === 0, applies the outcome, and removes the entry in the same tick.
  resolvedOutcome?: 'success' | 'fail'
}

/**
 * Risk event categories emitted by daily asset ticks and shown in asset feedback.
 */
export type RiskEventType =
  | 'eviction'
  | 'fire'
  | 'theft'
  | 'police_check'
  | 'copyright_strike'
  | 'raid'
  | 'scam_or_bust'
  | 'paranormal'
  | 'foreclosure'

/**
 * Resolved asset risk event to apply to state.
 */
export interface RiskEventDescriptor {
  assetId: string
  eventType: RiskEventType
  conditionLoss: number
}

// === Action payloads ===

/**
 * Failure codes for chassis purchase attempts.
 */
export type PurchaseFailureReason =
  | 'DIY_LOAN_NOT_ALLOWED'
  | 'INSUFFICIENT_FUNDS'
  | 'UNKNOWN_KIND_OR_TIER'
  | 'LOAN_PROFILE_INELIGIBLE'
  | 'ACQUISITION_ALREADY_ACTIVE'
  | 'UNKNOWN_FLAVOR'

/**
 * Failure codes for liability refinancing attempts.
 */
export type RefinanceFailureReason =
  | 'UNKNOWN_LIABILITY'
  | 'UNKNOWN_KIND_OR_TIER'
  | 'LOAN_PROFILE_INELIGIBLE'
  | 'INSUFFICIENT_FUNDS'
  | 'LOAN_IN_DEFAULT'

/**
 * Failure codes for module installation attempts.
 */
export type InstallModuleFailureReason =
  | 'UNKNOWN_MODULE'
  | 'UNKNOWN_ASSET'
  | 'UNKNOWN_SLOT'
  | 'SLOT_OCCUPIED'
  | 'SLOT_TYPE_MISMATCH'
  | 'LOCKED'
  | 'EXCLUSIVITY'
  | 'MAX_PER_ASSET'
  | 'INSUFFICIENT_FUNDS'

/**
 * Pre-generated dynamic slot id and type pair.
 */
export interface NewSlotEntry {
  slotType: SlotType
  id: string
}

/**
 * Reducer payload for successful chassis acquisition.
 */
export interface PurchaseChassisPayload {
  /** Asset id pre-generated in the action creator (reducer-purity). */
  id: string
  kind: AssetKind
  flavor: AssetFlavor
  tier: ChassisTier
  mode: AcquisitionMode
  /** Slot ids pre-generated in the action creator, parallel to the chassis-config slot order. */
  slotIds: string[]
  /** Loan profile id when mode === 'loan'. */
  loanProfileId?: string
  /** Day index at acquisition, sourced from state.player.day. */
  today: number
}

/**
 * Reducer payload for chassis tier upgrades.
 */
export interface UpgradeChassisTierPayload {
  assetId: string
  targetTier: ChassisTier
  /** Slot ids for the newly exposed tier-N slots. */
  newSlotIds: NewSlotEntry[]
}

/**
 * Reducer payload for module installation.
 */
export interface InstallModulePayload {
  assetId: string
  slotId: string
  moduleId: string
  /** Pre-generated ids for slots added by the module via `addsSlots`. */
  newSlotIds?: NewSlotEntry[]
}

/**
 * Reducer payload for liability refinancing.
 */
export interface RefinanceLiabilityPayload {
  liabilityId: string
  loanProfileId: string
  fee: number
}

/**
 * Aggregated active asset modifiers consumed by economy and state logic.
 */
export interface AssetModifiers {
  fuelMultiplier: number
  merchCostMultiplier: number
  songCostMultiplier: number
  trainingCostMultiplier: number
  baseRiskChanceMultiplier: number
  staminaRegenBonusPerDay: number
  travelStaminaRegen: number
  merchCapacityBonus: number
  songQualityBonus: number
  avgMerchSalePriceBonus: number
  famePassivePerDay: number
  bandMoodPerDay: number
  tipBonusGigs: number
  flags: {
    infightingDamper: boolean
    enablesReRecording: boolean
    enablesLimitedEditions: boolean
    enablesBulkProduction: boolean
    reducesTheftRiskTravel: boolean
  }
}
