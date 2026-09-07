/**
 * @fileoverview Test suite for Hybrid-Fog Counterfactual Probe (Task 11).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  FOG_CALIBRATION_NAMESPACE,
  FOG_HOLDOUT_NAMESPACE,
  FOG_REPUTATION_CALIBRATION_NAMESPACE,
  FOG_REPUTATION_HOLDOUT_NAMESPACE,
  FOG_INTEL_SOURCES,
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
      assert.ok(pair.branchA)
      assert.ok(pair.branchB)

      // Branch purity: the masked branch holds no intel on any candidate, and
      // exactly one legal recon charge separates it from the informed one.
      for (const level of Object.values(pair.intelLevelsA)) {
        assert.equal(level, 0)
      }
      assert.equal(pair.revealedNodeIds.length, 1)
      assert.equal(
        Object.values(pair.intelLevelsB).filter(level => level >= 1).length,
        1
      )

      // Reported fields must come from the production projection. Level 1
      // exposes payout/wear/rare; `exactDanger` is not a field the Fog has.
      assert.equal(pair.inspectedFieldsA.includes('exactPayout'), false)
      assert.ok(pair.inspectedFieldsB.includes('exactPayout'))
      assert.ok(pair.inspectedFieldsB.includes('exactWearCost'))
      for (const fields of [pair.inspectedFieldsA, pair.inspectedFieldsB]) {
        assert.equal(fields.includes('exactDanger'), false)
      }
    }
  })

  it('keeps the reputation cohort disjoint from the Scout cohort', () => {
    assert.deepEqual(FOG_INTEL_SOURCES, ['scout_recon', 'reputation'])
    const calSeeds = generateCohortSeeds(
      FOG_REPUTATION_CALIBRATION_NAMESPACE,
      50
    )
    const holSeeds = generateCohortSeeds(FOG_REPUTATION_HOLDOUT_NAMESPACE, 50)
    const scoutSeeds = new Set(
      generateCohortSeeds(FOG_CALIBRATION_NAMESPACE, 50)
    )
    const calSet = new Set(calSeeds)
    for (const seed of holSeeds) {
      assert.equal(calSet.has(seed), false)
    }
    for (const seed of calSeeds) {
      assert.equal(scoutSeeds.has(seed), false)
    }
  })

  it('runs a reputation counterfactual across the G5 familiarity threshold', () => {
    const profile = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'scout_intel'
    )
    assert.ok(profile)

    const pair = runFogCounterfactualPair(
      undefined,
      profile,
      8001,
      'reputation'
    )
    assert.equal(pair.source, 'reputation')
    if (pair.matchedDecisionFound) {
      // Crossing the threshold must grant the bounded level-1 read somewhere
      // on the forward route, even when it does not land on a candidate.
      assert.ok(pair.revealUsed)
      assert.ok(pair.revealedNodeIds.length > 0)
      assert.ok(pair.revealedCandidateIds.length <= pair.revealedNodeIds.length)
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

    // Task 11's blocking fidelity failure is the policy never consuming a
    // reveal it was actually shown. Recorded per source so the report can
    // state it rather than imply it.
    assert.ok(cohort.revealUsedCount > 0)
    assert.ok(Number.isFinite(cohort.revealUsedRouteUnchangedRate))
    assert.ok(
      cohort.revealAtDecisionCount === 0 ||
        cohort.revealUsedRouteUnchangedRate < 1,
      'the route policy never consumed a reveal it was shown at the decision point'
    )
  })
})
