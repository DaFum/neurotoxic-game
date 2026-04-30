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

  useEffect(() => {
    let timeout: number | undefined
    if (pendingBandHQOpen) {
      timeout = window.setTimeout(() => {
        setShowHQ(true)
        setPendingBandHQOpen(false)
      }, 0)
    }
    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout)
      }
    }
  }, [pendingBandHQOpen, setPendingBandHQOpen])

  const openHQ = useCallback(() => setShowHQ(true), [])
  const closeHQ = useCallback(() => setShowHQ(false), [])

  return {
    showHQ,
    openHQ,
    closeHQ
  }
}
