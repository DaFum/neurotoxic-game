/**
 * Canonical validation of the constrained Expedition build, plus the Career
 * Cash spend boundary every active-run purchase must pass through.
 *
 * @remarks
 * This module is the only place a candidate build becomes legal. It reuses the
 * repository's existing owners for every axis — `SONGS_BY_ID` for songs, the HQ
 * purchase state for gear, `state.assets` for the chassis and its installed
 * modules, `band.inventory` for merch, `band.stash` plus `CONTRABAND_BY_ID` for
 * contraband, `player.van.fuel` and `player.money` for resources — so no
 * parallel ownership model is introduced.
 *
 * Axes whose registries belong to a later gate are validated through a single
 * availability resolver each. Those resolvers return the G1 baseline (nothing
 * available yet, so only the neutral value is legal) and are the one function
 * the owning gate extends in place. That keeps `sponsorOfferId: null` and
 * `nativeContracts: []` the only legal G1A values without a second registry
 * appearing later.
 */

import { SONGS_BY_ID } from '../../data/songs'
import { CONTRABAND_BY_ID } from '../../data/contraband'
import { MERCH_PROFILES } from '../../data/merch'
import { EXPENSE_CONSTANTS } from '../../utils/economy/constants'
import { isFiniteNumber } from '../../utils/finiteNumber'
import { isForbiddenKey, isLooseRecord } from '../../utils/objectUtils'
import {
  BASE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID,
  MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS
} from './defaults'
import { getExpeditionOwnedPerformanceGear } from './equipment'
import type { GameState } from '../../types'
import type { LongTermAsset } from '../../types/assets'
import type {
  ExpeditionBuildRejectionReason,
  ExpeditionBuildValidation,
  ExpeditionLoadout,
  ExpeditionMap
} from '../../types/expedition'

/**
 * Highest fuel level the van can be topped up to before departure.
 */
const MAX_STARTING_FUEL = EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL

/**
 * Cash the player may spend inside an active Expedition.
 *
 * @param state - Current game state.
 * @returns Non-negative spendable amount.
 *
 * @remarks
 * `protectedCareerCash` is committed in the build and is off-limits for the
 * whole run. Without this boundary a wealthy Career would trivialize every run
 * safety decision — the design requires Cash to be a tool for controlling risk,
 * not an unlimited rescue. Outside a run the full balance is spendable.
 */
export const getExpeditionSpendableCash = (state: GameState): number =>
  state.expedition?.status === 'active'
    ? Math.max(0, state.player.money - state.expedition.protectedCareerCash)
    : Math.max(0, state.player.money)

/**
 * Checks whether an active-Expedition spend is affordable.
 *
 * @param state - Current game state.
 * @param amount - Non-negative cost to test.
 * @returns True when the spend stays inside the spendable slice.
 *
 * @remarks
 * A non-finite or negative amount is rejected rather than clamped: silently
 * treating `NaN` as free would let a malformed caller spend nothing and receive
 * the goods.
 */
export const canSpendExpeditionCash = (
  state: GameState,
  amount: number
): boolean =>
  isFiniteNumber(amount) &&
  amount >= 0 &&
  getExpeditionSpendableCash(state) >= amount

/**
 * Cost of topping the van up from its current level to a target level.
 *
 * @param currentFuel - Current `player.van.fuel`.
 * @param targetFuel - Committed `startingFuelTarget`.
 * @returns Cost in euros, rounded up; `0` when no top-up is needed.
 *
 * @remarks
 * Reuses the canonical `FUEL_PRICE` rather than restating a price, so retuning
 * the pump price moves Tour Prep with it. `calculateRefuelCost` covers only a
 * full tank, while the build commits a partial target.
 */
export const getExpeditionFuelTopUpCost = (
  currentFuel: number,
  targetFuel: number
): number => {
  const from = isFiniteNumber(currentFuel) ? currentFuel : 0
  const to = isFiniteNumber(targetFuel) ? targetFuel : 0
  const missing = Math.max(0, Math.min(MAX_STARTING_FUEL, to) - from)
  return Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)
}

/* -------------------------------------------------------------------------- */
/* Availability resolvers — one per axis owned by a later gate.                */
/* -------------------------------------------------------------------------- */

/**
 * Tour archetypes the player may commit.
 *
 * @remarks G5 owns the Tour registry and extends this in place.
 */
const getAvailableTourTypeIds = (_state: GameState): readonly string[] => [
  BASE_EXPEDITION_TOUR_TYPE_ID
]

/**
 * Regions the player may commit.
 *
 * @remarks G5 owns the Region registry and extends this in place.
 */
const getAvailableRegionIds = (_state: GameState): readonly string[] => [
  BASE_EXPEDITION_REGION_ID
]

/**
 * Crew ids the player may commit.
 *
 * @remarks G3 owns Crew and extends this in place. No Crew exists in G1A, so
 * the only legal commitment is an empty roster.
 */
const getAvailableCrewIds = (_state: GameState): readonly string[] => []

/**
 * Starter perk ids the player may commit.
 *
 * @remarks G5 owns the starter-perk registry and extends this in place.
 */
const getAvailableStarterPerkIds = (_state: GameState): readonly string[] => []

/**
 * Insurance policy ids the player may commit.
 *
 * @remarks G2 owns insurance and extends this in place.
 */
const getAvailableInsurancePolicyIds = (
  _state: GameState
): readonly string[] => []

/**
 * Tour Pressure modifier ids the player may commit.
 *
 * @remarks G5 owns Ascension/Tour Pressure and extends this in place, including
 * the registry, uniqueness, max-3 and `career.ascensionUnlocked` gates.
 */
const getAvailablePressureModifierIds = (
  _state: GameState
): readonly string[] => []

/**
 * Deterministically prepared Sponsor-offer ids for this run.
 *
 * @remarks G4 owns Sponsor offers and extends this in place. Offers are derived
 * from the prepared route, never accepted from the caller.
 */
const getAvailableSponsorOfferIds = (
  _state: GameState,
  _preparedMap: ExpeditionMap
): readonly string[] => []

/**
 * Native Contract template ids commitable against the prepared route.
 *
 * @remarks G4 owns native Contracts and extends this in place.
 */
const getAvailableNativeContractTemplateIds = (
  _state: GameState,
  _preparedMap: ExpeditionMap
): readonly string[] => []

/* -------------------------------------------------------------------------- */

const reject = (
  reason: ExpeditionBuildRejectionReason
): ExpeditionBuildValidation => ({ valid: false, reason })

const isNonNegativeInteger = (value: unknown): value is number =>
  isFiniteNumber(value) && Number.isInteger(value) && value >= 0

const hasDuplicates = (values: readonly string[]): boolean =>
  new Set(values).size !== values.length

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(entry => typeof entry === 'string')

/**
 * Resolves the committed chassis asset.
 *
 * @param state - Current game state.
 * @param assetId - Committed `activeTourbusAssetId`.
 * @returns The owned tourbus chassis, or `null`.
 */
const resolveCommittedChassis = (
  state: GameState,
  assetId: string
): LongTermAsset | null => {
  const assets = Array.isArray(state.assets) ? state.assets : []
  const asset = assets.find(entry => entry.id === assetId)
  if (!asset || asset.kind !== 'tourbus_chassis') return null
  return asset
}

/**
 * Reads the exact module ids installed on one chassis.
 */
const getInstalledModuleIds = (asset: LongTermAsset): string[] => {
  const ids: string[] = []
  for (const slot of Array.isArray(asset.slots) ? asset.slots : []) {
    if (typeof slot?.installedModuleId === 'string') {
      ids.push(slot.installedModuleId)
    }
  }
  return ids.sort()
}

/**
 * Validates a candidate Expedition build against canonical ownership.
 *
 * @param state - Current game state, the authority for every ownership check.
 * @param candidate - Untrusted candidate loadout from the Tour Prep UI.
 * @param preparedMap - The route built from the prepared root run seed.
 * @returns Either the normalized loadout the reducer stores, or the exact
 * rejection reason.
 *
 * @remarks
 * The returned loadout is rebuilt field by field rather than spread from the
 * candidate, so a caller cannot smuggle extra keys, unsorted selections or a
 * derived value into committed run identity.
 */
export const validateExpeditionBuildCommitment = (
  state: GameState,
  candidate: unknown,
  preparedMap: ExpeditionMap
): ExpeditionBuildValidation => {
  if (!isLooseRecord(candidate)) return reject('MALFORMED_CANDIDATE')
  const build = candidate.build
  if (!isLooseRecord(build)) return reject('MALFORMED_CANDIDATE')
  const equipment = build.equipment
  if (!isLooseRecord(equipment)) return reject('MALFORMED_CANDIDATE')
  const cargo = candidate.cargo
  if (!isLooseRecord(cargo)) return reject('MALFORMED_CANDIDATE')

  // ── Tour and Region ────────────────────────────────────────────────────────
  const { tourTypeId, regionId } = candidate
  if (typeof tourTypeId !== 'string' || typeof regionId !== 'string') {
    return reject('TOUR_OR_REGION_UNKNOWN')
  }
  if (
    !getAvailableTourTypeIds(state).includes(tourTypeId) ||
    !getAvailableRegionIds(state).includes(regionId)
  ) {
    return reject('TOUR_OR_REGION_UNKNOWN')
  }
  // The prepared route must be the one this build was assembled against,
  // otherwise the previewed danger/reward tiers describe a different run.
  if (
    preparedMap.tourTypeId !== tourTypeId ||
    preparedMap.regionId !== regionId
  ) {
    return reject('TOUR_OR_REGION_UNKNOWN')
  }

  // ── Setlist ────────────────────────────────────────────────────────────────
  const setlistSongIds = build.setlistSongIds
  if (!isStringArray(setlistSongIds)) return reject('MALFORMED_CANDIDATE')
  if (setlistSongIds.length === 0) return reject('SETLIST_EMPTY')
  if (hasDuplicates(setlistSongIds)) return reject('SETLIST_DUPLICATE')
  for (const songId of setlistSongIds) {
    if (!SONGS_BY_ID.has(songId)) return reject('SETLIST_UNKNOWN_SONG')
  }

  // ── Equipment: 0..3 real owned catalog items ───────────────────────────────
  const selectedGearItemIds = equipment.selectedGearItemIds
  if (!isStringArray(selectedGearItemIds)) return reject('MALFORMED_CANDIDATE')
  if (selectedGearItemIds.length > MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS) {
    return reject('EQUIPMENT_TOO_MANY_ITEMS')
  }
  if (hasDuplicates(selectedGearItemIds)) return reject('EQUIPMENT_DUPLICATE')
  const ownedGear = new Set(getExpeditionOwnedPerformanceGear(state))
  for (const itemId of selectedGearItemIds) {
    // `getExpeditionOwnedPerformanceGear` only ever yields real catalog ids, so
    // an unknown id and an unowned one both fail this single membership check.
    if (!ownedGear.has(itemId)) return reject('EQUIPMENT_NOT_OWNED')
  }

  // ── Chassis and installed modules ──────────────────────────────────────────
  const { activeTourbusAssetId } = candidate
  if (
    activeTourbusAssetId !== null &&
    typeof activeTourbusAssetId !== 'string'
  ) {
    return reject('MALFORMED_CANDIDATE')
  }
  const selectedTourbusModuleIds = build.selectedTourbusModuleIds
  if (!isStringArray(selectedTourbusModuleIds)) {
    return reject('MALFORMED_CANDIDATE')
  }
  let normalizedModuleIds: string[] = []
  if (activeTourbusAssetId === null) {
    // No chassis committed means no modules can be: a module only exists as an
    // installation on a specific owned chassis.
    if (selectedTourbusModuleIds.length > 0) return reject('MODULES_DRIFT')
  } else {
    const chassis = resolveCommittedChassis(state, activeTourbusAssetId)
    if (!chassis) return reject('MODULES_DRIFT')
    normalizedModuleIds = getInstalledModuleIds(chassis)
    const committed = [...selectedTourbusModuleIds].sort()
    if (
      committed.length !== normalizedModuleIds.length ||
      committed.some((id, index) => id !== normalizedModuleIds[index])
    ) {
      return reject('MODULES_DRIFT')
    }
  }

  // ── Merch drawn from owned inventory ───────────────────────────────────────
  const merchRaw = build.merch
  if (!Array.isArray(merchRaw)) return reject('MALFORMED_CANDIDATE')
  const merch: ExpeditionLoadout['build']['merch'] = []
  const seenMerchKeys = new Set<string>()
  for (const entry of merchRaw) {
    if (!isLooseRecord(entry)) return reject('MALFORMED_CANDIDATE')
    const { inventoryKey, quantity } = entry
    if (typeof inventoryKey !== 'string' || isForbiddenKey(inventoryKey)) {
      return reject('MERCH_NOT_OWNED')
    }
    if (!Object.hasOwn(MERCH_PROFILES, inventoryKey)) {
      return reject('MERCH_NOT_OWNED')
    }
    if (seenMerchKeys.has(inventoryKey)) return reject('MERCH_NOT_OWNED')
    if (!isNonNegativeInteger(quantity) || quantity === 0) {
      return reject('MERCH_NOT_OWNED')
    }
    const ownedRaw = Object.hasOwn(state.band.inventory, inventoryKey)
      ? state.band.inventory[inventoryKey]
      : 0
    const owned = isFiniteNumber(ownedRaw) ? ownedRaw : 0
    if (quantity > owned) return reject('MERCH_NOT_OWNED')
    seenMerchKeys.add(inventoryKey)
    merch.push({ inventoryKey, quantity })
  }

  // ── Contraband drawn from the owned stash ──────────────────────────────────
  const contrabandRaw = build.contraband
  if (!Array.isArray(contrabandRaw)) return reject('MALFORMED_CANDIDATE')
  const contraband: ExpeditionLoadout['build']['contraband'] = []
  const seenStashKeys = new Set<string>()
  for (const entry of contrabandRaw) {
    if (!isLooseRecord(entry)) return reject('MALFORMED_CANDIDATE')
    const { stashKey, stacks } = entry
    const instanceId = entry.instanceId === undefined ? null : entry.instanceId
    if (typeof stashKey !== 'string' || isForbiddenKey(stashKey)) {
      return reject('CONTRABAND_NOT_OWNED')
    }
    if (!CONTRABAND_BY_ID.has(stashKey)) {
      return reject('CONTRABAND_NOT_OWNED')
    }
    if (seenStashKeys.has(stashKey)) return reject('CONTRABAND_NOT_OWNED')
    if (!isNonNegativeInteger(stacks) || stacks === 0) {
      return reject('CONTRABAND_NOT_OWNED')
    }
    if (instanceId !== null && typeof instanceId !== 'string') {
      return reject('CONTRABAND_NOT_OWNED')
    }
    const stashEntry = Object.hasOwn(state.band.stash, stashKey)
      ? state.band.stash[stashKey]
      : undefined
    if (!isLooseRecord(stashEntry)) return reject('CONTRABAND_NOT_OWNED')
    const ownedStacks = isFiniteNumber(stashEntry.stacks)
      ? stashEntry.stacks
      : 0
    if (stacks > ownedStacks) return reject('CONTRABAND_NOT_OWNED')
    if (
      instanceId !== null &&
      typeof stashEntry.instanceId === 'string' &&
      stashEntry.instanceId !== instanceId
    ) {
      return reject('CONTRABAND_NOT_OWNED')
    }
    seenStashKeys.add(stashKey)
    contraband.push({ stashKey, instanceId, stacks })
  }

  // ── Sponsor offer (G4 registry) ────────────────────────────────────────────
  const { sponsorOfferId } = build
  if (sponsorOfferId !== null) {
    if (typeof sponsorOfferId !== 'string') return reject('MALFORMED_CANDIDATE')
    if (
      !getAvailableSponsorOfferIds(state, preparedMap).includes(sponsorOfferId)
    ) {
      return reject('SPONSOR_OFFER_UNKNOWN')
    }
  }

  // ── Native Contracts (G4 registry) ─────────────────────────────────────────
  const nativeContractsRaw = candidate.nativeContracts
  if (!Array.isArray(nativeContractsRaw)) return reject('MALFORMED_CANDIDATE')
  const availableTemplates = getAvailableNativeContractTemplateIds(
    state,
    preparedMap
  )
  const nativeContracts: ExpeditionLoadout['nativeContracts'] = []
  const seenTemplateIds = new Set<string>()
  for (const entry of nativeContractsRaw) {
    if (!isLooseRecord(entry)) return reject('MALFORMED_CANDIDATE')
    const { templateId } = entry
    const targetNodeId =
      entry.targetNodeId === undefined ? null : entry.targetNodeId
    if (
      typeof templateId !== 'string' ||
      !availableTemplates.includes(templateId)
    ) {
      return reject('NATIVE_CONTRACT_INVALID')
    }
    if (seenTemplateIds.has(templateId))
      return reject('NATIVE_CONTRACT_INVALID')
    if (targetNodeId !== null) {
      if (
        typeof targetNodeId !== 'string' ||
        !Object.hasOwn(preparedMap.meta, targetNodeId)
      ) {
        return reject('NATIVE_CONTRACT_INVALID')
      }
    }
    seenTemplateIds.add(templateId)
    nativeContracts.push({ templateId, targetNodeId })
  }

  // ── Crew, starter perk, insurance, Tour Pressure (later-gate registries) ───
  const crewIdsRaw = candidate.crewIds
  if (!isStringArray(crewIdsRaw)) return reject('MALFORMED_CANDIDATE')
  if (hasDuplicates(crewIdsRaw)) return reject('CREW_DUPLICATE')
  const availableCrew = getAvailableCrewIds(state)
  for (const crewId of crewIdsRaw) {
    if (!availableCrew.includes(crewId)) return reject('CREW_DUPLICATE')
  }

  const { starterPerkId, insurancePolicyId } = candidate
  if (starterPerkId !== null) {
    if (
      typeof starterPerkId !== 'string' ||
      !getAvailableStarterPerkIds(state).includes(starterPerkId)
    ) {
      return reject('MALFORMED_CANDIDATE')
    }
  }
  if (insurancePolicyId !== null) {
    if (
      typeof insurancePolicyId !== 'string' ||
      !getAvailableInsurancePolicyIds(state).includes(insurancePolicyId)
    ) {
      return reject('MALFORMED_CANDIDATE')
    }
  }

  const pressureModifierIdsRaw = candidate.pressureModifierIds
  if (!isStringArray(pressureModifierIdsRaw))
    return reject('MALFORMED_CANDIDATE')
  if (hasDuplicates(pressureModifierIdsRaw)) {
    return reject('PRESSURE_MODIFIERS_INVALID')
  }
  const availablePressure = getAvailablePressureModifierIds(state)
  for (const modifierId of pressureModifierIdsRaw) {
    if (!availablePressure.includes(modifierId)) {
      return reject('PRESSURE_MODIFIERS_INVALID')
    }
  }

  // ── Cargo ──────────────────────────────────────────────────────────────────
  // G2 owns the real capacity model, including the technical-gear slot each
  // committed performance-gear item consumes. G1A only rejects impossible
  // counts, so G2 can add capacity without a second cargo authority.
  const { spareParts, supplies } = cargo
  if (!isNonNegativeInteger(spareParts) || !isNonNegativeInteger(supplies)) {
    return reject('CARGO_OUT_OF_RANGE')
  }

  // ── Fuel target and protected Career Cash ──────────────────────────────────
  const { startingFuelTarget, protectedCareerCash } = build
  const currentFuel = isFiniteNumber(state.player.van?.fuel)
    ? state.player.van.fuel
    : 0
  if (
    !isNonNegativeInteger(startingFuelTarget) ||
    startingFuelTarget < currentFuel ||
    startingFuelTarget > MAX_STARTING_FUEL
  ) {
    return reject('FUEL_TARGET_OUT_OF_RANGE')
  }
  const playerMoney = isFiniteNumber(state.player.money)
    ? state.player.money
    : 0
  if (
    !isNonNegativeInteger(protectedCareerCash) ||
    protectedCareerCash > playerMoney
  ) {
    return reject('PROTECTED_CASH_OUT_OF_RANGE')
  }

  return {
    valid: true,
    normalized: {
      tourTypeId,
      regionId,
      activeTourbusAssetId,
      crewIds: [...crewIdsRaw],
      cargo: { spareParts, supplies },
      starterPerkId,
      nativeContracts,
      insurancePolicyId,
      pressureModifierIds: [...pressureModifierIdsRaw],
      build: {
        setlistSongIds: [...setlistSongIds],
        equipment: { selectedGearItemIds: [...selectedGearItemIds] },
        selectedTourbusModuleIds: normalizedModuleIds,
        merch,
        contraband,
        sponsorOfferId,
        startingFuelTarget,
        protectedCareerCash
      }
    }
  }
}
