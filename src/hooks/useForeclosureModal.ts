import { useCallback } from 'react'
import { useGameSelector, useGameActions } from '../context/GameState'
import type { AssetKind } from '../types/assets'

/**
 * Derives foreclosure modal visibility and dismissal action from pending notices.
 *
 * @returns Current foreclosure notice kind, open flag, and dismiss callback.
 */
export const useForeclosureModal = (): {
  isOpen: boolean
  currentKind: AssetKind | null
  dismiss: () => void
} => {
  const pendingForeclosureNotices = useGameSelector(
    state => state.pendingForeclosureNotices
  )
  const { dismissForeclosureNotice } = useGameActions()
  // Defensive access: legacy/hand-edited saves (and partial test states) may
  // lack `pendingForeclosureNotices` even though the type marks it required.
  const currentKind = pendingForeclosureNotices?.[0] ?? null

  const dismiss = useCallback(() => {
    if (currentKind !== null) {
      dismissForeclosureNotice(currentKind)
    }
  }, [currentKind, dismissForeclosureNotice])

  return {
    isOpen: (pendingForeclosureNotices?.length ?? 0) > 0,
    currentKind,
    dismiss
  }
}
