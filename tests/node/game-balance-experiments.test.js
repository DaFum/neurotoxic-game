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
  evaluateFinalCombinedValidation,
  evaluateCandidate,
  kpiStatusForRuns,
  pairSimulationRuns,
  rankCandidates,
  selectAcceptedCandidate,
  summarizePairedRuns
} from '../../scripts/game-balance-experiments.mjs'
import {
  KPI_TARGETS,
  SCENARIOS,
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
  sampleSize = 10
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
        index === 0 ? { ...item, famePerGigDeltaPct: 5.01 } : item
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

test('selected obligation relief ends after its configured production window', () => {
  assert.equal(getEarlyGameObligationMultiplier(1), 0.49)
  assert.equal(getEarlyGameObligationMultiplier(60), 0.49)
  assert.equal(getEarlyGameObligationMultiplier(61), 1)
})

test('selected regional repeat demand penalty starts after the first show and caps', () => {
  assert.equal(getRepeatDemandMultiplier(0, 0), 1)
  assert.equal(getRepeatDemandMultiplier(28, 1), 1)
  assert.equal(getRepeatDemandMultiplier(29, 1), 0.84)
  assert.ok(Math.abs(getRepeatDemandMultiplier(29, 20) - 0.45) < 1e-12)
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
    moneyAtDay20: 100,
    moneyAtDay40: 100
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
      medianSurvivalMinimumDeltaDays: 0,
      medianSurvivalMinimumDeltaPct: 0,
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
