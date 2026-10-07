import { deepFreeze } from '../utils/objectUtils'

/**
 * Central balance configuration.
 *
 * @remarks
 * The tuning surface the economy engine reads lives here rather than next to
 * the engine, so a lever change is one reviewed diff in one file. Engine
 * functions take the config **as a parameter** (defaulting to
 * {@link BALANCE_CONFIG}) rather than destructuring it at module scope —
 * module-scope destructuring defeats tree-shaking and pins tests to live values.
 *
 * `configVersion` is bumped whenever the shape changes, so a stale external
 * override fails the boot guard instead of silently under-configuring the
 * economy.
 */

/**
 * Draw, bar-spend, and promo tuning that decides how many people show up and
 * what they spend.
 */
interface AttendanceConfig {
  /** Fraction of venue capacity a no-fame band draws. */
  readonly baseDrawRatio: number
  /** Divisor turning fame into extra capacity draw. */
  readonly fameCapacityScaler: number
  /** Weight of the fame term in venue fill. */
  readonly fameFillWeight: number
  /** Bar-spend rate for high-loyalty audiences. */
  readonly barRateVip: number
  /** Default bar-spend rate. */
  readonly barRateNormal: number
  /** Average bar spend per audience member, in euros. */
  readonly avgSpendPerPersonAtBar: number
  /** Zealotry level at which promo effects change behavior. */
  readonly zealotryPromoThreshold: number
}

/**
 * Multipliers and rates that take money away from the gross payout.
 */
interface PenaltiesConfig {
  /** Applied to the final positive net of the gig (1.0 = no nerf). */
  readonly globalPayoutNerf: number
  /** Maximum management fee rate at high fame. */
  readonly managementCutRate: number
  /**
   * Venue split rate by venue difficulty tier (key is difficulty).
   * Note: The object keys must be numeric strings.
   */
  readonly venueSplitRates: Readonly<Record<number, number>>
  /** Base logistics expense for gig travel. */
  readonly travelLogisticsBase: number
  /** Additional logistics expense per 100 km. */
  readonly travelLogisticsPer100Km: number
  /** Additional logistics expense per fame level. */
  readonly travelLogisticsPerFameLevel: number
}

/**
 * Pre-gig modifier prices, shared by the PreGig preview and PostGig expenses.
 */
interface ModifiersConfig {
  readonly catering: number
  readonly promo: number
  readonly merch: number
  readonly soundcheck: number
  readonly guestlist: number
}

/**
 * Hard ceilings applied after every other term.
 */
interface CapsConfig {
  /** Maximum gig net before overage is surfaced as an expense. */
  readonly maxGigNet: number
  /** Maximum cash logistics expense contribution. */
  readonly travelLogisticsCashCap: number
  /** Whether to apply mathematical anti-swing smoothing to gig payouts. */
  readonly enableAntiSwingSmoothing: boolean
  /** The half-life parameter for the anti-swing smoothing curve. */
  readonly antiSwingHalfLife: number
}

/**
 * Shared expense tuning for daily, transport, food, accommodation, equipment, and admin costs.
 */
interface ExpensesConfig {
  readonly daily: { readonly baseCost: number }
  readonly transport: {
    readonly fuelPer100km: number
    readonly fuelPrice: number
    readonly maxFuel: number
    readonly repairCostPerUnit: number
    readonly insuranceMonthly: number
    readonly maintenance30Days: number
  }
  readonly food: {
    readonly fastFood: number
    readonly restaurant: number
    readonly energyDrink: number
    readonly alcohol: number
  }
  readonly accommodation: { readonly hostel: number; readonly hotel: number }
  readonly equipment: {
    readonly strings: number
    readonly sticks: number
    readonly cable: number
    readonly tubes: number
  }
  readonly admin: {
    readonly proberaum: number
    readonly insuranceEquip: number
  }
}

/**
 * Social-standing gates shared by the economy engine, post-gig options and
 * event conditions, so "high controversy" means one number everywhere.
 */
interface SocialConfig {
  /** Controversy level at which the audience counts as scandal-hit. */
  readonly highControversyThreshold: number
  /** Loyalty a scandal-hit audience still needs to rally behind the band. */
  readonly cultLoyaltyThreshold: number
}

/**
 * The full balance surface plus the version of its shape.
 */
export interface BalanceConfig {
  readonly configVersion: number
  readonly attendance: AttendanceConfig
  readonly penalties: PenaltiesConfig
  readonly modifiers: ModifiersConfig
  readonly caps: CapsConfig
  readonly social: SocialConfig
  readonly expenses: ExpensesConfig
}

/**
 * Shape version. Bump when a field is added, removed, or renamed.
 */
export const BALANCE_CONFIG_VERSION = 5

const RAW_DEFAULT_BALANCE_CONFIG = {
  configVersion: BALANCE_CONFIG_VERSION,
  attendance: {
    baseDrawRatio: 0.37,
    fameCapacityScaler: 10,
    fameFillWeight: 0.15,
    barRateVip: 0.3,
    barRateNormal: 0.15,
    avgSpendPerPersonAtBar: 5,
    zealotryPromoThreshold: 80
  },
  penalties: {
    // Raised from 0.5 so a full tour funds the one-off shop catalogue; prices
    // and income each close half of the gap. Re-derive both together — moving
    // one alone breaks the target.
    globalPayoutNerf: 0.97,
    managementCutRate: 0.15,
    venueSplitRates: { 3: 0.3, 4: 0.5 },
    travelLogisticsBase: 18,
    travelLogisticsPer100Km: 3,
    travelLogisticsPerFameLevel: 1.5
  },
  modifiers: {
    catering: 18,
    promo: 26,
    merch: 26,
    soundcheck: 42,
    guestlist: 50
  },
  caps: {
    // Applied *after* `penalties.globalPayoutNerf`, so holding the same
    // gross-net clipping threshold means scaling it by the same factor:
    // 30000 * 0.97. Derive it, do not guess it.
    maxGigNet: 29100,
    travelLogisticsCashCap: 45,
    enableAntiSwingSmoothing: true,
    antiSwingHalfLife: 1500
  },
  social: {
    highControversyThreshold: 40,
    cultLoyaltyThreshold: 20
  },
  expenses: {
    daily: { baseCost: 62 },
    transport: {
      fuelPer100km: 10,
      fuelPrice: 1.75,
      maxFuel: 100,
      repairCostPerUnit: 6,
      insuranceMonthly: 80,
      maintenance30Days: 200
    },
    food: { fastFood: 8, restaurant: 15, energyDrink: 3, alcohol: 15 },
    accommodation: { hostel: 25, hotel: 60 },
    equipment: { strings: 15, sticks: 12, cable: 25, tubes: 80 },
    admin: { proberaum: 180, insuranceEquip: 150 }
  }
} satisfies BalanceConfig

const RANGES = {
  baseDrawRatio: [0, 1],
  fameCapacityScaler: [0.000001, 1000],
  fameFillWeight: [0, 1],
  barRateVip: [0, 1],
  barRateNormal: [0, 1],
  avgSpendPerPersonAtBar: [0, 1000],
  zealotryPromoThreshold: [0, 100],
  globalPayoutNerf: [0, 5],
  managementCutRate: [0, 1],
  travelLogisticsBase: [0, 10_000],
  travelLogisticsPer100Km: [0, 10_000],
  travelLogisticsPerFameLevel: [0, 10_000],
  catering: [0, 100_000],
  promo: [0, 100_000],
  merch: [0, 100_000],
  soundcheck: [0, 100_000],
  guestlist: [0, 100_000],
  maxGigNet: [0, 10_000_000],
  travelLogisticsCashCap: [0, 100_000],
  antiSwingHalfLife: [100, 100_000],
  highControversyThreshold: [0, 100],
  cultLoyaltyThreshold: [0, 100],
  dailyBaseCost: [0, 100_000],
  transportFuelPer100km: [0, 100_000],
  transportFuelPrice: [0, 100_000],
  transportMaxFuel: [0, 100_000],
  transportRepairCostPerUnit: [0, 100_000],
  transportInsuranceMonthly: [0, 100_000],
  transportMaintenance30Days: [0, 100_000],
  foodFastFood: [0, 100_000],
  foodRestaurant: [0, 100_000],
  foodEnergyDrink: [0, 100_000],
  foodAlcohol: [0, 100_000],
  accommodationHostel: [0, 100_000],
  accommodationHotel: [0, 100_000],
  equipmentStrings: [0, 100_000],
  equipmentSticks: [0, 100_000],
  equipmentCable: [0, 100_000],
  equipmentTubes: [0, 100_000],
  adminProberaum: [0, 100_000],
  adminInsuranceEquip: [0, 100_000]
} as const

type RangedKey = keyof typeof RANGES

const readSection = (
  raw: Record<string, unknown>,
  section: string
): Record<string, unknown> => {
  if (!Object.hasOwn(raw, section)) {
    throw new TypeError(`Balance config is missing section "${section}"`)
  }
  const value = raw[section]
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`Balance config section "${section}" must be an object`)
  }
  return value as Record<string, unknown>
}

const readNumber = (
  section: Record<string, unknown>,
  sectionName: string,
  key: RangedKey
): number => {
  if (!Object.hasOwn(section, key)) {
    throw new TypeError(`Balance config is missing ${sectionName}.${key}`)
  }
  const value = section[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Balance config ${sectionName}.${key} must be finite`)
  }
  const [minimum, maximum] = RANGES[key]
  if (value < minimum || value > maximum) {
    throw new RangeError(
      `Balance config ${sectionName}.${key} is outside [${minimum}, ${maximum}]: ${value}`
    )
  }
  return value
}

const readNestedNumber = (
  section: Record<string, unknown>,
  subsection: string,
  key: string,
  rangeKey: RangedKey
): number => {
  if (!Object.hasOwn(section, subsection)) {
    throw new TypeError(`Balance config is missing ${subsection}.${key}`)
  }
  const sub = section[subsection]
  if (typeof sub !== 'object' || sub === null || Array.isArray(sub)) {
    throw new TypeError(
      `Balance config section "${subsection}" must be an object`
    )
  }
  const typedSub = sub as Record<string, unknown>
  if (!Object.hasOwn(typedSub, key)) {
    throw new TypeError(`Balance config is missing ${subsection}.${key}`)
  }
  const value = typedSub[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Balance config ${subsection}.${key} must be a number`)
  }
  const [min, max] = RANGES[rangeKey]
  if (value < min || value > max) {
    throw new RangeError(
      `Balance config ${subsection}.${key} (${value}) is outside allowed range [${min}, ${max}]`
    )
  }
  return value
}

const readSplitRates = (
  section: Record<string, unknown>
): Record<number, number> => {
  if (!Object.hasOwn(section, 'venueSplitRates')) {
    throw new TypeError('Balance config is missing penalties.venueSplitRates')
  }
  const raw = section.venueSplitRates
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new TypeError(
      'Balance config penalties.venueSplitRates must be an object'
    )
  }

  const rates: Record<number, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    const difficulty = Number(key)
    if (!Number.isInteger(difficulty)) {
      throw new TypeError(
        `Balance config penalties.venueSplitRates key "${key}" must be an integer difficulty`
      )
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError(
        `Balance config penalties.venueSplitRates.${key} must be finite`
      )
    }
    if (value < 0 || value > 1) {
      throw new RangeError(
        `Balance config penalties.venueSplitRates.${key} is outside [0, 1]: ${value}`
      )
    }
    rates[difficulty] = value
  }
  return rates
}

/**
 * Boot-time guard that validates the provided config object against the
 * expected shape and version.
 *
 * @param raw - An unknown object, typically from a saved file.
 * @returns A validated, frozen BalanceConfig.
 * @throws TypeError when the structure is invalid.
 * @throws RangeError when a value is outside its allowed range.
 *
 * @remarks
 * Called at boot on the shipped default, so an invalid config fails loudly at
 * startup rather than producing nonsense economy results at runtime.
 */
export const parseBalanceConfig = (raw: unknown): Readonly<BalanceConfig> => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new TypeError('Balance config must be an object')
  }
  const record = raw as Record<string, unknown>

  const configVersion = record.configVersion
  if (typeof configVersion !== 'number' || !Number.isInteger(configVersion)) {
    throw new TypeError('Balance config configVersion must be an integer')
  }
  if (configVersion !== BALANCE_CONFIG_VERSION) {
    throw new TypeError(
      `Balance config version ${configVersion} does not match expected ${BALANCE_CONFIG_VERSION}`
    )
  }

  const attendance = readSection(record, 'attendance')
  const penalties = readSection(record, 'penalties')
  const modifiers = readSection(record, 'modifiers')

  const caps = readSection(record, 'caps')

  if (typeof caps.enableAntiSwingSmoothing !== 'boolean') {
    throw new TypeError(
      'Balance config caps.enableAntiSwingSmoothing must be a boolean'
    )
  }

  const social = readSection(record, 'social')
  const expenses = readSection(record, 'expenses')

  return deepFreeze({
    configVersion,
    attendance: {
      baseDrawRatio: readNumber(attendance, 'attendance', 'baseDrawRatio'),
      fameCapacityScaler: readNumber(
        attendance,
        'attendance',
        'fameCapacityScaler'
      ),
      fameFillWeight: readNumber(attendance, 'attendance', 'fameFillWeight'),
      barRateVip: readNumber(attendance, 'attendance', 'barRateVip'),
      barRateNormal: readNumber(attendance, 'attendance', 'barRateNormal'),
      avgSpendPerPersonAtBar: readNumber(
        attendance,
        'attendance',
        'avgSpendPerPersonAtBar'
      ),
      zealotryPromoThreshold: readNumber(
        attendance,
        'attendance',
        'zealotryPromoThreshold'
      )
    },
    penalties: {
      globalPayoutNerf: readNumber(penalties, 'penalties', 'globalPayoutNerf'),
      managementCutRate: readNumber(
        penalties,
        'penalties',
        'managementCutRate'
      ),
      venueSplitRates: readSplitRates(penalties),
      travelLogisticsBase: readNumber(
        penalties,
        'penalties',
        'travelLogisticsBase'
      ),
      travelLogisticsPer100Km: readNumber(
        penalties,
        'penalties',
        'travelLogisticsPer100Km'
      ),
      travelLogisticsPerFameLevel: readNumber(
        penalties,
        'penalties',
        'travelLogisticsPerFameLevel'
      )
    },
    modifiers: {
      catering: readNumber(modifiers, 'modifiers', 'catering'),
      promo: readNumber(modifiers, 'modifiers', 'promo'),
      merch: readNumber(modifiers, 'modifiers', 'merch'),
      soundcheck: readNumber(modifiers, 'modifiers', 'soundcheck'),
      guestlist: readNumber(modifiers, 'modifiers', 'guestlist')
    },
    caps: {
      maxGigNet: readNumber(caps, 'caps', 'maxGigNet'),
      travelLogisticsCashCap: readNumber(
        caps,
        'caps',
        'travelLogisticsCashCap'
      ),
      enableAntiSwingSmoothing: caps.enableAntiSwingSmoothing as boolean,
      antiSwingHalfLife: readNumber(caps, 'caps', 'antiSwingHalfLife')
    },
    social: {
      highControversyThreshold: readNumber(
        social,
        'social',
        'highControversyThreshold'
      ),
      cultLoyaltyThreshold: readNumber(social, 'social', 'cultLoyaltyThreshold')
    },
    expenses: {
      daily: {
        baseCost: readNestedNumber(
          expenses,
          'daily',
          'baseCost',
          'dailyBaseCost'
        )
      },
      transport: {
        fuelPer100km: readNestedNumber(
          expenses,
          'transport',
          'fuelPer100km',
          'transportFuelPer100km'
        ),
        fuelPrice: readNestedNumber(
          expenses,
          'transport',
          'fuelPrice',
          'transportFuelPrice'
        ),
        maxFuel: readNestedNumber(
          expenses,
          'transport',
          'maxFuel',
          'transportMaxFuel'
        ),
        repairCostPerUnit: readNestedNumber(
          expenses,
          'transport',
          'repairCostPerUnit',
          'transportRepairCostPerUnit'
        ),
        insuranceMonthly: readNestedNumber(
          expenses,
          'transport',
          'insuranceMonthly',
          'transportInsuranceMonthly'
        ),
        maintenance30Days: readNestedNumber(
          expenses,
          'transport',
          'maintenance30Days',
          'transportMaintenance30Days'
        )
      },
      food: {
        fastFood: readNestedNumber(
          expenses,
          'food',
          'fastFood',
          'foodFastFood'
        ),
        restaurant: readNestedNumber(
          expenses,
          'food',
          'restaurant',
          'foodRestaurant'
        ),
        energyDrink: readNestedNumber(
          expenses,
          'food',
          'energyDrink',
          'foodEnergyDrink'
        ),
        alcohol: readNestedNumber(expenses, 'food', 'alcohol', 'foodAlcohol')
      },
      accommodation: {
        hostel: readNestedNumber(
          expenses,
          'accommodation',
          'hostel',
          'accommodationHostel'
        ),
        hotel: readNestedNumber(
          expenses,
          'accommodation',
          'hotel',
          'accommodationHotel'
        )
      },
      equipment: {
        strings: readNestedNumber(
          expenses,
          'equipment',
          'strings',
          'equipmentStrings'
        ),
        sticks: readNestedNumber(
          expenses,
          'equipment',
          'sticks',
          'equipmentSticks'
        ),
        cable: readNestedNumber(
          expenses,
          'equipment',
          'cable',
          'equipmentCable'
        ),
        tubes: readNestedNumber(
          expenses,
          'equipment',
          'tubes',
          'equipmentTubes'
        )
      },
      admin: {
        proberaum: readNestedNumber(
          expenses,
          'admin',
          'proberaum',
          'adminProberaum'
        ),
        insuranceEquip: readNestedNumber(
          expenses,
          'admin',
          'insuranceEquip',
          'adminInsuranceEquip'
        )
      }
    }
  })
}

/**
 * The validated production balance config. Parsing at module init is the boot
 * guard: an invalid shipped config throws before any gameplay code runs.
 */
export const BALANCE_CONFIG: Readonly<BalanceConfig> = parseBalanceConfig(
  RAW_DEFAULT_BALANCE_CONFIG
)
