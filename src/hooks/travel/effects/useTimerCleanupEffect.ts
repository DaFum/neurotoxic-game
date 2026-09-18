import { useEffect } from 'react'
import type { TravelRefsBundle } from '../types'

/**
 * Automatically clears active timeouts when a travel sequence component unmounts.
 *
 * @remarks
 * This cleanup effect ensures that stray pending callbacks do not execute and
 * mutate state after the component tree has collapsed. The tracked timers
 * represent confirmation expiry and the softlock game-over countdown. Note that
 * because the ref identities are intentionally stable across renders, this
 * cleanup runs exclusively on unmount, not on component re-renders.
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
