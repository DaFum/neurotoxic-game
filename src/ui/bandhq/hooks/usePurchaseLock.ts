import { useState, useCallback, useRef } from 'react'

/**
 * State and helper returned by {@link usePurchaseLock}.
 */
export interface PurchaseLockResult {
  /** Id of the item currently being purchased, or `null` when idle. */
  processingItemId: string | null
  /**
   * Runs a purchase callback under a re-entry lock keyed on `itemId`.
   *
   * The lock is held via a ref (synchronously observable) so a second
   * invocation fired before React re-renders the disabled buy button is
   * dropped. The lock releases in `finally`, after the awaited callback settles.
   *
   * @param itemId - Identifier of the item being purchased.
   * @param run - Purchase side effect to execute while the lock is held.
   */
  runWithLock: (
    itemId: string,
    run: () => void | Promise<void>
  ) => Promise<void>
}

/**
 * Reusable purchase processing lock shared by shop surfaces (Band HQ, Supply
 * Stop) to prevent duplicate purchases from rapid double-clicks. Mirrors the
 * `processingItemId` + ref-guard pattern so a second click is ignored until the
 * first purchase settles, and exposes `processingItemId` for disabling the
 * in-flight item's buy button.
 *
 * @returns The current processing item id and a `runWithLock` runner.
 */
export const usePurchaseLock = (): PurchaseLockResult => {
  const [processingItemId, setProcessingItemId] = useState<string | null>(null)
  const processingItemIdRef = useRef<string | null>(null)

  const runWithLock = useCallback(
    async (itemId: string, run: () => void | Promise<void>) => {
      if (processingItemIdRef.current !== null) return
      processingItemIdRef.current = itemId
      setProcessingItemId(itemId)
      try {
        await run()
        // Hold the lock briefly to allow React to render the disabled state
        await new Promise(resolve => setTimeout(resolve, 100))
      } finally {
        processingItemIdRef.current = null
        setProcessingItemId(null)
      }
    },
    []
  )

  return { processingItemId, runWithLock }
}
