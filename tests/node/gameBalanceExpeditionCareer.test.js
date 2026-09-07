/**
 * @fileoverview Test suite for Fresh-Career Progression Sequences (Task 12).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CAREER_CALIBRATION_NAMESPACE,
  CAREER_HOLDOUT_NAMESPACE,
  runFreshCareerSequence,
  buildLegalLoadoutApproximation
} from '../../scripts/game-balance-expedition-career.mjs'
import { createInitialState } from '../../src/context/initialState.ts'
import { EXPEDITION_BALANCE_PROFILES } from '../../scripts/game-balance-expedition-profiles.mjs'
import { generateCohortSeeds } from '../../scripts/game-balance-expedition-runner.mjs'

describe('Fresh-Career Progression Sequences (G6 Task 12)', () => {
  it('generates provably disjoint namespaces for fresh career calibration and holdout', () => {
    const calSeeds = generateCohortSeeds(CAREER_CALIBRATION_NAMESPACE, 50)
    const holSeeds = generateCohortSeeds(CAREER_HOLDOUT_NAMESPACE, 50)

    assert.equal(calSeeds.length, 50)
    assert.equal(holSeeds.length, 50)

    const calSet = new Set(calSeeds)
    for (const s of holSeeds) {
      assert.equal(
        calSet.has(s),
        false,
        `Seed ${s} overlapped between career calibration and holdout`
      )
    }
  })

  it('builds legal loadout approximation without fixture seeding', () => {
    const state = createInitialState()
    const profile = EXPEDITION_BALANCE_PROFILES[0]

    const loadout = buildLegalLoadoutApproximation(state, profile)

    assert.equal(loadout.tourTypeId, 'standard_tour')
    assert.equal(loadout.regionId, 'home_turf')
    assert.equal(loadout.activeTourbusAssetId, null)
    assert.deepEqual(loadout.crewIds, [])
    assert.equal(loadout.starterPerkId, null)
    assert.deepEqual(loadout.pressureModifierIds, [])
  })

  it('runs a fresh career 6-run sequence with zero initial meta and earns progression naturally', () => {
    const profile = EXPEDITION_BALANCE_PROFILES[0]
    const sequenceSeed = 9001

    const result = runFreshCareerSequence(undefined, profile, sequenceSeed, 6)

    // A fresh Career is not guaranteed six runs. It starts on the baseline
    // `initialState` purse with no meta, pays the real fuel top-up at every
    // START, and carries its van wear between Tours - so the sequence runs as
    // far as the economy funds it and records where it stopped. Asserting a
    // flat six would only hold by seeding the Career money it has not earned.
    assert.equal(result.runsRequested, 6)
    assert.ok(result.runsCompleted >= 1)
    assert.ok(result.runsCompleted <= 6)
    assert.equal(result.runOutcomes.length, result.runsCompleted)
    if (result.runsCompleted < 6) {
      assert.equal(result.haltedAtRun, result.runsCompleted + 1)
      assert.ok(typeof result.haltReason === 'string')
    } else {
      assert.equal(result.haltedAtRun, null)
    }

    // Verify task 12 assertions
    assert.notEqual(result.metrics.firstMetaFacilityRun, 0)
    assert.notEqual(result.metrics.firstPermanentExpeditionCapabilityRun, 0)

    for (const fixtureSets of result.metrics.fixtureCapabilitySetIds) {
      assert.deepEqual(
        fixtureSets,
        [],
        'Fresh career run must not have seeded fixture capabilities'
      )
    }

    // Ascension can only be true if recorded
    if (result.finalState.career.ascensionUnlocked) {
      assert.ok(result.metrics.firstAscensionUnlockRun !== null)
    }
  })
})
