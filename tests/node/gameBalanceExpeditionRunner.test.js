/**
 * @fileoverview Test suite for production-backed Expedition balance simulation runner (Tasks 5-8).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CALIBRATION_COHORT_NAMESPACE,
  HOLDOUT_COHORT_NAMESPACE,
  generateCohortSeeds,
  verifyHardCorrectnessGates,
  evaluateCandidateNode,
  runExpeditionSimulation,
  runExpeditionCohort,
  checkStrategyDominance
} from '../../scripts/game-balance-expedition-runner.mjs'
import {
  EXPEDITION_BALANCE_PROFILES,
  buildProductionSimulationLoadout
} from '../../scripts/game-balance-expedition-profiles.mjs'
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'

describe('Expedition Balance Runner (G6 Tasks 5-8)', () => {
  it('generates provably disjoint seeds between calibration and holdout cohorts', () => {
    const calSeeds = generateCohortSeeds(CALIBRATION_COHORT_NAMESPACE, 100)
    const holSeeds = generateCohortSeeds(HOLDOUT_COHORT_NAMESPACE, 100)

    assert.equal(calSeeds.length, 100)
    assert.equal(holSeeds.length, 100)

    const calSet = new Set(calSeeds)
    const holSet = new Set(holSeeds)
    assert.equal(calSet.size, 100)
    assert.equal(holSet.size, 100)

    // Verify all seeds are valid non-negative integers
    for (const s of calSeeds) {
      assert.ok(Number.isInteger(s) && s >= 0)
    }

    // Verify disjointness
    for (const s of holSeeds) {
      assert.equal(
        calSet.has(s),
        false,
        `Seed ${s} leaked into both calibration and holdout`
      )
    }

    // Verify reproducibility
    const calAgain = generateCohortSeeds(CALIBRATION_COHORT_NAMESPACE, 100)
    assert.deepEqual(calAgain, calSeeds)
  })

  it('enforces hard correctness gates and catches breaches', () => {
    const profile = EXPEDITION_BALANCE_PROFILES[0]
    const state = buildProductionSimulationLoadout(undefined, profile, 4242)
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )

    // Valid state should pass
    assert.doesNotThrow(() => {
      verifyHardCorrectnessGates(state, map, profile, 'init')
    })

    // Breached protected cash should throw HardGate5
    const breachedCashState = {
      ...state,
      player: {
        ...state.player,
        money: -100
      }
    }
    assert.throws(
      () => verifyHardCorrectnessGates(breachedCashState, map, profile, 'step'),
      /HardGate5/
    )

    // Disconnected route should throw HardGate3
    const brokenMap = {
      ...map,
      connections: map.connections.filter(edge => edge.to !== map.finaleNodeId)
    }
    assert.throws(
      () => verifyHardCorrectnessGates(state, brokenMap, profile, 'init'),
      /HardGate3/
    )
  })

  it('evaluates candidate nodes with profile-specific decision policies', () => {
    const cleanProfile = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'clean_sponsor'
    )
    const heatProfile = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'underground_heat'
    )
    assert.ok(cleanProfile && heatProfile)

    const state = buildProductionSimulationLoadout(undefined, cleanProfile, 100)
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )

    // Compare scores for candidate nodes
    const candidateEdges = map.connections.filter(
      e => e.from === map.startNodeId
    )
    assert.ok(candidateEdges.length > 0)
    const candId = candidateEdges[0].to

    const scoreClean = evaluateCandidateNode(candId, state, cleanProfile, map)
    const scoreHeat = evaluateCandidateNode(candId, state, heatProfile, map)

    assert.ok(Number.isFinite(scoreClean))
    assert.ok(Number.isFinite(scoreHeat))
    // Finale should always score 1000
    assert.equal(
      evaluateCandidateNode(map.finaleNodeId, state, cleanProfile, map),
      1000
    )
  })

  it('runs full production simulations across all 6 mature profiles', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      const seed = 5001
      const result = runExpeditionSimulation(undefined, profile, seed)

      assert.ok(['extracted', 'completed', 'failed'].includes(result.outcome))
      assert.ok(
        typeof result.terminalSource === 'string' &&
          result.terminalSource.length > 0
      )
      assert.ok(result.telemetry.meaningfulNodesVisited >= 1)
      assert.ok(result.telemetry.routeDepth >= 1)
      assert.ok(Number.isFinite(result.telemetry.minFuel))
      assert.ok(Number.isFinite(result.telemetry.minVanCondition))
      assert.ok(Number.isFinite(result.telemetry.minTechnicalCondition))
      assert.ok(Number.isFinite(result.telemetry.retainedMoney))
      assert.ok(Number.isFinite(result.telemetry.retainedFame))
      assert.equal(result.telemetry.profileId, profile.id)
      assert.equal(result.telemetry.seed, seed)

      // Verify that final state terminal status matches
      assert.equal(result.finalState.expedition.status, result.outcome)
    }
  })

  it('runs a cohort batch and checks strategy dominance', () => {
    const profiles = EXPEDITION_BALANCE_PROFILES.slice(0, 3)
    const calSeeds = generateCohortSeeds(CALIBRATION_COHORT_NAMESPACE, 3)
    const holSeeds = generateCohortSeeds(HOLDOUT_COHORT_NAMESPACE, 3)

    const calBatch = runExpeditionCohort(profiles, calSeeds)
    const holBatch = runExpeditionCohort(profiles, holSeeds)

    assert.equal(calBatch.totalRuns, 9)
    assert.equal(holBatch.totalRuns, 9)

    for (const p of profiles) {
      assert.ok(calBatch.profileSummaries[p.id])
      assert.ok(holBatch.profileSummaries[p.id])
      const s = calBatch.profileSummaries[p.id]
      assert.equal(s.completedRate + s.extractedRate + s.failedRate, 1)
      assert.ok(s.meanNodes > 0)
    }

    const domCheck = checkStrategyDominance(calBatch, holBatch)
    assert.ok(typeof domCheck.ok === 'boolean')
  })
})
