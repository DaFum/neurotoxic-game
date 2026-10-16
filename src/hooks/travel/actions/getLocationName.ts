import i18n from '../../../i18n'
import { getLocationName as getLocationNameUtil } from '../../../utils/travelUtils'
import { translateLocation } from '../../../utils/locationI18n'

/**
 * Resolves a localized location name using the current i18n context.
 *
 * @param location - Location key or display name.
 * @param venueId - Venue ID used when no location is provided.
 * @returns The translated location name or its readable fallback.
 */
export const getLocationName = (
  location: string | undefined,
  venueId?: string | null
): string =>
  getLocationNameUtil(location, venueId, i18n.t.bind(i18n), translateLocation)
