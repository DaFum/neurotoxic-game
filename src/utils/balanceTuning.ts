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
 * Temporary recurring-obligation relief selected by Phase 3 experiment
 * `bootstrap-obligations-50-through-60`.
 *
 * The multiplier applies through day 60 and accepts values in the range 0–1.
 */
export const DEFAULT_BALANCE_TUNING: Readonly<BalanceTuning> = deepFreeze({
  ...ORIGINAL_CONTROL_BALANCE_TUNING,
  earlyGame: {
    ...ORIGINAL_CONTROL_BALANCE_TUNING.earlyGame,
    durationDays: 60,
    dailyObligationMultiplier: 0.5
  },
  /**
   * Expiring regional demand saturation selected by Phase 3 experiment
   * `touring-demand-10-40-window-10`.
   *
   * Rates are fractions in 0–1; the history window is measured in days.
   */
  touring: {
    ...ORIGINAL_CONTROL_BALANCE_TUNING.touring,
    repeatGigWindowDays: 10,
    repeatDemandStartDay: 0,
    repeatDemandPenaltyPerGig: 0.1,
    maxRepeatDemandPenalty: 0.4
  }
})

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
