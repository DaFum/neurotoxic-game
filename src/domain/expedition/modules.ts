/**
 * Expedition vehicle module profiles and aggregator.
 *
 * @remarks
 * Maps real existing `MODULE_REGISTRY` module ids to Expedition vehicle module
 * profiles. Modules without a production Expedition consumer are left neutral.
 */

import type { ExpeditionVehicleModuleProfile } from '../../types/expedition'

export type { ExpeditionVehicleModuleProfile }

/**
 * Neutral identity profile for vehicle modules.
 */
export const NEUTRAL_EXPEDITION_MODULE_PROFILE: Readonly<ExpeditionVehicleModuleProfile> =
  {
    cargoCapacityBonus: 0,
    fuelConsumptionMultiplier: 1.0,
    roadWearMultiplier: 1.0,
    inspectionLevel: 0,
    authorityIntelBonus: 0,
    hiddenContrabandCapacity: 0,
    restStressRecoveryBonus: 0
  }

/**
 * Mapping of real Tourbus module IDs to their Expedition capability profiles.
 */
const EXPEDITION_MODULE_PROFILES: Readonly<
  Record<string, Readonly<Partial<ExpeditionVehicleModuleProfile>>>
> = {
  tb_roof_rack: {
    cargoCapacityBonus: 2
  },
  tb_trailer_hitch: {
    cargoCapacityBonus: 3
  },
  tb_sleeping_bunks: {
    restStressRecoveryBonus: 15
  },
  tb_gps_jammer: {
    authorityIntelBonus: 1
  },
  tb_cb_radio_mesh: {
    inspectionLevel: 1
  },
  tb_solar_panel: {
    fuelConsumptionMultiplier: 0.9
  },
  tb_smoke_screen: {
    roadWearMultiplier: 0.9
  }
}

/**
 * Resolves the Expedition profile for a single module id.
 *
 * @param moduleId - Module id string.
 * @returns Complete ExpeditionVehicleModuleProfile with neutral fallbacks.
 */
export const getExpeditionModuleProfile = (
  moduleId: unknown
): ExpeditionVehicleModuleProfile => {
  if (
    typeof moduleId !== 'string' ||
    !Object.hasOwn(EXPEDITION_MODULE_PROFILES, moduleId)
  ) {
    return { ...NEUTRAL_EXPEDITION_MODULE_PROFILE }
  }

  const overrides = EXPEDITION_MODULE_PROFILES[moduleId]
  return {
    cargoCapacityBonus: overrides?.cargoCapacityBonus ?? 0,
    fuelConsumptionMultiplier: overrides?.fuelConsumptionMultiplier ?? 1.0,
    roadWearMultiplier: overrides?.roadWearMultiplier ?? 1.0,
    inspectionLevel: (overrides?.inspectionLevel ?? 0) as 0 | 1 | 2,
    authorityIntelBonus: (overrides?.authorityIntelBonus ?? 0) as 0 | 1,
    hiddenContrabandCapacity: overrides?.hiddenContrabandCapacity ?? 0,
    restStressRecoveryBonus: overrides?.restStressRecoveryBonus ?? 0
  }
}

/**
 * Combines an array of installed module ids into a single composite profile.
 *
 * @param moduleIds - List of installed module ids.
 * @returns Aggregated ExpeditionVehicleModuleProfile.
 */
export const aggregateExpeditionModuleProfiles = (
  moduleIds: readonly string[]
): ExpeditionVehicleModuleProfile => {
  if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
    return { ...NEUTRAL_EXPEDITION_MODULE_PROFILE }
  }

  let cargoCapacityBonus = 0
  let fuelConsumptionMultiplier = 1.0
  let roadWearMultiplier = 1.0
  let maxInspectionLevel: 0 | 1 | 2 = 0
  let maxAuthorityIntelBonus: 0 | 1 = 0
  let hiddenContrabandCapacity = 0
  let restStressRecoveryBonus = 0

  for (const id of moduleIds) {
    const profile = getExpeditionModuleProfile(id)
    cargoCapacityBonus += profile.cargoCapacityBonus
    fuelConsumptionMultiplier *= profile.fuelConsumptionMultiplier
    roadWearMultiplier *= profile.roadWearMultiplier
    if (profile.inspectionLevel > maxInspectionLevel) {
      maxInspectionLevel = Math.min(2, profile.inspectionLevel) as 0 | 1 | 2
    }
    if (profile.authorityIntelBonus > maxAuthorityIntelBonus) {
      maxAuthorityIntelBonus = 1
    }
    hiddenContrabandCapacity += profile.hiddenContrabandCapacity
    restStressRecoveryBonus += profile.restStressRecoveryBonus
  }

  return {
    cargoCapacityBonus,
    fuelConsumptionMultiplier,
    roadWearMultiplier,
    inspectionLevel: maxInspectionLevel,
    authorityIntelBonus: maxAuthorityIntelBonus,
    hiddenContrabandCapacity,
    restStressRecoveryBonus
  }
}
