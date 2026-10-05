import { logger } from '../logger'
import { fnv1a32 } from '../stringUtils'
import type { CityTraitState } from '../../types'

const warnedMalformedVenueIds = new Set<string>()

/**
 * Pure city-prefix extraction shared by `getCityKeyFromVenueId` and
 * `getRegionKeyForLocation` (`mapUtils`), so the two cannot disagree on what a
 * venue id's city is.
 *
 * @param venueId - Venue id such as `berlin_so36`.
 * @returns The prefix before the first underscore, or `''` when the id has no
 * underscore or starts with one.
 */
export const getCityPrefix = (venueId: string): string => {
  const idx = venueId.indexOf('_')
  return idx > 0 ? venueId.slice(0, idx) : ''
}

/**
 * Derives the city key from a venue ID (e.g. 'berlin_so36' → 'berlin').
 *
 * Returns '' when the ID has no underscore; callers must guard against the
 * empty string. In dev builds a malformed non-empty ID emits a warning so
 * legacy/typo'd venue IDs surface rather than silently disabling city intel.
 * `getRegionKeyForLocation` shares {@link getCityPrefix} but, for city keys
 * stored as-is (e.g. `stendal`), falls back to the whole id instead of `''`.
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
  return getCityPrefix(venueId)
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

/**
 * Deterministically derive city traits for a given city key. Used to backfill
 * `cityStates` for saved maps that predate the city intel system.
 *
 * @param cityKey - City key extracted from a venue id.
 * @returns Deterministic city trait profile for genre bias, attention span, and spending.
 */
export const deriveCityTraits = (cityKey: string): CityTraitState => {
  const h = fnv1a32(cityKey)
  const genreBias = CITY_TRAIT_GENRES[h % CITY_TRAIT_GENRES.length] ?? 'unknown'
  const attentionSpan = 15 + ((h >>> 8) % 45)
  const barSpendingProfile =
    CITY_TRAIT_SPENDING_PROFILES[
      (h >>> 16) % CITY_TRAIT_SPENDING_PROFILES.length
    ] ?? 'average'
  return { genreBias, attentionSpan, barSpendingProfile }
}
