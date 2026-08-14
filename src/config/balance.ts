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
  /** Global multiplier applied to gig payouts. */
  readonly globalPayoutNerf: number
  /** Maximum fame-scaled management cut. */
  readonly managementCutRate: number
  /** Venue revenue split by venue difficulty. */
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
}

/**
 * Shape version. Bump when a field is added, removed, or renamed.
 */
export const BALANCE_CONFIG_VERSION = 1

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
    travelLogisticsCashCap: 45
  }
}

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
  travelLogisticsCashCap: [0, 100_000]
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
 * Validates a raw balance config, throwing descriptively on the first problem.
 *
 * @param raw - Untrusted config payload.
 * @returns A deep-frozen, fully validated config.
 *
 * @throws TypeError when a section, field, or type is wrong, or the version
 * does not match {@link BALANCE_CONFIG_VERSION}.
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
      travelLogisticsCashCap: readNumber(caps, 'caps', 'travelLogisticsCashCap')
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
