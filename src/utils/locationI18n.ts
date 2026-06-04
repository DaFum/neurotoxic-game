import type { TranslationCallback } from '../types/callbacks'

const VENUE_NAMESPACE = 'venues:'
const VENUE_NAME_SUFFIX = '.name'

const toVenueKey = (location: string) => {
  if (!location || typeof location !== 'string') return ''
  if (location.startsWith(VENUE_NAMESPACE)) return location
  return `${VENUE_NAMESPACE}${location}${VENUE_NAME_SUFFIX}`
}

/**
 * Resolves a venue location string through i18n with a readable fallback.
 *
 * @param t - Translation callback.
 * @param location - Raw venue id, i18n key, or fallback label.
 * @param fallback - Text returned when no location can be resolved.
 * @returns Translated venue name or readable fallback text.
 */
export const translateLocation = (
  t: TranslationCallback,
  location: string,
  fallback = 'Unknown'
) => {
  if (typeof t !== 'function') return fallback

  const key = toVenueKey(location)
  if (!key) return fallback

  const translated = t(key, { defaultValue: '' })
  if (translated && translated !== key) return translated

  if (location && location.startsWith(VENUE_NAMESPACE)) {
    return location
      .slice(VENUE_NAMESPACE.length)
      .replace(VENUE_NAME_SUFFIX, '')
      .replace(/_/g, ' ')
  }

  return location || fallback
}
