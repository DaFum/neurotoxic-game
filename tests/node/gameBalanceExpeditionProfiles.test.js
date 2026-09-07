/**
 * @fileoverview Tests for Expedition balance profiles and schema validation (G6 Tasks 1-3).
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EXPEDITION_BALANCE_PROFILES,
  EXPEDITION_BALANCE_PROFILE_IDS,
  EXPEDITION_TERMINAL_OUTCOMES,
  EXPEDITION_BALANCE_NAMESPACE,
  validateExpeditionBalanceProfile,
  toCanonicalTourTypeId,
  toCanonicalRegionId,
  buildProductionSimulationLoadout,
  MATURE_FIXTURE_VERSION
} from '../../scripts/game-balance-expedition-profiles.mjs'
import { getExpeditionChassisArchetype } from '../../src/domain/expedition/chassis.ts'
import { EXPEDITION_TOUR_TYPES } from '../../src/data/expedition/tourTypes.ts'
import { EXPEDITION_REGIONS } from '../../src/data/expedition/regions.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { isCrewAvailable } from '../../src/domain/expedition/crew.ts'
import { EXPEDITION_CREW_BY_ID } from '../../src/data/expedition/crew.ts'

describe('Expedition Balance Profiles (G6 Tasks 1-3)', () => {
  it('defines the v15 namespace and terminal outcomes without historical day horizon', () => {
    assert.equal(EXPEDITION_BALANCE_NAMESPACE, '#roguelite-expedition-v1')
    assert.deepEqual(EXPEDITION_TERMINAL_OUTCOMES, [
      'extracted',
      'completed',
      'failed'
    ])
  })

  it('instantiates exactly six mature-build strategy profiles', () => {
    assert.equal(EXPEDITION_BALANCE_PROFILES.length, 6)
    assert.deepEqual(EXPEDITION_BALANCE_PROFILE_IDS, [
      'clean_sponsor',
      'underground_heat',
      'diy_repair',
      'scout_intel',
      'high_exposure_performance',
      'rival_hunter'
    ])
  })

  it('validates every profile against the schema without hidden fallbacks', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      assert.doesNotThrow(
        () => validateExpeditionBalanceProfile(profile),
        `Profile ${profile.id} failed validation`
      )
    }
  })

  it('verifies that every requiresAscension profile declares >= 3 capability-set prerequisites', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      if (profile.requiresAscension) {
        assert.ok(
          profile.requiredCapabilitySetIds.length >= 3,
          `Profile ${profile.id} requiresAscension but declares only ${profile.requiredCapabilitySetIds.length} capability sets (must be >= 3)`
        )
      }
    }
  })

  it('verifies chassis archetype mapping matches production getExpeditionChassisArchetype', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      const derivedArchetype = getExpeditionChassisArchetype({
        chassisFlavor: profile.chassisSpec.flavor,
        chassisTier: profile.chassisSpec.tier
      })
      assert.equal(
        derivedArchetype,
        profile.chassisSpec.expectedArchetype,
        `Profile ${profile.id} archetype mismatch: expected ${profile.chassisSpec.expectedArchetype}, got ${derivedArchetype}`
      )
    }
  })

  it('validates capability provenance for crew roles: Manager needs industry_network, Security needs underground_network', () => {
    const scoutIntel = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'scout_intel'
    )
    assert.ok(scoutIntel)
    assert.ok(
      scoutIntel.requiredCapabilitySetIds.includes('industry_network'),
      'scout_intel must declare industry_network because Manager is gated'
    )

    const rivalHunter = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'rival_hunter'
    )
    assert.ok(rivalHunter)
    assert.ok(
      rivalHunter.requiredCapabilitySetIds.includes('underground_network'),
      'rival_hunter must declare underground_network because Security is gated'
    )

    // Test with real crew availability check
    const managerCrew = Object.values(EXPEDITION_CREW_BY_ID).find(
      c => c.role === 'manager'
    )
    assert.ok(managerCrew, 'manager crew must exist')

    const securityCrew = Object.values(EXPEDITION_CREW_BY_ID).find(
      c => c.role === 'security'
    )
    assert.ok(securityCrew, 'security crew must exist')

    const stateWithoutCapabilities = createInitialState()
    assert.equal(
      isCrewAvailable(stateWithoutCapabilities, managerCrew.id),
      false
    )
    assert.equal(
      isCrewAvailable(stateWithoutCapabilities, securityCrew.id),
      false
    )

    const stateWithIndustry = {
      ...stateWithoutCapabilities,
      career: {
        ...stateWithoutCapabilities.career,
        unlockedSetIds: ['industry_network']
      }
    }
    assert.equal(isCrewAvailable(stateWithIndustry, managerCrew.id), true)

    const stateWithUnderground = {
      ...stateWithoutCapabilities,
      career: {
        ...stateWithoutCapabilities.career,
        unlockedSetIds: ['underground_network']
      }
    }
    assert.equal(isCrewAvailable(stateWithUnderground, securityCrew.id), true)
  })

  it('validates coach chassis capability provenance: tier 2 legit requires chassis_network', () => {
    const cleanSponsor = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'clean_sponsor'
    )
    assert.ok(cleanSponsor.requiredCapabilitySetIds.includes('chassis_network'))

    const highExposure = EXPEDITION_BALANCE_PROFILES.find(
      p => p.id === 'high_exposure_performance'
    )
    assert.ok(highExposure.requiredCapabilitySetIds.includes('chassis_network'))
  })

  it('maps profile tour and region identifiers to canonical production definitions', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      const canonicalTour = toCanonicalTourTypeId(profile.tourTypeId)
      assert.ok(
        Object.hasOwn(EXPEDITION_TOUR_TYPES, canonicalTour),
        `canonical tour ${canonicalTour} for profile ${profile.id} not found in EXPEDITION_TOUR_TYPES`
      )
      const tourDef = EXPEDITION_TOUR_TYPES[canonicalTour]
      assert.ok(tourDef.depth > 0, `Tour ${canonicalTour} depth must be > 0`)
      assert.ok(
        Array.isArray(tourDef.extractionWindowRange) &&
          tourDef.extractionWindowRange.length === 2,
        `Tour ${canonicalTour} must define extractionWindowRange`
      )

      const canonicalRegion = toCanonicalRegionId(profile.regionId)
      assert.ok(
        Object.hasOwn(EXPEDITION_REGIONS, canonicalRegion),
        `canonical region ${canonicalRegion} for profile ${profile.id} not found in EXPEDITION_REGIONS`
      )
    }
  })

  it('rejects an invalid profile with missing required properties or illegal ascension setup', () => {
    const invalidProfile = {
      id: 'bad_ascension',
      tourTypeId: 'standard',
      regionId: 'home',
      chassisSpec: { flavor: 'legit', tier: 1, expectedArchetype: 'compact' },
      requiredModuleIds: [],
      crewRoleOrder: ['scout'],
      starterPerkId: null,
      insurancePolicyId: null,
      pressureModifierIds: [],
      nativeContractPreferenceIds: [],
      sponsorPolicy: 'none',
      cargoPolicy: 'safe',
      setlistPolicy: 'balanced_four',
      equipmentPolicy: 'current_selection',
      startingFuelTarget: 80,
      protectedCashRatio: 0.35,
      requiredCapabilitySetIds: ['industry_network'], // only 1 set!
      requiresAscension: true,
      decisionPolicy: 'safe_value',
      matureFixture: {
        version: MATURE_FIXTURE_VERSION,
        money: 500000,
        fame: 150,
        memberSkills: { tech: 5, technical: 5, charisma: 5 },
        vanUpgrades: [],
        startingVanFuel: 70
      }
    }

    assert.throws(
      () => validateExpeditionBalanceProfile(invalidProfile),
      /requiresAscension must declare >= 3 capability sets/
    )
  })

  it('rejects a profile that leaves mature fixture inputs undeclared', () => {
    // G6 Task 2 forbids hidden Cash/Fame/skill/equipment defaults. A profile
    // without the block would send the builder back to its own constants,
    // which is what made two runs of one profile irreproducible from the
    // profile alone.
    const base = EXPEDITION_BALANCE_PROFILES[0]
    const withoutFixture = { ...base }
    delete withoutFixture.matureFixture
    assert.throws(
      () => validateExpeditionBalanceProfile(withoutFixture),
      /missing matureFixture/
    )

    assert.throws(
      () =>
        validateExpeditionBalanceProfile({
          ...base,
          matureFixture: { ...base.matureFixture, version: 999 }
        }),
      /matureFixture\.version 999 is not the supported/
    )

    assert.throws(
      () =>
        validateExpeditionBalanceProfile({
          ...base,
          matureFixture: { ...base.matureFixture, money: Number.NaN }
        }),
      /matureFixture\.money must be a non-negative finite number/
    )
  })

  it('declares the mature fixture on every shipped profile', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      assert.equal(profile.matureFixture.version, MATURE_FIXTURE_VERSION)
      assert.ok(profile.matureFixture.money >= 0)
      assert.ok(Array.isArray(profile.matureFixture.vanUpgrades))
      // Fuel is one of the inputs Task 2 forbids defaulting, and it has to
      // leave room for the build's own top-up to be a real charge.
      assert.ok(
        profile.matureFixture.startingVanFuel <= profile.startingFuelTarget
      )
    }
  })

  it('rejects an undeclared or illegal starting fuel', () => {
    const base = EXPEDITION_BALANCE_PROFILES[0]
    const withoutFuel = { ...base, matureFixture: { ...base.matureFixture } }
    delete withoutFuel.matureFixture.startingVanFuel
    assert.throws(
      () => validateExpeditionBalanceProfile(withoutFuel),
      /startingVanFuel must be a finite number/
    )
    assert.throws(
      () =>
        validateExpeditionBalanceProfile({
          ...base,
          matureFixture: { ...base.matureFixture, startingVanFuel: 100 },
          startingFuelTarget: 90
        }),
      /exceeds startingFuelTarget/
    )
  })

  it('starts the mature van at exactly the declared fuel', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      const active = buildProductionSimulationLoadout(null, profile, 4242)
      assert.equal(
        active.expedition.provenance.matureFixture.startingVanFuel,
        profile.matureFixture.startingVanFuel
      )
    }
  })

  describe('buildProductionSimulationLoadout (G6 Task 4)', () => {
    for (const profile of EXPEDITION_BALANCE_PROFILES) {
      it(`builds valid active loadout for profile ${profile.id} through production owners`, () => {
        const seed = 4242
        const activeState = buildProductionSimulationLoadout(
          null,
          profile,
          seed
        )
        assert.equal(activeState.expedition.status, 'active')
        assert.equal(activeState.runSeed, seed)
        assert.equal(
          activeState.expedition.loadout.tourTypeId,
          toCanonicalTourTypeId(profile.tourTypeId)
        )
        assert.equal(
          activeState.expedition.loadout.regionId,
          toCanonicalRegionId(profile.regionId)
        )

        const prov = activeState.expedition.provenance
        assert.ok(prov, 'provenance must be recorded')
        assert.equal(prov.profileId, profile.id)
        assert.equal(prov.seed, seed)
        assert.equal(prov.chassis.tier, profile.chassisSpec.tier)
        assert.equal(prov.chassis.flavor, profile.chassisSpec.flavor)
        assert.equal(
          prov.chassis.archetype,
          profile.chassisSpec.expectedArchetype
        )
        assert.deepEqual(prov.moduleIds, profile.requiredModuleIds)
        assert.deepEqual(
          prov.fixtureCapabilitySetIds,
          profile.requiredCapabilitySetIds
        )

        if (profile.requiresAscension) {
          assert.equal(activeState.career.ascensionUnlocked, true)
        } else {
          assert.equal(activeState.career.ascensionUnlocked, false)
        }
      })
    }

    it('fails if scout_intel capability provenance lacks industry_network', () => {
      const scoutIntel = EXPEDITION_BALANCE_PROFILES.find(
        p => p.id === 'scout_intel'
      )
      assert.ok(scoutIntel)
      const corrupted = {
        ...scoutIntel,
        requiredCapabilitySetIds: [] // strip industry_network
      }
      assert.throws(
        () => buildProductionSimulationLoadout(null, corrupted, 4242),
        /is not available with declared capabilities/
      )
    })

    it('fails if rival_hunter capability provenance lacks underground_network', () => {
      const rivalHunter = EXPEDITION_BALANCE_PROFILES.find(
        p => p.id === 'rival_hunter'
      )
      assert.ok(rivalHunter)
      const corrupted = {
        ...rivalHunter,
        requiredCapabilitySetIds: [
          'festival_network',
          'chassis_network',
          'rival_network'
        ] // lacks underground_network
      }
      assert.throws(
        () => buildProductionSimulationLoadout(null, corrupted, 4242),
        /is not available with declared capabilities/
      )
    })
  })
})
