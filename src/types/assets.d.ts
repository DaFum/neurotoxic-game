/**
 * Long-term asset section identifiers.
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
 * Supported chassis upgrade tiers.
 */
export type ChassisTier = 1 | 2 | 3
/**
 * Ways a chassis can be acquired.
 */
export type AcquisitionMode = 'cash' | 'loan' | 'crowdfund'

// Slot-Typen sind kategorie-spezifische String-Literals.
// Ein Modul mit slotType X passt nur in Slots mit slotType X.
/**
 * Category-specific module slot identifiers.
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
  // Merch-Werkstatt
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
  position: { x: number; y: number } // 0..1, normalisiert über Background-Bild
  installedModuleId: string | null
  addedByModuleId?: string // bei dynamisch hinzugefügten Slots
}

/**
 * Optional stat, economy, and risk modifiers provided by modules.
 */
export interface AssetBoni {
  // Cashflow-Boni
  baseDailyRevenueDelta?: number
  upkeepDelta?: number
  // Multiplikative Boni (Default 1.0)
  fuelMultiplier?: number
  merchCostMultiplier?: number
  songCostMultiplier?: number
  trainingCostMultiplier?: number
  // Additive Boni (Default 0)
  staminaRegenBonusPerDay?: number
  travelStaminaRegen?: number
  merchCapacityBonus?: number
  songQualityBonus?: number
  avgMerchSalePriceBonus?: number // multiplikativ als +X%
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
  // Modulare Risiko-Modifikation
  diyRiskMultiplier?: number // 1.0 Default, mit existierenden DIY-Risiken multipliziert
}

/**
 * Unlock requirements that gate module availability.
 */
export interface ModuleUnlockReq {
  // Alle Felder werden AND-kombiniert (alle erfüllt → unlocked)
  minFame?: number
  minMoney?: number
  minScenePresence?: number
  minChassisTier?: ChassisTier
  requiredStoryFlags?: readonly string[] // ALLE Flags müssen gesetzt sein
  requiredMemberSkill?: {
    memberId?: string // wenn fehlend: jedes Member mit Skill genügt
    skill: string
    tier: number
  }
  // String: genau dieses Modul muss auf irgendeinem Asset installiert sein.
  // Array: OR-Set akzeptabler Modul-IDs — eines davon reicht.
  requiredOtherModuleInstalled?: string | readonly string[]
}

/**
 * Long-term asset module catalogue entry.
 */
export interface AssetModule {
  id: string // stabile lower_snake-ID, z.B. 'tb_solar_panel'
  ownerKind: AssetKind
  slotType: SlotType
  flavor: AssetFlavor
  cost: number
  installCost: number
  removalRefundFraction: number // 0..1, beim Ausbau erstattet
  boni: AssetBoni
  unlock: ModuleUnlockReq
  exclusiveWithGroup?: string // gleicher Key auf zwei Modulen → gegenseitiger Ausschluss
  addsSlots?: ReadonlyArray<{ slotType: SlotType; count: number }>
  // Constraint: ein Modul mit slotType=X UND addsSlots-Eintrag mit slotType=X
  // wird vom Modul-Validator zur Build-Zeit abgelehnt (verhindert Selbst-Stacking)
  maxPerAsset?: number // optionaler Hard-Cap, Default 1
  riskEventTypes?: readonly RiskEventType[]
  imagePromptKey: string // Schlüssel in MODULE_PROMPTS (mehrere Module dürfen ihn teilen)
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
  plannedSuccessRoll: number // 0..1, deterministisch beim START gezogen
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
  // resolvedOutcome ist undefined solange daysRemaining > 0.
  // processCrowdfundTick setzt den Wert bei daysRemaining === 0,
  // wendet die Folgen an und entfernt den Eintrag im selben Tick.
  resolvedOutcome?: 'success' | 'fail'
}

/**
 * Asset risk event categories.
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
