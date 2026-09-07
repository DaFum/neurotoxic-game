/**
 * @fileoverview Test suite for Extraction counterfactual probe (Task 9).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  EXTRACTION_CALIBRATION_NAMESPACE,
  EXTRACTION_HOLDOUT_NAMESPACE,
  runExtractionCounterfactualPair,
  runExtractionProbeCohort
} from '../../scripts/game-balance-expedition-extraction-probe.mjs'
import { generateCohortSeeds } from '../../scripts/game-balance-expedition-runner.mjs'
import { EXPEDITION_BALANCE_PROFILES } from '../../scripts/game-balance-expedition-profiles.mjs'

describe('Extraction Counterfactual Probe (G6 Task 9)', () => {
  it('generates provably disjoint namespaces for extraction calibration and holdout', () => {
    const calSeeds = generateCohortSeeds(EXTRACTION_CALIBRATION_NAMESPACE, 50)
    const holSeeds = generateCohortSeeds(EXTRACTION_HOLDOUT_NAMESPACE, 50)

    assert.equal(calSeeds.length, 50)
    assert.equal(holSeeds.length, 50)

    const calSet = new Set(calSeeds)
    for (const s of holSeeds) {
      assert.equal(
        calSet.has(s),
        false,
        `Seed ${s} overlapped between calibration and holdout`
      )
    }
  })

  it('runs a paired extraction counterfactual where branch A extracts and branch B continues', () => {
    const profile = EXPEDITION_BALANCE_PROFILES[0]
    const seed = 6001

    const result = runExtractionCounterfactualPair(undefined, profile, seed)

    if (result.windowEncountered) {
      assert.ok(result.branchA)
      assert.equal(result.branchA.outcome, 'extracted')
      assert.ok(Number.isFinite(result.branchA.retainedMoney))
      assert.ok(Number.isFinite(result.branchA.retainedFame))

      assert.ok(result.branchB)
      assert.ok(
        ['extracted', 'completed', 'failed'].includes(result.branchB.outcome)
      )
      assert.ok(Number.isFinite(result.deltaMoney))
      assert.ok(Number.isFinite(result.deltaFame))
    }
  })

  it('runs extraction probe cohort across profiles and seeds', () => {
    const profiles = EXPEDITION_BALANCE_PROFILES.slice(0, 2)
    const seeds = generateCohortSeeds(EXTRACTION_CALIBRATION_NAMESPACE, 3)

    const summary = runExtractionProbeCohort(profiles, seeds)

    assert.equal(summary.totalPairsEvaluated, 6)
    assert.ok(Number.isFinite(summary.meanDeltaMoney))
    assert.ok(Number.isFinite(summary.meanDeltaFame))
  })
})
