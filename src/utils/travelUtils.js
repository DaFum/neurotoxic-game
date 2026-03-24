import { normalizeVenueId } from './mapUtils.js'
import { clampPlayerMoney } from './gameStateUtils.js'

/**
 * Resolves full venue for capacity checks or fallback naming from VENUES_MAP list
 * @param {Object|string} venue - Venue data or ID
 * @param {string} id - Venue ID
 * @param {Map<string, Object>} venuesMap - Pre-computed map of venues
 * @returns {Object|null} Resolved venue object
 */
export const resolveVenue = (venue, id, venuesMap) => {
  if (typeof venue === 'string') {
    return venuesMap.get(id) || null
  }
  if (!venue || !('capacity' in venue)) {
    return venuesMap.get(id) || venue
  }
  return venue
}

/**
 * Gets the translated name for a location
 * @param {string} location - Location name
 * @param {string} venueId - Venue ID
 * @param {Function} t - Translation function
 * @param {Function} translateLocation - Location translation helper
 * @returns {string} Translated location name
 */
export const getLocationName = (location, venueId, t, translateLocation) => {
  const key = location || venueId || 'Unknown'
  return translateLocation(t, key, key)
}

/**
 * Checks if a venue is accessible to the player
 * @param {Object} params
 * @param {Object} params.node - Target node
 * @param {Object} params.player - Player state
 * @param {Object} params.reputationByRegion - Reputation data
 * @param {Array} params.venueBlacklist - Blacklisted venues
 * @param {Map} params.venuesMap - Map of all venues
 * @param {Function} params.getLocationName - Helper to get location name
 * @returns {Object} { allowed: boolean, errorKey?: string, defaultMessage?: string, errorContext?: Object }
 */
export const checkVenueAccess = ({
  node,
  player,
  reputationByRegion = {},
  venueBlacklist = [],
  venuesMap,
  getLocationName
}) => {
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
      defaultMessage: 'Booking refused: {{location}} has permanently blacklisted you!',
      errorContext: { location: getLocationName(resolvedVenue.name, venueId) }
    }
  }

  if (player?.stats?.proveYourselfMode && resolvedVenue.capacity > 150) {
    return {
      allowed: false,
      errorKey: 'ui:travel.errors.proveYourselfVenueTooBig',
      defaultMessage: 'PROVE YOURSELF MODE: You must rebuild your reputation in small venues (150 cap or less). {{location}} is too big!',
      errorContext: { location: getLocationName(resolvedVenue.name, venueId) }
    }
  }

  const regionId = venueId?.split('_')?.[0] || 'Unknown'
  if ((reputationByRegion[regionId] || 0) <= -30) {
    return {
      allowed: false,
      errorKey: 'ui:travel.errors.bookingRefusedRegionalReputation',
      defaultMessage: 'Booking refused: The venue in {{location}} blacklisted you due to poor regional reputation!',
      errorContext: { location: getLocationName(resolvedVenue.name, venueId) }
    }
  }

  return { allowed: true, resolvedVenue }
}

/**
 * Checks if a travel to a node is physically possible (visibility/connectivity)
 * @param {Object} node - Target node
 * @param {string} visibility - Visibility state
 * @param {boolean} isConnected - Whether target is connected to current
 * @returns {Object} { allowed: boolean, errorKey?: string, defaultMessage?: string }
 */
export const checkTravelPrerequisites = (node, visibility, isConnected) => {
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
 * Checks if the player has enough money and fuel for travel
 * @param {number} totalCost - Required money
 * @param {number} fuelLiters - Required fuel
 * @param {Object} player - Player state
 * @returns {Object} { allowed: boolean, errorKey?: string, defaultMessage?: string }
 */
export const checkTravelResources = (totalCost, fuelLiters, player) => {
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
