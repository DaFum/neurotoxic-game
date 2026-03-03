import { useState, useCallback, useMemo } from 'react'
import { useGameState } from '../context/GameState.jsx'

/**
 * Hook to manage Quests modal state and props.
 * Used in the Overworld scene.
 */
export const useQuestsModal = () => {
  const [showQuests, setShowQuests] = useState(false)
  const gameState = useGameState()

  const openQuests = useCallback(() => setShowQuests(true), [])
  const closeQuests = useCallback(() => setShowQuests(false), [])

  const questsProps = useMemo(
    () => ({
      onClose: closeQuests,
      activeQuests: gameState.activeQuests || [],
      player: gameState.player
    }),
    [
      closeQuests,
      gameState.activeQuests,
      gameState.player
    ]
  )

  return {
    showQuests,
    openQuests,
    closeQuests,
    questsProps
  }
}
