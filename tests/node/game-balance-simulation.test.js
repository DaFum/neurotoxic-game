import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

import {
  REGRESSION_METRICS,
  SCENARIOS,
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
  assert.ok(Math.abs(reconcileFameLedger(run)) < 1e-9)
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
    const activations = metric.activations ?? metric.successes ?? 0
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
})

test('feature inventory is finite and matches the application snapshot', () => {
  const inventory = buildFeatureInventory()
  for (const value of Object.values(inventory)) {
    assert.ok(Number.isFinite(value) && value >= 0)
  }
  assert.equal(inventory.socialPlatformsAvailable, 4)
  assert.equal(inventory.questsAvailable, 32)
  assert.equal(inventory.assetModulesAvailable, 63)
  assert.equal(inventory.loanProfilesAvailable, 5)
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
