import { logger } from '../logger'
import type { CityTraitState } from '../../types'

const warnedMalformedVenueIds = new Set<string>()

/**
 * Derives the city key from a venue ID (e.g. 'berlin_so36' → 'berlin').
 *
 * Returns '' when the ID has no underscore; callers must guard against the
 * empty string. In dev builds a malformed non-empty ID emits a warning so
 * legacy/typo'd venue IDs surface rather than silently disabling city intel.
 *
 * @param venueId - Canonical venue id containing a city prefix.
 * @returns Prefix before the first underscore, or an empty string for malformed ids.
 */
export const getCityKeyFromVenueId = (venueId: string): string => {
  const idx = venueId.indexOf('_')
  if (idx === -1) {
    if (
      venueId.length > 0 &&
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV !== 'production' &&
      !warnedMalformedVenueIds.has(venueId)
    ) {
      warnedMalformedVenueIds.add(venueId)
      logger.warn(
        'mapGenerator',
        `Malformed venue ID "${venueId}" has no underscore; city intel will be empty`
      )
    }
    return ''
  }
  return venueId.slice(0, idx)
}

const CITY_TRAIT_GENRES = [
  'punk',
  'metal',
  'goth',
  'indie',
  'synth',
  'noise',
  'hardcore'
] as const

const CITY_TRAIT_SPENDING_PROFILES = [
  'stingy',
  'average',
  'generous',
  'drunkards',
  'merch-hungry'
] as const

const hashCityKey = (cityKey: string): number => {
  let h = 2166136261
  for (let i = 0; i < cityKey.length; i++) {
    h ^= cityKey.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Deterministically derive city traits for a given city key. Used to backfill
 * `cityStates` for saved maps that predate the city intel system.
 *
 * @param cityKey - City key extracted from a venue id.
 * @returns Deterministic city trait profile for genre bias, attention span, and spending.
 */
export const deriveCityTraits = (cityKey: string): CityTraitState => {
  const h = hashCityKey(cityKey)
  const genreBias = CITY_TRAIT_GENRES[h % CITY_TRAIT_GENRES.length] ?? 'unknown'
  const attentionSpan = 15 + ((h >>> 8) % 45)
  const barSpendingProfile =
    CITY_TRAIT_SPENDING_PROFILES[
      (h >>> 16) % CITY_TRAIT_SPENDING_PROFILES.length
    ] ?? 'average'
  return { genreBias, attentionSpan, barSpendingProfile }
}
