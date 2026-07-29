import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PRODUCTION_CADENCE_VALIDATION,
  cappedScenarios,
  parseArgs,
  renderProductionCadenceMarkdown,
  runProductionCadenceValidation,
  runCadenceProbe,
  summarizeCohort
} from '../../scripts/game-balance-cadence-probe.mjs'
import {
  GIG_CADENCE_POLICIES,
  KPI_TARGETS,
  createScenarioSeed
} from '../../scripts/game-balance-simulation.mjs'

const CULT = 'cult_hypergrowth'
const RUNS = 8

const runway = (overrides = {}) => ({
  firstGigDay: 1,
  bankruptBeforeFirstGig: false,
  moneyBeforeFirstGig: 400,
  lowestMoneyBeforeFirstGig: 400,
  daysBeforeFirstGig: 0,
  obligationsBeforeFirstGig: 80,
  spendBeforeFirstGig: 120,
  blockedTravelDaysBeforeFirstGig: 0,
  firstBlockedTravel: null,
  ...overrides
})

const stubRun = ({ bankrupt, played = true }) => ({
  bankrupt,
  daysSurvived: played ? 10 : 4,
  gigsPlayed: played ? 7 : 0,
  finalMoney: bankrupt ? 0 : 20000,
  finaleReached: played,
  finaleCompleted: played,
  fameAccounting: { earned: played ? 11200 : 0 },
  travelSpend: 300,
  refuelSpend: 40,
  repairSpend: 20,
  clinicSpend: 0,
  catalogMoneySpent: 500,
  earlyRunway: played
    ? runway()
    : runway({
        firstGigDay: null,
        bankruptBeforeFirstGig: bankrupt,
        moneyBeforeFirstGig: null,
        daysBeforeFirstGig: 4,
        blockedTravelDaysBeforeFirstGig: 1,
        firstBlockedTravel: { day: 3, reason: 'money' }
      })
})

/**
 * The runner only receives `(scenario, seed)`, and `createScenarioSeed` hashes its
 * label away, so the run index has to be recovered from a precomputed map.
 */
const seedIndex = scenarios => {
  const map = new Map()
  for (const scenario of scenarios) {
    for (let runIndex = 0; runIndex < RUNS; runIndex++) {
      map.set(createScenarioSeed(`${scenario.id}#holdout`, runIndex), runIndex)
      map.set(
        createScenarioSeed(`${scenario.id}#selection`, runIndex),
        runIndex
      )
      map.set(createScenarioSeed(scenario.id, runIndex), runIndex)
    }
  }
  return map
}

/**
 * @param breachingPolicies policies under which `cult_hypergrowth` fails two runs
 *   in eight — 25%, above its 12% cap. Every other scenario stays solvent so the
 *   gate turns on this scenario alone, the way the real breach reads.
 */
const makeRunner = (
  breachingPolicies,
  breachingStreams = ['selection', 'holdout']
) => {
  const scenarios = cappedScenarios()
  const indexBySeed = seedIndex(scenarios)
  const streamOfSeed = new Map()
  for (const scenario of scenarios) {
    for (let runIndex = 0; runIndex < RUNS; runIndex++) {
      streamOfSeed.set(createScenarioSeed(scenario.id, runIndex), 'calibration')
      streamOfSeed.set(
        createScenarioSeed(`${scenario.id}#selection`, runIndex),
        'selection'
      )
      streamOfSeed.set(
        createScenarioSeed(`${scenario.id}#holdout`, runIndex),
        'holdout'
      )
    }
  }
  return (scenario, seed) => {
    const runIndex = indexBySeed.get(seed)
    const breaches =
      scenario.id === CULT &&
      breachingPolicies.includes(scenario.gigCadencePolicy) &&
      breachingStreams.includes(streamOfSeed.get(seed)) &&
      runIndex < 2
    return stubRun({ bankrupt: breaches, played: !breaches })
  }
}

const probe = breachingPolicies =>
  runCadenceProbe({
    runsPerScenario: RUNS,
    runner: makeRunner(breachingPolicies),
    scenarios: cappedScenarios()
  })

// The probe supports `--runs <n>`, and a small cohort can put every policy under
// the cap — `--runs 1` reads 0% everywhere. Asking only "which variants pass?"
// would then publish a FAIL-to-PASS causal claim that nothing in the measurement
// supports.
test('no reproduced breach yields no causal claim', () => {
  const report = probe([])

  assert.equal(report.conclusion.shippedPolicyBreachesCultCap, false)
  assert.equal(report.conclusion.phaseExplainsBreach, false)
  assert.deepEqual(report.conclusion.clearingPolicies, [])
  assert.match(report.conclusion.verdict, /Nicht auswertbar/)
  assert.doesNotMatch(
    report.conclusion.verdict,
    /von FAIL/,
    'A verdict may not describe a transition that did not happen'
  )

  // Every policy passing its gate is exactly the case that used to be misread.
  for (const variant of report.variants) {
    assert.equal(variant.holdoutSafetyValidation.passed, true)
  }
})

test('a breach only the shipped policy carries is attributed to the phase', () => {
  const report = probe(['gap-aligned'])

  assert.equal(report.conclusion.shippedPolicyBreachesCultCap, true)
  assert.equal(report.conclusion.shippedCultHoldoutRatePct, 25)
  assert.equal(
    report.conclusion.cultHardCapPct,
    KPI_TARGETS[CULT].bankruptcyMax
  )
  assert.equal(report.conclusion.phaseExplainsBreach, true)
  assert.deepEqual(
    report.conclusion.clearingPolicies.slice().sort(),
    GIG_CADENCE_POLICIES.filter(policy => policy !== 'gap-aligned')
      .slice()
      .sort()
  )
  assert.match(report.conclusion.verdict, /von FAIL \(25% gegen 12%\) auf PASS/)

  // The phase effect has to show on a second, independent cohort too — otherwise it
  // is a property of the sample it was found on rather than of the phase.
  assert.equal(report.conclusion.independentConfirmation.stream, 'selection')
  assert.equal(
    report.conclusion.independentConfirmation.agreesWithHoldout,
    true
  )
  assert.equal(report.conclusion.independentConfirmation.shippedCultRatePct, 25)
})

// The probe imposes an independent-confirmation requirement on itself; publishing a
// positive conclusion without it would ignore the probe's own rule.
test('a phase effect on one cohort only is not a conclusion', () => {
  // Breaches on `validation` but not on `selection`: a variant therefore "clears the
  // holdout gate" while the second cohort shows no effect to confirm.
  const report = runCadenceProbe({
    runsPerScenario: RUNS,
    // The probe names its reserved cohort `holdout`; breaching only there leaves the
    // `selection` cohort with no effect to confirm.
    runner: makeRunner(['gap-aligned'], ['holdout']),
    scenarios: cappedScenarios()
  })

  assert.equal(report.conclusion.shippedPolicyBreachesCultCap, true)
  assert.equal(
    report.conclusion.independentConfirmation.agreesWithHoldout,
    false
  )
  assert.equal(
    report.conclusion.phaseExplainsBreach,
    false,
    'A single-cohort effect must not be published as a phase conclusion'
  )
  assert.match(report.conclusion.verdict, /Nicht auswertbar/)
  assert.match(report.conclusion.verdict, /Stichprobeneffekt/)
})

test('a breach every phase carries is not a simulation artifact', () => {
  const report = probe([...GIG_CADENCE_POLICIES])

  assert.equal(report.conclusion.shippedPolicyBreachesCultCap, true)
  assert.equal(report.conclusion.phaseExplainsBreach, false)
  assert.deepEqual(report.conclusion.clearingPolicies, [])
  assert.match(report.conclusion.verdict, /reproduziert/)
  assert.match(report.conclusion.verdict, /Eingriff ist gerechtfertigt/)
})

// A cohort metric that folds a gig-less run in as a zero cannot describe the
// never-played cohort. Both denominators are published so a Fame claim has to say
// which one it rests on.
test('cohort fame per gig publishes both denominators', () => {
  const runs = [
    stubRun({ bankrupt: false }),
    stubRun({ bankrupt: true, played: false })
  ]
  const cohort = summarizeCohort(runs)

  assert.equal(cohort.neverPlayedCount, 1)
  assert.equal(cohort.bankruptBeforeFirstGigCount, 1)
  assert.equal(cohort.famePerGigPlayedRuns, 1600)
  assert.equal(
    cohort.famePerGig,
    800,
    'The all-runs figure is halved by the gig-less run, which is the artifact'
  )
  assert.equal(cohort.firstBlockedTravelReasons.money, 1)
})

test('production cadence validation is predeclared and rejects undersized samples', () => {
  assert.deepEqual(PRODUCTION_CADENCE_VALIDATION.policies, [
    'gap-aligned',
    'first-income'
  ])
  assert.equal(
    PRODUCTION_CADENCE_VALIDATION.seedNamespace,
    '#production-cadence-validation-v2'
  )
  assert.equal(PRODUCTION_CADENCE_VALIDATION.minimumRunsPerScenario, 2000)
  assert.equal(
    Object.hasOwn(PRODUCTION_CADENCE_VALIDATION, 'bankruptcyCorridors'),
    false
  )
  assert.throws(
    () => runProductionCadenceValidation({ runsPerScenario: 1999 }),
    /at least 2000/
  )
})

test('--runs rejects production validation samples below the predeclared minimum', () => {
  assert.throws(() => parseArgs(['--runs']), /--runs requires a value/)
  assert.throws(() => parseArgs(['--runs', '1999']), /--runs.*at least 2000/)
  assert.equal(parseArgs(['--runs', '2000']).runsPerScenario, 2000)
})

test('production cadence validation fails closed when an expected scenario is missing', () => {
  const expectedScenarios = cappedScenarios().map(scenario => scenario.id)
  const scenarios = [cappedScenarios()[0]]
  const report = runProductionCadenceValidation({
    runsPerScenario: 2000,
    runner: () => stubRun({ bankrupt: false }),
    scenarios
  })

  assert.deepEqual(report.expectedScenarios, expectedScenarios)
  assert.deepEqual(
    report.evaluatedScenarios,
    scenarios.map(scenario => scenario.id)
  )
  assert.deepEqual(report.missingScenarioIds, expectedScenarios.slice(1))
  assert.equal(report.approvedForProduction, false)
  assert.deepEqual(
    report.failedGates,
    expectedScenarios.slice(1).map(id => `${id}:missing-validation`)
  )
  const markdown = renderProductionCadenceMarkdown(report)
  assert.match(markdown, /## Szenarioabdeckung/)
  assert.match(markdown, new RegExp(`Fehlend:.*${expectedScenarios[1]}`))
})

test('production cadence validation applies the predeclared release gates', () => {
  const scenarios = cappedScenarios().map(scenario => ({ ...scenario }))
  const seedToIndex = new Map()
  for (const scenario of scenarios) {
    for (let index = 0; index < 2000; index++) {
      seedToIndex.set(
        createScenarioSeed(
          `${scenario.id}${PRODUCTION_CADENCE_VALIDATION.seedNamespace}`,
          index
        ),
        index
      )
    }
  }
  const bankruptcyCounts = {
    'gap-aligned': {
      cult_hypergrowth: 260,
      baseline_touring: 60,
      bootstrap_struggle: 500
    },
    'first-income': {
      cult_hypergrowth: 120,
      baseline_touring: 60,
      bootstrap_struggle: 400
    }
  }
  const runner = (scenario, seed) => {
    const index = seedToIndex.get(seed)
    const bankrupt =
      index < (bankruptcyCounts[scenario.gigCadencePolicy][scenario.id] ?? 0)
    return stubRun({ bankrupt, played: !bankrupt })
  }

  const report = runProductionCadenceValidation({
    runsPerScenario: 2000,
    runner,
    scenarios
  })

  assert.equal(report.status, 'production-cadence-validation-passed')
  assert.equal(report.approvedForProduction, true)
  assert.deepEqual(report.failedGates, [])
  assert.equal(
    report.designWarnings.bootstrap_struggle.classification,
    'inside'
  )
  assert.equal(
    report.comparisons.bootstrap_struggle.pairedFamePerGig.deltaPct,
    0
  )
  assert.equal(
    report.comparisons.bootstrap_struggle.pairedSolventFinalMoney.deltaPct,
    0
  )
  assert.equal(report.candidate.scenarios.cult_hypergrowth.bankruptcyRatePct, 6)
  assert.equal(report.candidate.scenarios.baseline_touring.bankruptcyRatePct, 3)
  assert.equal(
    report.candidate.scenarios.bootstrap_struggle.bankruptcyRatePct,
    20
  )
})

test('production cadence side-effect gates use comparable seed pairs and fail closed', () => {
  const scenarios = cappedScenarios().map(item => ({ ...item }))
  const scenario = {
    ...scenarios.find(item => item.id === 'baseline_touring')
  }
  const seeds = new Map()
  for (const item of scenarios) {
    for (let index = 0; index < 2000; index++) {
      seeds.set(
        createScenarioSeed(
          `${item.id}${PRODUCTION_CADENCE_VALIDATION.seedNamespace}`,
          index
        ),
        index
      )
    }
  }
  const runner = (configured, seed) => {
    if (configured.id !== scenario.id) return stubRun({ bankrupt: false })
    const index = seeds.get(seed)
    const control = configured.gigCadencePolicy === 'gap-aligned'
    const comparable = index < 1000
    const run = stubRun({
      bankrupt: !comparable && control,
      played: comparable || !control
    })
    if (!comparable && !control) {
      run.finalMoney = 100000
      run.fameAccounting.earned = 999999
    }
    return run
  }

  const report = runProductionCadenceValidation({
    runsPerScenario: 2000,
    runner,
    scenarios
  })
  const comparison = report.comparisons[scenario.id]

  assert.equal(comparison.pairedFamePerGig.sampleSize, 1000)
  assert.equal(comparison.pairedFamePerGig.deltaPct, 0)
  assert.equal(comparison.pairedSolventFinalMoney.sampleSize, 1000)
  assert.equal(comparison.pairedSolventFinalMoney.deltaPct, 0)
  assert.equal(report.approvedForProduction, true)

  const thin = runProductionCadenceValidation({
    runsPerScenario: 2000,
    runner: (configured, seed) => {
      if (configured.id !== scenario.id) return stubRun({ bankrupt: false })
      const index = seeds.get(seed)
      const comparable = index < 999
      return stubRun({
        bankrupt: !comparable,
        played: comparable
      })
    },
    scenarios
  })
  assert.equal(thin.comparisons[scenario.id].pairedFamePerGig.deltaPct, null)
  assert.equal(
    thin.comparisons[scenario.id].pairedSolventFinalMoney.deltaPct,
    null
  )
  assert.deepEqual(thin.failedGates.sort(), [
    `${scenario.id}:bankruptcy-max`,
    `${scenario.id}:fame-per-gig`,
    `${scenario.id}:solvent-final-money`
  ])
})

test('production cadence release gate uses finale completion, not arrival', () => {
  const scenarios = cappedScenarios().map(item => ({ ...item }))
  const scenario = {
    ...scenarios.find(item => item.id === 'baseline_touring')
  }
  const runner = configured => {
    const run = stubRun({ bankrupt: false })
    run.finaleReached = true
    run.finaleCompleted =
      configured.id !== scenario.id ||
      configured.gigCadencePolicy === 'gap-aligned'
    return run
  }
  const report = runProductionCadenceValidation({
    runsPerScenario: 2000,
    runner,
    scenarios
  })

  assert.equal(report.comparisons[scenario.id].finaleReachedDeltaPct, 0)
  assert.equal(report.comparisons[scenario.id].finaleCompletedDeltaPct, -100)
  assert.deepEqual(report.failedGates, [`${scenario.id}:finale-completed`])
})

test('production cadence stranding gate uses blocked travel before the first gig', () => {
  const scenarios = cappedScenarios().map(item => ({ ...item }))
  const scenarioId = 'baseline_touring'
  const runner = configured => {
    const run = stubRun({ bankrupt: false })
    if (
      configured.id === scenarioId &&
      configured.gigCadencePolicy === 'first-income'
    ) {
      run.earlyRunway = runway({
        blockedTravelDaysBeforeFirstGig: 1,
        firstBlockedTravel: { day: 1, reason: 'money' }
      })
    }
    return run
  }
  const report = runProductionCadenceValidation({
    runsPerScenario: 2000,
    runner,
    scenarios
  })

  assert.equal(
    report.comparisons[scenarioId].blockedTravelBeforeFirstGigRunsPctDelta,
    100
  )
  assert.equal(
    report.comparisons[scenarioId].bankruptBeforeFirstGigRateDeltaPct,
    0
  )
  assert.deepEqual(report.failedGates, [`${scenarioId}:pre-first-gig-stranded`])
  const markdown = renderProductionCadenceMarkdown(report)
  assert.match(markdown, /Δ blockierte Reise vor erstem Gig/)
  assert.match(markdown, /Δ Insolvenz vor erstem Gig/)
})

test('production cadence stranding gate ignores bankruptcy without blocked travel', () => {
  const scenarios = cappedScenarios().map(item => ({ ...item }))
  const scenarioId = 'baseline_touring'
  let runIndex = 0
  const runner = configured => {
    const run = stubRun({ bankrupt: false })
    if (configured.gigCadencePolicy === 'gap-aligned') {
      if (configured.id === scenarioId) runIndex = 0
      return run
    }
    if (configured.id === scenarioId && runIndex++ === 0) {
      run.bankrupt = true
      run.earlyRunway = runway({ bankruptBeforeFirstGig: true })
    }
    return run
  }
  const report = runProductionCadenceValidation({
    runsPerScenario: 2000,
    runner,
    scenarios
  })

  assert.equal(
    report.comparisons[scenarioId].blockedTravelBeforeFirstGigRunsPctDelta,
    0
  )
  assert.equal(
    report.comparisons[scenarioId].bankruptBeforeFirstGigRateDeltaPct,
    0.05
  )
  assert.equal(
    report.failedGates.includes(`${scenarioId}:pre-first-gig-stranded`),
    false
  )
})
