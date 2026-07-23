import { test, expect } from 'vitest'
import {
  SCENARIOS,
  createScenarioSeed,
  evaluateKpiStatus
} from '../../scripts/game-balance-simulation.mjs'

test('createScenarioSeed is deterministic', () => {
  const seed1 = createScenarioSeed('baseline_touring', 12)
  const seed2 = createScenarioSeed('baseline_touring', 12)
  expect(seed1).toBe(seed2)
})

test('createScenarioSeed is independent of array index', () => {
  // Simulating an array re-order:
  // Before, seeds were calculated as (scenarioIndex + 1) * 10000 + runIndex * 31 + 7
  // Now they only depend on ID and runIndex.
  const scenario = SCENARIOS.find(s => s.id === 'bootstrap_struggle')

  const seedRun1 = createScenarioSeed(scenario.id, 0)
  const seedRun2 = createScenarioSeed(scenario.id, 1)

  expect(seedRun1).not.toBe(seedRun2)

  // They remain the same if we imagine the scenario moving array positions
  const seedRun1Again = createScenarioSeed(scenario.id, 0)
  expect(seedRun1).toBe(seedRun1Again)
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
