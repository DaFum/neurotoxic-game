import { useMemo } from 'react'
import { useGameSelector } from '../context/GameState.tsx'
import { getCurrentVenueId } from '../domain/questEffects'
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
  const currentVenueId = useGameSelector(state => getCurrentVenueId(state))

  const questsProps = useMemo(
    () => ({
      onClose: closeQuests,
      activeQuests: activeQuests ?? [],
      player,
      currentVenueId
    }),
    [closeQuests, activeQuests, player, currentVenueId]
  )

  return {
    showQuests,
    openQuests,
    closeQuests,
    questsProps
  }
}
