import { useCallback } from 'react'
import i18n from '../../../i18n'
import { getLocationName as getLocationNameUtil } from '../../../utils/travelUtils'
import { translateLocation } from '../../../utils/locationI18n'

/**
 * Provides a localized and formatted location name resolver.
 *
 * @remarks
 * This hook wraps the core `getLocationNameUtil` with the current `i18n` translation
 * context, returning a memoized callback suitable for rendering localized city, venue,
 * or custom node names in UI components.
 *
 * @returns A memoized callback function that takes a location key and an optional venue ID, returning the localized location name string.
 *
 * @example
 * ```ts
 * const getLocationName = useGetLocationName()
 * const displayName = getLocationName('berlin', 'venue_underground')
 * ```
 */
export const useGetLocationName = () => {
  return useCallback(
    (location: string | undefined, venueId?: string | null) => {
      return getLocationNameUtil(
        location,
        venueId,
        i18n.t.bind(i18n),
        translateLocation
      )
    },
    []
  )
}
