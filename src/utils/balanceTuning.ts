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
    }
  })

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
 * reviewed line of code rather than a silent mismatch, and
 * `tests/node/regionalGigHistory.test.js` then requires production to sit on
 * `ORIGINAL_CONTROL_BALANCE_TUNING` — never on some third hand-edited state — and
 * requires the hold to be cleared once the report stops recommending a lever.
 */
export const BALANCE_RECOMMENDATION_HOLD: string | null =
  'The report recommends `bootstrap-emergency-250` (a one-off €250 grant below €100 through day 5). Two open questions have to be settled before it can ship. First, it clears every hard cap but pushes four of seven scenarios BELOW the lower bound of their `RISK_TARGETS` corridor (Bootstrap Struggle to 8.08% against 15-30%), which no gate checks — see `designRiskCorridors` in the report. Second, the breach it answers is `cult_hypergrowth` at 13.85% holdout insolvency, and 91.67% of those insolvencies happen before the first gig: `pnpm run simulate:balance:cadence` shows the cadence PHASE alone moves that to 1.92% with no lever at all. If the phase is what was wrong, this grant is a subsidy for a problem that does not exist. Decide the cadence policy first, then re-run the experiments and either adopt the recommendation or clear this hold.'

/**
 * Production tuning. Currently neutral: Phase 3 selected no lever once the
 * simulated horizon was bounded by the map, and the lever the report now
 * recommends is on hold — see `BALANCE_RECOMMENDATION_HOLD`.
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
  denseScheduleMaintenanceMultiplier: [1, 5]
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
  return deepFreeze({ earlyGame, touring })
}
