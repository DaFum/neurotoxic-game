import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { LOAN_PROFILES } from '../../src/utils/loanProfiles.js'
import { createInitialState } from '../../src/context/initialState.js'
import { getUnifiedUpgradeCatalog } from '../../src/data/upgradeCatalog.js'

import {
  REGRESSION_METRICS,
  SCENARIOS,
  accountFameChange,
  accountFamePurchase,
  applyCatalogPurchase,
  buildExecutionCoverage,
  buildFeatureInventory,
  calculateDrawdownPct,
  reconcileFameLedger,
  runSingleSimulation,
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
