import { useCallback } from 'react'
import { useGameState } from '../context/GameState'

/**
 * Hook to encapsulate reusable arrival sequence logic for both legacy travel and Minigame integration.
 * Ensures consistent side effects (Events, Autosave, Day Advance, Routing).
 */
export const useArrivalLogic = () => {
  const {
    advanceDay,
    saveGame,
    updateBand,
    triggerEvent,
    startGig,
    changeScene,
    addToast,
    band,
    gameMap,
    player
  } = useGameState()

  const handleArrivalSequence = useCallback(() => {
    // 1. Advance Day
    advanceDay()

    // 2. Save Game
    saveGame()

    // 3. Harmony Regen (if applicable)
    if (band?.harmonyRegenTravel) {
      updateBand({ harmony: Math.min(100, (band.harmony ?? 0) + 5) })
    }

    // 4. Trigger Events
    let travelEventActive = triggerEvent('transport', 'travel')
    if (!travelEventActive) {
      travelEventActive = triggerEvent('band', 'travel')
    }

    // 5. Handle Node Arrival & Routing
    const currentNode = gameMap?.nodes[player.currentNodeId]

    if (currentNode) {
      if (currentNode.type === 'REST_STOP') {
        const newMembers = (band?.members ?? []).map(m => ({
          ...m,
          stamina: Math.min(100, Math.max(0, m.stamina + 20)),
          mood: Math.min(100, Math.max(0, m.mood + 10))
        }))
        updateBand({ members: newMembers })
        addToast('Rested at stop. Band feels better.', 'success')
      } else if (currentNode.type === 'SPECIAL' && !travelEventActive) {
        const specialEvent = triggerEvent('special')
        if (!specialEvent) {
          addToast('A mysterious place, but nothing happened.', 'info')
        }
      } else if (currentNode.type === 'START') {
        addToast('Home Sweet Home.', 'success')
      }
    }

    if (currentNode && currentNode.type === 'GIG') {
      if ((band?.harmony ?? 0) <= 0) {
        addToast("Band's harmony too low to perform!", 'warning')
        changeScene('OVERWORLD')
      } else {
        startGig(currentNode.venue)
      }
    } else {
      changeScene('OVERWORLD')
    }
  }, [
    advanceDay,
    saveGame,
    updateBand,
    triggerEvent,
    startGig,
    changeScene,
    addToast,
    band,
    gameMap,
    player
  ])

  return { handleArrivalSequence }
}
