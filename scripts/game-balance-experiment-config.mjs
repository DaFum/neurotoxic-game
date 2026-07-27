import crypto from 'node:crypto'

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
        // The solvency ceilings track the economy, not the scenario: under
        // neutral tuning a surviving bootstrap run ends a tour on ~EUR 4.35k
        // median / ~EUR 9.1k p90, so these sit just above that to catch a lever
        // that enriches already-solvent runs. Re-derive whenever
        // GLOBAL_PAYOUT_NERF or the catalogue changes, or the neutral baseline
        // itself stops qualifying.
        bankruptcyRateMaxPct: 60,
        bankruptcyMaximumDeltaPct: 0,
        solventMedianMoneyMax: 5500,
        solventP90MoneyMax: 11000,
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

const candidate = (id, phase, description, hypothesis, scenarios, overrides) => ({
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

  ...[0.9, 0.8, 0.7].map(value =>
    candidate(
      `bootstrap-obligations-${value * 100}-through-3`,
      'bootstrap',
      `Reduces applicable early-game daily obligations to ${value * 100} percent through day 3.`,
      'Lower recurring costs over the opening hops should prevent early insolvency without changing Fame efficiency.',
      ['bootstrap_struggle'],
      { earlyGame: { durationDays: 3, dailyObligationMultiplier: value } }
    )
  ),
  ...[0.8, 0.7, 0.6].map(value =>
    candidate(
      `bootstrap-obligations-${value * 100}-through-5`,
      'bootstrap',
      `Reduces applicable early-game daily obligations to ${value * 100} percent through day 5.`,
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
      `touring-demand-${penalty * 100}-${maximum * 100}-window-${window}`,
      'touring',
      `Applies ${penalty * 100} percent regional repeat-demand loss per gig over ${window} days, capped at ${maximum * 100} percent.`,
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
      `touring-demand-${penalty * 100}-${maximum * 100}-after-3-window-${window}`,
      'touring',
      `Applies ${penalty * 100} percent regional repeat-demand loss over ${window} days after day 3, capped at ${maximum * 100} percent.`,
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
      `touring-wear-${Math.round(value * 100)}`,
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
  crypto.createHash('sha256').update(JSON.stringify(canonicalize(config))).digest('hex')
