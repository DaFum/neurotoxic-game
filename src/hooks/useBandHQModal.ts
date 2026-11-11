import { useEffect } from 'react'
import { useGameSelector, useGameActions } from '../context/GameState'
import { useDisclosure } from './useDisclosure'

/**
 * Hook to manage BandHQ modal state.
 * Used in MainMenu and Overworld scenes.
 */
export const useBandHQModal = () => {
  const pendingBandHQOpen = useGameSelector(
    state => state.pendingOverlay?.kind === 'band_hq'
  )
  // An HQ request made while another overlay was pending waits here until the
  // single overlay slot is free again.
  const deferredBandHQOpen = useGameSelector(
    state => state.deferredBandHQOpen === true && !state.pendingOverlay
  )
  const { setPendingBandHQOpen } = useGameActions()

  const {
    isOpen: showHQ,
    open: openHQ,
    close: closeHQ
  } = useDisclosure(pendingBandHQOpen)

  // Cross-scene opening (e.g. from MainMenu into Overworld) arrives as the
  // `pendingOverlay: { kind: 'band_hq' }`; consume it and clear it.
  useEffect(() => {
    if (!pendingBandHQOpen) return
    // Syncing local visibility from the pending overlay flag is the
    // point of this effect; the state update is intentional.
    openHQ()
    setPendingBandHQOpen(false)
  }, [pendingBandHQOpen, openHQ, setPendingBandHQOpen])

  useEffect(() => {
    if (deferredBandHQOpen) setPendingBandHQOpen(true)
  }, [deferredBandHQOpen, setPendingBandHQOpen])

  return {
    showHQ,
    openHQ,
    closeHQ
  }
}
