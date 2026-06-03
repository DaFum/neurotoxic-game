import type { AssetModifiers } from '../../types/assets'
import { NEUTRAL_ASSET_MODIFIERS } from '../assetSelectors'
import { finiteNumberOr } from '../gameStateUtils'
import { MERCH_PROFILES } from '../../data/merch'
import type { MerchItemProfile } from '../../data/merch'






export { DEFAULT_MERCH_PRICES } from '../../data/merch'
export const SORTED_MERCH_KEYS = Object.freeze(Object.keys(MERCH_PROFILES).sort())


export const MERCH_PROFILE_VALUES = Object.freeze(
  Object.values(MERCH_PROFILES)
) as ReadonlyArray<MerchItemProfile>

export /**
 * Calculates venue split / promoter cut.
 */
const VENUE_SPLIT_RATES: Record<number, number> = { 3: 0.35, 4: 0.55 }

export const BAR_RATE_VIP = 0.3;
export const BAR_RATE_NORMAL = 0.15;
export const AVG_SPEND_PER_PERSON_AT_BAR = 5;
export const ZEALOTRY_PROMO_THRESHOLD = 80;

export const MODIFIER_COSTS = {
  catering: 18,
  promo: 26,
  merch: 26,
  soundcheck: 42,
  guestlist: 50
}
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

export const EXPENSE_CONSTANTS = {
  DAILY: {
    BASE_COST: 62
  },
  TRANSPORT: {
    FUEL_PER_100KM: 12, // Liters
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

export const TICKET_SALES_CONSTANTS = {
  BASE_DRAW_RATIO: 0.4,
  FAME_CAPACITY_SCALER: 10,
  FAME_FILL_WEIGHT: 0.55
}


export const MANAGEMENT_CUT_RATE = 0.15
export const MAX_GIG_NET = 7500
export const GLOBAL_PAYOUT_NERF = 0.5
export const TRAVEL_LOGISTICS_BASE = 18
export const TRAVEL_LOGISTICS_PER_100KM = 4
export const TRAVEL_LOGISTICS_PER_FAME_LEVEL = 1.5
export const TRAVEL_LOGISTICS_CASH_CAP = 45
