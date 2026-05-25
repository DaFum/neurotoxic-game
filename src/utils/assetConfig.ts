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

// Empty stub for foundation phase. Section plans 2–5 replace each entry with
// concrete tier configurations. Every entry must be its own object — sharing
// instances across kinds means a section plan mutating `tourbus_chassis.legit[1]`
// would also affect `studio_chassis.legit[1]`. Factories below produce fresh
// objects per kind, flavor, and tier.
const makeEmptyTier = (): ChassisTierConfig => ({
  price: 0,
  upkeep: 0,
  revenue: 0,
  slots: [],
  baseRiskEventChance: 0
})

const makeEmptyFlavorConfig = (): ChassisFlavorConfig => ({
  1: makeEmptyTier(),
  2: makeEmptyTier(),
  3: makeEmptyTier()
})

const makeEmptyKindConfig = (): ChassisKindConfig => ({
  legit: makeEmptyFlavorConfig(),
  diy: makeEmptyFlavorConfig()
})

export const CHASSIS_CONFIG: Record<AssetKind, ChassisKindConfig> = {
  tourbus_chassis: makeEmptyKindConfig(),
  studio_chassis: makeEmptyKindConfig(),
  bandhaus_chassis: makeEmptyKindConfig(),
  merch_workshop_chassis: makeEmptyKindConfig()
}
