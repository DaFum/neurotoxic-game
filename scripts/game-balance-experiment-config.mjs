import crypto from 'node:crypto'
import { CLINIC_CONFIG } from '../src/context/gameConstants.ts'

// Percentages in ids and descriptions come from fractional tuning values, and a
// bare `value * 100` leaks binary float error into both (0.29 * 100 is
// 28.999999999999996). Ids feed `hashExperimentConfig`, so that noise would end
// up in the published config hash. Round to at most one decimal, which keeps
// genuine half-percent steps such as 7.5 and 13.5 intact.
const pct = value => Number((value * 100).toFixed(1))

// Every window below is expressed in days inside a single tour. The map is a
// depth-10 layered DAG and arriving anywhere advances the day once, so a run
// spans `SIMULATION_CONSTANTS.daysPerRun` days. A lever whose window starts at
// or beyond that horizon never fires and measures nothing.
const criteria = phase =>
  phase === 'bootstrap'
    ? {
        // Bootstrap Struggle is intentionally harsh; its KPI cap is the limit.
        // Median days survived cannot be used here: it already sits at the
        // horizon ceiling, so a "survived longer" delta is unmeasurable. What a
        // relief lever must show instead is that it does not raise insolvency
        // and does not quietly enrich the runs that were already solvent.
        // The solvency ceilings track the economy, not the scenario: they sit
        // just above the measured neutral baseline so a lever that enriches
        // already-solvent runs is caught. Re-derive whenever GLOBAL_PAYOUT_NERF
        // or the catalogue changes, or the neutral baseline itself stops
        // qualifying.
        //
        // Re-derived when travel stopped being gated on the gig cadence. The
        // previous EUR 5.5k / 11k pair was calibrated while a non-performance day
        // skipped travel, so Bootstrap Struggle took about two hops in ten days
        // and ended a tour on ~EUR 4.35k median. Now that it actually tours, the
        // neutral baseline is ~EUR 24.7k median / ~EUR 29.9k p90 — the old
        // ceilings failed every candidate including the neutral no-op, which is a
        // broken gate rather than a balance finding. Same ~1.26x median / ~1.21x
        // p90 headroom as before.
        bankruptcyRateMaxPct: 60,
        bankruptcyMaximumDeltaPct: 0,
        solventMedianMoneyMax: 31000,
        solventP90MoneyMax: 36000,
        famePerGigMaximumAbsDeltaPct: 5
      }
    : {
        // A touring lever may dampen end-of-tour cash but must not be required
        // to: 0 is inside every band so the neutral no-op candidate is a valid
        // outcome when no dampening is warranted.
        medianFinalMoneyDeltaPct: [-25, 0],
        p90FinalMoneyDeltaPct: [-30, 0],
        earlyCheckpointMinimumDeltaPct: -5,
        midCheckpointMinimumDeltaPct: -10,
        candidateBankruptcyRateMaxPct: 10,
        bankruptcyMaximumDeltaPct: 2,
        famePerGigMaximumAbsDeltaPct: 5,
        harmonyMinimumDelta: -5
      }

const candidate = (
  id,
  phase,
  description,
  hypothesis,
  scenarios,
  overrides
) => ({
  id,
  phase,
  description,
  hypothesis,
  scenarios,
  overrides,
  acceptanceCriteria: criteria(phase)
})

export const BALANCE_EXPERIMENTS = [
  // Neutral baselines. Selection ranks fully validated combinations by least
  // intervention, so if shipping nothing clears every gate, nothing ships.
  candidate(
    'bootstrap-none',
    'bootstrap',
    'Leaves early-game daily obligations untouched.',
    'The shipped economy may already sit inside its insolvency tolerance over a full tour, in which case no relief is warranted.',
    ['bootstrap_struggle'],
    { earlyGame: {} }
  ),
  candidate(
    'touring-none',
    'touring',
    'Leaves repeat-gig demand untouched.',
    'Gig-frequency advantage may be inherent to playing more gig nodes rather than a compounding exploit, in which case no dampener is warranted.',
    ['baseline_touring'],
    { touring: {} }
  ),
  candidate(
    'harmony-recovery-none',
    'recovery',
    'Leaves critical harmony without an additional recovery decision.',
    'The control establishes whether paid recovery improves outcomes.',
    ['bootstrap_struggle', 'chaos_tour'],
    { recovery: {} }
  ),
  ...[40, 45].flatMap(threshold =>
    ['day', 'money'].map(costType =>
      candidate(
        `harmony-recovery-${threshold}-${costType}`,
        'recovery',
        `Offers harmony recovery below ${threshold} for a ${costType === 'day' ? 'tour day' : 'clinic-priced payment'}.`,
        'Critical harmony should become a costly pacing decision instead of an unavoidable decline.',
        ['bootstrap_struggle', 'chaos_tour'],
        {
          recovery: {
            threshold,
            costType,
            moneyCost:
              costType === 'money' ? CLINIC_CONFIG.HEAL_BASE_COST_MONEY : 0,
            harmonyGain: 20
          }
        }
      )
    )
  ),

  ...[0.9, 0.8, 0.7].map(value =>
    candidate(
      `bootstrap-obligations-${pct(value)}-through-3`,
      'bootstrap',
      `Reduces applicable early-game daily obligations to ${pct(value)} percent through day 3.`,
      'Lower recurring costs over the opening hops should prevent early insolvency without changing Fame efficiency.',
      ['bootstrap_struggle'],
      { earlyGame: { durationDays: 3, dailyObligationMultiplier: value } }
    )
  ),
  ...[0.8, 0.7, 0.6].map(value =>
    candidate(
      `bootstrap-obligations-${pct(value)}-through-5`,
      'bootstrap',
      `Reduces applicable early-game daily obligations to ${pct(value)} percent through day 5.`,
      'Covering the first half of the tour should catch the runs that fail just after the opening.',
      ['bootstrap_struggle'],
      { earlyGame: { durationDays: 5, dailyObligationMultiplier: value } }
    )
  ),
  ...[250, 500].map(value =>
    candidate(
      `bootstrap-emergency-${value}`,
      'bootstrap',
      `Provides one emergency intervention of €${value} through day 5 below €100.`,
      'A one-shot liquidity backstop should recover endangered runs without broadly enriching solvent runs.',
      ['bootstrap_struggle'],
      {
        earlyGame: {
          emergencyGrant: value,
          emergencyGrantMaxDay: 5,
          emergencyGrantTriggerMoney: 100
        }
      }
    )
  ),
  candidate(
    'bootstrap-staged-60-80',
    'bootstrap',
    'Scales obligations to 60 percent through day 2 and 80 percent through day 5.',
    'A tapered ramp should protect the opening hops while restoring full costs before the tour ends.',
    ['bootstrap_struggle'],
    {
      earlyGame: {
        obligationStages: [
          { throughDay: 2, multiplier: 0.6 },
          { throughDay: 5, multiplier: 0.8 }
        ]
      }
    }
  ),
  candidate(
    'bootstrap-staged-75',
    'bootstrap',
    'Scales obligations to 75 percent through day 4.',
    'A short moderate ramp should reduce opening failures with little surplus.',
    ['bootstrap_struggle'],
    { earlyGame: { obligationStages: [{ throughDay: 4, multiplier: 0.75 }] } }
  ),

  ...[
    [3, 0.05, 0.15],
    [3, 0.075, 0.25],
    [5, 0.05, 0.2]
  ].map(([window, penalty, maximum]) =>
    candidate(
      `touring-demand-${pct(penalty)}-${pct(maximum)}-window-${window}`,
      'touring',
      `Applies ${pct(penalty)} percent regional repeat-demand loss per gig over ${window} days, capped at ${pct(maximum)} percent.`,
      'Expiring regional saturation should target dense routing more than paced touring.',
      ['baseline_touring'],
      {
        touring: {
          repeatGigWindowDays: window,
          repeatDemandPenaltyPerGig: penalty,
          maxRepeatDemandPenalty: maximum
        }
      }
    )
  ),
  ...[
    [3, 0.1, 0.4],
    [5, 0.1, 0.4],
    [5, 0.135, 0.48]
  ].map(([window, penalty, maximum]) =>
    candidate(
      `touring-demand-${pct(penalty)}-${pct(maximum)}-after-3-window-${window}`,
      'touring',
      `Applies ${pct(penalty)} percent regional repeat-demand loss over ${window} days after day 3, capped at ${pct(maximum)} percent.`,
      'Deferring saturation past the opening hops should preserve early cash while flattening repeat routing later in the tour.',
      ['baseline_touring'],
      {
        touring: {
          repeatGigWindowDays: window,
          repeatDemandStartDay: 3,
          repeatDemandPenaltyPerGig: penalty,
          maxRepeatDemandPenalty: maximum
        }
      }
    )
  ),
  candidate(
    'touring-demand-16-55-after-5',
    'touring',
    'Applies 16 percent regional repeat-demand loss over five days after day 5, capped at 55 percent.',
    'A later gate with a stronger bounded rate tests whether the back half of a tour can be dampened without early damage.',
    ['baseline_touring'],
    {
      touring: {
        repeatGigWindowDays: 5,
        repeatDemandStartDay: 5,
        repeatDemandPenaltyPerGig: 0.16,
        maxRepeatDemandPenalty: 0.55
      }
    }
  ),
  ...[1, 2].map(value =>
    candidate(
      `touring-stress-${value}`,
      'touring',
      `Applies ${value} harmony loss on consecutive gig days.`,
      'Dense touring stress should create a visible pacing trade-off.',
      ['baseline_touring'],
      {
        touring: {
          denseScheduleThresholdDays: 1,
          denseScheduleHarmonyPenalty: value
        }
      }
    )
  ),
  candidate(
    'touring-stress-1-recovery-90',
    'touring',
    'Applies one harmony loss and ten percent lower recovery after consecutive gigs.',
    'Combining small stress and recovery pressure may discourage density without a large cash penalty.',
    ['baseline_touring'],
    {
      touring: {
        denseScheduleThresholdDays: 1,
        denseScheduleHarmonyPenalty: 1,
        denseScheduleRecoveryMultiplier: 0.9
      }
    }
  ),
  ...[1.05, 1.1, 1.15].map(value =>
    candidate(
      `touring-wear-${Math.round(pct(value))}`,
      'touring',
      `Multiplies dense-schedule wear by ${value}.`,
      'Canonical wear should convert dense schedules into delayed maintenance costs.',
      ['baseline_touring'],
      {
        touring: {
          denseScheduleThresholdDays: 1,
          denseScheduleMaintenanceMultiplier: value
        }
      }
    )
  )
]

const canonicalize = value =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map(key => [key, canonicalize(value[key])])
        )
      : value

export const hashExperimentConfig = config =>
  crypto
    .createHash('sha256')
    .update(JSON.stringify(canonicalize(config)))
    .digest('hex')
