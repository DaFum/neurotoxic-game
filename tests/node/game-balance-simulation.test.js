import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { LOAN_PROFILES } from '../../src/utils/loanProfiles.js'
import { createInitialState } from '../../src/context/initialState.js'
import { getUnifiedUpgradeCatalog } from '../../src/data/upgradeCatalog.js'

import { MapGenerator } from '../../src/utils/mapGenerator.ts'

import {
  KPI_TARGETS,
  LIQUIDITY_STRESS_THRESHOLDS,
  PERFORMABLE_NODE_TYPES,
  REGRESSION_METRICS,
  RISK_EVIDENCE_MINIMUM_SAMPLE,
  RISK_TARGETS,
  SCENARIOS,
  SIMULATION_CONSTANTS,
  accountFameChange,
  accountFamePurchase,
  applyCatalogPurchase,
  buildDesignRiskReview,
  buildExecutionCoverage,
  buildTourAdjacency,
  buildFeatureInventory,
  calculateDrawdownPct,
  chooseNextTourNode,
  createScenarioSeed,
  classifyBankruptcyRisk,
  describeCorridorConfidence,
  evaluateScenarioRiskStatus,
  reconcileFameLedger,
  runSingleSimulation,
  summarizeCatalogAffordability,
  summarizeScenario
} from '../../scripts/game-balance-simulation.mjs'

const probeScenario = (daysOverride, overrides = {}) => {
  const base = SCENARIOS[0]
  return {
    ...base,
    id: `probe-${daysOverride}`,
    gigGapDays: 999,
    eventIntensity: 0,
    brandDealsEnabled: false,
    socialStrategy: 'none',
    daysOverride,
    ...overrides,
    initialOverrides: {
      ...base.initialOverrides,
      ...overrides.initialOverrides,
      player: {
        ...base.initialOverrides.player,
        money: 1_000_000,
        fame: 0,
        ...overrides.initialOverrides?.player
      }
    }
  }
}

test('baseline compatibility metrics match the canonical contract', () => {
  assert.deepEqual(
    REGRESSION_METRICS.map(metric => metric.key),
    [
      'bankruptcyRate',
      'avgFinalMoney',
      'avgFameProgressPerGig',
      'avgGigsPlayed'
    ]
  )
})

test('run-level Fame accounting records successful gigs and reconciles', () => {
  const run = runSingleSimulation(
    probeScenario(10, { gigGapDays: 1, minigameSkill: 1 }),
    9876
  )
  assert.ok(run.gigsPlayed > 0)
  assert.ok(run.fameAccounting.earned > 0)
  assert.equal(reconcileFameLedger(run) + run.fameAccounting.clampAdjustment, 0)

  run.finalFame += 1
  assert.equal(reconcileFameLedger(run), -1)
  run.reconciliationDelta = reconcileFameLedger(run)
  const unreconciledSummary = summarizeScenario([run])
  assert.equal(unreconciledSummary.fameAccounting.reconciledRuns, 0)
  assert.equal(unreconciledSummary.fameAccounting.maxAbsReconciliationDelta, 1)
})

test('event Fame accounting records gains, losses, and floor clamps', () => {
  const accounting = {
    earned: 0,
    spentGross: 0,
    refunded: 0,
    spentNet: 0,
    lost: 0,
    clampAdjustment: 0
  }
  accountFameChange(accounting, 25, 25)
  accountFameChange(accounting, -10, -10)
  accountFameChange(accounting, -10, -5)
  assert.deepEqual(accounting, {
    earned: 25,
    spentGross: 0,
    refunded: 0,
    spentNet: 0,
    lost: 20,
    clampAdjustment: 5
  })
  assert.equal(
    reconcileFameLedger({
      startingFame: 5,
      finalFame: 0,
      fameAccounting: {
        earned: 0,
        spentGross: 0,
        refunded: 0,
        lost: 10,
        clampAdjustment: 5
      }
    }),
    -5
  )
})

test('Fame purchases account only successful deductions and real refunds', () => {
  const accounting = {
    earned: 0,
    spentGross: 0,
    refunded: 0,
    spentNet: 0,
    lost: 0,
    clampAdjustment: 0
  }
  accountFamePurchase(accounting, {
    succeeded: false,
    nominalCost: 20,
    beforeFame: 100,
    afterFame: 80
  })
  assert.equal(accounting.spentGross, 0)

  accountFamePurchase(accounting, {
    succeeded: true,
    nominalCost: 20,
    beforeFame: 100,
    afterFame: 85,
    refundedFame: 5
  })
  assert.equal(accounting.spentGross, 20)
  assert.equal(accounting.refunded, 5)
  assert.equal(accounting.spentNet, 15)
})

test('label contact separates Fame cost from its Fame reward', () => {
  const state = createInitialState()
  state.player.fame = 5000
  const counters = {
    fameAccounting: {
      earned: 0,
      spentGross: 0,
      refunded: 0,
      spentNet: 0,
      lost: 0,
      clampAdjustment: 0
    },
    catalogFameSpent: 0,
    catalogMoneySpent: 0,
    gearItemsPurchased: 0,
    traitUnlocks: 0,
    catalogUpgrades: 0
  }
  const labelContact = getUnifiedUpgradeCatalog().find(
    item => item.id === 'label_contact'
  )

  assert.equal(applyCatalogPurchase(state, labelContact, counters), true)
  assert.equal(state.player.fame, 4000)
  assert.equal(counters.fameAccounting.spentGross, 2000)
  assert.equal(counters.fameAccounting.earned, 1000)
  assert.equal(counters.fameAccounting.refunded, 0)
  assert.equal(counters.fameAccounting.clampAdjustment, 0)
})

test('summary Fame progress uses the explicit earned ledger', () => {
  const runs = [
    runSingleSimulation(probeScenario(5, { gigGapDays: 1 }), 321),
    runSingleSimulation(probeScenario(5, { gigGapDays: 1 }), 654)
  ]
  const summary = summarizeScenario(runs)
  const expectedProgress = Math.round(
    runs.reduce((total, run) => total + run.fameAccounting.earned, 0) /
      runs.length
  )
  const expectedPerGig = Number(
    (
      runs.reduce(
        (total, run) =>
          total +
          (run.gigsPlayed > 0 ? run.fameAccounting.earned / run.gigsPlayed : 0),
        0
      ) / runs.length
    ).toFixed(2)
  )
  assert.equal(summary.avgFameProgress, expectedProgress)
  assert.equal(summary.avgFameProgressPerGig, expectedPerGig)
})

test('days survived reflects probes and early bankruptcy', () => {
  for (const daysOverride of [20, 30, 40, 75]) {
    const run = runSingleSimulation(probeScenario(daysOverride), 1234)
    assert.equal(run.daysSurvived, daysOverride)
  }

  const bankrupt = runSingleSimulation(
    probeScenario(40, {
      initialOverrides: { player: { money: 0, fame: 0 } }
    }),
    1234
  )
  assert.equal(bankrupt.bankrupt, true)
  assert.ok(bankrupt.daysSurvived < 40)
  assert.equal(
    summarizeScenario([bankrupt]).population.allRuns.daysSurvived.max,
    bankrupt.daysSurvived
  )
})

test('drawdown is consistently expressed as percent', () => {
  assert.equal(calculateDrawdownPct(100, 50), 50)
  assert.equal(calculateDrawdownPct(100, 0), 100)
  assert.equal(calculateDrawdownPct(100, 100), 0)
  assert.equal(calculateDrawdownPct(0, -10), 0)
})

test('execution coverage aggregates without leaking or duplicating IDs', () => {
  const zero = buildExecutionCoverage([{ summary: {} }])
  assert.equal(zero.brandDeals.covered, false)

  const run = runSingleSimulation(
    { ...probeScenario(5), gigGapDays: 1, minigameSkill: 1 },
    9876
  )
  const scenarioCoverage = summarizeScenario([run]).executionCoverage
  const globalCoverage = buildExecutionCoverage([
    { summary: { executionCoverage: scenarioCoverage } },
    { summary: { executionCoverage: scenarioCoverage } }
  ])
  assert.ok(scenarioCoverage.socialTrends.evaluations > 0)
  for (const metric of Object.values(globalCoverage)) {
    const evaluations = metric.evaluations ?? metric.attempts ?? 0
    const activations =
      metric.activations ?? metric.completions ?? metric.successes ?? 0
    assert.ok(activations <= evaluations)
    if (metric.uniqueIdsSeen) {
      assert.equal(
        metric.uniqueIdsSeen.length,
        new Set(metric.uniqueIdsSeen).size
      )
    }
  }
  assert.equal(
    globalCoverage.socialTrends.evaluations,
    scenarioCoverage.socialTrends.evaluations * 2
  )
  assert.deepEqual(buildExecutionCoverage([{ summary: {} }]), zero)
  assert.ok(globalCoverage.minigamesTravel.completions > 0)
  assert.equal('successes' in globalCoverage.minigamesTravel, false)
  assert.ok(
    [
      globalCoverage.minigamesTravel,
      globalCoverage.minigamesRoadie,
      globalCoverage.minigamesKabelsalat,
      globalCoverage.minigamesAmp
    ].some(metric => metric.completions < metric.attempts)
  )
})

test('feature inventory is finite and matches the application snapshot', () => {
  const inventory = buildFeatureInventory()
  for (const value of Object.values(inventory)) {
    assert.ok(Number.isFinite(value) && value >= 0)
  }
  assert.equal(inventory.socialPlatformsAvailable, 4)
  assert.equal(inventory.questsAvailable, 32)
  assert.equal(inventory.assetModulesAvailable, 63)
  assert.deepEqual(Object.keys(LOAN_PROFILES).sort(), [
    'coop',
    'loanShark',
    'longTerm',
    'mediumTerm',
    'shortTerm'
  ])
  assert.equal(
    inventory.loanProfilesAvailable,
    Object.keys(LOAN_PROFILES).length
  )
})

test('generated Markdown contains no undefined or NaN cells', async () => {
  const markdown = await fs.readFile(
    new URL(
      '../../reports/game-balance-simulation-analysis.md',
      import.meta.url
    ),
    'utf8'
  )
  assert.doesNotMatch(markdown, /undefined|NaN/)
})

// ── Design risk corridors ───────────────────────────────────────────────────

// The corridor is layer two of three; it must describe intent *inside* the
// safety envelope. A corridor that reaches past `bankruptcyMax` would let a
// scenario read `within_target` while breaching the hard gate.
test('every design corridor sits inside its scenario safety ceiling', () => {
  for (const [id, target] of Object.entries(RISK_TARGETS)) {
    const [minimumPct, maximumPct] = target.bankruptcyTargetPct
    assert.ok(
      SCENARIOS.some(scenario => scenario.id === id),
      `${id} must be a configured scenario`
    )
    assert.ok(minimumPct < maximumPct, `${id} corridor must be ordered`)
    assert.ok(minimumPct >= 0, `${id} corridor minimum must be non-negative`)
    const safetyMaximumPct = KPI_TARGETS[id]?.bankruptcyMax
    assert.ok(
      Number.isFinite(safetyMaximumPct),
      `${id} needs a safety ceiling to sit under`
    )
    assert.ok(
      maximumPct <= safetyMaximumPct,
      `${id} corridor (${maximumPct}%) must not exceed its safety ceiling (${safetyMaximumPct}%)`
    )
  }
})

test('classifyBankruptcyRisk ranks safety and evidence above the corridor', () => {
  const base = {
    targetRangePct: [15, 30],
    safetyMaximumPct: 60,
    sampleSize: 260
  }

  assert.equal(
    classifyBankruptcyRisk({ ...base, observedPct: 17.31 }),
    'within_target'
  )
  assert.equal(
    classifyBankruptcyRisk({ ...base, observedPct: 0 }),
    'below_target'
  )
  assert.equal(
    classifyBankruptcyRisk({ ...base, observedPct: 45 }),
    'above_target'
  )
  // The safety ceiling outranks the corridor: 70% is above both, and reporting
  // it as merely "above_target" would hide a hard-gate breach.
  assert.equal(
    classifyBankruptcyRisk({ ...base, observedPct: 70 }),
    'above_safety_limit'
  )
  // Missing evidence outranks everything, including the safety verdict.
  assert.equal(
    classifyBankruptcyRisk({
      ...base,
      observedPct: 70,
      sampleSize: RISK_EVIDENCE_MINIMUM_SAMPLE - 1
    }),
    'insufficient_evidence'
  )
  // Boundaries are inclusive on both ends.
  assert.equal(
    classifyBankruptcyRisk({ ...base, observedPct: 15 }),
    'within_target'
  )
  assert.equal(
    classifyBankruptcyRisk({ ...base, observedPct: 30 }),
    'within_target'
  )
  // A scenario without a corridor is not silently judged against one.
  assert.equal(
    classifyBankruptcyRisk({
      ...base,
      targetRangePct: undefined,
      observedPct: 5
    }),
    'not_evaluated'
  )
  assert.equal(
    classifyBankruptcyRisk({ ...base, observedPct: Number.NaN }),
    'not_evaluated'
  )
})

test('describeCorridorConfidence names where the Wilson interval leaves the corridor', () => {
  const targetRangePct = [15, 30]
  const describe = (lowerPct, upperPct) =>
    describeCorridorConfidence({
      confidence95: { lowerPct, upperPct },
      targetRangePct
    })

  assert.equal(describe(16, 29), 'contained')
  // Bootstrap's real shape: point estimate inside the band, interval leaking
  // under the intended minimum. That distinction is the whole reason the
  // interval is reported next to the rate.
  assert.equal(describe(13.19, 22.37), 'straddles_lower')
  assert.equal(describe(20, 35), 'straddles_upper')
  assert.equal(describe(10, 40), 'spans_corridor')
  assert.equal(describe(0.07, 2.15), 'entirely_below')
  assert.equal(describe(40, 55), 'entirely_above')
  assert.equal(
    describeCorridorConfidence({ confidence95: null, targetRangePct }),
    'not_evaluated'
  )
})

test('evaluateScenarioRiskStatus requires calibration and holdout to agree', () => {
  const status = (calibrationStatus, holdoutStatus) =>
    evaluateScenarioRiskStatus({ calibrationStatus, holdoutStatus })

  assert.equal(status('within_target', 'within_target'), 'healthy')
  assert.equal(status('below_target', 'below_target'), 'low_risk')
  assert.equal(status('above_target', 'above_target'), 'high_risk')
  // Disagreement across disjoint seed streams means the scenario sits on a
  // corridor boundary; claiming either label alone would overstate the measurement.
  assert.equal(status('within_target', 'below_target'), 'unstable')
  assert.equal(status('above_safety_limit', 'within_target'), 'unsafe')
  assert.equal(
    status('insufficient_evidence', 'above_safety_limit'),
    'insufficient_evidence'
  )
  assert.equal(status('within_target', 'not_evaluated'), 'not_evaluated')
})

test('buildDesignRiskReview stays non-blocking and warns on a below-target scenario', () => {
  const review = buildDesignRiskReview({
    results: [
      {
        id: 'baseline_touring',
        name: 'Baseline Touring',
        summary: {
          bankruptcy: {
            count: 0,
            sampleSize: 260,
            ratePct: 0,
            confidence95: { lowerPct: 0, upperPct: 1.46, method: 'wilson' }
          }
        }
      },
      // No corridor configured for probes, so they must not appear at all
      // rather than be judged against a corridor that does not exist.
      {
        id: 'late_game_probe',
        name: 'Late Game Probe',
        summary: { bankruptcy: { count: 0, sampleSize: 260, ratePct: 0 } }
      }
    ],
    holdoutScenarios: [
      {
        id: 'baseline_touring',
        holdoutBankruptcy: { count: 0, sampleSize: 260, ratePct: 0 }
      }
    ]
  })

  assert.equal(review.blocking, false)
  assert.deepEqual(
    review.scenarios.map(scenario => scenario.id),
    ['baseline_touring']
  )

  const [scenario] = review.scenarios
  assert.equal(scenario.status, 'low_risk')
  assert.equal(scenario.bankruptcy.status, 'below_target')
  assert.deepEqual(scenario.bankruptcy.targetRangePct, [1, 5])
  assert.equal(
    scenario.bankruptcy.safetyMaximumPct,
    KPI_TARGETS.baseline_touring.bankruptcyMax
  )
  assert.equal(scenario.holdout.riskBandResult, 'stable')
  assert.equal(review.warnings.length, 1)
  assert.match(review.warnings[0], /sicherer als beabsichtigt/)
})

test('buildDesignRiskReview reports an absent holdout instead of assuming agreement', () => {
  const review = buildDesignRiskReview({
    results: [
      {
        id: 'bootstrap_struggle',
        name: 'Bootstrap Struggle',
        summary: {
          bankruptcy: {
            count: 45,
            sampleSize: 260,
            ratePct: 17.31,
            confidence95: { lowerPct: 13.19, upperPct: 22.37, method: 'wilson' }
          }
        }
      }
    ],
    holdoutScenarios: []
  })

  const [scenario] = review.scenarios
  assert.equal(scenario.bankruptcy.status, 'within_target')
  assert.equal(scenario.bankruptcy.corridorConfidence, 'straddles_lower')
  assert.equal(scenario.holdout.status, 'not_evaluated')
  assert.equal(scenario.holdout.riskBandResult, 'not_evaluated')
  // A missing holdout is not agreement, so the composite must not read healthy.
  assert.equal(scenario.status, 'not_evaluated')
  assert.deepEqual(review.warnings, [])
})

test('financial stress profile measures liquidity pressure from a true running minimum', () => {
  const runs = [
    runSingleSimulation(SCENARIOS[1], createScenarioSeed('stress', 0)),
    runSingleSimulation(SCENARIOS[1], createScenarioSeed('stress', 1))
  ]
  const stress = summarizeScenario(runs).financialStress

  assert.equal(stress.thresholds.tightEur, LIQUIDITY_STRESS_THRESHOLDS.tight)
  assert.equal(
    stress.thresholds.criticalEur,
    LIQUIDITY_STRESS_THRESHOLDS.critical
  )

  for (const run of runs) {
    // The gig-anchored `lowestMoney` can never be below the true running
    // minimum; if it were, the stress shares would be sampling the wrong series.
    assert.ok(run.lowestMoneyObserved <= run.lowestMoney)
    assert.ok(run.daysBelowTightLiquidity >= run.daysBelowCriticalLiquidity)
    assert.ok(run.daysBelowTightLiquidity <= run.daysSurvived)
  }

  for (const key of [
    'everBelowTightPct',
    'everBelowCriticalPct',
    'zeroBalancePct',
    'creditOrGrantAssistedPct'
  ]) {
    assert.ok(
      Number.isFinite(stress[key]) && stress[key] >= 0 && stress[key] <= 100,
      `${key} must be a percentage`
    )
  }
  assert.ok(stress.everBelowCriticalPct <= stress.everBelowTightPct)
  assert.ok(
    stress.avgDaysBelowCriticalThreshold <= stress.avgDaysBelowTightThreshold
  )
  assert.ok(stress.p90MaxDrawdownPct >= stress.medianMaxDrawdownPct)

  const expectedTightPct =
    (runs.filter(
      run => run.lowestMoneyObserved < LIQUIDITY_STRESS_THRESHOLDS.tight
    ).length /
      runs.length) *
    100
  assert.equal(stress.everBelowTightPct, Number(expectedTightPct.toFixed(2)))
})

test('committed report carries a non-blocking design risk review', async () => {
  const raw = await fs.readFile(
    new URL(
      '../../reports/game-balance-simulation-results.json',
      import.meta.url
    ),
    'utf8'
  )
  /** @type {unknown} */
  const payload = JSON.parse(raw)
  assert.ok(
    typeof payload === 'object' &&
      payload !== null &&
      Object.hasOwn(payload, 'designRiskReview'),
    'Report must carry designRiskReview; regenerate with pnpm run simulate:balance'
  )
  const review = /** @type {Record<string, unknown>} */ (payload)
    .designRiskReview
  assert.ok(typeof review === 'object' && review !== null)
  assert.equal(/** @type {Record<string, unknown>} */ (review).blocking, false)
  const scenarios = /** @type {Record<string, unknown>} */ (review).scenarios
  assert.ok(Array.isArray(scenarios))
  assert.deepEqual(
    scenarios.map(scenario => scenario.id).sort(),
    Object.keys(RISK_TARGETS).sort(),
    'Every configured corridor must be evaluated in the committed report'
  )
})

// ── Purchase paths and gig economics (Phase 4D / 4E) ────────────────────────

test('catalogue affordability separates reachable items from unaffordable ones', () => {
  const state = createInitialState()

  const broke = summarizeCatalogAffordability({
    ...state,
    player: { ...state.player, money: 0, fame: 0 }
  })
  const rich = summarizeCatalogAffordability({
    ...state,
    player: { ...state.player, money: 10_000_000, fame: 10_000_000 }
  })

  assert.ok(broke.unaffordable > 0, 'A broke player must see blocked items')
  assert.equal(broke.affordable, 0, 'A broke player can afford nothing')
  assert.ok(rich.affordable > 0)
  assert.equal(rich.unaffordable, 0, 'Money is never the blocker when rich')
  // Owned and effect-less items are in neither bucket, so the two counts do not
  // have to sum to the catalogue size — but neither may exceed it.
  assert.ok(rich.affordable >= broke.affordable)
})

test('purchase log records timing, cost and the balance on both sides of a buy', () => {
  const run = runSingleSimulation(
    SCENARIOS[0],
    createScenarioSeed('purchase-path', 0)
  )

  assert.ok(Array.isArray(run.purchaseLog))
  assert.ok(Array.isArray(run.missedPurchases))
  assert.ok(Array.isArray(run.liquidityDeferrals))
  assert.ok(run.purchaseLog.length > 0, 'Baseline touring must buy something')

  for (const entry of run.purchaseLog) {
    assert.ok(
      Number.isInteger(entry.day) &&
        entry.day >= 1 &&
        entry.day <= run.daysSurvived,
      'Every purchase must be dated inside the run'
    )
    assert.ok(Number.isFinite(entry.cost) && entry.cost >= 0)
    assert.ok(['money', 'fame'].includes(entry.currency))
    // Only the paid currency is asserted to move downward. The other one is
    // deliberately not pinned: effects cross currencies in both directions — a
    // money-priced item can grant fame, and a fame-priced one can pay out money
    // — so the currency paid and the stats moved are independent.
    if (entry.currency === 'money') {
      // The recorded pair must bracket the cost, otherwise "remaining
      // liquidity after a purchase" is measuring the wrong moment.
      assert.ok(entry.moneyAfter <= entry.moneyBefore)
    } else {
      assert.ok(entry.fameAfter <= entry.fameBefore)
    }
  }

  for (const entry of run.missedPurchases) {
    assert.ok(Number.isInteger(entry.day))
    assert.ok(['money', 'fame'].includes(entry.currency))
  }

  assert.ok(run.affordabilityAtEnd)
  assert.ok(Number.isInteger(run.affordabilityAtEnd.affordable))
  assert.ok(Number.isInteger(run.affordabilityAtEnd.unaffordable))
})

// A fully specified run with no purchases and no gigs. Aggregation arithmetic is
// tested against these rather than against live simulations: a two-run cohort
// happens to buy only fame-priced items and a sparse-gig scenario can go
// bankrupt before its first gig, which makes live cohorts a poor probe for
// "does the maths divide by the right thing".
const syntheticRun = (overrides = {}) => ({
  bankrupt: false,
  daysSurvived: 10,
  finalMoney: 0,
  finalFame: 0,
  finalHarmony: 50,
  finalControversy: 0,
  gigsPlayed: 0,
  totalGigNet: 0,
  totalTravelCostGigs: 0,
  totalHitWindowSum: 0,
  totalMissesSum: 0,
  totalPerfScoreSum: 0,
  gigScoreLow: 0,
  gigScoreMid: 0,
  gigScoreHigh: 0,
  gigCapHits: 0,
  peakMoney: 0,
  lowestMoney: 0,
  lowestMoneyObserved: 0,
  daysBelowTightLiquidity: 10,
  daysBelowCriticalLiquidity: 10,
  emergencyGrantUsed: false,
  maxPeakToTroughDrop: 0,
  eventsApplied: 0,
  gigEvents: 0,
  startingFame: 0,
  travelSpend: 0,
  repairSpend: 0,
  refuelSpend: 0,
  clinicSpend: 0,
  restStops: 0,
  purchaseLog: [],
  missedPurchases: [],
  liquidityDeferrals: [],
  affordabilityAtMidCheckpoint: null,
  affordabilityAtEnd: { affordable: 0, unaffordable: 0 },
  fameAccounting: {
    earned: 0,
    spentGross: 0,
    refunded: 0,
    spentNet: 0,
    lost: 0,
    clampAdjustment: 0
  },
  timeline: [],
  ...overrides
})

test('purchase path aggregation reports timing, reachability and residual liquidity', () => {
  const paths = summarizeScenario([
    syntheticRun({
      purchaseLog: [
        {
          day: 3,
          id: 'van_a',
          category: 'VAN',
          currency: 'money',
          cost: 900,
          moneyBefore: 2000,
          moneyAfter: 1100,
          fameBefore: 0,
          fameAfter: 0
        },
        {
          day: 6,
          id: 'hq_a',
          category: 'HQ',
          currency: 'money',
          cost: 500,
          moneyBefore: 1500,
          moneyAfter: 1000,
          fameBefore: 0,
          fameAfter: 0
        }
      ],
      missedPurchases: [
        { day: 7, id: 'gear_a', category: 'GEAR', currency: 'money' }
      ],
      liquidityDeferrals: [{ day: 8, id: 'gear_b', category: 'GEAR' }],
      affordabilityAtMidCheckpoint: { affordable: 40, unaffordable: 5 },
      affordabilityAtEnd: { affordable: 50, unaffordable: 2 }
    }),
    // A second run that only reaches the van, so the HQ timing must be the
    // median over reaching runs rather than over the whole cohort.
    syntheticRun({
      purchaseLog: [
        {
          day: 5,
          id: 'van_a',
          category: 'VAN',
          currency: 'fame',
          cost: 100,
          moneyBefore: 800,
          moneyAfter: 800,
          fameBefore: 300,
          fameAfter: 200
        }
      ],
      affordabilityAtMidCheckpoint: { affordable: 30, unaffordable: 15 },
      affordabilityAtEnd: { affordable: 45, unaffordable: 7 }
    })
  ]).purchasePaths

  assert.equal(paths.runsWithAnyPurchasePct, 100)
  assert.equal(paths.firstPurchaseDayMedian, 4) // median of days 3 and 5
  assert.equal(paths.vanUpgradeReachedPct, 100)
  assert.equal(paths.firstVanUpgradeDayMedian, 4)
  assert.equal(paths.hqUpgradeReachedPct, 50)
  assert.equal(
    paths.firstHqUpgradeDayMedian,
    6,
    'Median over reaching runs only'
  )
  assert.equal(paths.avgDistinctItemsPurchased, 1.5)
  assert.equal(paths.modalFirstPurchaseCategory, 'VAN')
  // Only money-priced purchases may enter the money averages; folding a
  // fame purchase in would report an unchanged balance as spent liquidity.
  assert.equal(paths.avgMoneyBeforePurchase, 1750)
  assert.equal(paths.avgResidualMoneyAfterPurchase, 1050)
  assert.equal(paths.avgMissedPurchases, 0.5)
  assert.equal(paths.avgLiquidityDeferrals, 0.5)
  assert.equal(paths.avgUnaffordableAtMidCheckpoint, 10)
  assert.equal(paths.avgUnaffordableAtEnd, 4.5)
})

test('a scenario that never purchases reports null timings instead of zero', () => {
  // Zero would read as "bought on day 0"; null is the honest answer for a
  // cohort with no purchase at all.
  const paths = summarizeScenario([
    syntheticRun({ affordabilityAtEnd: { affordable: 0, unaffordable: 12 } })
  ]).purchasePaths

  assert.equal(paths.firstPurchaseDayMedian, null)
  assert.equal(paths.firstVanUpgradeDayMedian, null)
  assert.equal(paths.firstHqUpgradeDayMedian, null)
  assert.equal(paths.runsWithAnyPurchasePct, 0)
  assert.equal(paths.modalFirstPurchaseCategory, null)
  assert.equal(paths.avgMoneyBeforePurchase, null)
  assert.equal(paths.avgUnaffordableAtMidCheckpoint, null)
  assert.equal(paths.avgUnaffordableAtEnd, 12)
})

test('gig economics separates yield per calendar day from yield per gig', () => {
  const economics = summarizeScenario([
    syntheticRun({
      daysSurvived: 10,
      gigsPlayed: 3,
      totalGigNet: 3000,
      totalTravelCostGigs: 300
    }),
    syntheticRun({
      daysSurvived: 10,
      gigsPlayed: 3,
      totalGigNet: 3000,
      totalTravelCostGigs: 300
    })
  ]).gigEconomics

  // The two rates must not collapse into one another: sparse touring earns more
  // per gig than per calendar day, and that gap is the Gap-1 effect itself.
  assert.equal(economics.gigNetPerCalendarDay, 300)
  assert.equal(economics.gigNetPerGigDay, 1000)
  assert.equal(economics.gigsPerCalendarDay, 0.3)
  assert.equal(economics.travelCostShareOfGigNetPct, 10)
  assert.equal(economics.avgTravelCostPerGigDay, 100)
  assert.ok(economics.gigNetPerGigDay > economics.gigNetPerCalendarDay)
})

test('gig economics reports zero rather than dividing by no gigs', () => {
  // A cohort that went bankrupt before its first gig is a real case; it must not
  // produce NaN or Infinity in a published table.
  const economics = summarizeScenario([
    syntheticRun({ daysSurvived: 4, gigsPlayed: 0 })
  ]).gigEconomics

  for (const value of Object.values(economics)) {
    assert.ok(
      Number.isFinite(value),
      'every gig-economics figure must be finite'
    )
  }
  assert.equal(economics.gigNetPerGigDay, 0)
  assert.equal(economics.catalogItemsUnderOneGigNetPct, 0)
})

test('gig economics measures rest days from the model, which currently never rests', () => {
  // Documented finding, not an aspiration: the rest trigger (harmony < 30 or a
  // member under 30 stamina/mood) never fires under current tuning, so the
  // opportunity cost of a pause is unmeasurable in this model. If tuning ever
  // makes the band rest, this test starts failing and the report text that
  // explains the zero needs revisiting.
  const runs = [
    runSingleSimulation(SCENARIOS[0], createScenarioSeed('rest-probe', 0)),
    runSingleSimulation(SCENARIOS[1], createScenarioSeed('rest-probe', 1))
  ]
  for (const run of runs) assert.equal(run.restStops, 0)

  const economics = summarizeScenario(runs).gigEconomics
  assert.equal(economics.avgRestDays, 0)
  assert.equal(economics.restDaySharePct, 0)
})

test('a non-numeric seed is rejected instead of collapsing to one fixed stream', () => {
  // `seed + 0x6d2b79f5` concatenates for a string, the arithmetic then goes NaN,
  // and every string seed produces the SAME run — two "different" seeds would
  // look like a reproducibility success. Callers must use createScenarioSeed.
  assert.throws(
    () => runSingleSimulation(SCENARIOS[0], 'not-a-number'),
    /Simulation seed must be a finite number/
  )
  assert.throws(() => runSingleSimulation(SCENARIOS[0], undefined), TypeError)
  assert.throws(() => runSingleSimulation(SCENARIOS[0], Number.NaN), TypeError)

  // Distinct numeric seeds must actually diverge.
  const first = runSingleSimulation(
    SCENARIOS[0],
    createScenarioSeed('divergence', 0)
  )
  const second = runSingleSimulation(
    SCENARIOS[0],
    createScenarioSeed('divergence', 1)
  )
  assert.notDeepEqual(
    [first.finalMoney, first.finalFame, first.gigsPlayed],
    [second.finalMoney, second.finalFame, second.gigsPlayed]
  )
})

// ── Decision heuristics ─────────────────────────────────────────────────────

test('the buyer keeps a reserve scaled to running costs, not a flat floor', () => {
  const scenario = probeScenario(10, { gigGapDays: 999 })
  const runs = Array.from({ length: 12 }, (_, index) =>
    runSingleSimulation(scenario, createScenarioSeed('reserve', index))
  )

  for (const run of runs) {
    for (const entry of run.purchaseLog) {
      if (entry.currency !== 'money') continue
      // The old flat €900 floor scaled with nothing: it blocked everything on
      // day 2 and meant nothing by day 8. Whatever the reserve resolves to, a
      // purchase must never leave the buyer with nothing.
      assert.ok(
        entry.moneyAfter >= 0,
        'a purchase must not drive the balance negative'
      )
    }
  }
})

test('a shop visit falls back to something in reach instead of wasting the draw', () => {
  // With one uniform draw over the whole catalogue and no fallback, most visits
  // hit an unaffordable or already-owned item and bought nothing, which is why a
  // full tour ended with about three items owned.
  const runs = Array.from({ length: 12 }, (_, index) =>
    runSingleSimulation(SCENARIOS[0], createScenarioSeed('fallback', index))
  )
  // Structural rather than statistical: on a day where the drawn item failed,
  // the fallback must either have bought something else or found nothing in
  // reach. A bare "bought more than N items" bound would flip on any payout or
  // catalogue change without saying what actually broke.
  let fallbackOpportunities = 0
  let fallbackPurchases = 0
  for (const run of runs) {
    const purchaseDays = new Set(run.purchaseLog.map(entry => entry.day))
    const blockedDays = new Set(
      [...run.missedPurchases, ...run.liquidityDeferrals].map(
        entry => entry.day
      )
    )
    for (const day of blockedDays) {
      fallbackOpportunities += 1
      if (purchaseDays.has(day)) fallbackPurchases += 1
    }
  }
  assert.ok(
    fallbackOpportunities > 0,
    'the cohort must contain days where the drawn item was not bought'
  )
  assert.ok(
    fallbackPurchases > 0,
    'a blocked draw must sometimes still end in a purchase, otherwise the fallback is dead'
  )
  // Purchases must still be dated and paid for, not conjured by the fallback.
  for (const run of runs) {
    for (const entry of run.purchaseLog) {
      assert.ok(entry.day >= 1 && entry.day <= run.daysSurvived)
      assert.ok(entry.cost >= 0)
    }
  }
})

test('rest decision and rest effect read the same threshold', () => {
  // They used to disagree — rest fired below 30, care required below 50 — so a
  // rest day could consume a gig slot, heal nobody and increment no counter.
  // Any rest day must now either treat someone at the clinic or use the free
  // rest stop.
  const runs = Array.from({ length: 20 }, (_, index) =>
    runSingleSimulation(SCENARIOS[0], createScenarioSeed('rest-effect', index))
  )

  for (const run of runs) {
    assert.ok(
      run.restDays >= run.restStops,
      'free rest stops are a subset of rest days'
    )
    if (run.restDays > 0) {
      assert.ok(
        run.restStops > 0 || run.clinicVisits > 0,
        'a rest day must actually do something'
      )
    }
  }
})

test('the rest branch is reachable, and harmony alone never triggers it', () => {
  // An earlier version of this test asserted that wear never reaches the HUD's
  // marks. The full cohorts disprove that: stamina dips to 31 and mood to 42 in
  // some scenarios, and the high-controversy scenario actually rests. What is
  // true and worth pinning is that the branch is live (so it cannot rot back
  // into dead code) and that harmony is not a reason to skip a gig, because
  // resting does not repair it.
  const scenario = SCENARIOS.find(item => item.id === 'high_controversy_probe')
  assert.ok(scenario, 'high_controversy_probe must exist')
  // 60 runs, not 20: rest is rare (about 0.05 days per run) now that pass-through
  // rest stops keep members above the care thresholds, so a small cohort sees
  // zero by chance and the assertion would be flaky rather than wrong.
  const runs = Array.from({ length: 60 }, (_, index) =>
    runSingleSimulation(scenario, createScenarioSeed(scenario.id, index))
  )

  const restDays = runs.reduce((sum, run) => sum + run.restDays, 0)
  assert.ok(
    restDays > 0,
    'the rest decision must still be reachable in at least one scenario'
  )
  for (const run of runs) {
    assert.ok(run.restDays >= run.restStops)
    if (run.restDays > 0) {
      assert.ok(
        run.restStops > 0 || run.clinicVisits > 0,
        'a rest day must actually do something'
      )
    }
  }

  // Harmony reaches values far below any old rest threshold, and the scenario
  // still mostly tours instead of resting — harmony is not a rest reason.
  const lowHarmonyRuns = runs.filter(run => run.minHarmonyObserved < 35)
  assert.ok(lowHarmonyRuns.length > 0, 'harmony must reach low values here')
  assert.ok(
    lowHarmonyRuns.filter(run => run.restDays > 0).length <
      lowHarmonyRuns.length,
    'low harmony must not imply a rest day'
  )

  // Deliberately not asserted: that every rest day is explained by the observed
  // member minima. Those minima are sampled at the start of the day while the
  // rest decision reads the state after the daily tick has taken its -5 stamina,
  // so a member can sit above the threshold at both sampling points and still
  // have been below it at the moment of the decision. The predicate itself is
  // shared between decision and effect in the source, which is the real
  // guarantee; comparing two different sampling points would only look rigorous.
})

// ── Real tour paths (Phase 4F) ──────────────────────────────────────────────

test('tour adjacency only ever points forward, one layer at a time', () => {
  const tourMap = new MapGenerator(
    createScenarioSeed('adjacency', 0)
  ).generateMap(SIMULATION_CONSTANTS.daysPerRun)
  const adjacency = buildTourAdjacency(tourMap)

  assert.ok(adjacency.size > 0)
  for (const [fromId, targets] of adjacency) {
    const from = tourMap.nodes[fromId]
    assert.ok(from, `unknown source node ${fromId}`)
    for (const target of targets) {
      assert.equal(
        target.layer,
        from.layer + 1,
        'a connection must advance exactly one layer'
      )
    }
  }
  // The finale sits one layer past the last generated layer and is terminal.
  const finale = tourMap.nodeList.find(node => node.type === 'FINALE')
  assert.ok(finale)
  assert.equal(finale.layer, SIMULATION_CONSTANTS.daysPerRun)
  assert.equal(adjacency.get(finale.id), undefined)
})

test('route choice prefers a stage over a rest stop but takes what is offered', () => {
  const state = createInitialState()
  const node = (id, type, diff) => ({
    id,
    type,
    layer: 1,
    venue: { id: `venue_${id}`, diff, name: `venues:${id}.name` }
  })
  const rng = () => 0

  const withStage = chooseNextTourNode(
    [node('rest', 'REST_STOP', 2), node('gig', 'GIG', 2)],
    state,
    rng
  )
  assert.equal(
    withStage.id,
    'gig',
    'a playable node wins when one is reachable'
  )

  // The map does not always offer a stage; the band still has to move.
  const onlyStops = chooseNextTourNode(
    [node('rest', 'REST_STOP', 2), node('supply', 'SUPPLY_STOP', 2)],
    state,
    rng
  )
  assert.ok(onlyStops, 'a non-performable node is still a valid destination')
  assert.equal(PERFORMABLE_NODE_TYPES.has(onlyStops.type), false)

  assert.equal(chooseNextTourNode([], state, rng), null)
})

test('travel is independent of the gig cadence', () => {
  // The regression this pins: `shouldPlayGig` used to gate route movement, so a
  // non-performance day ended before any travel. Map reach then measured
  // `gigGapDays` rather than the map, and a sparse cadence looked unable to
  // finish the tour when it had simply never been allowed to drive. Production
  // gates travel on visibility, a directed edge and money/fuel only
  // (`useHandleTravel`), never on having played the current node.
  const cohort = scenario =>
    Array.from({ length: 20 }, (_, index) =>
      runSingleSimulation(scenario, createScenarioSeed('cadence-parity', index))
    )
  const dense = cohort({ ...SCENARIOS[0], gigGapDays: 1 })
  const sparse = cohort({ ...SCENARIOS[0], gigGapDays: 4 })

  const mean = (runs, pick) =>
    runs.reduce((sum, run) => sum + pick(run), 0) / runs.length
  const denseLayers = mean(dense, run => run.deepestLayerReached)
  const sparseLayers = mean(sparse, run => run.deepestLayerReached)
  const denseGigs = mean(dense, run => run.gigsPlayed)
  const sparseGigs = mean(sparse, run => run.gigsPlayed)

  // Same travel policy, so the same depth is reached regardless of cadence.
  assert.ok(
    Math.abs(denseLayers - sparseLayers) < 1.5,
    `layer reach must not track cadence, saw ${denseLayers} vs ${sparseLayers}`
  )
  // The cadence still has to do something: fewer shows at the same reach.
  assert.ok(
    sparseGigs < denseGigs,
    `a sparse cadence must play fewer gigs, saw ${sparseGigs} vs ${denseGigs}`
  )
  // ...but not by halving the driving, which is what the coupling did.
  assert.ok(
    sparseGigs > denseGigs / 2,
    `sparse touring must not collapse to half the gigs, saw ${sparseGigs} vs ${denseGigs}`
  )
})

test('every day is either an explicit rest or a real hop along a directed edge', () => {
  const tourMap = new MapGenerator(createScenarioSeed('edges', 0)).generateMap(
    SIMULATION_CONSTANTS.daysPerRun
  )
  const validEdges = new Set(
    tourMap.connections.map(
      connection => `${connection.from}->${connection.to}`
    )
  )
  assert.ok(validEdges.size > 0)

  const runs = Array.from({ length: 20 }, (_, index) =>
    runSingleSimulation(SCENARIOS[1], createScenarioSeed('no-idle-days', index))
  )

  for (const run of runs) {
    const arrivals = Object.values(run.nodeTypesVisited).reduce(
      (sum, count) => sum + count,
      0
    )
    // No invented cost-only days: every survived day is a rest, an arrival, or
    // the terminal day on which the run ended.
    assert.ok(
      arrivals + run.restDays + run.routeDeadEnds >= run.daysSurvived - 1,
      `idle days found: ${run.daysSurvived} days, ${arrivals} arrivals, ${run.restDays} rests, ${run.routeDeadEnds} dead ends`
    )
    // Travel costs accrue for arrivals, including ones that pay nothing.
    if (arrivals > 0) assert.ok(run.travelSpend > 0)
  }
})

test('reaching the finale and completing it are tracked separately', () => {
  // `finaleCompleted` used to be set on arrival, before the harmony cancellation
  // check, so a cancelled finale counted as a finished tour.
  const runs = Array.from({ length: 30 }, (_, index) =>
    runSingleSimulation(SCENARIOS[0], createScenarioSeed('finale-split', index))
  )
  for (const run of runs) {
    assert.equal(typeof run.finaleReached, 'boolean')
    assert.equal(typeof run.finaleCompleted, 'boolean')
    // Completion implies arrival, never the other way round.
    if (run.finaleCompleted) assert.equal(run.finaleReached, true)
  }
  const paths = summarizeScenario(runs).tourPaths
  assert.ok(paths.finaleCompletedPct <= paths.finaleReachedPct)
})

test('a sparse cadence still reaches the finale', () => {
  // The inverse of the old assertion, which pinned the artifact: a four-day
  // cadence used to be structurally unable to finish the tour.
  const runs = Array.from({ length: 20 }, (_, index) =>
    runSingleSimulation(SCENARIOS[1], createScenarioSeed('sparse-reach', index))
  )
  const reached = runs.filter(run => run.finaleReached).length
  assert.ok(
    reached > runs.length / 2,
    `a sparse cadence must still finish the tour, saw ${reached}/${runs.length}`
  )
})

test('the same seed still reproduces once the map is part of the run', () => {
  // The map is seeded from the run seed, so reproducibility must survive it —
  // otherwise paired experiment deltas would measure map drift.
  const seed = createScenarioSeed('map-reproducibility', 0)
  const first = runSingleSimulation(SCENARIOS[0], seed)
  const second = runSingleSimulation(SCENARIOS[0], seed)

  assert.deepEqual(
    [
      first.finalMoney,
      first.gigsPlayed,
      first.deepestLayerReached,
      first.tourCompleted
    ],
    [
      second.finalMoney,
      second.gigsPlayed,
      second.deepestLayerReached,
      second.tourCompleted
    ]
  )
})

test('tour path aggregation reports reach, arrivals and node mix', () => {
  const runs = Array.from({ length: 8 }, (_, index) =>
    runSingleSimulation(SCENARIOS[0], createScenarioSeed('path-agg', index))
  )
  const paths = summarizeScenario(runs).tourPaths

  assert.equal(paths.tourDepth, SIMULATION_CONSTANTS.daysPerRun)
  assert.ok(paths.finaleReachedPct >= 0 && paths.finaleReachedPct <= 100)
  assert.ok(paths.avgDeepestLayerReached <= paths.tourDepth)
  assert.ok(paths.avgArrivals > 0)
  const shares = Object.values(paths.nodeTypeSharePct)
  assert.ok(shares.length > 0)
  const total = shares.reduce((sum, value) => sum + value, 0)
  assert.ok(
    Math.abs(total - 100) < 0.5,
    `node shares must sum to 100, saw ${total}`
  )
})
