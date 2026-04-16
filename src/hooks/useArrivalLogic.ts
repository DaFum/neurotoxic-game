// @ts-nocheck
import { useCallback, useRef } from 'react'
import { useGameState } from '../context/GameState'
import {
  handleNodeArrival,
  processHarmonyRegen,
  isGigNode,
  processTravelEvents
} from '../utils/arrivalUtils'
import { GAME_PHASES } from '../context/gameConstants'

/**
 * Hook to encapsulate reusable arrival sequence logic for both legacy travel and Minigame integration.
 * Note: While this handles shared side effects and delegated non-performance travel events (via arrivalUtils),
 * inline event triggering for GIG, FESTIVAL, and FINALE destinations remains within useTravelLogic.
 */
export const useArrivalLogic = ({ onShowHQ, rng } = {}) => {
  const {
    advanceDay,
    saveGame,
    updateBand,
    updatePlayer,
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
      saveGame(false)

      // 3. Harmony Regen (if applicable)
      const newHarmony = processHarmonyRegen(band)
      if (newHarmony !== null) {
        updateBand({ harmony: newHarmony })
      }

      // 4. Trigger Events
      // Only trigger travel events for non-GIG destinations.
      // GIG destinations get events in the PreGig scene instead.
      const currentNode = gameMap?.nodes[player.currentNodeId]
      // If there is no resolved current node (e.g. incomplete map fixture),
      // processTravelEvents keeps legacy behavior and still attempts travel events.
      const travelEventActive = processTravelEvents(currentNode, triggerEvent)

      // 5. Handle Node Arrival & Routing
      // Delegates routing (HQ, Gig, Rest Stop) to shared utility
      if (currentNode) {
        handleNodeArrival({
          node: currentNode,
          band,
          player,
          updateBand,
          updatePlayer,
          triggerEvent,
          startGig,
          addToast,
          changeScene,
          onShowHQ,
          eventAlreadyActive: travelEventActive,
          rng
        })
      }

      // Ensure we route to OVERWORLD if not a Gig/Festival/Finale where action is taken
      if (!isGigNode(currentNode)) {
        changeScene(GAME_PHASES.OVERWORLD)
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
    updatePlayer,
    triggerEvent,
    startGig,
    changeScene,
    addToast,
    band,
    gameMap,
    player,
    onShowHQ,
    rng
  ])

  return { handleArrivalSequence }
}
