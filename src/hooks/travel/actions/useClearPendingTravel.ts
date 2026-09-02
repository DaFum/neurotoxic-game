import { useCallback } from 'react'
import type { TravelActionsParams } from '../types'

/**
 * Clears any pending travel timeout and resets the pending travel node state.
 *
 * @remarks
 * This hook is used to abort or clean up travel actions that are queued but have not yet executed.
 * It ensures both the React state and the mutable refs are synchronized to null, preventing state desync.
 *
 * @param options - The destructured refs and setters required for clearing the pending travel state.
 * @returns A stable callback function that executes the clear operation when invoked.
 */
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
