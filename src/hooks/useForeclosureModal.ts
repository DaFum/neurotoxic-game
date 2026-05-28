import { useCallback } from 'react'
import { useGameSelector, useGameActions } from '../context/GameState'
import type { AssetKind } from '../types/assets'

export const useForeclosureModal = (): {
  isOpen: boolean
  currentKind: AssetKind | null
  dismiss: () => void
} => {
  const pendingForeclosureNotices = useGameSelector(
    state => state.pendingForeclosureNotices
  )
  const { dismissForeclosureNotice } = useGameActions()
  const currentKind = pendingForeclosureNotices[0] ?? null

  const dismiss = useCallback(() => {
    if (currentKind !== null) {
      dismissForeclosureNotice(currentKind)
    }
  }, [currentKind, dismissForeclosureNotice])

  return {
    isOpen: pendingForeclosureNotices.length > 0,
    currentKind,
    dismiss
  }
}
