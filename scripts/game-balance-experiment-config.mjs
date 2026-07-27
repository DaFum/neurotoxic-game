import crypto from 'node:crypto'

const criteria = phase => phase === 'bootstrap'
  ? { bankruptcyRateMaxPct: 60, medianSurvivalMinimumDeltaDays: 10, medianSurvivalMinimumDeltaPct: 20, solventMedianMoneyMax: 5000, solventP90MoneyMax: 15000, famePerGigMaximumAbsDeltaPct: 5 }
  : { medianFinalMoneyDeltaPct: [-25, -10], p90FinalMoneyDeltaPct: [-30, -15], day20MinimumDeltaPct: -5, day40MinimumDeltaPct: -10, candidateBankruptcyRateMaxPct: 10, bankruptcyMaximumDeltaPct: 2, famePerGigMaximumAbsDeltaPct: 5, harmonyMinimumDelta: -5 }

const candidate = (id, phase, description, hypothesis, scenarios, overrides) => ({
  id, phase, description, hypothesis, scenarios, overrides, acceptanceCriteria: criteria(phase)
})

export const BALANCE_EXPERIMENTS = [
  ...[0.9, 0.8, 0.7].map(value => candidate(`bootstrap-obligations-${value * 100}`, 'bootstrap', `Reduces applicable early-game daily obligations to ${value * 100} percent through day 15.`, 'Lower recurring costs should prevent early insolvency without changing Fame efficiency.', ['bootstrap_struggle'], { earlyGame: { durationDays: 15, dailyObligationMultiplier: value } })),
  ...[250, 500, 750].map(value => candidate(`bootstrap-emergency-${value}`, 'bootstrap', `Provides one emergency intervention of €${value} through day 10 below €100.`, 'A one-shot liquidity backstop should recover endangered runs without broadly enriching solvent runs.', ['bootstrap_struggle'], { earlyGame: { emergencyGrant: value, emergencyGrantMaxDay: 10, emergencyGrantTriggerMoney: 100 } })),
  candidate('bootstrap-staged-60-80', 'bootstrap', 'Scales obligations to 60 percent through day 5 and 80 percent through day 10.', 'A tapered ramp should protect the opening while restoring full costs quickly.', ['bootstrap_struggle'], { earlyGame: { obligationStages: [{ throughDay: 5, multiplier: 0.6 }, { throughDay: 10, multiplier: 0.8 }] } }),
  candidate('bootstrap-staged-75', 'bootstrap', 'Scales obligations to 75 percent through day 7.', 'A short moderate ramp should reduce opening failures with little surplus.', ['bootstrap_struggle'], { earlyGame: { obligationStages: [{ throughDay: 7, multiplier: 0.75 }] } }),
  candidate('bootstrap-staged-85', 'bootstrap', 'Scales obligations to 85 percent through day 10.', 'A mild ramp may be sufficient for marginal failures.', ['bootstrap_struggle'], { earlyGame: { obligationStages: [{ throughDay: 10, multiplier: 0.85 }] } }),
  candidate('bootstrap-obligations-50-through-60', 'bootstrap', 'Reduces recurring daily obligations to 50 percent through day 60.', 'A longer but still temporary taper should cover the observed delayed bootstrap failures without enriching successful runs.', ['bootstrap_struggle'], { earlyGame: { durationDays: 60, dailyObligationMultiplier: 0.5 } }),
  ...[[0.05, 0.15], [0.05, 0.2], [0.075, 0.25]].map(([penalty, maximum]) => candidate(`touring-demand-${penalty * 100}-${maximum * 100}`, 'touring', `Applies ${penalty * 100} percent regional repeat-demand loss per gig, capped at ${maximum * 100} percent.`, 'Expiring regional saturation should target dense schedules more than paced touring.', ['baseline_touring'], { touring: { repeatGigWindowDays: 5, repeatDemandPenaltyPerGig: penalty, maxRepeatDemandPenalty: maximum } })),
  candidate('touring-demand-10-40-window-10', 'touring', 'Applies 10 percent regional repeat-demand loss per gig over ten days, capped at 40 percent.', 'A broader expiring window should make dense regional routing carry delayed demand costs while preserving early cash.', ['baseline_touring'], { touring: { repeatGigWindowDays: 10, repeatDemandPenaltyPerGig: 0.1, maxRepeatDemandPenalty: 0.4 } }),
  candidate('touring-demand-10-40-window-8', 'touring', 'Applies 10 percent regional repeat-demand loss per gig over eight days, capped at 40 percent.', 'A shorter saturation window should retain the late-game reduction while keeping day-20 money within its guardrail.', ['baseline_touring'], { touring: { repeatGigWindowDays: 8, repeatDemandPenaltyPerGig: 0.1, maxRepeatDemandPenalty: 0.4 } }),
  candidate('touring-demand-10-40-after-20', 'touring', 'Applies 10 percent regional repeat-demand loss over eight days after day 20, capped at 40 percent.', 'Deferring saturation until after the bootstrap horizon should preserve day-20 cash while flattening later compounding.', ['baseline_touring'], { touring: { repeatGigWindowDays: 8, repeatDemandStartDay: 20, repeatDemandPenaltyPerGig: 0.1, maxRepeatDemandPenalty: 0.4 } }),
  candidate('touring-demand-12-45-after-20', 'touring', 'Applies 12 percent regional repeat-demand loss over ten days after day 20, capped at 45 percent.', 'A stronger deferred saturation candidate tests whether P90 can be reduced without early damage.', ['baseline_touring'], { touring: { repeatGigWindowDays: 10, repeatDemandStartDay: 20, repeatDemandPenaltyPerGig: 0.12, maxRepeatDemandPenalty: 0.45 } }),
  ...[1, 2].map(value => candidate(`touring-stress-${value}`, 'touring', `Applies ${value} harmony loss on consecutive gig days.`, 'Dense touring stress should create a visible pacing trade-off.', ['baseline_touring'], { touring: { denseScheduleThresholdDays: 1, denseScheduleHarmonyPenalty: value } })),
  candidate('touring-stress-1-recovery-90', 'touring', 'Applies one harmony loss and ten percent lower recovery after consecutive gigs.', 'Combining small stress and recovery pressure may discourage density without a large cash penalty.', ['baseline_touring'], { touring: { denseScheduleThresholdDays: 1, denseScheduleHarmonyPenalty: 1, denseScheduleRecoveryMultiplier: 0.9 } }),
  ...[1.05, 1.1, 1.15].map(value => candidate(`touring-wear-${Math.round(value * 100)}`, 'touring', `Multiplies dense-schedule wear by ${value}.`, 'Canonical wear should convert dense schedules into delayed maintenance costs.', ['baseline_touring'], { touring: { denseScheduleThresholdDays: 1, denseScheduleMaintenanceMultiplier: value } }))
]

const canonicalize = value => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]))
    : value

export const hashExperimentConfig = config => crypto.createHash('sha256').update(JSON.stringify(canonicalize(config))).digest('hex')
