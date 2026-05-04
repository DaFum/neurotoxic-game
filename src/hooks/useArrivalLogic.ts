import { useCallback, useEffect, useRef } from 'react'
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
 *
 * Idempotency: `isHandlingRef` stores the nodeId currently being processed rather than a plain
 * boolean. This prevents double-execution for the same node while automatically allowing a fresh
 * arrival when the player navigates to a different node.
 *
 * ARRIVAL_REF_RESET_TRIGGER = 'nodeId' — the ref is cleared in a useEffect cleanup keyed on
 * `player.currentNodeId`, so stale guards never block arrivals at subsequent nodes even after
 * an error or a rapid node change.
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

  // Stores the nodeId being processed; null means idle. Using the nodeId rather than a plain
  // boolean handles rapid node changes: two different nodeIds are always distinct guards.
  const isHandlingRef = useRef<string | null>(null)

  // ARRIVAL_REF_RESET_TRIGGER = 'nodeId'
  // Reset the guard whenever the player moves to a new node so a stale `true` value from a
  // previous arrival (or a failed one) never blocks the next legitimate arrival.
  useEffect(() => {
    return () => {
      isHandlingRef.current = null
    }
  }, [player.currentNodeId])

  const handleArrivalSequence = useCallback(() => {
    const nodeId = player.currentNodeId
    if (isHandlingRef.current === nodeId) return
    isHandlingRef.current = nodeId

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
      // processTravelEvents internally skips GIG nodes (isGigNode guard lives
      // there). If that guard is ever removed, this call must add its own check.
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
      // Reset guard so the user can retry the same node after an error
      isHandlingRef.current = null
      throw e
    }
    // Do NOT reset isHandlingRef.current in success path; the useEffect cleanup keyed on
    // player.currentNodeId handles the reset when the node changes.
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
