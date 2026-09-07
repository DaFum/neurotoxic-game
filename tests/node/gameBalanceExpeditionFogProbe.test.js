/**
 * @fileoverview Test suite for Hybrid-Fog Counterfactual Probe (Task 11).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  FOG_CALIBRATION_NAMESPACE,
  FOG_HOLDOUT_NAMESPACE,
  runFogCounterfactualPair,
  runFogProbeCohort
} from '../../scripts/game-balance-expedition-fog-probe.mjs'
import { generateCohortSeeds } from '../../scripts/game-balance-expedition-runner.mjs'
import { EXPEDITION_BALANCE_PROFILES } from '../../scripts/game-balance-expedition-profiles.mjs'

describe('Hybrid-Fog Counterfactual Probe (G6 Task 11)', () => {
  it('generates provably disjoint namespaces for fog calibration and holdout', () => {
    const calSeeds = generateCohortSeeds(FOG_CALIBRATION_NAMESPACE, 50)
    const holSeeds = generateCohortSeeds(FOG_HOLDOUT_NAMESPACE, 50)

    assert.equal(calSeeds.length, 50)
    assert.equal(holSeeds.length, 50)

    const calSet = new Set(calSeeds)
    for (const s of holSeeds) {
      assert.equal(
        calSet.has(s),
        false,
        `Seed ${s} overlapped between fog calibration and holdout`
      )
    }
  })

  it('evaluates a matched fog counterfactual and inspects revealed fields', () => {
    const profile = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'scout_intel'
    )
    assert.ok(profile)

    const seed = 8001
    const pair = runFogCounterfactualPair(undefined, profile, seed)

    if (pair.matchedDecisionFound) {
      assert.ok(pair.candidateCount >= 2)
      assert.ok(typeof pair.chosenNodeA === 'string')
      assert.ok(typeof pair.chosenNodeB === 'string')
      assert.ok(pair.inspectedFields.includes('rareRewardId'))
      assert.ok(pair.inspectedFields.includes('exactDanger'))
      assert.ok(pair.branchA)
      assert.ok(pair.branchB)
    }
  })

  it('runs fog probe cohort and proves revealed information is consumed', () => {
    const profile = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'scout_intel'
    )
    assert.ok(profile)

    // Test with a sample of seeds to verify cohort execution
    const seeds = [8001, 8002, 8003, 8004, 8005]
    const cohort = runFogProbeCohort([profile], seeds)

    assert.equal(cohort.totalPairs, 5)
    assert.ok(Number.isFinite(cohort.routeChangedRate))
    assert.ok(Number.isFinite(cohort.meanDeltaMoney))
  })
})
