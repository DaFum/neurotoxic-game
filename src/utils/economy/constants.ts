import { MERCH_PROFILES } from '../../data/merch'
import type { MerchItemProfile } from '../../data/merch'
import type { AssetModifiers } from '../../types/assets'
import { NEUTRAL_ASSET_MODIFIERS } from '../assetSelectors'
import { finiteNumberOr } from '../gameState'

export { DEFAULT_MERCH_PRICES } from '../../data/merch'
/**
 * Stable sorted merch item keys for allocation and display.
 */
export const SORTED_MERCH_KEYS = Object.freeze(
  Object.keys(MERCH_PROFILES).sort()
)
/**
 * Stable merch profile list used by economy calculations.
 */
export const MERCH_PROFILE_VALUES = Object.freeze(
  Object.values(MERCH_PROFILES)
) as ReadonlyArray<MerchItemProfile>

/**
 * Per-modifier costs used both in the PreGig UI preview and the PostGig expense calculation.
 * Keep this as the single source of truth so both screens always agree.
 */
export const MODIFIER_COSTS = {
  catering: 18,
  promo: 26,
  merch: 26,
  soundcheck: 42,
  guestlist: 50
} as const satisfies Record<string, number>

/**
 * Calculates the effective pre-gig modifier cost after asset modifiers.
 */
export const calculateGigModifierCost = (
  key: keyof typeof MODIFIER_COSTS,
  assetModifiers: AssetModifiers = NEUTRAL_ASSET_MODIFIERS
): number => {
  const baseCost = MODIFIER_COSTS[key] ?? 0
  if (key !== 'soundcheck') return baseCost

  const songCostMultiplier = Math.max(
    0,
    finiteNumberOr(assetModifiers.songCostMultiplier, 1)
  )
  return Math.ceil(baseCost * songCostMultiplier)
}

/**
 * Bar-spend rate for high-loyalty gig audiences.
 */
export const BAR_RATE_VIP = 0.3
/**
 * Default bar-spend rate for gig audiences.
 */
export const BAR_RATE_NORMAL = 0.15
/**
 * Average bar spend per audience member in euros.
 */
export const AVG_SPEND_PER_PERSON_AT_BAR = 5
/**
 * Zealotry threshold where promo effects change behavior.
 */
export const ZEALOTRY_PROMO_THRESHOLD = 80

/**
 * Shared expense tuning for daily, travel, food, lodging, gear, and admin costs.
 */
export const EXPENSE_CONSTANTS = {
  DAILY: {
    BASE_COST: 62
  },
  TRANSPORT: {
    FUEL_PER_100KM: 10, // Liters
    FUEL_PRICE: 1.75, // Euro per Liter
    MAX_FUEL: 100, // Liters
    REPAIR_COST_PER_UNIT: 6, // Per 1% condition
    INSURANCE_MONTHLY: 80,
    MAINTENANCE_30DAYS: 200
  },
  FOOD: {
    FAST_FOOD: 8, // Per person per day
    RESTAURANT: 15, // Per person per day
    ENERGY_DRINK: 3,
    ALCOHOL: 15
  },
  ACCOMMODATION: {
    HOSTEL: 25, // Per person
    HOTEL: 60 // Per person
  },
  EQUIPMENT: {
    STRINGS: 15,
    STICKS: 12,
    CABLE: 25,
    TUBES: 80
  },
  ADMIN: {
    PROBERAUM: 180, // Monthly
    INSURANCE_EQUIP: 150 // Monthly
  }
}

/**
 * Shared tuning constants for ticket-sales calculations.
 */
export const TICKET_SALES_CONSTANTS = {
  BASE_DRAW_RATIO: 0.4,
  FAME_CAPACITY_SCALER: 10,
  FAME_FILL_WEIGHT: 0.55
}

/**
 * Maximum fame-scaled management cut rate.
 */
export const MANAGEMENT_CUT_RATE = 0.15
/**
 * Maximum allowed gig net before overage is surfaced as an expense.
 */
export const MAX_GIG_NET = 7500
/**
 * Global multiplier applied to gig payout calculations.
 */
export const GLOBAL_PAYOUT_NERF = 0.25
/**
 * Base logistics expense for gig travel.
 */
export const TRAVEL_LOGISTICS_BASE = 18
/**
 * Additional logistics expense per 100 kilometers.
 */
export const TRAVEL_LOGISTICS_PER_100KM = 3
/**
 * Additional logistics expense per fame level.
 */
export const TRAVEL_LOGISTICS_PER_FAME_LEVEL = 1.5
/**
 * Maximum cash logistics expense contribution.
 */
export const TRAVEL_LOGISTICS_CASH_CAP = 45

/**
 * Venue split rates by difficulty.
 */
export const VENUE_SPLIT_RATES: Record<number, number> = { 3: 0.3, 4: 0.5 }
