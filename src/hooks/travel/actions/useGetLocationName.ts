import { useCallback } from 'react'
import i18n from '../../../i18n'
import { getLocationName as getLocationNameUtil } from '../../../utils/travelUtils'
import { translateLocation } from '../../../utils/locationI18n'

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
