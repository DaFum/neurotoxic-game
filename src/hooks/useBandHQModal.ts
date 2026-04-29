import { useState, useCallback, useEffect } from 'react'

// Track if the modal should automatically open upon entering a scene.
let pendingBandHQOpen = false

export const setPendingBandHQOpen = (value: boolean) => {
  pendingBandHQOpen = value
}

/**
 * Hook to manage BandHQ modal state.
 * Used in MainMenu and Overworld scenes.
 */
export const useBandHQModal = () => {
  const [showHQ, setShowHQ] = useState(pendingBandHQOpen)

  useEffect(() => {
    if (pendingBandHQOpen) {
      setPendingBandHQOpen(false)
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
