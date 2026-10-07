import { useEffect } from 'react'
import { useGameSelector, useGameActions } from '../context/GameState'
import { useDisclosure } from './useDisclosure'

/**
 * Hook to manage BandHQ modal state.
 * Used in MainMenu and Overworld scenes.
 */
export const useBandHQModal = () => {
  const pendingBandHQOpen = useGameSelector(state => state.pendingBandHQOpen)
  const { setPendingBandHQOpen } = useGameActions()

  const {
    isOpen: showHQ,
    open: openHQ,
    close: closeHQ
  } = useDisclosure(pendingBandHQOpen)

  // Cross-scene opening (e.g. from MainMenu into Overworld) arrives as the
  // persisted `pendingBandHQOpen` flag; consume it and clear it.
  useEffect(() => {
    if (!pendingBandHQOpen) return
    // Syncing local visibility from the persisted cross-scene flag is the
    // point of this effect; the state update is intentional.
    openHQ()
    setPendingBandHQOpen(false)
  }, [pendingBandHQOpen, openHQ, setPendingBandHQOpen])

  return {
    showHQ,
    openHQ,
    closeHQ
  }
}
