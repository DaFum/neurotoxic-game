import { useCallback } from 'react'
import type { TravelActionsParams } from '../types'

export const useClearPendingTravel = ({
  refs,
  setters
}: Pick<TravelActionsParams, 'refs' | 'setters'>) => {
  return useCallback(() => {
    if (refs.pendingTimeoutRef.current) {
      clearTimeout(refs.pendingTimeoutRef.current)
      refs.pendingTimeoutRef.current = null
    }
    setters.setPendingTravelNode(null)
    refs.pendingTravelNodeRef.current = null
  }, [setters, refs])
}
