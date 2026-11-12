import { useCallback } from 'react'
import type { TravelActionsParams } from '../types'

/**
 * Clears any pending travel timeout, removes the confirmation toast, and resets
 * the pending travel node state.
 *
 * @remarks
 * This hook is used to abort or clean up travel actions that are queued but have not yet executed.
 * It ensures both the React state and the mutable refs are synchronized to null, preventing state desync.
 *
 * @param params - The destructured refs and setters required for clearing the pending travel state.
 * @returns A stable callback function that executes the clear operation when invoked.
 */
export const useClearPendingTravel = (
  params: Pick<TravelActionsParams, 'refs' | 'setters' | 'params'>
) => {
  const { refs, setters } = params
  const { removeToast } = params.params
  return useCallback(() => {
    let toastIdToRemove: string | null = null

    if (refs.phaseRef?.current.status === 'confirming') {
      const { timeoutId, toastId } = refs.phaseRef.current
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      toastIdToRemove = toastId
      refs.phaseRef.current = { status: 'idle' }
      setters.setPhase?.({ status: 'idle' })
    }

    if (refs.pendingTimeoutRef?.current) {
      clearTimeout(refs.pendingTimeoutRef.current)
      refs.pendingTimeoutRef.current = null
    }

    if (toastIdToRemove) {
      removeToast(toastIdToRemove)
      if (refs.pendingToastIdRef) {
        refs.pendingToastIdRef.current = null
      }
    } else if (refs.pendingToastIdRef?.current) {
      removeToast(refs.pendingToastIdRef.current)
      refs.pendingToastIdRef.current = null
    }

    if (refs.pendingTravelNodeRef) {
      refs.pendingTravelNodeRef.current = null
    }
    setters.setPendingTravelNode?.(null)
  }, [setters, refs, removeToast])
}
