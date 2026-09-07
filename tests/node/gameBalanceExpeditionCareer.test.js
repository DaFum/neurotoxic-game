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
import { getAvailableCrewIds } from '../../src/domain/expedition/loadout.ts'
import { getExpeditionOwnedPerformanceGear } from '../../src/domain/expedition/equipment.ts'
import { EXPEDITION_CREW } from '../../src/data/expedition/crew.ts'
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

    // Gated axes fall back, because a fresh Career owns none of them.
    assert.equal(loadout.tourTypeId, 'standard_tour')
    assert.equal(loadout.regionId, 'home_turf')
    assert.equal(loadout.activeTourbusAssetId, null)
    assert.equal(loadout.starterPerkId, null)
    assert.deepEqual(loadout.pressureModifierIds, [])
    assert.deepEqual(loadout.build.selectedTourbusModuleIds, [])

    // Ungated axes take the persona's real choices. Returning a flat empty
    // build here made every sequence measure one generic baseline instead of
    // the six personas.
    const available = new Set(getAvailableCrewIds(state))
    assert.ok(loadout.crewIds.length > 0)
    assert.ok(loadout.crewIds.length <= 3)
    for (const crewId of loadout.crewIds) {
      assert.ok(available.has(crewId), `${crewId} is not currently available`)
    }
    // Chosen by the persona's declared role order.
    const roleOf = crewId =>
      EXPEDITION_CREW.find(crew => crew.id === crewId)?.role
    const chosenRoles = loadout.crewIds.map(roleOf)
    const expectedRoles = profile.crewRoleOrder.filter(role =>
      chosenRoles.includes(role)
    )
    assert.deepEqual(chosenRoles, expectedRoles)

    assert.ok(loadout.nativeContracts.length <= 2)
    for (const entry of loadout.nativeContracts) {
      assert.ok(
        profile.nativeContractPreferenceIds.includes(entry.templateId),
        `${entry.templateId} is not one of the persona's preferences`
      )
    }
  })

  it('never commits gear, modules or a chassis the fresh Career does not own', () => {
    const state = createInitialState()
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      const loadout = buildLegalLoadoutApproximation(state, profile)
      const owned = new Set(getExpeditionOwnedPerformanceGear(state))
      for (const itemId of loadout.build.equipment.selectedGearItemIds) {
        assert.ok(owned.has(itemId), `${itemId} was fixture-seeded`)
      }
      // No chassis owned means no chassis committed, and therefore no modules.
      assert.equal(loadout.activeTourbusAssetId, null)
      assert.deepEqual(loadout.build.selectedTourbusModuleIds, [])
    }
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
    // `notEqual(x, 0)` passed for every value this helper can produce - it
    // assigns `runIdx`, which starts at 1, or leaves `null`. These check the
    // real contract: a recorded run index falls inside the sequence.
    for (const run of [
      result.metrics.firstMetaFacilityRun,
      result.metrics.firstPermanentExpeditionCapabilityRun
    ]) {
      if (run === null) continue
      assert.ok(Number.isInteger(run))
      assert.ok(run >= 1 && run <= result.runsCompleted)
    }

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

  it('records the Task 12 progression observables from real Career state', () => {
    // `signatureTraitUnlockRun` was declared and never written, and there was
    // no recovery-debt or Nemesis metric at all, so the report claimed
    // progression evidence it had not collected.
    const result = runFreshCareerSequence(
      undefined,
      EXPEDITION_BALANCE_PROFILES[0],
      9001,
      6
    )
    const metrics = result.metrics

    // A `x === null || Number.isInteger(x)` check passes for anything, so it
    // proved nothing. These assert the metric's actual contract instead: a run
    // index is within the sequence, and it is set exactly when the underlying
    // Career state says so.
    const anyTrait = Object.values(
      result.finalState.career.crewById ?? {}
    ).some(crew => crew?.signatureTraitId)
    if (metrics.signatureTraitUnlockRun === null) {
      assert.equal(
        anyTrait,
        false,
        'no unlock run recorded while a signature trait is owned'
      )
    } else {
      assert.equal(anyTrait, true)
      assert.ok(metrics.signatureTraitUnlockRun >= 1)
      assert.ok(metrics.signatureTraitUnlockRun <= result.runsCompleted)
    }

    // Same contract for the legacy Expedition-affecting HQ path.
    if (metrics.firstLegacyExpeditionAffectingHqPurchaseRun === null) {
      assert.equal(metrics.run1LegacyExpeditionAffectingHqPurchaseRate, false)
    } else {
      assert.ok(metrics.firstLegacyExpeditionAffectingHqPurchaseRun >= 1)
      assert.equal(
        metrics.run1LegacyExpeditionAffectingHqPurchaseRate,
        metrics.firstLegacyExpeditionAffectingHqPurchaseRun === 1
      )
    }
    assert.ok(Array.isArray(metrics.crewRecoveryDebtDurations))
    for (const entry of metrics.crewRecoveryDebtDurations) {
      assert.equal(typeof entry.crewId, 'string')
      assert.ok(entry.tours >= 0)
      assert.equal(entry.tours, entry.clearedAtRun - entry.openedAtRun)
    }

    // Rival identity is observed per run, so a Career that meets the same
    // Rival twice is distinguishable from one that is handed a fresh id.
    assert.ok(Array.isArray(metrics.rivalIdsByRun))
    assert.equal(metrics.rivalIdsByRun.length <= result.runsCompleted, true)
    assert.ok(
      metrics.sameRivalReturnRate >= 0 && metrics.sameRivalReturnRate <= 1
    )
    assert.ok(Number.isInteger(metrics.maxNemesisLevel))
    assert.ok(Array.isArray(metrics.nemesisLevelAdvancedRuns))
    // The rate is derived from the recorded ids, so it has to agree with them.
    const ids = metrics.rivalIdsByRun
    const expectedRate =
      ids.length > 1
        ? ids.slice(1).filter(id => id === ids[0]).length / (ids.length - 1)
        : 0
    assert.equal(metrics.sameRivalReturnRate, expectedRate)
    for (const entry of metrics.nemesisLevelAdvancedRuns) {
      assert.ok(entry.run >= 1 && entry.run <= result.runsCompleted)
      assert.ok(entry.level > 0 && entry.level <= metrics.maxNemesisLevel)
    }
  })
})
