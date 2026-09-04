/**
 * Real cargo manifest, capacity model, and cargo views for Roguelite Expedition.
 *
 * @remarks
 * Cargo capacity is a strategic build constraint. Visible cargo holds spare
 * parts, supplies, committed performance gear items, and merch stacks.
 * Contraband absorbs into hidden contraband capacity first, with any overflow
 * consuming visible cargo slots. Hidden contraband capacity cannot absorb
 * merch, gear, spare parts, or supplies.
 */

import type { GameState } from '../../types'
import type { LongTermAsset } from '../../types/assets'
import type {
  ExpeditionCargoCapacity,
  ExpeditionCargoState,
  ExpeditionCargoView,
  ExpeditionContrabandSelection,
  ExpeditionLoadout,
  ExpeditionMerchSelection
} from '../../types/expedition'
import { isFiniteNumber } from '../../utils/finiteNumber'
import { getExpeditionChassisProfile } from './chassis'
import { aggregateExpeditionModuleProfiles } from './modules'

const isNonNegativeInteger = (value: unknown): value is number =>
  isFiniteNumber(value) && Number.isInteger(value) && value >= 0

export type {
  ExpeditionCargoCapacity,
  ExpeditionCargoState,
  ExpeditionCargoView
}

/**
 * Baseline visible cargo capacity for any Expedition run before chassis or module bonuses.
 */
const BASE_EXPEDITION_CARGO_CAPACITY = 8 as const

/**
 * Calculates visible and hidden contraband capacity from committed chassis and installed modules.
 *
 * @param chassisAsset - Committed tourbus asset or null.
 * @param moduleIds - List of installed module ids.
 * @returns Object containing visible and hidden capacities.
 */
export const calculateExpeditionCargoCapacity = (
  chassisAsset: LongTermAsset | null | undefined,
  moduleIds: readonly string[] = []
): { visibleCapacity: number; hiddenCapacity: number } => {
  const chassisProfile = getExpeditionChassisProfile(chassisAsset)
  const moduleProfile = aggregateExpeditionModuleProfiles(moduleIds)

  const visibleCapacity =
    BASE_EXPEDITION_CARGO_CAPACITY +
    chassisProfile.cargoCapacityBonus +
    moduleProfile.cargoCapacityBonus

  const hiddenCapacity =
    chassisProfile.hiddenContrabandCapacity +
    moduleProfile.hiddenContrabandCapacity

  return { visibleCapacity, hiddenCapacity }
}

/**
 * Calculates slot utilization against given capacities.
 *
 * @param cargo - Candidate or active cargo contents.
 * @param capacity - Visible and hidden capacities.
 * @returns Complete capacity and usage breakdown.
 */
export const calculateExpeditionCargoUsage = (
  cargo: {
    spareParts: number
    supplies: number
    technicalGearItemIds?: readonly string[]
    merch?: readonly ExpeditionMerchSelection[]
    contraband?: readonly ExpeditionContrabandSelection[]
  },
  capacity: { visibleCapacity: number; hiddenCapacity: number }
): ExpeditionCargoCapacity => {
  const spareParts = isNonNegativeInteger(cargo.spareParts)
    ? cargo.spareParts
    : 0
  const supplies = isNonNegativeInteger(cargo.supplies) ? cargo.supplies : 0
  const gearCount = Array.isArray(cargo.technicalGearItemIds)
    ? cargo.technicalGearItemIds.length
    : 0
  const merchCount = Array.isArray(cargo.merch) ? cargo.merch.length : 0

  let totalContrabandStacks = 0
  if (Array.isArray(cargo.contraband)) {
    for (const item of cargo.contraband) {
      if (isNonNegativeInteger(item.stacks)) {
        totalContrabandStacks += item.stacks
      }
    }
  }

  const hiddenCapacity = Math.max(
    0,
    isFiniteNumber(capacity.hiddenCapacity) ? capacity.hiddenCapacity : 0
  )
  const visibleCapacity = Math.max(
    0,
    isFiniteNumber(capacity.visibleCapacity)
      ? capacity.visibleCapacity
      : BASE_EXPEDITION_CARGO_CAPACITY
  )

  const hiddenSlotsUsed = Math.min(hiddenCapacity, totalContrabandStacks)
  const contrabandVisibleSlots = Math.max(
    0,
    totalContrabandStacks - hiddenSlotsUsed
  )

  const visibleSlotsUsed =
    spareParts + supplies + gearCount + merchCount + contrabandVisibleSlots

  return {
    visibleCapacity,
    hiddenCapacity,
    visibleSlotsUsed,
    hiddenSlotsUsed,
    availableVisibleSlots: Math.max(0, visibleCapacity - visibleSlotsUsed),
    availableHiddenSlots: Math.max(0, hiddenCapacity - hiddenSlotsUsed)
  }
}

/**
 * Materializes the real ExpeditionCargoState from an approved, normalized loadout.
 *
 * @param loadout - Normalized committed loadout.
 * @param _state - Current game state for verification.
 * @returns Materialized ExpeditionCargoState.
 *
 * @remarks
 * Copies exactly `loadout.build.equipment.selectedGearItemIds` into `technicalGearItemIds`.
 */
export const materializeExpeditionCargo = (
  loadout: ExpeditionLoadout,
  _state?: GameState
): ExpeditionCargoState => {
  const selectedGear = loadout.build?.equipment?.selectedGearItemIds ?? []
  const merch = loadout.build?.merch ?? []
  const contraband = loadout.build?.contraband ?? []

  return {
    spareParts: Math.max(
      0,
      isNonNegativeInteger(loadout.cargo?.spareParts)
        ? loadout.cargo.spareParts
        : 0
    ),
    supplies: Math.max(
      0,
      isNonNegativeInteger(loadout.cargo?.supplies) ? loadout.cargo.supplies : 0
    ),
    technicalGearItemIds: [...selectedGear],
    merch: structuredClone(merch),
    contraband: structuredClone(contraband)
  }
}

/**
 * Resolves the active Expedition cargo view for gameplay consumers.
 *
 * @param state - Current game state.
 * @returns Unified view of active cargo with capacity details.
 */
export const getExpeditionCargoView = (
  state: GameState
): ExpeditionCargoView => {
  const activeTourbusAssetId = state.expedition?.loadout?.activeTourbusAssetId
  const assets = Array.isArray(state.assets) ? state.assets : []
  const chassisAsset = activeTourbusAssetId
    ? (assets.find(
        a => a.id === activeTourbusAssetId && a.kind === 'tourbus_chassis'
      ) ?? null)
    : null

  const moduleIds =
    state.expedition?.loadout?.build?.selectedTourbusModuleIds ?? []
  const capacity = calculateExpeditionCargoCapacity(chassisAsset, moduleIds)

  // If cargo is already materialized on expedition state, use it
  let cargoState: ExpeditionCargoState
  if (state.expedition?.cargo && typeof state.expedition.cargo === 'object') {
    cargoState = state.expedition.cargo
  } else if (state.expedition?.loadout) {
    cargoState = materializeExpeditionCargo(state.expedition.loadout, state)
  } else {
    cargoState = {
      spareParts: 0,
      supplies: 0,
      technicalGearItemIds: [],
      merch: [],
      contraband: []
    }
  }

  const usage = calculateExpeditionCargoUsage(cargoState, capacity)

  return {
    ...cargoState,
    ...usage
  }
}
