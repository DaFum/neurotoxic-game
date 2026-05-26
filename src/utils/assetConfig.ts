import type {
  AssetFlavor,
  AssetKind,
  ChassisTier,
  SlotType
} from '../types/assets'
import {
  TOURBUS_T1_SLOTS,
  TOURBUS_T2_SLOTS,
  TOURBUS_T3_SLOTS
} from './assetSections/tourbusConfig'
import {
  STUDIO_T1_SLOTS,
  STUDIO_T2_SLOTS,
  STUDIO_T3_SLOTS
} from './assetSections/studioConfig'
import {
  BANDHAUS_T1_SLOTS,
  BANDHAUS_T2_SLOTS,
  BANDHAUS_T3_SLOTS
} from './assetSections/bandhausConfig'

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

/** Daily condition decay applied to every asset during `processAssetTick`. */
export const CONDITION_DECAY_PER_DAY = 0.3

/**
 * Condition loss applied when a risk event triggers for an asset (fire,
 * theft, raid, etc.). Centralized so balancing can adjust without code edits.
 */
export const RISK_EVENT_CONDITION_LOSS = 15

/** Fame penalty applied when a liability defaults to foreclosure. */
export const FORECLOSURE_FAME_PENALTY = 10

/**
 * RNG stream sizing for `advanceDay`. The reducer must consume rolls
 * deterministically without ever falling off the end of the stream — see
 * `rollAssetRiskEvents`. We budget two rolls per asset (trigger + type) plus
 * a constant buffer for future tick stages (crowdfund jitter, etc.).
 */
export const RNG_ROLLS_PER_ASSET = 2
export const RNG_BASE_BUFFER = 8

/**
 * Derives a DIY-flavor chassis tier from its legit counterpart by applying
 * the standard DIY multipliers. Plans 2–5 use this to keep DIY values in sync
 * with their legit baselines without manual duplication.
 */
export const buildDiyTier = (legit: ChassisTierConfig): ChassisTierConfig => ({
  price: Math.round(legit.price * DIY_PRICE_MULT),
  upkeep: Math.round(legit.upkeep * DIY_UPKEEP_MULT),
  revenue: legit.revenue,
  // Clone so the DIY tier doesn't share the legit tier's slot array — a
  // section plan mutating one would otherwise corrupt the other.
  slots: [...legit.slots],
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

const TOURBUS_LEGIT = {
  1: {
    price: 4000,
    upkeep: 20,
    revenue: 0,
    slots: [...TOURBUS_T1_SLOTS] as SlotType[],
    baseRiskEventChance: 0.005
  },
  2: {
    price: 9000,
    upkeep: 35,
    revenue: 0,
    slots: [...TOURBUS_T2_SLOTS] as SlotType[],
    baseRiskEventChance: 0.005
  },
  3: {
    price: 18000,
    upkeep: 55,
    revenue: 0,
    slots: [...TOURBUS_T3_SLOTS] as SlotType[],
    baseRiskEventChance: 0.005
  }
} satisfies ChassisFlavorConfig

const STUDIO_LEGIT = {
  1: {
    price: 6000,
    upkeep: 25,
    revenue: 20,
    slots: [...STUDIO_T1_SLOTS] as SlotType[],
    baseRiskEventChance: 0.003
  },
  2: {
    price: 14000,
    upkeep: 45,
    revenue: 50,
    slots: [...STUDIO_T2_SLOTS] as SlotType[],
    baseRiskEventChance: 0.003
  },
  3: {
    price: 30000,
    upkeep: 80,
    revenue: 120,
    slots: [...STUDIO_T3_SLOTS] as SlotType[],
    baseRiskEventChance: 0.003
  }
} satisfies ChassisFlavorConfig

const BANDHAUS_LEGIT = {
  1: {
    price: 8000,
    upkeep: 30,
    revenue: 0,
    slots: [...BANDHAUS_T1_SLOTS] as SlotType[],
    baseRiskEventChance: 0.004
  },
  2: {
    price: 18000,
    upkeep: 55,
    revenue: 0,
    slots: [...BANDHAUS_T2_SLOTS] as SlotType[],
    baseRiskEventChance: 0.004
  },
  3: {
    price: 35000,
    upkeep: 90,
    revenue: 0,
    slots: [...BANDHAUS_T3_SLOTS] as SlotType[],
    baseRiskEventChance: 0.004
  }
} satisfies ChassisFlavorConfig

export const CHASSIS_CONFIG: Record<AssetKind, ChassisKindConfig> = {
  tourbus_chassis: {
    legit: TOURBUS_LEGIT,
    diy: {
      1: buildDiyTier(TOURBUS_LEGIT[1]),
      2: buildDiyTier(TOURBUS_LEGIT[2]),
      3: buildDiyTier(TOURBUS_LEGIT[3])
    }
  },
  studio_chassis: {
    legit: STUDIO_LEGIT,
    diy: {
      1: buildDiyTier(STUDIO_LEGIT[1]),
      2: buildDiyTier(STUDIO_LEGIT[2]),
      3: buildDiyTier(STUDIO_LEGIT[3])
    }
  },
  bandhaus_chassis: {
    legit: BANDHAUS_LEGIT,
    diy: {
      1: buildDiyTier(BANDHAUS_LEGIT[1]),
      2: buildDiyTier(BANDHAUS_LEGIT[2]),
      3: buildDiyTier(BANDHAUS_LEGIT[3])
    }
  },
  merch_workshop_chassis: makeEmptyKindConfig()
}
