/**
 * Chassis archetypes and profiles for Expedition runs.
 *
 * @remarks
 * Every supported Tourbus flavor and tier maps deterministically to one of four
 * chassis archetypes: compact, diy, coach, or armored_hauler.
 * Existing `CHASSIS_CONFIG.tourbus_chassis[flavor][tier]` remains the canonical
 * ownership and configuration source — no purchasable chassis registry is created.
 */

import type { LongTermAsset } from '../../types/assets'
import type {
  ExpeditionChassisArchetype,
  ExpeditionChassisProfile
} from '../../types/expedition'

export type { ExpeditionChassisArchetype, ExpeditionChassisProfile }

/**
 * Baseline profiles for each of the four chassis archetypes.
 */
export const EXPEDITION_CHASSIS_PROFILES: Readonly<
  Record<ExpeditionChassisArchetype, ExpeditionChassisProfile>
> = {
  compact: {
    archetype: 'compact',
    fuelConsumptionMultiplier: 0.85,
    roadWearMultiplier: 1.1,
    cargoCapacityBonus: 0,
    fieldRepairEfficiency: 0.0,
    crewStressMultiplier: 1.05,
    authorityEventWeightMultiplier: 0.95,
    hiddenContrabandCapacity: 0
  },
  diy: {
    archetype: 'diy',
    fuelConsumptionMultiplier: 1.0,
    roadWearMultiplier: 1.15,
    cargoCapacityBonus: 1,
    fieldRepairEfficiency: 0.2,
    crewStressMultiplier: 1.0,
    authorityEventWeightMultiplier: 1.0,
    hiddenContrabandCapacity: 1
  },
  coach: {
    archetype: 'coach',
    fuelConsumptionMultiplier: 1.2,
    roadWearMultiplier: 0.85,
    cargoCapacityBonus: 3,
    fieldRepairEfficiency: 0.05,
    crewStressMultiplier: 0.85,
    authorityEventWeightMultiplier: 1.05,
    hiddenContrabandCapacity: 0
  },
  armored_hauler: {
    archetype: 'armored_hauler',
    fuelConsumptionMultiplier: 1.35,
    roadWearMultiplier: 0.75,
    cargoCapacityBonus: 4,
    fieldRepairEfficiency: 0.1,
    crewStressMultiplier: 0.95,
    authorityEventWeightMultiplier: 1.2,
    hiddenContrabandCapacity: 2
  }
}

/**
 * Shape of an asset or partial asset descriptor specifying chassis flavor and tier.
 */
export interface ChassisDescriptor {
  chassisFlavor?: unknown
  chassisTier?: unknown
  kind?: unknown
}

/**
 * Maps any Tourbus flavor and tier deterministically to its canonical chassis archetype.
 *
 * @param asset - Owned Tourbus asset or descriptor with flavor and tier.
 * @returns The resolved chassis archetype, defaulting to 'compact' if uncommitted or unrecognized.
 *
 * @remarks
 * Canonical mapping for all six supported Tourbus combinations:
 * - legit tier 1 -\> compact
 * - legit tier 2 -\> coach
 * - legit tier 3 -\> coach
 * - diy tier 1   -\> diy
 * - diy tier 2   -\> diy
 * - diy tier 3   -\> armored_hauler
 */
export const getExpeditionChassisArchetype = (
  asset: LongTermAsset | ChassisDescriptor | null | undefined
): ExpeditionChassisArchetype => {
  if (!asset || typeof asset !== 'object') {
    return 'compact'
  }

  // If kind is provided and it's not a tourbus, fall back safely
  if (
    'kind' in asset &&
    asset.kind !== undefined &&
    asset.kind !== 'tourbus_chassis'
  ) {
    return 'compact'
  }

  const flavor = asset.chassisFlavor
  const tier = asset.chassisTier

  if (flavor === 'legit') {
    if (tier === 1) return 'compact'
    if (tier === 2 || tier === 3) return 'coach'
  } else if (flavor === 'diy') {
    if (tier === 1 || tier === 2) return 'diy'
    if (tier === 3) return 'armored_hauler'
  }

  return 'compact'
}

/**
 * Resolves the full Expedition chassis profile for an asset or archetype.
 *
 * @param target - Owned asset, descriptor, or archetype string.
 * @returns The frozen chassis tuning profile.
 */
export const getExpeditionChassisProfile = (
  target:
    | LongTermAsset
    | ChassisDescriptor
    | ExpeditionChassisArchetype
    | null
    | undefined
): ExpeditionChassisProfile => {
  if (
    typeof target === 'string' &&
    Object.hasOwn(EXPEDITION_CHASSIS_PROFILES, target)
  ) {
    return EXPEDITION_CHASSIS_PROFILES[target as ExpeditionChassisArchetype]
  }

  const archetype = getExpeditionChassisArchetype(
    target as LongTermAsset | ChassisDescriptor | null | undefined
  )
  return EXPEDITION_CHASSIS_PROFILES[archetype]
}
