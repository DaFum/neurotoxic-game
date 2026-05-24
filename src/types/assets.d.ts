export type AssetKind =
  | 'tourbus_chassis'
  | 'studio_chassis'
  | 'bandhaus_chassis'
  | 'merch_workshop_chassis'

export type AssetFlavor = 'legit' | 'diy'
export type ChassisTier = 1 | 2 | 3
export type AcquisitionMode = 'cash' | 'loan' | 'crowdfund'

// Slot-Typen sind kategorie-spezifische String-Literals.
// Ein Modul mit slotType X passt nur in Slots mit slotType X.
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

export interface AssetSlot {
  id: string
  slotType: SlotType
  position: { x: number; y: number } // 0..1, normalisiert über Background-Bild
  installedModuleId: string | null
  addedByModuleId?: string // bei dynamisch hinzugefügten Slots
}

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
  // resolvedOutcome ist undefined solange daysRemaining > 0.
  // processCrowdfundTick setzt den Wert bei daysRemaining === 0,
  // wendet die Folgen an und entfernt den Eintrag im selben Tick.
  resolvedOutcome?: 'success' | 'fail'
}

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
