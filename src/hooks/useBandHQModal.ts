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

  // Sync state if pendingBandHQOpen changes to true
  // This is a render-phase update which is valid for syncing state from props/selectors
  // and avoids the useEffect set-state warning.
  if (pendingBandHQOpen && !showHQ) {
    setShowHQ(true)
  }

  useEffect(() => {
    if (pendingBandHQOpen) {
      setPendingBandHQOpen(false)
    }
  }, [pendingBandHQOpen, setPendingBandHQOpen])

  useEffect(() => {
    const handleOpen = (event: CustomEvent<{ target: string }>) => {
      if (event.detail?.target === 'bandhq') {
        setShowHQ(true)
      }
    }
    window.addEventListener('open-modal', handleOpen as EventListener)
    return () => {
      window.removeEventListener('open-modal', handleOpen as EventListener)
    }
  }, [])

  const openHQ = useCallback(() => setShowHQ(true), [])
  const closeHQ = useCallback(() => setShowHQ(false), [])

  return {
    showHQ,
    openHQ,
    closeHQ
  }
}
