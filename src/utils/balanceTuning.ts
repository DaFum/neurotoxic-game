export interface BalanceTuning {
  earlyGame: {
    durationDays: number
    dailyObligationMultiplier: number
    emergencyGrant: number
    emergencyGrantMaxDay: number
    emergencyGrantTriggerMoney: number
    obligationStages: ReadonlyArray<{
      throughDay: number
      multiplier: number
    }>
  }
  touring: {
    repeatGigWindowDays: number
    repeatDemandStartDay: number
    repeatDemandPenaltyPerGig: number
    maxRepeatDemandPenalty: number
    denseScheduleThresholdDays: number
    denseScheduleHarmonyPenalty: number
    denseScheduleRecoveryMultiplier: number
    denseScheduleMaintenanceMultiplier: number
  }
  recovery: {
    threshold: number
    costType: 'none' | 'day' | 'money'
    moneyCost: number
    harmonyGain: number
  }
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

export const ORIGINAL_CONTROL_BALANCE_TUNING: Readonly<BalanceTuning> =
  deepFreeze({
    earlyGame: {
      durationDays: 0,
      dailyObligationMultiplier: 1,
      emergencyGrant: 0,
      emergencyGrantMaxDay: 0,
      emergencyGrantTriggerMoney: 0,
      obligationStages: []
    },
    touring: {
      repeatGigWindowDays: 0,
      repeatDemandStartDay: 0,
      repeatDemandPenaltyPerGig: 0,
      maxRepeatDemandPenalty: 0,
      denseScheduleThresholdDays: 0,
      denseScheduleHarmonyPenalty: 0,
      denseScheduleRecoveryMultiplier: 1,
      denseScheduleMaintenanceMultiplier: 1
    },
    recovery: {
      threshold: 0,
      costType: 'none',
      moneyCost: 0,
      harmonyGain: 20
    }
  })

export interface BalanceRecommendationHold {
  /** `recommendation.bootstrap` of the report this hold was reviewed against. */
  bootstrap: string
  /** `recommendation.touring` of the report this hold was reviewed against. */
  touring: string
  reason: string
}

/**
 * Why production does not carry the lever the committed experiment report
 * recommends.
 *
 * `null` is the normal state and means production is expected to match
 * `recommendation.tuning` in `reports/game-balance-experiments-results.json`
 * exactly — that equality is what stops production tuning from drifting away
 * from the evidence, in either direction.
 *
 * A non-null hold is the one legitimate exception: the report recommends a lever
 * that has deliberately not been adopted. It exists so that decision is a
 * reviewed line of code rather than a silent mismatch. It names the exact
 * candidate pair it was reviewed against, so a report that starts recommending
 * something else invalidates the hold instead of silently inheriting it — a
 * generic "we are holding something" would leave production pinned to the control
 * tuning against evidence nobody looked at. `tests/node/regionalGigHistory.test.js`
 * enforces all three parts: production sits on `ORIGINAL_CONTROL_BALANCE_TUNING`,
 * the ids match the report, and the hold is cleared once the report recommends no
 * lever at all.
 */
export const BALANCE_RECOMMENDATION_HOLD: Readonly<BalanceRecommendationHold> | null =
  null

/**
 * Production tuning. Currently neutral: Phase 3 selected no lever once the
 * simulated horizon was bounded by the map, and the report still recommends the
 * neutral no-op, so there is nothing being held back (`BALANCE_RECOMMENDATION_HOLD`
 * is `null`).
 *
 * The levers it previously carried were calibrated against 75-day runs. A real
 * playthrough is 10 hops and ends at the FINALE node, so a "through day 60"
 * obligation discount covered every real playthrough six times over — a
 * permanent subsidy, not the temporary relief it was justified as — while a
 * repeat-demand window starting at day 28 never fired at all. Over the real
 * horizon the untuned economy sits inside every KPI band and inside Bootstrap
 * Struggle's insolvency tolerance, so there is nothing for a lever to fix.
 *
 * Re-run `pnpm run simulate:balance:experiments` before reintroducing a lever;
 * `bootstrap-none` / `touring-none` are legitimate winners.
 */
export const DEFAULT_BALANCE_TUNING: Readonly<BalanceTuning> =
  ORIGINAL_CONTROL_BALANCE_TUNING

export const getEarlyGameObligationMultiplier = (
  day: number,
  tuning: Readonly<BalanceTuning> = DEFAULT_BALANCE_TUNING
): number => {
  const stage = tuning.earlyGame.obligationStages.find(
    item => day <= item.throughDay
  )
  if (stage) return stage.multiplier
  return day <= tuning.earlyGame.durationDays
    ? tuning.earlyGame.dailyObligationMultiplier
    : 1
}

export const getRepeatDemandMultiplier = (
  day: number,
  recentRegionalGigCount: number,
  tuning: Readonly<BalanceTuning> = DEFAULT_BALANCE_TUNING
): number =>
  day <= tuning.touring.repeatDemandStartDay
    ? 1
    : Math.max(
        0,
        1 -
          Math.min(
            tuning.touring.maxRepeatDemandPenalty,
            Math.max(0, recentRegionalGigCount) *
              tuning.touring.repeatDemandPenaltyPerGig
          )
      )

const RANGES = {
  durationDays: [0, 365],
  dailyObligationMultiplier: [0, 1],
  emergencyGrant: [0, 100_000],
  emergencyGrantMaxDay: [0, 365],
  emergencyGrantTriggerMoney: [0, 100_000],
  repeatGigWindowDays: [0, 365],
  repeatDemandStartDay: [0, 365],
  repeatDemandPenaltyPerGig: [0, 1],
  maxRepeatDemandPenalty: [0, 1],
  denseScheduleThresholdDays: [0, 365],
  denseScheduleHarmonyPenalty: [0, 100],
  denseScheduleRecoveryMultiplier: [0, 1],
  denseScheduleMaintenanceMultiplier: [1, 5],
  threshold: [0, 100],
  moneyCost: [0, 100_000],
  harmonyGain: [0, 100]
} as const

const validateNumber = (key: keyof typeof RANGES, value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${key} must be finite`)
  }
  const [minimum, maximum] = RANGES[key]
  if (value < minimum || value > maximum) {
    throw new RangeError(`${key} is outside its allowed range`)
  }
  return value
}

export const resolveBalanceTuning = (
  overrides: Partial<{
    earlyGame: Partial<BalanceTuning['earlyGame']>
    touring: Partial<BalanceTuning['touring']>
    recovery: Partial<BalanceTuning['recovery']>
  }> = {},
  base: Readonly<BalanceTuning> = DEFAULT_BALANCE_TUNING
): Readonly<BalanceTuning> => {
  for (const section of Object.keys(overrides)) {
    if (!Object.hasOwn(base, section)) {
      throw new TypeError(`Unknown tuning section: ${section}`)
    }
  }

  const earlyGame = { ...base.earlyGame }
  const touring = { ...base.touring }
  const recovery = { ...base.recovery }
  for (const [key, value] of Object.entries(overrides.earlyGame ?? {})) {
    if (!Object.hasOwn(earlyGame, key))
      throw new TypeError(`Unknown earlyGame key: ${key}`)
    if (key === 'obligationStages') {
      if (!Array.isArray(value))
        throw new TypeError('obligationStages must be an array')
      let previousThroughDay = -1
      earlyGame.obligationStages = value.map((stage, index) => {
        if (!stage || typeof stage !== 'object')
          throw new TypeError(`Invalid obligation stage ${index}`)
        if (!Object.hasOwn(stage, 'throughDay'))
          throw new TypeError('Obligation stage requires own throughDay')
        if (!Object.hasOwn(stage, 'multiplier'))
          throw new TypeError('Obligation stage requires own multiplier')
        const unknownKeys = Object.keys(stage).filter(
          stageKey => stageKey !== 'throughDay' && stageKey !== 'multiplier'
        )
        if (unknownKeys.length > 0)
          throw new TypeError(`Unknown obligation stage key: ${unknownKeys[0]}`)
        const throughDay = validateNumber('durationDays', stage.throughDay)
        if (throughDay <= previousThroughDay)
          throw new RangeError(
            'Obligation stage boundaries must be strictly increasing'
          )
        previousThroughDay = throughDay
        return {
          throughDay,
          multiplier: validateNumber(
            'dailyObligationMultiplier',
            stage.multiplier
          )
        }
      })
      continue
    }
    Object.assign(earlyGame, {
      [key]: validateNumber(key as keyof typeof RANGES, value)
    })
  }
  for (const [key, value] of Object.entries(overrides.touring ?? {})) {
    if (!Object.hasOwn(touring, key))
      throw new TypeError(`Unknown touring key: ${key}`)
    Object.assign(touring, {
      [key]: validateNumber(key as keyof typeof RANGES, value)
    })
  }
  for (const [key, value] of Object.entries(overrides.recovery ?? {})) {
    if (!Object.hasOwn(recovery, key))
      throw new TypeError(`Unknown recovery key: ${key}`)
    if (key === 'costType') {
      if (!['none', 'day', 'money'].includes(String(value)))
        throw new TypeError('Unknown recovery costType')
      recovery.costType = value as BalanceTuning['recovery']['costType']
      continue
    }
    Object.assign(recovery, {
      [key]: validateNumber(key as keyof typeof RANGES, value)
    })
  }
  return deepFreeze({ earlyGame, touring, recovery })
}
