import { normalizeVenueId } from './mapUtils'
import { getCityKeyFromVenueId } from './mapGenerator'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampMemberStamina,
  finiteNumberOr,
  isEmptyObject
} from './gameState'
import type { BandState, MapNode, PlayerState, Venue } from '../types'
import type { AssetModifiers } from '../types/assets'
import type { TranslationCallback } from '../types/callbacks'

interface VenueLike extends Partial<Venue> {
  [key: string]: unknown
}

type VenueMap = Map<string, VenueLike>

interface VenueAccessResult {
  allowed: boolean
  resolvedVenue?: VenueLike
  errorKey?: string
  defaultMessage?: string
  errorContext?: Record<string, unknown>
}

interface TravelArrivalUpdateInput {
  player: PlayerState
  band: BandState
  node: MapNode & { venue?: unknown }
  fuelLiters: number
  totalCost: number
  assetModifiers?: Pick<AssetModifiers, 'travelStaminaRegen'>
}

interface TravelArrivalUpdates {
  nextPlayer: Partial<PlayerState>
  nextBand: Partial<BandState> | null
}

type ResolvedTravelVenue = Venue & { capacity: number }

const isResolvedTravelVenue = (
  value: unknown
): value is ResolvedTravelVenue => {
  if (!value || typeof value !== 'object') return false
  const venue = value as { id?: unknown; name?: unknown; capacity?: unknown }
  return (
    Object.hasOwn(value, 'id') &&
    Object.hasOwn(value, 'name') &&
    Object.hasOwn(value, 'capacity') &&
    typeof venue.id === 'string' &&
    typeof venue.name === 'string' &&
    typeof venue.capacity === 'number' &&
    Number.isFinite(venue.capacity)
  )
}

/**
 * Resolves full venue for capacity checks or fallback naming from VENUES_MAP list
 * @param venue - Venue data or ID
 * @param id - Venue ID
 * @param venuesMap - Pre-computed map of venues
 * @returns Resolved venue object
 */
export const resolveVenue = (
  venue: VenueLike | string | null | undefined,
  id: string | null | undefined,
  venuesMap: VenueMap
): VenueLike | null => {
  if (typeof venue === 'string') {
    return venuesMap.get(id ?? '') || null
  }
  if (!venue || !Object.hasOwn(venue, 'capacity')) {
    return venuesMap.get(id ?? '') || venue || null
  }
  return venue
}

/**
 * Resolves travel venue input to the full venue shape required by access checks.
 *
 * @param venue - Venue object, venue id, or missing venue value from a map node.
 * @param venuesMap - Precomputed venue lookup keyed by canonical venue id.
 * @returns Resolved travel venue, or null when the venue cannot be resolved.
 */
export const resolveTravelVenue = (
  venue: VenueLike | string | null | undefined,
  venuesMap: VenueMap
): ResolvedTravelVenue | null => {
  const venueId = normalizeVenueId(venue)
  const resolvedVenue = resolveVenue(venue, venueId, venuesMap)
  return isResolvedTravelVenue(resolvedVenue) ? resolvedVenue : null
}

/**
 * Gets the translated name for a location
 * @param location - Location name
 * @param venueId - Venue ID
 * @param t - Translation function
 * @param translateLocation - Location translation helper
 * @returns Translated location name
 */
export const getLocationName = (
  location: string | undefined,
  venueId: string | null | undefined,
  t: TranslationCallback,
  translateLocation: (
    t: TranslationCallback,
    locationKey: string,
    fallback: string
  ) => string
): string => {
  const key = location || venueId || 'Unknown'
  return translateLocation(t, key, key)
}

/**
 * Checks reputation, blacklist, and challenge-mode access for a map venue.
 *
 * @param params - Venue access inputs from the travel confirmation flow.
 * - `params.node` - Target node
 * - `params.player` - Player state
 * - `params.reputationByRegion` - Reputation data
 * - `params.venueBlacklist` - Blacklisted venues
 * - `params.venuesMap` - Map of all venues
 * - `params.getLocationName` - Helper to get location name
 * @returns Access result with localized error metadata when travel is blocked.
 */
export const checkVenueAccess = ({
  node,
  player,
  reputationByRegion = {},
  venueBlacklist = [],
  venuesMap,
  getLocationName
}: {
  node: MapNode & { type?: string; venue?: VenueLike | string }
  player: PlayerState
  reputationByRegion?: Record<string, number>
  venueBlacklist?: string[]
  venuesMap: VenueMap
  getLocationName: (
    location: string | undefined,
    venueId: string | null | undefined
  ) => string
}): VenueAccessResult => {
  if (node.type === 'START' || !node.venue) {
    return { allowed: true }
  }

  const venueId = normalizeVenueId(node.venue)
  const resolvedVenue = resolveVenue(node.venue, venueId, venuesMap)

  if (!resolvedVenue) {
    return {
      allowed: false,
      errorKey: 'ui:errors.invalidVenueData',
      defaultMessage: 'Invalid venue data.'
    }
  }

  if (venueId && venueBlacklist.includes(venueId)) {
    return {
      allowed: false,
      errorKey: 'ui:travel.errors.bookingRefusedBlacklisted',
      defaultMessage:
        'Booking refused: {{location}} has permanently blacklisted you!',
      errorContext: { location: getLocationName(resolvedVenue.name, venueId) }
    }
  }

  if (player?.stats?.proveYourselfMode && (resolvedVenue.capacity ?? 0) > 150) {
    return {
      allowed: false,
      errorKey: 'ui:travel.errors.proveYourselfVenueTooBig',
      defaultMessage:
        'PROVE YOURSELF MODE: You must rebuild your reputation in small venues (150 cap or less). {{location}} is too big!',
      errorContext: {
        location: getLocationName(resolvedVenue.name, venueId ?? undefined)
      }
    }
  }

  const regionId = (venueId && getCityKeyFromVenueId(venueId)) || 'Unknown'
  if ((reputationByRegion[regionId] ?? 0) <= -30) {
    return {
      allowed: false,
      errorKey: 'ui:travel.errors.bookingRefusedRegionalReputation',
      defaultMessage:
        'Booking refused: The venue in {{location}} blacklisted you due to poor regional reputation!',
      errorContext: {
        location: getLocationName(resolvedVenue.name, venueId ?? undefined)
      }
    }
  }

  return { allowed: true, resolvedVenue }
}

/**
 * Checks whether the target node is visible and connected to the current route.
 *
 * @param node - Target map node.
 * @param visibility - Resolved node visibility state.
 * @param isConnected - Whether the target is connected to the current node.
 * @returns Access result with localized error metadata when routing is blocked.
 */
export const checkTravelPrerequisites = (
  node: MapNode & { type?: string },
  visibility: string,
  isConnected: boolean
): VenueAccessResult => {
  if (node.type === 'START') {
    return { allowed: true }
  }

  if (visibility !== 'visible' || !isConnected) {
    return {
      allowed: false,
      errorKey:
        visibility !== 'visible'
          ? 'ui:travel.errors.locationNotVisible'
          : 'ui:travel.errors.locationNotConnected',
      defaultMessage:
        visibility !== 'visible'
          ? 'Cannot travel: location not visible'
          : 'Cannot travel: location not connected'
    }
  }

  return { allowed: true }
}

/**
 * Checks whether the player can pay the money and fuel costs for travel.
 *
 * @param totalCost - Required money after travel-cost calculations.
 * @param fuelLiters - Required fuel in liters.
 * @param player - Player state used for current money and van fuel.
 * @returns Access result with localized error metadata when resources are short.
 */
export const checkTravelResources = (
  totalCost: number,
  fuelLiters: number,
  player: PlayerState
): VenueAccessResult => {
  if (clampPlayerMoney(player.money ?? 0) < totalCost) {
    return {
      allowed: false,
      errorKey: 'ui:travel.errors.notEnoughMoneyForTravel',
      defaultMessage: 'Not enough money for gas and food!'
    }
  }

  if (Math.max(0, player.van?.fuel ?? 0) < fuelLiters) {
    return {
      allowed: false,
      errorKey: 'ui:travel.errors.notEnoughFuel',
      defaultMessage: 'Not enough fuel in the tank!'
    }
  }

  return { allowed: true }
}

/**
 * Builds player and band patches applied after successful travel arrival.
 *
 * @param input - Travel arrival inputs containing player, band, destination,
 * fuel cost, money cost, and active asset modifiers.
 * @returns Player patch and optional band patch for arrival side effects.
 */
export const getTravelArrivalUpdates = ({
  player,
  band,
  node,
  fuelLiters,
  totalCost,
  assetModifiers
}: TravelArrivalUpdateInput): TravelArrivalUpdates => {
  const nextPlayer = {
    money: clampPlayerMoney((player.money ?? 0) - totalCost),
    van: {
      ...player.van,
      fuel: Math.max(0, (player.van?.fuel ?? 0) - fuelLiters)
    },
    location:
      getCityKeyFromVenueId(normalizeVenueId(node.venue) ?? '') || 'Unknown',
    currentNodeId: node.id,
    totalTravels: (player.totalTravels ?? 0) + 1
  }

  const bandPatch: Partial<BandState> = {}
  if (band?.harmonyRegenTravel) {
    bandPatch.harmony = clampBandHarmony((band.harmony ?? 0) + 5)
  }
  const travelStaminaRegen = finiteNumberOr(
    assetModifiers?.travelStaminaRegen,
    0
  )
  if (travelStaminaRegen > 0 && Array.isArray(band?.members)) {
    bandPatch.members = band.members.map(member => ({
      ...member,
      stamina: clampMemberStamina(
        finiteNumberOr(member.stamina, 0) + travelStaminaRegen,
        finiteNumberOr(member.staminaMax, 100)
      )
    }))
  }

  const nextBand = !isEmptyObject(bandPatch) ? bandPatch : null

  return { nextPlayer, nextBand }
}
