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
    if (pendingBandHQOpen) {
      // Use setTimeout to defer the state update and avoid synchronous re-render warnings
      // as suggested by CI Copilot reviewer to resolve @eslint-react/set-state-in-effect
      const timer = setTimeout(() => {
        setShowHQ(true)
        setPendingBandHQOpen(false)
      }, 0)
      return () => clearTimeout(timer)
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
