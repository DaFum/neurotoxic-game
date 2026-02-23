import { useCallback, useRef } from 'react'
import { useGameState } from '../context/GameState'
import { clampBandHarmony } from '../utils/gameStateUtils'

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

  const isHandlingRef = useRef(false)

  const handleArrivalSequence = useCallback(() => {
    if (isHandlingRef.current) return
    isHandlingRef.current = true

    try {
      // 1. Advance Day
      advanceDay()

      // 2. Save Game
      saveGame()

      // 3. Harmony Regen (if applicable)
      if (band?.harmonyRegenTravel) {
        updateBand({ harmony: clampBandHarmony((band.harmony ?? 0) + 5) })
      }

      // 4. Trigger Events
      // Only trigger travel events for non-GIG destinations.
      // GIG destinations get events in the PreGig scene instead.
      const currentNode = gameMap?.nodes[player.currentNodeId]
      const isGigNode = currentNode?.type === 'GIG' || currentNode?.type === 'FESTIVAL' || currentNode?.type === 'FINALE'

      let travelEventActive = false
      if (!isGigNode) {
        travelEventActive = triggerEvent('transport', 'travel')
        if (!travelEventActive) {
          travelEventActive = triggerEvent('band', 'travel')
        }
      }

      // 5. Handle Node Arrival & Routing

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

      if (currentNode && (currentNode.type === 'GIG' || currentNode.type === 'FESTIVAL' || currentNode.type === 'FINALE')) {
        if ((band?.harmony ?? 0) <= 0) {
          addToast("Band's harmony too low to perform!", 'warning')
          changeScene('OVERWORLD')
        } else {
          startGig(currentNode.venue)
        }
      } else {
        changeScene('OVERWORLD')
      }
    } catch (e) {
      // If error, reset guard so user can try again
      isHandlingRef.current = false
      throw e
    }
    // Do NOT reset isHandlingRef.current in success path to ensure one-shot behavior until unmount
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
