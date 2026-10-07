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

  it('HardGate10 treats explicit technical failure as a way out of a dead state', () => {
    const profile = EXPEDITION_BALANCE_PROFILES[0]
    const state = buildProductionSimulationLoadout(undefined, profile, 4242)
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )
    // Every group dead and the van at zero: improvise keeps the groups
    // recoverable, so no crisis is derived and only the explicit technical
    // acceptance is left. That must not read as a softlock.
    const dead = {
      ...state,
      player: { ...state.player, van: { ...state.player.van, condition: 0 } },
      expedition: {
        ...state.expedition,
        technicalCondition: {
          ...state.expedition.technicalCondition,
          pa: 0,
          instruments: 0,
          stageGear: 0
        }
      }
    }
    assert.doesNotThrow(() =>
      verifyHardCorrectnessGates(dead, map, profile, 'step')
    )
  })

  it('accepts technical failure when a dead group has no paid recovery', () => {
    const profile = EXPEDITION_BALANCE_PROFILES[0]
    const base = buildProductionSimulationLoadout(undefined, profile, 4242)
    // No spare part, no cash for the service stop, no insurance and no healthy
    // donor group: only improvise is left, which the policy declines.
    const stranded = {
      ...base,
      // Barely more than the protected Career slice: far below the price of a
      // professional repair.
      player: {
        ...base.player,
        money: base.expedition.protectedCareerCash + 10
      },
      expedition: {
        ...base.expedition,
        insurancePolicyId: null,
        loadout: { ...base.expedition.loadout, insurancePolicyId: null },
        cargo: { ...base.expedition.cargo, spareParts: 0 },
        technicalCondition: {
          ...base.expedition.technicalCondition,
          pa: 0,
          instruments: 0,
          stageGear: 0
        }
      }
    }
    const result = runExpeditionSimulation(stranded, profile, 4242)
    assert.equal(result.outcome, 'failed')
    assert.equal(result.terminalSource, 'technical_shutdown')
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
    assert.ok(Array.isArray(domCheck.corridorFindings))
    assert.ok(Array.isArray(domCheck.dominanceViolations))
    // `ok` describes the blocking half only.
    assert.equal(domCheck.ok, domCheck.dominanceViolations.length === 0)
  })

  it('separates soft corridor findings from a blocking dominance verdict', () => {
    // G6 Task 7 calls the corridors tuneable hypotheses and says dominance
    // blocks only when the same conclusion reproduces in disjoint calibration
    // and holdout. Folding a corridor miss into the blocking set turned a
    // tuning note into a release stopper.
    const summary = over => ({
      completedRate: 0.5,
      extractedRate: 0.5,
      failedRate: 0,
      meanNodes: 8,
      meanMoney: 1000,
      meanDepth: 8,
      meanFame: 100,
      ...over
    })

    // A trivial-completion profile is a corridor finding, never a block.
    const trivial = {
      profileSummaries: {
        a: summary({ completedRate: 1, extractedRate: 0 }),
        b: summary(),
        c: summary()
      }
    }
    const corridorOnly = checkStrategyDominance(trivial, trivial)
    assert.equal(corridorOnly.dominanceViolations.length, 0)
    assert.equal(corridorOnly.ok, true)
    // Reported once per cohort, because the hypothesis is checked against both.
    assert.equal(
      corridorOnly.corridorFindings.filter(f => /completedRate 100\.0%/.test(f))
        .length,
      2
    )

    // A profile strictly better on completion, money and failure in BOTH
    // cohorts blocks.
    const dominated = {
      profileSummaries: {
        a: summary({ completedRate: 0.9, meanMoney: 5000, failedRate: 0 }),
        b: summary({ completedRate: 0.4, meanMoney: 1000, failedRate: 0.2 }),
        c: summary({ completedRate: 0.3, meanMoney: 900, failedRate: 0.3 })
      }
    }
    const blocked = checkStrategyDominance(dominated, dominated)
    assert.equal(blocked.ok, false)
    assert.equal(blocked.dominanceViolations.length, 1)
    assert.match(
      blocked.dominanceViolations[0],
      /^Profile a strictly dominates/
    )

    // The same conclusion in only one cohort does not block.
    const notReproduced = checkStrategyDominance(dominated, trivial)
    assert.equal(notReproduced.ok, true)
    assert.equal(notReproduced.dominanceViolations.length, 0)
  })
})
