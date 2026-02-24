import { useCallback, useRef } from 'react'
import { useGameState } from '../context/GameState'
import { clampBandHarmony } from '../utils/gameStateUtils'
import { handleNodeArrival } from '../utils/arrivalUtils'

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
        handleNodeArrival({
            node: currentNode,
            band,
            updateBand,
            triggerEvent,
            startGig,
            addToast,
            changeScene,
            eventAlreadyActive: travelEventActive
        })
      }

      // If it's a gig node, handleNodeArrival tries to start it.
      // If startGig fails or it's not a gig, we ensure we route to OVERWORLD unless GIG started?
      // handleNodeArrival only calls startGig for GIG nodes.
      // It doesn't handle routing for non-GIG nodes except implicitly falling through.
      // But useArrivalLogic is called when arriving, usually transition to OVERWORLD is needed if not Gig.
      // The original code fell through to changeScene('OVERWORLD') if not Gig.

      const isGig = currentNode && (currentNode.type === 'GIG' || currentNode.type === 'FESTIVAL' || currentNode.type === 'FINALE')
      if (!isGig) {
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
