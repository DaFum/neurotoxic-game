import { useState, useCallback } from 'react'
import { useGameState } from '../context/GameState'

/**
 * Hook to manage the Contraband Stash UI state and actions.
 * @returns {Object} Stash state and handlers
 */
export const useContrabandStash = () => {
  const { band, dispatch, addToast } = useGameState()
  const [showStash, setShowStash] = useState(false)
  const [selectedMember, setSelectedMember] = useState(band.members[0]?.id)

  const openStash = useCallback(() => setShowStash(true), [])
  const closeStash = useCallback(() => setShowStash(false), [])

  const useItem = useCallback(
    (instanceId, item) => {
      // If it's a member-targeted effect but no member selected, error
      if ((item.effectType === 'stamina' || item.effectType === 'mood') && !selectedMember) {
        addToast('Select a band member first!', 'warning')
        return
      }

      dispatch({
        type: 'USE_CONTRABAND',
        payload: { instanceId, memberId: selectedMember }
      })

      addToast(`Used ${item.name}!`, 'success')
    },
    [dispatch, selectedMember, addToast]
  )

  return {
    showStash,
    openStash,
    closeStash,
    stashProps: {
      stash: band.stash || [],
      members: band.members,
      selectedMember,
      setSelectedMember,
      useItem,
      onClose: closeStash
    }
  }
}
