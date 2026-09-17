import { useEffect } from 'react'
import type { TravelRefsBundle } from '../types'

/**
 * Automatically clears active timeouts when a travel sequence unmounts or restarts.
 *
 * @remarks
 * This cleanup effect ensures that stray pending callbacks for travel initiation
 * or node transitions do not execute and mutate state after the component tree
 * has collapsed or the user has navigated away.
 *
 * @param refs - A bundle of mutable React refs containing timeout identifiers
 */
export const useTimerCleanupEffect = (refs: TravelRefsBundle) => {
  useEffect(() => {
    return () => {
      if (refs.timeoutRef.current) {
        clearTimeout(refs.timeoutRef.current)
        refs.timeoutRef.current = null
      }
      if (refs.pendingTimeoutRef.current) {
        clearTimeout(refs.pendingTimeoutRef.current)
        refs.pendingTimeoutRef.current = null
      }
    }
  }, [refs.timeoutRef, refs.pendingTimeoutRef])
}
