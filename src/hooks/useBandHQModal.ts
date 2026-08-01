import { useState, useCallback, useEffect } from 'react'
import { useGameSelector, useGameActions } from '../context/GameState'

/**
 * Hook to manage BandHQ modal state.
 * Used in MainMenu and Overworld scenes.
 */
export const useBandHQModal = () => {
  const pendingBandHQOpen = useGameSelector(state => state.pendingBandHQOpen)
  const { setPendingBandHQOpen } = useGameActions()

  const [showHQ, setShowHQ] = useState(pendingBandHQOpen)

  // Cross-scene opening (e.g. from MainMenu into Overworld) arrives as the
  // persisted `pendingBandHQOpen` flag; consume it and clear it.
  useEffect(() => {
    if (!pendingBandHQOpen) return
    setShowHQ(true)
    setPendingBandHQOpen(false)
  }, [pendingBandHQOpen, setPendingBandHQOpen])

  const openHQ = useCallback(() => setShowHQ(true), [])
  const closeHQ = useCallback(() => setShowHQ(false), [])

  return {
    showHQ,
    openHQ,
    closeHQ
  }
}
