import type {
  AssetFlavor,
  AssetKind,
  ChassisTier,
  SlotType
} from '../types/assets'

export interface ChassisTierConfig {
  price: number
  upkeep: number
  revenue: number
  slots: readonly SlotType[]
  baseRiskEventChance: number
}

export type ChassisFlavorConfig = Record<ChassisTier, ChassisTierConfig>
export type ChassisKindConfig = Record<AssetFlavor, ChassisFlavorConfig>

export const DIY_PRICE_MULT = 0.5
export const DIY_UPKEEP_MULT = 0.7
export const DIY_RISK = 0.03

/**
 * Flat overhead added to every chassis-tier upgrade purchase, on top of the
 * tier-price delta. Keeps tier-upgrades from being free shortcut paths around
 * starting at a higher tier.
 */
export const UPGRADE_OVERHEAD = 500

/**
 * EUR cost per missing condition point to repair an asset back to 100. Repair
 * is a single-shot action (no partial repairs).
 */
export const REPAIR_COST_PER_POINT = 8

/**
 * Derives a DIY-flavor chassis tier from its legit counterpart by applying
 * the standard DIY multipliers. Plans 2–5 use this to keep DIY values in sync
 * with their legit baselines without manual duplication.
 */
export const buildDiyTier = (legit: ChassisTierConfig): ChassisTierConfig => ({
  price: Math.round(legit.price * DIY_PRICE_MULT),
  upkeep: Math.round(legit.upkeep * DIY_UPKEEP_MULT),
  revenue: legit.revenue,
  slots: legit.slots,
  baseRiskEventChance: DIY_RISK
})

// Empty stub for foundation phase. Section plans 2–5 replace each entry
// with concrete tier configurations. The empty shape lets reducers and
// selectors compile against the union type before any section is populated.
const EMPTY_TIER: ChassisTierConfig = {
  price: 0,
  upkeep: 0,
  revenue: 0,
  slots: [],
  baseRiskEventChance: 0
}
const EMPTY_KIND: ChassisKindConfig = {
  legit: { 1: EMPTY_TIER, 2: EMPTY_TIER, 3: EMPTY_TIER },
  diy: { 1: EMPTY_TIER, 2: EMPTY_TIER, 3: EMPTY_TIER }
}

export const CHASSIS_CONFIG: Record<AssetKind, ChassisKindConfig> = {
  tourbus_chassis: EMPTY_KIND,
  studio_chassis: EMPTY_KIND,
  bandhaus_chassis: EMPTY_KIND,
  merch_workshop_chassis: EMPTY_KIND
}
