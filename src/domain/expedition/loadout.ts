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
import { logger } from '../../utils/logger'
import { ActionTypes } from '../../context/actionTypes'
import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'
import { isForbiddenKey, isLooseRecord } from '../../utils/objectUtils'
import { EXPEDITION_REGIONS } from '../../data/expedition/regions'
import { EXPEDITION_TOUR_TYPES } from '../../data/expedition/tourTypes'
import {
  FREE_EXPEDITION_REGION_ID,
  BASE_EXPEDITION_TOUR_TYPE_ID,
  MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS
} from './defaults'
import { getExpeditionOwnedPerformanceGear } from './equipment'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { isCrewAvailable } from './crew'
import {
  calculateExpeditionCargoCapacity,
  calculateExpeditionCargoUsage
} from './cargo'
import { getAvailableInsurancePolicyIds } from './insurance'
import type { GameState } from '../../types'
import type { LongTermAsset } from '../../types/assets'
import type {
  ExpeditionBuildRejectionReason,
  ExpeditionBuildValidation,
  ExpeditionLoadout,
  ExpeditionMap,
  ExpeditionSponsorStagingProvenance
} from '../../types/expedition'
import { EXPEDITION_CONTRACTS_BY_ID } from '../../data/expedition/contracts'
import { buildPreparedExpeditionSponsorOffers } from './sponsors'
import { isExpeditionCapabilityUnlocked } from '../../data/expedition/unlockSets'
import {
  EXPEDITION_STARTER_PERK_IDS,
  EXPEDITION_STARTER_PERKS
} from '../../data/expedition/starterPerks'
import {
  EXPEDITION_PRESSURE_MODIFIER_IDS,
  MAX_EXPEDITION_PRESSURE_MODIFIERS
} from '../../data/expedition/pressureModifiers'
import type { ExpeditionCapabilityId } from '../../types/career'
import {
  areExpeditionContractsCompatible,
  materializeContractConstraints
} from './contracts'

/**
 * Highest fuel level the van can be topped up to before departure.
 */
/**
 * Ceiling on a committed starting Fuel target.
 *
 * @remarks
 * Exported so callers that need to reason about the cheapest legal build - the
 * Between-Tour insolvency check, the balance harness - use the same ceiling the
 * validator enforces rather than a literal of their own.
 */
export const EXPEDITION_MAX_STARTING_FUEL = EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL
const MAX_STARTING_FUEL = EXPEDITION_MAX_STARTING_FUEL

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
export const getExpeditionSpendableCash = (state: GameState): number => {
  const money = finiteNumberOr(state.player.money, 0)
  if (state.expedition?.status === 'active') {
    const protectedCash = state.expedition.protectedCareerCash
    if (!isFiniteNumber(protectedCash) || protectedCash < 0) {
      return 0
    }
    return Math.max(0, money - protectedCash)
  }
  return Math.max(0, money)
}

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
 * What START will charge for the cheapest legal next Expedition.
 *
 * @param state - Career state between Tours.
 * @returns The unavoidable cost of booking again, in euros.
 *
 * @remarks
 * A build may only top the tank up, never siphon it, so the cheapest legal
 * `startingFuelTarget` is the tank the last Tour left rounded up - and the only
 * unavoidable charge is that rounding. It is a euro or two, which is exactly
 * why a Career stranded just below it reads as absurd: the band cannot book a
 * Tour because it is two euros short of topping off a tank it already has.
 */
export const getExpeditionMinimumNextStartCost = (state: GameState): number => {
  const currentFuel = finiteNumberOr(state.player?.van?.fuel, 0)
  const cheapestTarget = Math.min(
    EXPEDITION_MAX_STARTING_FUEL,
    Math.ceil(Math.max(0, currentFuel))
  )
  return getExpeditionFuelTopUpCost(currentFuel, cheapestTarget)
}

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
 * The capability each non-baseline Tour and Region is gated behind.
 *
 * @remarks
 * `standard_tour` is deliberately absent - it is the one Tour every Career can
 * always book. The free Region is `home_turf`, and it is absent from
 * `REGION_CAPABILITY` for the same reason. `industrial_belt` is *not* free: it
 * is the pre-G5 route baseline, but new bookings need `region_industrial_belt`
 * (see the remark on {@link getAvailableExpeditionRegionIds}), and only a run
 * that already committed it keeps it.
 */
const TOUR_CAPABILITY: Readonly<Record<string, ExpeditionCapabilityId>> = {
  survival_tour: 'tour_survival_tour',
  corporate_tour: 'tour_corporate_tour',
  underground_tour: 'tour_underground_tour',
  blitz_tour: 'tour_blitz_tour',
  rival_hunt_tour: 'tour_rival_hunt_tour'
}

const REGION_CAPABILITY: Readonly<Record<string, ExpeditionCapabilityId>> = {
  industrial_belt: 'region_industrial_belt',
  corporate_circuit: 'region_corporate_circuit',
  underground_scene: 'region_underground_scene',
  festival_fields: 'region_festival_fields'
}

/**
 * The highest chassis tier a Career may tour in without buying the capability.
 */
const FREE_EXPEDITION_CHASSIS_TIER = 1

/**
 * Whether the Career has bought its way to an id, or never needed to.
 *
 * @param state - Current game state.
 * @param id - Tour or Region id.
 * @param gates - The capability map for that axis.
 * @returns True when the id is ungated or its capability is unlocked.
 */
const isAvailableById = (
  state: GameState,
  id: string,
  gates: Readonly<Record<string, ExpeditionCapabilityId>>
): boolean => {
  if (!Object.hasOwn(gates, id)) return true
  const capability = gates[id]
  return (
    capability !== undefined &&
    isExpeditionCapabilityUnlocked(state.career?.unlockedSetIds, capability)
  )
}

/**
 * Tour archetypes the player may commit.
 *
 * @remarks
 * Registered *and* unlocked. The registry stops a Tour from being published as
 * data no run can reach; the capability gate is what makes an unlock set worth
 * its Tokens. The baseline id is kept first and is never gated, so an existing
 * save, seed or preview still resolves to the same route.
 */
export const getAvailableExpeditionTourTypeIds = (
  state: GameState
): readonly string[] => [
  BASE_EXPEDITION_TOUR_TYPE_ID,
  ...Object.keys(EXPEDITION_TOUR_TYPES).filter(
    id =>
      id !== BASE_EXPEDITION_TOUR_TYPE_ID &&
      isAvailableById(state, id, TOUR_CAPABILITY)
  )
]

/**
 * Regions the player may commit.
 *
 * @remarks
 * Same rule as the Tours above: registered and unlocked. `home_turf` is the
 * one free Region, so a fresh Career always has somewhere to go. Everything
 * else is sold, `industrial_belt` included: it is the pre-G5 route baseline,
 * but keeping it free would make the `region_industrial_belt` capability that
 * `mechanic_network` charges Tokens for dead inventory. A run that already
 * committed it keeps it - this list only gates new bookings.
 */
export const getAvailableExpeditionRegionIds = (
  state: GameState
): readonly string[] => [
  FREE_EXPEDITION_REGION_ID,
  ...Object.keys(EXPEDITION_REGIONS).filter(
    id =>
      id !== FREE_EXPEDITION_REGION_ID &&
      isAvailableById(state, id, REGION_CAPABILITY)
  )
]

/**
 * Whether a persisted Sponsor staging still names a Region, Tour and perk this
 * Career may actually book.
 *
 * @param state - Loaded game state.
 * @param provenance - The staging provenance a save carried.
 * @returns `true` when every axis is still available to this Career.
 *
 * @remarks
 * The sanitizer only narrows the provenance's shape; availability needs the
 * whole Career, so it is re-derived here on load. Without it a hand-edited save
 * could stage offers for a Region or perk it never unlocked and have START
 * honour them.
 */
export const isExpeditionStagingRouteAvailable = (
  state: GameState,
  provenance: ExpeditionSponsorStagingProvenance | undefined
): boolean => {
  if (!provenance) return false
  if (!getAvailableExpeditionRegionIds(state).includes(provenance.regionId)) {
    return false
  }
  if (
    !getAvailableExpeditionTourTypeIds(state).includes(provenance.tourTypeId)
  ) {
    return false
  }
  return (
    provenance.starterPerkId === null ||
    getAvailableStarterPerkIds(state).includes(provenance.starterPerkId)
  )
}

/**
 * Crew ids the player may commit.
 *
 * @remarks G3 owns Crew and extends this in place. No Crew exists in G1A, so
 * the only legal commitment is an empty roster.
 */
export const getAvailableCrewIds = (state: GameState): readonly string[] =>
  Object.keys(EXPEDITION_CREW_BY_ID).filter(id => isCrewAvailable(state, id))

/**
 * Starter perk ids the player may commit.
 *
 * @remarks
 * A perk is selectable only once the Career owns the capability that carries
 * it, so the list is empty for a Career that has bought no unlock set. The
 * registry is the whole vocabulary: a Legendary id, or any id not in it, is
 * never available.
 */
export const getAvailableStarterPerkIds = (
  state: GameState
): readonly string[] =>
  EXPEDITION_STARTER_PERK_IDS.filter(perkId =>
    isExpeditionCapabilityUnlocked(
      state.career?.unlockedSetIds,
      EXPEDITION_STARTER_PERKS[perkId].capabilityId
    )
  )

/**
 * Tour Pressure modifier ids the player may commit.
 *
 * @remarks G5 owns Ascension/Tour Pressure and extends this in place, including
 * the registry, uniqueness, max-3 and `career.ascensionUnlocked` gates.
 */
export const getAvailablePressureModifierIds = (
  state: GameState
): readonly string[] =>
  state.career?.ascensionUnlocked === true
    ? EXPEDITION_PRESSURE_MODIFIER_IDS
    : []

/**
 * Deterministically derived Sponsor-offer ids for this run.
 *
 * @remarks
 * Derived from the prepared route rather than read from persisted state, and
 * the route is the authority on which Region and Tour it belongs to. That is
 * what makes the offer set correct for the candidate being validated: the
 * committed loadout does not exist yet at START, and at PREPARE the player has
 * not chosen a Region or Tour at all, so a stored set is always staged against
 * inputs it could not have known. The starter perk travels with the candidate
 * for the same reason: `press_pass` biases the pool the build is choosing from,
 * and that build is not committed anywhere this could read it back from.
 */
export const getAvailableSponsorOfferIds = (
  state: GameState,
  preparedMap: ExpeditionMap,
  starterPerkId: string | null = null
): readonly string[] =>
  buildPreparedExpeditionSponsorOffers(
    state,
    preparedMap.regionId,
    preparedMap.tourTypeId,
    starterPerkId
  ).map(offer => offer.offerId)

/**
 * Native Contract template ids commitable against the prepared route.
 *
 * @remarks G4 owns native Contracts and extends this in place.
 */
export const getAvailableNativeContractTemplateIds = (
  state: GameState,
  preparedMap: ExpeditionMap
): readonly string[] => {
  // `performance_contract_pool` is what `festival_network` charges for: the
  // performance-kind templates are the ones a Career books on its reputation
  // rather than on the route it happens to have drawn.
  const hasPerformancePool = isExpeditionCapabilityUnlocked(
    state.career?.unlockedSetIds,
    'performance_contract_pool'
  )
  return [...EXPEDITION_CONTRACTS_BY_ID.values()]
    .filter(
      template =>
        (template.kind !== 'performance' || hasPerformancePool) &&
        materializeContractConstraints(template, preparedMap) !== null
    )
    .map(template => template.id)
}

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
    !getAvailableExpeditionTourTypeIds(state).includes(tourTypeId) ||
    !getAvailableExpeditionRegionIds(state).includes(regionId)
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
    // Owning the bus is not the same as being allowed to tour in it. A tier
    // above the free ceiling is what `chassis_higher_tier` is sold for, so the
    // gate lives on the commitment rather than on the purchase.
    if (
      Math.floor(finiteNumberOr(chassis.chassisTier, 1)) >
        FREE_EXPEDITION_CHASSIS_TIER &&
      !isExpeditionCapabilityUnlocked(
        state.career?.unlockedSetIds,
        'chassis_higher_tier'
      )
    ) {
      return reject('CHASSIS_TIER_LOCKED')
    }
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
    // The candidate's perk, not a validated one: an unavailable perk id is
    // rejected a few checks below, so a pool widened by one can never be
    // committed - it only keeps a legitimate `press_pass` build from being
    // told its own staged offer is unknown.
    if (
      !getAvailableSponsorOfferIds(
        state,
        preparedMap,
        typeof candidate.starterPerkId === 'string'
          ? candidate.starterPerkId
          : null
      ).includes(sponsorOfferId)
    ) {
      return reject('SPONSOR_OFFER_UNKNOWN')
    }
  }

  // ── Native Contracts (G4 registry) ─────────────────────────────────────────
  const nativeContractsRaw = candidate.nativeContracts
  if (!Array.isArray(nativeContractsRaw)) return reject('MALFORMED_CANDIDATE')
  if (nativeContractsRaw.length > 2) return reject('NATIVE_CONTRACT_INVALID')
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
  if (
    !areExpeditionContractsCompatible(
      nativeContracts.map(contract => contract.templateId)
    )
  )
    return reject('NATIVE_CONTRACT_INVALID')
  for (const contract of nativeContracts) {
    const template = EXPEDITION_CONTRACTS_BY_ID.get(contract.templateId)
    const constraints = materializeContractConstraints(
      template,
      preparedMap,
      contract.targetNodeId
    )
    if (!constraints) return reject('NATIVE_CONTRACT_INVALID')
    const needsTarget =
      template?.constraints.some(
        constraint => constraint.kind === 'visit_matching_node'
      ) ?? false
    if (needsTarget !== (contract.targetNodeId !== null))
      return reject('NATIVE_CONTRACT_INVALID')
  }

  // ── Crew, starter perk, insurance, Tour Pressure (later-gate registries) ───
  const crewIdsRaw = candidate.crewIds
  if (!isStringArray(crewIdsRaw)) return reject('MALFORMED_CANDIDATE')
  if (crewIdsRaw.length > 3) return reject('MALFORMED_CANDIDATE')
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
  let normalizedInsurancePolicyId:
    import('../../types/expedition').ExpeditionInsurancePolicyId | null = null
  if (insurancePolicyId !== null) {
    if (
      typeof insurancePolicyId !== 'string' ||
      !(getAvailableInsurancePolicyIds(state) as readonly string[]).includes(
        insurancePolicyId
      )
    ) {
      return reject('MALFORMED_CANDIDATE')
    }
    normalizedInsurancePolicyId =
      insurancePolicyId as import('../../types/expedition').ExpeditionInsurancePolicyId
  }

  const pressureModifierIdsRaw = candidate.pressureModifierIds
  if (!isStringArray(pressureModifierIdsRaw))
    return reject('MALFORMED_CANDIDATE')
  if (hasDuplicates(pressureModifierIdsRaw)) {
    return reject('PRESSURE_MODIFIERS_INVALID')
  }
  if (pressureModifierIdsRaw.length > MAX_EXPEDITION_PRESSURE_MODIFIERS) {
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

  const chassis = activeTourbusAssetId
    ? resolveCommittedChassis(state, activeTourbusAssetId)
    : null
  const cargoCapacity = calculateExpeditionCargoCapacity(
    chassis,
    normalizedModuleIds
  )
  const cargoUsage = calculateExpeditionCargoUsage(
    {
      spareParts,
      supplies,
      technicalGearItemIds: selectedGearItemIds,
      merch,
      contraband
    },
    cargoCapacity
  )

  if (cargoUsage.visibleSlotsUsed > cargoUsage.visibleCapacity) {
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
      insurancePolicyId: normalizedInsurancePolicyId,
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

/**
 * Action types exempt from the protected-Cash floor.
 *
 * @remarks
 * The floor guards *discretionary* spending. Three families must stay exempt:
 *
 * - `ADVANCE_DAY` applies mandatory obligations (upkeep, liability payments,
 *   legacy wear). Blocking it would freeze the day tick; the design instead
 *   wants unpayable obligations to surface as the bankruptcy crisis, which the
 *   failure shell derives from the same spendable slice. G2 owns the full
 *   active-Expedition day policy.
 * - `LOAD_GAME`/`RESET_STATE` install a state rather than spend from one, so
 *   comparing their result against the previous state's floor is meaningless.
 * - The Expedition terminal actions settle the run. A settlement only ever
 *   forfeits run *earnings*, so it cannot reach below the protected slice, but
 *   exempting them keeps the floor from second-guessing the settlement math.
 */
const EXPEDITION_CASH_FLOOR_EXEMPT_ACTIONS: ReadonlySet<string> = new Set([
  ActionTypes.ADVANCE_DAY,
  ActionTypes.LOAD_GAME,
  ActionTypes.RESET_STATE,
  ActionTypes.EXTRACT_EXPEDITION,
  ActionTypes.COMPLETE_EXPEDITION,
  ActionTypes.ACCEPT_EXPEDITION_FAILURE,
  ActionTypes.PREPARE_NEXT_EXPEDITION
])

/**
 * Rejects any action that would spend past the protected Career Cash slice.
 *
 * @param previousState - State before the action reduced.
 * @param nextState - State the action produced.
 * @param actionType - The action's discriminant.
 * @returns `nextState`, or `previousState` when the spend crossed the floor.
 *
 * @remarks
 * One authoritative floor instead of a check at every spend site. Travel,
 * refuelling, repairs, clinic treatments, purchases and negative event money
 * deltas all deduct from `player.money` through their own reducers; auditing
 * each of them would leave the next spend path added elsewhere unguarded, and
 * the design requires the protected slice to hold against *every* in-run spend.
 *
 * Only a spend that actually lowers the balance is judged, so an action that
 * nets positive or leaves Cash untouched is never rejected — including one that
 * starts below the floor because mandatory obligations already pushed it there.
 */
export const enforceExpeditionCashFloor = (
  previousState: GameState,
  nextState: GameState,
  actionType: string
): GameState => {
  if (nextState === previousState) return previousState
  if (previousState.expedition?.status !== 'active') return nextState
  if (EXPEDITION_CASH_FLOOR_EXEMPT_ACTIONS.has(actionType)) return nextState

  const floor = Math.max(
    0,
    isFiniteNumber(previousState.expedition.protectedCareerCash)
      ? previousState.expedition.protectedCareerCash
      : 0
  )
  if (floor === 0) return nextState

  const before = isFiniteNumber(previousState.player.money)
    ? previousState.player.money
    : 0
  const after = isFiniteNumber(nextState.player.money)
    ? nextState.player.money
    : 0
  if (after >= before) return nextState
  if (after >= floor) return nextState

  logger.warn(
    'Expedition',
    `Rejected a spend that would cross the protected Career Cash floor (${actionType})`,
    { before, after, floor }
  )
  return previousState
}

/**
 * How an active Expedition overrides the legacy daily tick.
 *
 * @remarks
 * Gathered once per day tick so the pure daily-update helpers can apply the
 * Expedition rules without each of them reaching into `state.expedition`.
 */
export interface ExpeditionDayPolicy {
  /** True while an active run overrides the legacy day tick. */
  isActive: boolean
  /** Cash the run may spend on mandatory obligations. */
  spendableCash: number
  /** Floor `player.money` must never cross. */
  protectedCareerCash: number
  /** Obligation a previous day could not pay, carried forward. */
  carriedUnpaidObligation: number
}

/**
 * Reads the day policy for the current state.
 *
 * @param state - Current game state.
 * @returns The policy; `isActive: false` outside a run, where the legacy tick
 * is left completely unchanged.
 */
export const getExpeditionDayPolicy = (
  state: GameState
): ExpeditionDayPolicy => {
  const isActive = state.expedition?.status === 'active'
  return {
    isActive,
    spendableCash: isActive ? getExpeditionSpendableCash(state) : 0,
    protectedCareerCash: isActive
      ? Math.max(0, finiteNumberOr(state.expedition.protectedCareerCash, 0))
      : 0,
    carriedUnpaidObligation: isActive
      ? Math.max(0, finiteNumberOr(state.expedition.unpaidDailyObligation, 0))
      : 0
  }
}

/**
 * Outcome of settling one day's mandatory obligations inside a run.
 */
export interface ExpeditionDaySettlement {
  /** Balance to write, never below the protected slice. */
  nextMoney: number
  /** Amount that could not be paid and carries into the next day. */
  unpaidObligation: number
}

/**
 * Settles a day's mandatory obligations against the run's spendable Cash.
 *
 * @param policy - Day policy for the current run.
 * @param currentMoney - Balance before the settlement.
 * @param dailyCost - Net mandatory cost for the day; negative means net income.
 * @returns The balance to write and the shortfall to carry forward.
 *
 * @remarks
 * Mandatory obligations are the one in-run cost the player cannot decline, so
 * they are allowed to consume the whole spendable slice — but not a cent of the
 * protected Career Cash, and the floor never raises a balance that is already
 * below it. A shortfall is therefore not silently forgiven and not
 * silently taken: it carries forward as evidence, which is what lets the failure
 * shell raise an attributable bankruptcy crisis instead of the run simply
 * stalling.
 *
 * A day whose net result is income still clears carried debt first, so earning
 * the money back is a real recovery rather than a cosmetic one.
 */
export const settleExpeditionDailyObligation = (
  policy: ExpeditionDayPolicy,
  currentMoney: number,
  dailyCost: number
): ExpeditionDaySettlement => {
  const money = finiteNumberOr(currentMoney, 0)
  const due = finiteNumberOr(dailyCost, 0) + policy.carriedUnpaidObligation

  // Net income for the day: nothing is owed, and the balance simply rises.
  if (due <= 0) {
    return { nextMoney: money - due, unpaidObligation: 0 }
  }

  const payable = Math.min(due, Math.max(0, policy.spendableCash))
  // The floor can only stop a payment, never fund one. Earlier stages of the
  // same day tick (the asset and liability ticks) may already have taken the
  // balance below the protected slice, and clamping *up* to it here would
  // conjure the difference into existence.
  const floor = Math.min(money, policy.protectedCareerCash)
  return {
    nextMoney: Math.max(floor, money - payable),
    unpaidObligation: due - payable
  }
}
