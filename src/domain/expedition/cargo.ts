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
import { isFiniteNumber, isNonNegativeInteger } from '../../utils/finiteNumber'
import {
  getCommittedExpeditionTourbusAsset,
  getExpeditionChassisProfile
} from './chassis'
import { aggregateExpeditionModuleProfiles } from './modules'

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
 * Whether a packed contraband entry covers one owned stash stack.
 *
 * @param entry - Packed (committed) contraband selection.
 * @param stashKey - Contraband id of the stash stack.
 * @param instanceId - Instance id of the stash stack, when it has one.
 * @returns True for a non-empty entry on the same id whose `null` instance
 * matches any instance and whose instance otherwise matches exactly.
 */
export const isPackedContrabandEntry = (
  entry: ExpeditionContrabandSelection,
  stashKey: unknown,
  instanceId: unknown
): boolean =>
  entry.stashKey === stashKey &&
  entry.stacks > 0 &&
  (entry.instanceId === null || entry.instanceId === instanceId)

/**
 * Counts the packed stacks of one contraband id.
 *
 * @param contraband - Packed contraband entries.
 * @param stashKey - Contraband id to count.
 * @returns Total stacks packed for that id, across all of its entries.
 */
export const countPackedContraband = (
  contraband: readonly ExpeditionContrabandSelection[],
  stashKey: string
): number =>
  contraband.reduce(
    (sum, entry) =>
      entry.stashKey === stashKey && entry.stacks > 0
        ? sum + entry.stacks
        : sum,
    0
  )

/**
 * Removes stacks of one contraband id from the packed entries.
 *
 * @param contraband - Packed contraband entries.
 * @param stashKey - Contraband id to debit.
 * @param stacks - Stacks to remove, taken from the first entries that hold them.
 * @returns New entry list; emptied entries are dropped.
 */
export const debitPackedContraband = (
  contraband: readonly ExpeditionContrabandSelection[],
  stashKey: string,
  stacks: number
): ExpeditionContrabandSelection[] => {
  let remaining = stacks
  const next: ExpeditionContrabandSelection[] = []
  for (const entry of contraband) {
    if (entry.stashKey !== stashKey || remaining <= 0 || entry.stacks <= 0) {
      next.push(entry)
      continue
    }
    const taken = Math.min(entry.stacks, remaining)
    remaining -= taken
    if (entry.stacks - taken > 0) {
      next.push({ ...entry, stacks: entry.stacks - taken })
    }
  }
  return next
}

/**
 * Adds stacks of one contraband id to the packed entries.
 *
 * @param contraband - Packed contraband entries.
 * @param stashKey - Contraband id to add.
 * @param instanceId - Instance id of the owned stash stack, when it has one.
 * @param stacks - Stacks to add.
 * @returns New entry list, merged into a covering entry when there is one.
 */
export const creditPackedContraband = (
  contraband: readonly ExpeditionContrabandSelection[],
  stashKey: string,
  instanceId: string | null,
  stacks: number
): ExpeditionContrabandSelection[] => {
  const index = contraband.findIndex(entry =>
    isPackedContrabandEntry(entry, stashKey, instanceId)
  )
  if (index === -1) return [...contraband, { stashKey, instanceId, stacks }]
  return contraband.map((entry, i) =>
    i === index ? { ...entry, stacks: entry.stacks + stacks } : entry
  )
}

/**
 * Narrows the owned stash to what an active run carries.
 *
 * @param stash - Owned contraband stash.
 * @param expedition - Expedition slice.
 * @returns The stash unchanged outside an active run; during one, only the
 * packed items, each with at most its packed stack count.
 */
export const getCarriedContrabandStash = (
  stash: Record<string, unknown> | undefined,
  expedition: GameState['expedition'] | undefined
): Record<string, unknown> | undefined => {
  if (expedition?.status !== 'active') return stash
  const packed = resolveActiveExpeditionCargo({ expedition })?.contraband ?? []
  const carried: Record<string, unknown> = {}
  for (const [id, entry] of Object.entries(stash ?? {})) {
    const count = countPackedContraband(packed, id)
    if (count <= 0 || typeof entry !== 'object' || entry === null) continue
    const owned = (entry as { stacks?: unknown }).stacks
    carried[id] = {
      ...entry,
      stacks: typeof owned === 'number' ? Math.min(owned, count) : count
    }
  }
  return carried
}

/**
 * Resolves the cargo an active run actually carries.
 *
 * @param state - Current game state.
 * @returns The materialized cargo, the cargo derived from the committed loadout
 * for an older active save that never stored one, or `null` outside a run.
 *
 * @remarks
 * Consumers that spend packed stock (stash use, merch sales) must read this
 * rather than `expedition.cargo`, which such a save leaves absent; treating the
 * absence as "empty" or "unrestricted" would refuse or over-allow the packed
 * manifest. Persist the returned value when a consumer changes it.
 */
export const resolveActiveExpeditionCargo = (
  state: Pick<GameState, 'expedition'>
): ExpeditionCargoState | null => {
  if (state.expedition?.status !== 'active') return null
  if (state.expedition.cargo && typeof state.expedition.cargo === 'object') {
    return state.expedition.cargo
  }
  return state.expedition.loadout
    ? materializeExpeditionCargo(state.expedition.loadout)
    : null
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
  const chassisAsset = activeTourbusAssetId
    ? getCommittedExpeditionTourbusAsset(state)
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
