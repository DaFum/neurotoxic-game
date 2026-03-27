import { useState, useCallback, useMemo } from 'react'
import { useGameState } from '../context/GameState.jsx'

/**
 * Builds the props object for the Quests modal.
 * @param {Function} onClose - The function to close the modal.
 * @param {Array} activeQuests - The array of active quests from game state.
 * @param {Object} player - The player object from game state.
 * @returns {Object} Props required by the Quests modal component.
 */
export const buildQuestsProps = (onClose, activeQuests, player) => ({
  onClose,
  activeQuests: activeQuests || [],
  player
})

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
    () =>
      buildQuestsProps(closeQuests, gameState.activeQuests, gameState.player),
    [closeQuests, gameState.activeQuests, gameState.player]
  )

  return {
    showQuests,
    openQuests,
    closeQuests,
    questsProps
  }
}
