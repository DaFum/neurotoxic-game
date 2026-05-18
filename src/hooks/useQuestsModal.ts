import { useState, useCallback, useMemo } from 'react'
import { useGameSelector } from '../context/GameState.tsx'

/**
 * Hook to manage Quests modal state and props.
 * Used in the Overworld scene.
 */
export const useQuestsModal = () => {
  const [showQuests, setShowQuests] = useState(false)
  const activeQuests = useGameSelector(state => state.activeQuests)
  const player = useGameSelector(state => state.player)

  const openQuests = useCallback(() => setShowQuests(true), [])
  const closeQuests = useCallback(() => setShowQuests(false), [])

  const questsProps = useMemo(
    () => ({
      onClose: closeQuests,
      activeQuests: activeQuests ?? [],
      player
    }),
    [closeQuests, activeQuests, player]
  )

  return {
    showQuests,
    openQuests,
    closeQuests,
    questsProps
  }
}
