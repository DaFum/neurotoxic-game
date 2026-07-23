import { test, expect } from 'vitest'
import {
  createScenarioSeed,
  evaluateKpiStatus,
  getScenarioInsight
} from '../../scripts/game-balance-simulation.mjs'

test('createScenarioSeed is deterministic', () => {
  const seed1 = createScenarioSeed('baseline_touring', 12)
  const seed2 = createScenarioSeed('baseline_touring', 12)
  expect(seed1).toBe(seed2)
})

test('createScenarioSeed is independent of array index and execution order', () => {
  const idsOriginal = ['baseline_touring', 'bootstrap_struggle', 'chaos_tour']
  const idsReversed = [...idsOriginal].reverse()

  const runsToTest = 3

  const seedsOriginal = idsOriginal.map(id => {
    return Array.from({ length: runsToTest }).map((_, runIndex) =>
      createScenarioSeed(id, runIndex)
    )
  })

  const seedsReversed = idsReversed.map(id => {
    return Array.from({ length: runsToTest }).map((_, runIndex) =>
      createScenarioSeed(id, runIndex)
    )
  })

  // The seeds generated for 'baseline_touring' should be identical regardless of when it's processed
  expect(seedsOriginal[0]).toEqual(seedsReversed[2])
  expect(seedsOriginal[1]).toEqual(seedsReversed[1])
  expect(seedsOriginal[2]).toEqual(seedsReversed[0])
})

test('different scenarios generate different seeds for the same run', () => {
  const s1 = createScenarioSeed('scenario_A', 0)
  const s2 = createScenarioSeed('scenario_B', 0)
  expect(s1).not.toBe(s2)
})

test('evaluateKpiStatus correctly maps KPI statuses', () => {
  expect(evaluateKpiStatus(undefined)).toEqual({
    status: 'not_evaluated',
    passed: null
  })
  expect(evaluateKpiStatus([])).toEqual({
    status: 'not_evaluated',
    passed: null
  })
  expect(evaluateKpiStatus([{ pass: true }, { pass: true }])).toEqual({
    status: 'passed',
    passed: true
  })
  expect(evaluateKpiStatus([{ pass: true }, { pass: false }])).toEqual({
    status: 'failed',
    passed: false
  })
})

test('getScenarioInsight correctly identifies untargeted KPI scenarios', () => {
  const summary = {
    bankruptcyRate: 0,
    avgFinalMoney: 5000,
    avgFinalFame: 50,
    avgFinalHarmony: 60,
    kpiStatus: 'not_evaluated',
    kpisPassed: null
  }
  expect(getScenarioInsight(summary)).toBe(
    '⚪ Szenario besitzt keine KPI-Zieldefinition.'
  )
})
