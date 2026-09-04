import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_CHASSIS_PROFILES,
  getExpeditionChassisArchetype,
  getExpeditionChassisProfile
} from '../../src/domain/expedition/chassis'

test('Task 1: Expedition Chassis Archetypes and Profiles', async t => {
  await t.test(
    'maps all six supported Tourbus flavor/tier combinations deterministically',
    () => {
      // Legit tiers
      assert.equal(
        getExpeditionChassisArchetype({
          chassisFlavor: 'legit',
          chassisTier: 1
        }),
        'compact'
      )
      assert.equal(
        getExpeditionChassisArchetype({
          chassisFlavor: 'legit',
          chassisTier: 2
        }),
        'coach'
      )
      assert.equal(
        getExpeditionChassisArchetype({
          chassisFlavor: 'legit',
          chassisTier: 3
        }),
        'coach'
      )

      // DIY tiers
      assert.equal(
        getExpeditionChassisArchetype({ chassisFlavor: 'diy', chassisTier: 1 }),
        'diy'
      )
      assert.equal(
        getExpeditionChassisArchetype({ chassisFlavor: 'diy', chassisTier: 2 }),
        'diy'
      )
      assert.equal(
        getExpeditionChassisArchetype({ chassisFlavor: 'diy', chassisTier: 3 }),
        'armored_hauler'
      )
    }
  )

  await t.test(
    'falls back safely to compact when no tourbus asset is committed',
    () => {
      assert.equal(getExpeditionChassisArchetype(null), 'compact')
      assert.equal(getExpeditionChassisArchetype(undefined), 'compact')
      // Wrong kind or non-conforming object
      assert.equal(
        getExpeditionChassisArchetype({
          id: 'st_1',
          kind: 'studio_chassis',
          chassisFlavor: 'diy',
          chassisTier: 3
        }),
        'compact'
      )
    }
  )

  await t.test(
    'provides canonical tuning profiles for all four archetypes',
    () => {
      const compact = EXPEDITION_CHASSIS_PROFILES.compact
      assert.equal(compact.archetype, 'compact')
      assert.equal(compact.fuelConsumptionMultiplier, 0.85)
      assert.equal(compact.roadWearMultiplier, 1.1)
      assert.equal(compact.cargoCapacityBonus, 0)
      assert.equal(compact.fieldRepairEfficiency, 0.0)
      assert.equal(compact.crewStressMultiplier, 1.05)
      assert.equal(compact.authorityEventWeightMultiplier, 0.95)
      assert.equal(compact.hiddenContrabandCapacity, 0)

      const diy = EXPEDITION_CHASSIS_PROFILES.diy
      assert.equal(diy.archetype, 'diy')
      assert.equal(diy.fuelConsumptionMultiplier, 1.0)
      assert.equal(diy.roadWearMultiplier, 1.15)
      assert.equal(diy.cargoCapacityBonus, 1)
      assert.equal(diy.fieldRepairEfficiency, 0.2)
      assert.equal(diy.crewStressMultiplier, 1.0)
      assert.equal(diy.authorityEventWeightMultiplier, 1.0)
      assert.equal(diy.hiddenContrabandCapacity, 1)

      const coach = EXPEDITION_CHASSIS_PROFILES.coach
      assert.equal(coach.archetype, 'coach')
      assert.equal(coach.fuelConsumptionMultiplier, 1.2)
      assert.equal(coach.roadWearMultiplier, 0.85)
      assert.equal(coach.cargoCapacityBonus, 3)
      assert.equal(coach.fieldRepairEfficiency, 0.05)
      assert.equal(coach.crewStressMultiplier, 0.85)
      assert.equal(coach.authorityEventWeightMultiplier, 1.05)
      assert.equal(coach.hiddenContrabandCapacity, 0)

      const armored = EXPEDITION_CHASSIS_PROFILES.armored_hauler
      assert.equal(armored.archetype, 'armored_hauler')
      assert.equal(armored.fuelConsumptionMultiplier, 1.35)
      assert.equal(armored.roadWearMultiplier, 0.75)
      assert.equal(armored.cargoCapacityBonus, 4)
      assert.equal(armored.fieldRepairEfficiency, 0.1)
      assert.equal(armored.crewStressMultiplier, 0.95)
      assert.equal(armored.authorityEventWeightMultiplier, 1.2)
      assert.equal(armored.hiddenContrabandCapacity, 2)
    }
  )

  await t.test(
    'compares two otherwise identical setups and proves fuel, wear, capacity, and risk/recovery choice differ before modules',
    () => {
      const compactProfile = getExpeditionChassisProfile({
        chassisFlavor: 'legit',
        chassisTier: 1
      })
      const diyProfile = getExpeditionChassisProfile({
        chassisFlavor: 'diy',
        chassisTier: 1
      })

      // Fuel differs
      assert.notEqual(
        compactProfile.fuelConsumptionMultiplier,
        diyProfile.fuelConsumptionMultiplier
      )
      // Road wear differs
      assert.notEqual(
        compactProfile.roadWearMultiplier,
        diyProfile.roadWearMultiplier
      )
      // Cargo capacity differs
      assert.notEqual(
        compactProfile.cargoCapacityBonus,
        diyProfile.cargoCapacityBonus
      )
      // Risk/recovery choice differs: field repair efficiency
      assert.notEqual(
        compactProfile.fieldRepairEfficiency,
        diyProfile.fieldRepairEfficiency
      )
      // Contraband / authority differ
      assert.notEqual(
        compactProfile.hiddenContrabandCapacity,
        diyProfile.hiddenContrabandCapacity
      )
    }
  )
})
