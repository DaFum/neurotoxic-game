import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_BALANCE_TUNING,
  getEarlyGameObligationMultiplier,
  getRepeatDemandMultiplier,
  resolveBalanceTuning
} from '../../src/utils/balanceTuning.ts'
import {
  bankruptcyTransitions,
  deterministicBootstrapConfidence,
  pairedMetricStatistics
} from '../../scripts/utils/paired-statistics.mjs'
import {
  BALANCE_EXPERIMENTS,
  hashExperimentConfig
} from '../../scripts/game-balance-experiment-config.mjs'
import {
  assertEqualControlCohorts,
  combinationImpact,
  FAME_EVIDENCE_MIN_SHARE,
  famePerGigWithinLimit,
  holdoutGateScenarios,
  streamSeed,
  measureHoldoutGate,
  pairedFamePerGig,
  NoViableCandidateError,
  runExperimentSuite,
  evaluateFinalCombinedValidation,
  evaluateCandidate,
  kpiStatusForRuns,
  pairSimulationRuns,
  rankCandidates,
  renderExperimentMarkdown,
  selectAcceptedCandidate,
  summarizePairedRuns
} from '../../scripts/game-balance-experiments.mjs'
import {
  KPI_TARGETS,
  SCENARIOS,
  SIMULATION_CONSTANTS,
  calculateAverageFameEarnedPerGig,
  createScenarioSeed,
  getJsonHash,
  runSingleSimulation
} from '../../scripts/game-balance-simulation.mjs'
import { applyRepeatDemandAdjustment } from '../../src/utils/postGig/derivations.ts'

const combinedSummary = ({
  scenarioId = 'baseline_touring',
  controlRate = 0,
  candidateRate = 0,
  controlStatus = 'passed',
  candidateStatus = 'passed',
  fameDelta = 0,
  harmonyDelta = 0,
  drawdownDelta = 0,
  sampleSize = 10,
  // The Fame limit reads the evidence object, not the bare delta, so a fixture has
  // to carry it — a candidate with no comparable pairs must fail closed.
  fameEvidence = true
} = {}) => ({
  scenarioId,
  sampleSize,
  controlKpiStatus: controlStatus,
  candidateKpiStatus: candidateStatus,
  bankruptcy: {
    controlRatePct: controlRate,
    candidateRatePct: candidateRate,
    deltaRatePct: candidateRate - controlRate,
    bankruptcyTransitions: {
      bothSolvent: sampleSize,
      controlOnlyBankrupt: 0,
      candidateOnlyBankrupt: 0,
      bothBankrupt: 0
    }
  },
  famePerGigDeltaPct: fameDelta,
  famePerGig: {
    deltaPct: fameEvidence ? fameDelta : null,
    sampleSize: fameEvidence ? sampleSize : 0,
    minimumSampleSize: Math.max(
      1,
      Math.ceil(sampleSize * FAME_EVIDENCE_MIN_SHARE)
    ),
    sufficientEvidence: fameEvidence
  },
  continuous: {
    finalHarmony: { pairedDelta: { median: harmonyDelta } },
    maxDrawdownPct: { pairedDelta: { median: drawdownDelta } }
  }
})

test('final combined validation enforces hard acceptance and integrity gates', () => {
  const valid = SCENARIOS.map(scenario =>
    combinedSummary({
      scenarioId: scenario.id,
      candidateRate: scenario.id === 'bootstrap_struggle' ? 60 : 0,
      controlStatus: KPI_TARGETS[scenario.id] ? 'passed' : 'not_evaluated',
      candidateStatus: KPI_TARGETS[scenario.id] ? 'passed' : 'not_evaluated'
    })
  )
  assert.equal(evaluateFinalCombinedValidation(valid).passed, true)
  assert.equal(evaluateFinalCombinedValidation(valid.slice(1)).passed, false)
  assert.equal(
    evaluateFinalCombinedValidation([...valid, valid[0]]).checks
      .scenarioIdsUnique,
    false
  )
  assert.equal(
    evaluateFinalCombinedValidation(
      valid.map(item =>
        item.scenarioId === 'bootstrap_struggle'
          ? combinedSummary({
              scenarioId: item.scenarioId,
              candidateRate: 60.01
            })
          : item
      )
    ).passed,
    false
  )
  assert.equal(
    evaluateFinalCombinedValidation(
      valid.map((item, index) =>
        index === 0
          ? {
              ...item,
              controlKpiStatus: 'passed',
              candidateKpiStatus: 'failed'
            }
          : item
      )
    ).passed,
    false
  )
  assert.equal(
    evaluateFinalCombinedValidation(
      valid.map(item =>
        item.scenarioId === 'baseline_touring'
          ? combinedSummary({
              scenarioId: item.scenarioId,
              controlRate: 2,
              candidateRate: 4.01
            })
          : item
      )
    ).passed,
    false
  )
  assert.equal(
    evaluateFinalCombinedValidation(
      valid.map((item, index) =>
        index === 0
          ? combinedSummary({ scenarioId: item.scenarioId, fameDelta: 5.01 })
          : item
      )
    ).passed,
    false
  )
  // Fail closed: a candidate whose Fame comparison has no comparable pairs must not
  // pass the limit on a delta nothing measured.
  assert.equal(
    evaluateFinalCombinedValidation(
      valid.map((item, index) =>
        index === 0
          ? combinedSummary({
              scenarioId: item.scenarioId,
              fameDelta: 0,
              fameEvidence: false
            })
          : item
      )
    ).passed,
    false,
    'Zero comparable pairs is not evidence of zero side effect'
  )
  assert.equal(
    evaluateFinalCombinedValidation(
      valid.map((item, index) =>
        index === 0
          ? combinedSummary({
              scenarioId: item.scenarioId,
              harmonyDelta: -5.01
            })
          : item
      )
    ).passed,
    false
  )
  assert.equal(
    evaluateFinalCombinedValidation(
      valid.map((item, index) =>
        index === 0
          ? combinedSummary({
              scenarioId: item.scenarioId,
              drawdownDelta: 10.01
            })
          : item
      )
    ).passed,
    false
  )
  const badTransitions = structuredClone(valid[0])
  badTransitions.bankruptcy.bankruptcyTransitions.bothSolvent = 9
  assert.equal(
    evaluateFinalCombinedValidation([badTransitions, ...valid.slice(1)]).passed,
    false
  )
})

test('canonical fame per gig averages run ratios and non-KPI scenarios are explicit', () => {
  const runs = [
    { scenarioId: 'unconfigured', gigsPlayed: 1, fameEarned: 100 },
    { scenarioId: 'unconfigured', gigsPlayed: 9, fameEarned: 0 }
  ]
  assert.equal(calculateAverageFameEarnedPerGig(runs), 50)
  assert.deepEqual(
    kpiStatusForRuns(
      runs.map(run => ({
        control: run,
        candidate: run,
        scenarioId: run.scenarioId
      }))
    ),
    {
      control: 'not_evaluated',
      candidate: 'not_evaluated'
    }
  )
})

test('KPI hash depends on KPI targets but not report version', () => {
  const hash = getJsonHash(KPI_TARGETS)
  assert.equal(hash, getJsonHash(structuredClone(KPI_TARGETS)))
  const changed = structuredClone(KPI_TARGETS)
  changed.bootstrap_struggle.bankruptcyMax--
  assert.notEqual(hash, getJsonHash(changed))
  assert.equal(hash, getJsonHash({ ...KPI_TARGETS, reportVersion: 999 }))
})

test('canonical repeat demand adjustment is immutable, bounded, regional, and save compatible', () => {
  const financials = {
    income: { total: 100, breakdown: [] },
    expenses: { total: 90, breakdown: [] },
    net: 10
  }
  const tuning = resolveBalanceTuning({
    touring: {
      repeatGigWindowDays: 5,
      repeatDemandStartDay: 20,
      repeatDemandPenaltyPerGig: 0.1,
      maxRepeatDemandPenalty: 0.4
    }
  })
  assert.equal(
    applyRepeatDemandAdjustment(financials, {
      day: 20,
      regionId: 'berlin',
      regionalGigHistory: {},
      tuning
    }),
    financials
  )
  assert.equal(
    applyRepeatDemandAdjustment(financials, {
      day: 20,
      regionId: 'berlin',
      regionalGigHistory: { berlin: [19] },
      tuning
    }),
    financials
  )
  const adjusted = applyRepeatDemandAdjustment(financials, {
    day: 21,
    regionId: 'berlin',
    regionalGigHistory: { berlin: [1, 16, 17, 18, 19, 20], hamburg: [20] },
    tuning
  })
  assert.notEqual(adjusted, financials)
  assert.equal(adjusted.net, 6)
  assert.equal(adjusted.expenses.total, 94)
  assert.equal(
    adjusted.expenses.breakdown.at(-1).labelKey,
    'economy:gigExpenses.demandSaturation.label'
  )
  assert.equal(financials.net, 10)
  const loss = applyRepeatDemandAdjustment(
    { ...financials, net: 2 },
    {
      day: 21,
      regionId: 'berlin',
      regionalGigHistory: { berlin: [20, 20, 20, 20, 20] },
      tuning
    }
  )
  assert.equal(loss.net >= 0, true)
  assert.equal(
    applyRepeatDemandAdjustment(financials, {
      day: 21,
      regionId: 'munich',
      regionalGigHistory: { berlin: [20] },
      tuning
    }),
    financials
  )
})

test('resolveBalanceTuning applies partial overrides without mutating defaults', () => {
  const before = structuredClone(DEFAULT_BALANCE_TUNING)
  const resolved = resolveBalanceTuning({
    earlyGame: { durationDays: 15, dailyObligationMultiplier: 0.8 }
  })

  assert.equal(resolved.earlyGame.durationDays, 15)
  assert.equal(resolved.earlyGame.dailyObligationMultiplier, 0.8)
  assert.deepEqual(DEFAULT_BALANCE_TUNING, before)
  assert.ok(Object.isFrozen(DEFAULT_BALANCE_TUNING.earlyGame))
})

test('resolveBalanceTuning rejects unknown, non-finite, and out-of-range values', () => {
  assert.throws(
    () => resolveBalanceTuning({ earlyGame: { mystery: 1 } }),
    /unknown/i
  )
  assert.throws(
    () => resolveBalanceTuning({ earlyGame: { durationDays: NaN } }),
    /finite/i
  )
  assert.throws(
    () => resolveBalanceTuning({ touring: { maxRepeatDemandPenalty: 1.1 } }),
    /range/i
  )
})

test('resolveBalanceTuning rejects malformed obligation stage shapes and order', () => {
  assert.throws(
    () =>
      resolveBalanceTuning({
        earlyGame: {
          obligationStages: [{ throughDay: 5, multiplier: 0.8, extra: true }]
        }
      }),
    /unknown.*stage.*key/i
  )
  assert.throws(
    () =>
      resolveBalanceTuning({
        earlyGame: {
          obligationStages: [
            { throughDay: 5, multiplier: 0.8 },
            { throughDay: 5, multiplier: 0.9 }
          ]
        }
      }),
    /strictly increasing/i
  )
  assert.throws(
    () =>
      resolveBalanceTuning({
        earlyGame: {
          obligationStages: [
            { throughDay: 10, multiplier: 0.8 },
            { throughDay: 5, multiplier: 0.9 }
          ]
        }
      }),
    /strictly increasing/i
  )
  const inherited = Object.create({ throughDay: 5, multiplier: 0.8 })
  assert.throws(
    () =>
      resolveBalanceTuning({ earlyGame: { obligationStages: [inherited] } }),
    /own.*throughDay/i
  )
})

// Phase 3 selected no lever once the horizon was bounded by the map, so the
// production defaults are neutral. Guarding that explicitly matters: a lever
// reintroduced without a supporting experiment run would silently change every
// player's economy.
test('production defaults apply no balance lever', () => {
  assert.equal(getEarlyGameObligationMultiplier(1), 1)
  assert.equal(getEarlyGameObligationMultiplier(10), 1)
  assert.equal(getRepeatDemandMultiplier(1, 5), 1)
  assert.equal(getRepeatDemandMultiplier(10, 20), 1)
})

test('obligation relief ends after its configured window', () => {
  const tuning = resolveBalanceTuning(
    { earlyGame: { durationDays: 5, dailyObligationMultiplier: 0.7 } },
    DEFAULT_BALANCE_TUNING
  )
  assert.equal(getEarlyGameObligationMultiplier(1, tuning), 0.7)
  assert.equal(getEarlyGameObligationMultiplier(5, tuning), 0.7)
  assert.equal(getEarlyGameObligationMultiplier(6, tuning), 1)
})

test('regional repeat demand penalty starts after its gate and caps', () => {
  const tuning = resolveBalanceTuning(
    {
      touring: {
        repeatGigWindowDays: 5,
        repeatDemandStartDay: 3,
        repeatDemandPenaltyPerGig: 0.16,
        maxRepeatDemandPenalty: 0.55
      }
    },
    DEFAULT_BALANCE_TUNING
  )
  assert.equal(getRepeatDemandMultiplier(3, 1, tuning), 1)
  assert.equal(getRepeatDemandMultiplier(4, 1, tuning), 0.84)
  assert.ok(Math.abs(getRepeatDemandMultiplier(4, 20, tuning) - 0.45) < 1e-12)
})

test('experiment config hash is stable and sensitive to parameter changes', () => {
  const first = hashExperimentConfig(BALANCE_EXPERIMENTS)
  const second = hashExperimentConfig(structuredClone(BALANCE_EXPERIMENTS))
  const changed = structuredClone(BALANCE_EXPERIMENTS)
  changed[0].overrides.earlyGame.dailyObligationMultiplier = 0.89

  assert.match(first, /^[a-f0-9]{64}$/)
  assert.equal(first, second)
  assert.notEqual(first, hashExperimentConfig(changed))
})

test('paired statistics describe known deltas and zero candidate wins', () => {
  const mixed = pairedMetricStatistics([1, 2, 3], [2, 2, 5], {
    bootstrapSeed: 'known'
  })
  assert.equal(mixed.pairedDelta.mean, 1)
  assert.equal(mixed.pairedDelta.positiveCount, 2)
  assert.equal(mixed.pairedDelta.unchangedCount, 1)

  const zero = pairedMetricStatistics([1, 2], [1, 2], {
    bootstrapSeed: 'zero'
  })
  assert.equal(zero.pairedDelta.candidateWinRatePct, 0)
  assert.equal(zero.pairedDelta.confidence95.mean.lower, 0)
  assert.equal(zero.pairedDelta.confidence95.mean.upper, 0)
})

test('paired bootstrap intervals are deterministic and do not mutate input', () => {
  const values = [-2, 0, 1, 4, 8]
  const before = [...values]
  const first = deterministicBootstrapConfidence(values, 'stable-seed', 2000)
  const second = deterministicBootstrapConfidence(values, 'stable-seed', 2000)

  assert.deepEqual(first, second)
  assert.deepEqual(values, before)
  assert.equal(first.mean.method, 'paired-bootstrap')
  assert.equal(first.mean.resamples, 2000)
})

test('paired statistics handle an empty population', () => {
  const result = pairedMetricStatistics([], [], { bootstrapSeed: 'empty' })
  assert.equal(result.control.mean, null)
  assert.equal(result.pairedDelta.count, 0)
})

test('bankruptcy transitions use control-only as recovered runs', () => {
  const result = bankruptcyTransitions(
    [true, false, true, false],
    [false, true, true, false]
  )

  assert.deepEqual(result.bankruptcyTransitions, {
    bothSolvent: 1,
    controlOnlyBankrupt: 1,
    candidateOnlyBankrupt: 1,
    bothBankrupt: 1
  })
  assert.equal(result.netRecoveredRuns, 1)
  assert.equal(result.netHarmedRuns, 1)
  assert.equal(result.deltaRatePct, 0)
})

test('pairSimulationRuns uses the same scenario seed for control and candidate', () => {
  const scenario = { id: 'pairing_probe' }
  const seen = []
  const pairs = pairSimulationRuns({
    scenario,
    runsPerScenario: 3,
    controlTuning: DEFAULT_BALANCE_TUNING,
    candidateTuning: DEFAULT_BALANCE_TUNING,
    runner: (_scenario, seed) => {
      seen.push(seed)
      return {
        bankrupt: false,
        daysSurvived: 1,
        finalMoney: seed,
        finalFame: 0,
        fameAccounting: { earned: 0 },
        gigsPlayed: 0,
        finalHarmony: 80,
        maxPeakToTroughDrop: 0
      }
    }
  })

  assert.equal(pairs.length, 3)
  assert.deepEqual(seen, [
    pairs[0].seed,
    pairs[0].seed,
    pairs[1].seed,
    pairs[1].seed,
    pairs[2].seed,
    pairs[2].seed
  ])
  assert.notEqual(
    createScenarioSeed('pairing_probe', 0),
    createScenarioSeed('other_probe', 0)
  )
})

test('pairSimulationRuns reuses a precomputed control cohort', () => {
  const controlRuns = [1, 2].map(finalMoney => ({
    bankrupt: false,
    daysSurvived: 1,
    finalMoney,
    finalFame: 0,
    fameEarned: 0,
    gigsPlayed: 0,
    finalHarmony: 80,
    maxDrawdownPct: 0
  }))
  let runnerCalls = 0
  const pairs = pairSimulationRuns({
    scenario: { id: 'cached_control_probe' },
    runsPerScenario: 2,
    controlTuning: DEFAULT_BALANCE_TUNING,
    candidateTuning: DEFAULT_BALANCE_TUNING,
    controlRuns,
    runner: () => {
      runnerCalls++
      return {
        bankrupt: false,
        daysSurvived: 1,
        finalMoney: 10,
        finalFame: 0,
        fameAccounting: { earned: 0 },
        gigsPlayed: 0,
        finalHarmony: 80,
        maxPeakToTroughDrop: 0
      }
    }
  })

  assert.equal(runnerCalls, 2)
  assert.deepEqual(
    pairs.map(pair => pair.control.finalMoney),
    [1, 2]
  )
})

test('assertEqualControlCohorts rejects divergent candidate controls', () => {
  const cohort = [{ control: { finalMoney: 10 } }]
  assert.doesNotThrow(() =>
    assertEqualControlCohorts([cohort, structuredClone(cohort)])
  )
  assert.throws(
    () =>
      assertEqualControlCohorts([cohort, [{ control: { finalMoney: 11 } }]]),
    /control cohorts differ/i
  )
})

test('control-versus-control produces zero deltas and transitions', () => {
  const pairs = pairSimulationRuns({
    scenario: { id: 'zero_probe' },
    runsPerScenario: 4,
    controlTuning: DEFAULT_BALANCE_TUNING,
    candidateTuning: DEFAULT_BALANCE_TUNING,
    runner: (_scenario, seed) => ({
      bankrupt: seed % 2 === 0,
      daysSurvived: 10,
      finalMoney: 5,
      finalFame: 2,
      fameAccounting: { earned: 2 },
      gigsPlayed: 1,
      finalHarmony: 80,
      maxPeakToTroughDrop: 3
    })
  })
  const summary = summarizePairedRuns(pairs, 'control-control', 'zero_probe')
  for (const metric of Object.values(summary.continuous)) {
    assert.equal(metric.pairedDelta.mean, 0)
    assert.equal(metric.pairedDelta.candidateWinRatePct, 0)
  }
  assert.equal(summary.bankruptcy.netRecoveredRuns, 0)
  assert.equal(summary.bankruptcy.netHarmedRuns, 0)
})

test('ranking never lets a hard failure beat a passing candidate', () => {
  const ranked = rankCandidates([
    {
      id: 'failed',
      acceptanceCriteria: { passed: false },
      rankingComponents: {
        targetFit: 100,
        sideEffectPenalty: 0,
        overcorrectionPenalty: 0,
        complexityPenalty: 0
      }
    },
    {
      id: 'passed',
      acceptanceCriteria: { passed: true },
      rankingComponents: {
        targetFit: 1,
        sideEffectPenalty: 2,
        overcorrectionPenalty: 0,
        complexityPenalty: 1
      }
    }
  ])
  assert.equal(ranked[0].id, 'passed')
})

test('selection returns null when every candidate fails hard criteria', () => {
  assert.equal(
    selectAcceptedCandidate([
      { id: 'failed', acceptanceCriteria: { passed: false } }
    ]),
    null
  )
})

test('evaluateCandidate uses and preserves declared acceptance criteria', () => {
  const makeResult = bankrupt => ({
    bankrupt,
    daysSurvived: 10,
    finalMoney: 100,
    finalFame: 10,
    fameEarned: 10,
    gigsPlayed: 1,
    finalHarmony: 80,
    maxDrawdownPct: 0,
    moneyAtEarlyCheckpoint: 100,
    moneyAtMidCheckpoint: 100
  })
  const pairs = [
    {
      scenarioId: 'criteria_probe',
      control: makeResult(false),
      candidate: makeResult(true)
    }
  ]
  const definition = {
    id: 'criteria-probe',
    phase: 'bootstrap',
    scenarios: ['criteria_probe'],
    acceptanceCriteria: {
      bankruptcyRateMaxPct: 100,
      bankruptcyMaximumDeltaPct: 100,
      solventMedianMoneyMax: 100,
      solventP90MoneyMax: 100,
      famePerGigMaximumAbsDeltaPct: 0
    }
  }
  const result = evaluateCandidate(
    definition,
    pairs,
    summarizePairedRuns(pairs, definition.id, 'criteria_probe')
  )

  assert.equal(result.acceptanceCriteria.bankruptcyRateMaxPct, 100)
  assert.equal(result.acceptanceCriteria.passed, true)
})

test('generated identifiers do not make candidate execution order observable', () => {
  const scenario = {
    ...SCENARIOS[0],
    id: 'order_probe',
    daysOverride: 2
  }
  const seed = createScenarioSeed(scenario.id, 0)
  const first = runSingleSimulation(scenario, seed, DEFAULT_BALANCE_TUNING)
  runSingleSimulation(
    scenario,
    seed,
    resolveBalanceTuning({ touring: { repeatGigWindowDays: 1 } })
  )
  const second = runSingleSimulation(scenario, seed, DEFAULT_BALANCE_TUNING)
  assert.deepEqual(
    [first.finalMoney, first.finalFame, first.gigsPlayed, first.bankrupt],
    [second.finalMoney, second.finalFame, second.gigsPlayed, second.bankrupt]
  )
})

// Paired experiments are only meaningful if a run is a pure function of
// (scenario, seed, tuning). `secureRandom()` buffers 1024 draws, so a run that
// does not drop the buffer inherits values generated from the previous run's
// stream at an offset that depends on how many draws that run made. A
// full-length run is required here: a 2-day probe consumes too few draws for
// the drift to reach the summary fields.
test('full-length runs are reproducible regardless of preceding runs', () => {
  const scenario = SCENARIOS.find(item => item.id === 'bootstrap_struggle')
  const seed = createScenarioSeed(scenario.id, 0)
  const fingerprint = run => [
    run.finalMoney,
    run.finalFame,
    run.gigsPlayed,
    run.daysSurvived,
    run.finalHarmony,
    run.bankrupt
  ]

  const first = runSingleSimulation(scenario, seed, DEFAULT_BALANCE_TUNING)
  const repeated = runSingleSimulation(scenario, seed, DEFAULT_BALANCE_TUNING)
  assert.deepEqual(
    fingerprint(repeated),
    fingerprint(first),
    'Identical inputs must reproduce identically'
  )

  // A differently-tuned run in between consumes a different number of draws.
  runSingleSimulation(
    { ...scenario, id: 'interleaved_probe' },
    createScenarioSeed('interleaved_probe', 7),
    resolveBalanceTuning({
      earlyGame: { durationDays: 30, dailyObligationMultiplier: 0.5 }
    })
  )
  const afterInterleave = runSingleSimulation(
    scenario,
    seed,
    DEFAULT_BALANCE_TUNING
  )
  assert.deepEqual(
    fingerprint(afterInterleave),
    fingerprint(first),
    'An interleaved run must not shift the secure-random stream'
  )
})

// Obligation stages are cumulative `throughDay` boundaries, so each stage's
// weight is its own segment length. Reading nonexistent `durationDays` /
// `dailyObligationMultiplier` fields off a stage yields NaN, which silently
// demotes staged combinations to the id tie-break instead of ranking them by
// actual intervention size.
test('combinationImpact weights obligation stages by segment length', () => {
  const noTouring = { overrides: { touring: {} } }
  const staged = {
    overrides: {
      earlyGame: {
        obligationStages: [
          { throughDay: 5, multiplier: 0.6 },
          { throughDay: 10, multiplier: 0.8 }
        ]
      }
    }
  }

  // Days 1-5 at 0.6 => 5 * 0.4 = 2; days 6-10 at 0.8 => 5 * 0.2 = 1.
  const impact = combinationImpact({ bootstrap: staged, touring: noTouring })
  assert.ok(Number.isFinite(impact), 'Staged impact must not be NaN')
  assert.equal(impact, 3)

  const flat = {
    overrides: {
      earlyGame: { durationDays: 10, dailyObligationMultiplier: 0.7 }
    }
  }
  assert.ok(
    Math.abs(combinationImpact({ bootstrap: flat, touring: noTouring }) - 3) <
      1e-9,
    'Equivalent total relief must rank equally regardless of encoding'
  )

  // A single stage covering the same window with less relief must rank lower.
  const milder = {
    overrides: {
      earlyGame: { obligationStages: [{ throughDay: 10, multiplier: 0.85 }] }
    }
  }
  assert.ok(
    combinationImpact({ bootstrap: milder, touring: noTouring }) < impact
  )
})

test('combinationImpact ignores an empty obligationStages array', () => {
  const impact = combinationImpact({
    bootstrap: {
      overrides: {
        earlyGame: {
          obligationStages: [],
          durationDays: 60,
          dailyObligationMultiplier: 0.5
        }
      }
    },
    touring: { overrides: { touring: {} } }
  })
  assert.equal(impact, 30, 'Empty stages must fall back to the flat window')
})

// The suite reuses one control cohort per scenario across every combination
// instead of re-simulating it. That is only sound because a run is a pure
// function of (scenario, seed, tuning) — this pins the equivalence.
test('reusing a control cohort matches re-simulating it', () => {
  // No daysOverride: the probe should exercise the same map-bounded horizon the
  // suite actually runs on.
  const scenario = {
    ...SCENARIOS[0],
    id: 'cohort_reuse_probe'
  }
  const candidateTuning = resolveBalanceTuning({
    touring: {
      repeatGigWindowDays: 4,
      repeatDemandPenaltyPerGig: 0.1,
      maxRepeatDemandPenalty: 0.3
    }
  })
  const shared = {
    scenario,
    runsPerScenario: 3,
    controlTuning: DEFAULT_BALANCE_TUNING,
    candidateTuning
  }

  const resimulated = pairSimulationRuns(shared)
  const reused = pairSimulationRuns({
    ...shared,
    controlRuns: resimulated.map(pair => pair.control)
  })

  assert.deepEqual(
    reused.map(pair => [pair.control, pair.candidate, pair.delta]),
    resimulated.map(pair => [pair.control, pair.candidate, pair.delta])
  )
})

const rankingEntry = (id, targetFit) => ({
  id,
  targetFit,
  sideEffectPenalty: 0,
  overcorrectionPenalty: 0,
  complexityPenalty: 1
})

const DEFAULT_RANKING_ENTRIES = [
  rankingEntry('probe-candidate', 60),
  rankingEntry('probe-other', 40)
]

const buildMarkdownReport = ({
  objectiveMet,
  rankingEntries = DEFAULT_RANKING_ENTRIES,
  // A blocking gate must not default to "passed" in a fixture: a test that forgot
  // to supply it would assert on a pass nothing validated. Fail closed, and make
  // the passing case state so explicitly.
  holdoutSafety = {
    blocking: true,
    passed: false,
    evaluatedScenarios: [],
    failures: []
  }
}) => {
  const candidate = {
    id: 'probe-candidate',
    aggregateResults: {
      bankruptcy: {
        controlRatePct: 80,
        candidateRatePct: 50,
        deltaRatePct: -30
      },
      continuous: {
        daysSurvived: { pairedDelta: { median: 12 } },
        finalHarmony: { pairedDelta: { median: -1 } },
        maxDrawdownPct: { pairedDelta: { median: 2 } },
        finalMoney: { pairedDelta: { median: -100 } }
      },
      solventMedianMoney: 1200,
      famePerGigDeltaPct: 0.5,
      medianFinalMoneyDeltaPct: -17,
      p90FinalMoneyDeltaPct: -20,
      earlyCheckpointDeltaPct: -1
    },
    acceptanceCriteria: { passed: true }
  }
  const gapProfile = {
    before: 205.68,
    after: objectiveMet ? 22.5 : 139.81,
    reductionPct: 65.87,
    withinTarget: objectiveMet
  }
  return {
    metadata: { pairingStrategy: 'same-scenario-same-run-index-same-seed' },
    runtime: { totalRuns: 1000, durationMs: 1000 },
    phases: {
      phase3B: {
        candidates: [candidate],
        ranking: rankingEntries,
        selectedCandidateId: candidate.id
      },
      phase3C: {
        candidates: [candidate],
        ranking: rankingEntries,
        selectedCandidateId: candidate.id,
        objectiveStatus: objectiveMet ? 'met' : 'partial',
        objectiveNote: objectiveMet
          ? 'Objective reached.'
          : 'Structural Gap-1 dominance remains unresolved.',
        gigFrequencyAnalysis: { control: [], finalTuning: [] },
        gapTradeoff: { gap1VsGap2: { control: {}, finalTuning: {} } },
        gigFrequencyValidation: {
          objectiveMet,
          targetRangePct: [20, 25],
          improved: true,
          shortfalls: objectiveMet
            ? []
            : [
                'baseline_touring money-per-day advantage 139.81% is outside the 20-25% target (was 205.68%)'
              ],
          profiles: {
            baseline_touring: gapProfile,
            low_resource_touring: gapProfile
          }
        }
      }
    },
    finalCombinedValidation: {
      passed: true,
      resultsByScenario: {
        bootstrap_struggle: {
          scenarioId: 'bootstrap_struggle',
          controlKpiStatus: 'passed',
          candidateKpiStatus: 'passed',
          bankruptcy: {
            controlRatePct: 80,
            candidateRatePct: 50,
            deltaRatePct: -30
          },
          continuous: {
            finalMoney: { pairedDelta: { median: -100 } },
            finalHarmony: { pairedDelta: { median: -1 } },
            maxDrawdownPct: { pairedDelta: { median: 2 } }
          },
          famePerGigDeltaPct: 0.5,
          scenarioValidation: { passed: true }
        }
      }
    },
    combinationSearch: {
      strategy: 'ascending-impact-first-validated',
      pairsAvailable: 12,
      pairsEvaluated: 1,
      pairsSkipped: 11
    },
    holdoutSafetyValidation: holdoutSafety,
    recommendation: {
      status: objectiveMet
        ? 'accepted-for-production'
        : 'accepted-for-production-partial'
    }
  }
}

test('experiment markdown discloses an unmet Phase 3C objective', () => {
  const partial = renderExperimentMarkdown(
    buildMarkdownReport({ objectiveMet: false })
  )

  assert.match(partial, /Phase 3C Gesamtstatus \| partial/)
  assert.match(partial, /Gap-1-Dominanz im Zielband \| nicht gelöst/)
  assert.match(partial, /accepted-for-production-partial/)
  assert.match(partial, /139\.81%/, 'Measured advantage must appear')
  assert.match(partial, /outside the 20-25% target/)
  assert.match(partial, /Structural Gap-1 dominance remains unresolved/)
})

test('experiment markdown discloses a failed holdout safety gate and withholds the recommendation', () => {
  const failed = renderExperimentMarkdown(
    buildMarkdownReport({
      objectiveMet: true,
      holdoutSafety: {
        blocking: true,
        passed: false,
        evaluatedScenarios: ['cult_hypergrowth'],
        failures: [
          {
            scenarioId: 'cult_hypergrowth',
            metric: 'bankruptcyRate',
            holdoutValuePct: 14.23,
            maximumPct: 12,
            sampleSize: 260
          }
        ]
      }
    })
  )

  assert.match(failed, /Holdout-Sicherheitsgate: \*\*FAIL\*\*/)
  assert.match(failed, /cult_hypergrowth` bankruptcyRate 14\.23% > 12%/)
  assert.match(failed, /Keine Produktionsempfehlung/)
  assert.match(
    failed,
    /Holdout-Sicherheitsgrenzen \(harte Caps\) \| fehlgeschlagen/
  )
})

test('a passing holdout safety gate withholds nothing', () => {
  const passed = renderExperimentMarkdown(
    buildMarkdownReport({
      objectiveMet: true,
      // Stated explicitly: the fixture default fails closed, so a pass here has
      // to come from a validation result rather than from an omission.
      holdoutSafety: {
        blocking: true,
        passed: true,
        evaluatedScenarios: ['baseline_touring'],
        failures: []
      }
    })
  )

  assert.match(passed, /Holdout-Sicherheitsgate: \*\*PASS\*\*/)
  assert.doesNotMatch(passed, /Keine Produktionsempfehlung/)
  assert.match(passed, /Holdout-Sicherheitsgrenzen \(harte Caps\) \| bestanden/)
  assert.match(passed, /Gesamt: \*\*PASS\*\*/)
})

test('the overall release status fails when either gate fails', () => {
  const holdoutFailed = renderExperimentMarkdown(
    buildMarkdownReport({ objectiveMet: true })
  )

  // Calibration passes in this fixture, so the overall verdict must still be FAIL
  // — that is the whole point of the second gate.
  assert.match(holdoutFailed, /Kalibrierungs-Gate: \*\*PASS\*\*/)
  assert.match(holdoutFailed, /Holdout-Sicherheit: \*\*FAIL\*\*/)
  assert.match(holdoutFailed, /Gesamt: \*\*FAIL\*\*/)
})

test('experiment markdown reports a met Phase 3C objective without partial wording', () => {
  const met = renderExperimentMarkdown(
    buildMarkdownReport({ objectiveMet: true })
  )

  assert.match(met, /Phase 3C Gesamtstatus \| met/)
  assert.match(met, /Gap-1-Dominanz im Zielband \| erreicht/)
  assert.doesNotMatch(met, /accepted-for-production-partial/)
})

// The search stops at the first validated pair, so ordering by impact is only a
// least-intervention guarantee if every configured lever actually scores above
// the no-op. A new override family that combinationImpact does not read would
// tie with 'none' and win or lose on the alphabetical tie-break instead.
test('every configured lever scores a positive combination impact', () => {
  const neutralBootstrap = BALANCE_EXPERIMENTS.find(
    item => item.id === 'bootstrap-none'
  )
  const neutralTouring = BALANCE_EXPERIMENTS.find(
    item => item.id === 'touring-none'
  )
  assert.ok(neutralBootstrap && neutralTouring, 'No-op candidates must exist')

  assert.equal(
    combinationImpact({
      bootstrap: neutralBootstrap,
      touring: neutralTouring
    }),
    0,
    'The all-neutral combination must be the strict minimum'
  )

  for (const candidate of BALANCE_EXPERIMENTS) {
    if (candidate.id.endsWith('-none')) continue

    const impact =
      candidate.phase === 'bootstrap'
        ? combinationImpact({
            bootstrap: candidate,
            touring: neutralTouring
          })
        : combinationImpact({
            bootstrap: neutralBootstrap,
            touring: candidate
          })

    assert.ok(
      Number.isFinite(impact),
      `${candidate.id} produced a non-finite impact (${impact})`
    )
    assert.ok(
      impact > 0,
      `${candidate.id} scores ${impact}, tying with the no-op — combinationImpact does not read its override family`
    )
  }
})

// targetFit saturating for most candidates once made the bootstrap ranking a
// pure id tie-break while still reading like a meaningful order. The renderer
// has to say so; this branch is otherwise only reachable in that degraded state.
test('experiment markdown flags a non-discriminating ranking', () => {
  const tied = renderExperimentMarkdown(
    buildMarkdownReport({
      objectiveMet: false,
      rankingEntries: [
        rankingEntry('probe-a', 0),
        rankingEntry('probe-b', 0),
        rankingEntry('probe-c', 0)
      ]
    })
  )
  assert.match(tied, /ID-Tie-Break und ist nicht aussagekraeftig/)

  const spread = renderExperimentMarkdown(
    buildMarkdownReport({
      objectiveMet: false,
      rankingEntries: [
        rankingEntry('probe-a', 60),
        rankingEntry('probe-b', 40),
        rankingEntry('probe-c', 20)
      ]
    })
  )
  assert.doesNotMatch(spread, /nicht aussagekraeftig/)
})

// An empty candidate set is a legitimate experiment outcome; a misconfigured
// horizon or a simulation regression is not. The CLI distinguishes them by
// type, so the type has to stay distinguishable.
test('no-viable-candidate failures are a distinct error type', () => {
  const outcome = new NoViableCandidateError(
    'No Phase 3B candidate satisfies acceptance criteria'
  )

  assert.ok(outcome instanceof NoViableCandidateError)
  assert.ok(outcome instanceof Error)
  assert.equal(outcome.name, 'NoViableCandidateError')
  assert.equal(
    new RangeError(
      'Progression checkpoints fall outside the simulated horizon'
    ) instanceof NoViableCandidateError,
    false,
    'A configuration fault must not be reported as an experiment outcome'
  )
})

// rankCandidates puts passing candidates ahead of failing ones before it
// compares scores, so an all-tied score set can still carry a meaningful order.
test('ranking tie notice accounts for pass/fail ordering', () => {
  const tiedButMixedAcceptance = renderExperimentMarkdown(
    buildMarkdownReport({
      objectiveMet: false,
      rankingEntries: [
        { ...rankingEntry('probe-a', 0), passed: true },
        { ...rankingEntry('probe-b', 0), passed: false }
      ]
    })
  )
  assert.doesNotMatch(
    tiedButMixedAcceptance,
    /nicht aussagekraeftig/,
    'Pass-before-fail is a real ordering, not an id tie-break'
  )

  const tiedAndAllPassing = renderExperimentMarkdown(
    buildMarkdownReport({
      objectiveMet: false,
      rankingEntries: [
        { ...rankingEntry('probe-a', 0), passed: true },
        { ...rankingEntry('probe-b', 0), passed: true }
      ]
    })
  )
  assert.match(tiedAndAllPassing, /nicht aussagekraeftig/)
})

// ---------------------------------------------------------------------------
// Two-gate combination search
//
// The published report selected the neutral no-op after evaluating 1 of 126
// pairs, and only then discovered that its shipping tuning breached a hard
// holdout cap. 125 candidates were never asked whether they would have held. The
// gate is blocking, so it belongs inside the search, not after it.
// ---------------------------------------------------------------------------

const STUB_RUNS_PER_SCENARIO = 4

// The stub has to tell the three seed streams apart, and `createScenarioSeed`
// returns a hashed number rather than the label it was built from.
const streamIndexFor = runsPerScenario => {
  const streamOfSeed = new Map()
  const indexOfSeed = new Map()
  for (const scenario of SCENARIOS) {
    for (let runIndex = 0; runIndex < runsPerScenario; runIndex++) {
      for (const stream of ['calibration', 'selection', 'validation']) {
        const seed = streamSeed(stream, scenario.id, runIndex)
        assert.equal(
          streamOfSeed.has(seed),
          false,
          `Seed streams must stay disjoint (${stream} collides with ${streamOfSeed.get(seed)})`
        )
        streamOfSeed.set(seed, stream)
        indexOfSeed.set(seed, runIndex)
      }
    }
  }
  return {
    streamOf: seed => streamOfSeed.get(seed) ?? null,
    indexOf: seed => indexOfSeed.get(seed)
  }
}

// Deliberately identical for control and candidate on the calibration stream, so
// every paired delta is zero and both gates' calibration side passes. That
// isolates what these tests are about: the holdout gate.
const stubRun = ({ bankrupt }) => ({
  bankrupt,
  daysSurvived: SIMULATION_CONSTANTS.daysPerRun,
  finalMoney: bankrupt ? 0 : 18000,
  finalFame: 12000,
  fameAccounting: { earned: 12000 },
  gigsPlayed: 8,
  finalHarmony: 60,
  maxPeakToTroughDrop: 10,
  moneyAtEarlyCheckpoint: 900,
  moneyAtMidCheckpoint: 2400,
  moneyAtLateCheckpoint: 6000,
  totalGigNet: 20000,
  clinicVisits: 1,
  repairs: 1,
  refuels: 2
})

/**
 * @param reliefClearsGate when true, an early-game obligation multiplier at or
 *   below 0.8 makes `cult_hypergrowth` hold. When false no tuning can clear it,
 *   which is the situation the shipped economy is in.
 * @param breachingStreams which streams carry the breach. Defaults to both the
 *   search stream and the reserved one; passing `['selection']` models the case the
 *   split exists to catch — a candidate that looks safe on the stream it was chosen
 *   on and breaches on the untouched one.
 */
const makeStubRunner = ({
  reliefClearsGate,
  runsPerScenario = STUB_RUNS_PER_SCENARIO,
  breachingStreams = ['selection', 'validation']
}) => {
  const streams = streamIndexFor(runsPerScenario)
  return (scenario, seed, tuning) => {
    const runIndex = streams.indexOf(seed)
    const stream = streams.streamOf(seed)
    const baseId = scenario.id.replace(/_gap_\d+$/, '')
    const relieved =
      reliefClearsGate &&
      (tuning?.earlyGame?.dailyObligationMultiplier ?? 1) <= 0.8
    // One insolvency in four is 25%, above cult_hypergrowth's 12% cap; zero is
    // below it. Every other scenario stays solvent, so the gate turns on this
    // scenario alone — exactly how the real breach reads.
    const bankrupt =
      runIndex === 0 &&
      baseId === 'cult_hypergrowth' &&
      !relieved &&
      breachingStreams.includes(stream)
    return stubRun({ bankrupt })
  }
}

test('the combination search rejects a cap breach and keeps looking', async () => {
  const report = await runExperimentSuite({
    runsPerScenario: STUB_RUNS_PER_SCENARIO,
    writeReports: false,
    simulate: makeStubRunner({ reliefClearsGate: true })
  })

  assert.equal(report.combinationSearch.selectionOutcome, 'fully-validated')
  assert.ok(
    report.combinationSearch.pairsRejectedBySelectionGate > 0,
    'The neutral pair passes calibration and must be rejected by the selection gate'
  )
  assert.equal(report.holdoutSafetyValidation.passed, true)
  assert.equal(report.holdoutSafetyValidation.missingScenarioIds.length, 0)
  assert.equal(report.finalCombinedValidation.passed, true)
  assert.match(report.recommendation.status, /^accepted-for-production/)

  // The selected lever must be one that actually clears the gate, not the
  // lowest-impact pair that merely passed calibration.
  assert.notEqual(report.recommendation.bootstrap, 'bootstrap-none')
  assert.ok(
    (report.recommendation.tuning.earlyGame.dailyObligationMultiplier ?? 1) <=
      0.8,
    'Selection must land on a tuning that holds on the holdout stream'
  )
  assert.equal(report.combinationSearch.selectedAppliesNoChange, false)

  const neutral = report.combinationRanking.find(
    item =>
      item.bootstrap === 'bootstrap-none' && item.touring === 'touring-none'
  )
  assert.ok(neutral)
  assert.equal(neutral.passed, false)
  assert.equal(neutral.selectionGatePassed, false)
  assert.deepEqual(neutral.selectionGateFailures, [
    'cult_hypergrowth 25% > 12%'
  ])
  // Skipping the paired comparison for a pair that cannot ship must read as "not
  // measured", never as a pass.
  assert.equal(neutral.calibrationPassed, null)
})

test('no combination clearing both gates still produces the diagnostic report', async () => {
  const report = await runExperimentSuite({
    runsPerScenario: STUB_RUNS_PER_SCENARIO,
    writeReports: false,
    simulate: makeStubRunner({ reliefClearsGate: false })
  })

  assert.equal(
    report.combinationSearch.selectionOutcome,
    'no-combination-cleared-both-gates'
  )
  assert.equal(
    report.combinationSearch.pairsEvaluated,
    report.combinationSearch.pairsAvailable,
    'Every available pair must be asked, not just the first that passed calibration'
  )
  assert.equal(
    report.combinationSearch.pairsRejectedBySelectionGate,
    report.combinationSearch.pairsAvailable
  )
  assert.equal(report.holdoutSafetyValidation.passed, false)
  assert.equal(
    report.recommendation.status,
    'no-production-recommendation-holdout-safety-failed'
  )

  // Nothing may be marked as selected for production when both gates refused
  // everything, even though the artifacts still name a reported baseline.
  const selectedFlags = [
    ...report.phases.phase3B.candidates,
    ...report.phases.phase3C.candidates
  ].filter(item => item.selectedForProduction)
  assert.deepEqual(selectedFlags, [])

  // The reported baseline's holdout block must cover every capped scenario: an
  // aborted screen would publish five of seven as unmeasured, which reads as
  // config drift rather than as "the gate had already failed".
  assert.deepEqual(report.holdoutSafetyValidation.missingScenarioIds, [])
  assert.deepEqual(
    Object.keys(report.holdoutBankruptcyByScenario).sort(),
    report.holdoutSafetyValidation.expectedScenarios.slice().sort()
  )
  assert.match(
    renderExperimentMarkdown(report),
    /Keine Kombination hat beide Gates bestanden/
  )
})

test('the reserved validation stream is measured once, on the selected pair only', async () => {
  // The failure mode the three-way split exists for: a candidate that clears the
  // caps on the stream it was selected on, and breaches on the untouched one.
  // Searching further there would spend the independence the stream is for, so the
  // outcome has to be "no recommendation" rather than "try the next candidate".
  const report = await runExperimentSuite({
    runsPerScenario: STUB_RUNS_PER_SCENARIO,
    writeReports: false,
    simulate: makeStubRunner({
      reliefClearsGate: false,
      breachingStreams: ['validation']
    })
  })

  assert.equal(
    report.selectionGateValidation.passed,
    true,
    'clean on selection'
  )
  assert.equal(
    report.holdoutSafetyValidation.passed,
    false,
    'breaches on validation'
  )
  assert.deepEqual(
    report.holdoutSafetyValidation.failures.map(failure => failure.scenarioId),
    ['cult_hypergrowth']
  )
  assert.equal(
    report.recommendation.status,
    'no-production-recommendation-final-validation-failed'
  )
  // Nothing may be marked shippable, and the search must not have gone looking for
  // a replacement on the validation stream.
  assert.deepEqual(
    [
      ...report.phases.phase3B.candidates,
      ...report.phases.phase3C.candidates
    ].filter(item => item.selectedForProduction),
    []
  )
  // `fully-validated` would claim all three gates held. The search gates did; the
  // reserved stream did not, and the search artifact has to say which step failed
  // rather than disagreeing with `recommendation.status`.
  assert.equal(
    report.combinationSearch.selectionOutcome,
    'selection-validated-final-validation-failed'
  )
  assert.deepEqual(report.combinationSearch.selectedFinalValidationFailures, [
    'cult_hypergrowth 25% > 12%'
  ])
  assert.equal(report.combinationSearch.pairsRejectedBySelectionGate, 0)
  assert.deepEqual(report.holdoutSafetyValidation.missingScenarioIds, [])
  assert.deepEqual(Object.keys(report.seedStreams).sort(), [
    'calibration',
    'selection',
    'validation'
  ])
})

test('holdout screening covers every capped scenario, tightest cap first', () => {
  const ordered = holdoutGateScenarios().map(scenario => scenario.id)
  const capped = SCENARIOS.filter(scenario =>
    Number.isFinite(KPI_TARGETS[scenario.id]?.bankruptcyMax)
  ).map(scenario => scenario.id)

  assert.deepEqual(ordered.slice().sort(), capped.slice().sort())
  const caps = ordered.map(id => KPI_TARGETS[id].bankruptcyMax)
  assert.deepEqual(
    caps,
    caps.slice().sort((a, b) => a - b)
  )
})

test('screening aborts at a breach but a full measurement covers the whole set', () => {
  const runner = makeStubRunner({ reliefClearsGate: false })
  const tuning = resolveBalanceTuning({}, DEFAULT_BALANCE_TUNING)

  const screened = measureHoldoutGate({
    tuning,
    runsPerScenario: STUB_RUNS_PER_SCENARIO,
    runner,
    stream: 'selection'
  })
  assert.equal(screened.stream, 'selection')
  assert.equal(screened.validation.passed, false)
  assert.ok(
    screened.measured.length < holdoutGateScenarios().length,
    'A breach must stop the screen instead of measuring the remainder'
  )
  assert.ok(screened.validation.missingScenarioIds.length > 0)

  const full = measureHoldoutGate({
    tuning,
    runsPerScenario: STUB_RUNS_PER_SCENARIO,
    runner,
    abortOnBreach: false,
    stream: 'selection'
  })
  assert.equal(full.measured.length, holdoutGateScenarios().length)
  assert.deepEqual(full.validation.missingScenarioIds, [])
  assert.equal(full.validation.passed, false)
  assert.deepEqual(
    full.validation.failures.map(failure => failure.scenarioId),
    ['cult_hypergrowth']
  )
  assert.ok(full.runsSpent > screened.runsSpent)
})

// The side-effect limit asks whether a lever accelerates Fame per gig. Folding a
// gig-less run in as a zero cannot answer that when the lever is what decides how
// many runs play — and that is exactly what a liquidity lever changes.
test('paired fame per gig compares the same denominator on both sides', () => {
  const pair = (controlGigs, candidateGigs, fame = 1600) => ({
    control: { gigsPlayed: controlGigs, fameEarned: fame * controlGigs },
    candidate: { gigsPlayed: candidateGigs, fameEarned: fame * candidateGigs }
  })

  // A lever that rescues runs which never played must read as neutral: every gig
  // that happened paid the same Fame on both sides.
  const rescued = [pair(4, 4), pair(0, 5), pair(0, 6), pair(3, 3)]
  const measured = pairedFamePerGig(rescued)
  assert.equal(measured.deltaPct, 0)
  assert.equal(
    measured.sampleSize,
    2,
    'Pairs with a gig-less side carry no per-gig information'
  )
  assert.equal(measured.excludedPairs, 2)

  // Real acceleration must still register.
  const accelerated = [
    {
      control: { gigsPlayed: 4, fameEarned: 4000 },
      candidate: { gigsPlayed: 4, fameEarned: 5000 }
    }
  ]
  assert.equal(pairedFamePerGig(accelerated).deltaPct, 25)

  // No comparable pair at all must not read as a measured zero: the delta is null,
  // the evidence flag is false, and the limit fails closed on it.
  const none = pairedFamePerGig([pair(0, 0)])
  assert.equal(none.sampleSize, 0)
  assert.equal(none.deltaPct, null)
  assert.equal(none.sufficientEvidence, false)
  assert.equal(famePerGigWithinLimit(none, 5), false)
  assert.equal(famePerGigWithinLimit(measured, 5), true)

  // Coverage is a share of the cohort, so the threshold tracks runsPerScenario
  // instead of becoming unreachable on a small probe run.
  const thin = pairedFamePerGig([
    pair(4, 4),
    pair(0, 5),
    pair(0, 5),
    pair(0, 5)
  ])
  assert.equal(thin.sampleSize, 1)
  assert.equal(thin.minimumSampleSize, Math.ceil(4 * FAME_EVIDENCE_MIN_SHARE))
  assert.equal(thin.sufficientEvidence, false)
  assert.equal(thin.deltaPct, null)
})
