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
  evaluateCandidate,
  pairSimulationRuns,
  rankCandidates,
  summarizePairedRuns
} from '../../scripts/game-balance-experiments.mjs'
import {
  SCENARIOS,
  createScenarioSeed,
  runSingleSimulation
} from '../../scripts/game-balance-simulation.mjs'

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
})

test('selected obligation relief ends after its configured production window', () => {
  assert.equal(getEarlyGameObligationMultiplier(1), 0.5)
  assert.equal(getEarlyGameObligationMultiplier(60), 0.5)
  assert.equal(getEarlyGameObligationMultiplier(61), 1)
})

test('selected regional repeat demand penalty starts after the first show and caps', () => {
  assert.equal(getRepeatDemandMultiplier(0, 0), 1)
  assert.equal(getRepeatDemandMultiplier(1, 1), 0.9)
  assert.equal(getRepeatDemandMultiplier(1, 20), 0.6)
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
