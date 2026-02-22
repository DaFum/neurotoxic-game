import { useState, useCallback, useMemo } from 'react'
import { useGameState } from '../context/GameState.jsx'
import { useAudioControl } from './useAudioControl.js'

/**
 * Hook to manage BandHQ modal state and props.
 * Used in MainMenu and Overworld scenes.
 */
export const useBandHQModal = () => {
  const [showHQ, setShowHQ] = useState(false)
  const gameState = useGameState()
  const { audioState, handleAudioChange } = useAudioControl()

  const openHQ = useCallback(() => setShowHQ(true), [])
  const closeHQ = useCallback(() => setShowHQ(false), [])

  const bandHQProps = useMemo(
    () => ({
      onClose: closeHQ,
      player: gameState.player,
      band: gameState.band,
      social: gameState.social,
      updatePlayer: gameState.updatePlayer,
      updateBand: gameState.updateBand,
      addToast: gameState.addToast,
      settings: gameState.settings,
      updateSettings: gameState.updateSettings,
      deleteSave: gameState.deleteSave,
      setlist: gameState.setlist,
      setSetlist: gameState.setSetlist,
      audioState,
      onAudioChange: handleAudioChange
    }),
    [
      closeHQ,
      gameState.player,
      gameState.band,
      gameState.social,
      gameState.updatePlayer,
      gameState.updateBand,
      gameState.addToast,
      gameState.settings,
      gameState.updateSettings,
      gameState.deleteSave,
      gameState.setlist,
      gameState.setSetlist,
      audioState,
      handleAudioChange
    ]
  )

  return {
    showHQ,
    openHQ,
    closeHQ,
    bandHQProps
  }
}
