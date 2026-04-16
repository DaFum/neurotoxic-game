// @ts-nocheck
// TODO: Review this file
const VENUE_NAMESPACE = 'venues:'
const VENUE_NAME_SUFFIX = '.name'

const toVenueKey = location => {
  if (!location || typeof location !== 'string') return ''
  if (location.startsWith(VENUE_NAMESPACE)) return location
  return `${VENUE_NAMESPACE}${location}${VENUE_NAME_SUFFIX}`
}

export const translateLocation = (t, location, fallback = 'Unknown') => {
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
