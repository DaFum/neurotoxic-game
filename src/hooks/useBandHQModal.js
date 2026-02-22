import { useState } from 'react'
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

  const openHQ = () => setShowHQ(true)
  const closeHQ = () => setShowHQ(false)

  const bandHQProps = {
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
  }

  return {
    showHQ,
    openHQ,
    closeHQ,
    bandHQProps
  }
}
