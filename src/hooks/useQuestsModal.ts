import { useMemo } from 'react'
import { useGameSelector } from '../context/GameState.tsx'
import { useDisclosure } from './useDisclosure'

/**
 * Hook to manage Quests modal state and props.
 * Used in the Overworld scene.
 */
export const useQuestsModal = () => {
  const {
    isOpen: showQuests,
    open: openQuests,
    close: closeQuests
  } = useDisclosure()
  const activeQuests = useGameSelector(state => state.activeQuests)
  const player = useGameSelector(state => state.player)

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
