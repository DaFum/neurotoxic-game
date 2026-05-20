import { useCallback, useEffect, useRef } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import {
  handleNodeArrival,
  processHarmonyRegen,
  processTravelEvents
} from '../utils/arrivalUtils'
import { GAME_PHASES } from '../context/gameConstants'
import type { GamePhase } from '../types'

type UseArrivalLogicOptions = {
  onShowHQ?: () => void
  onShowSupplyStop?: (
    inventory: import('../types/components').PurchaseItem[]
  ) => void
  rng?: () => number
}

/**
 * Hook to encapsulate reusable arrival sequence logic for both legacy travel and Minigame integration.
 * Note: arrivalUtils owns the travel-event policy. This hook keeps the default policy
 * that skips GIG, FESTIVAL, and FINALE destinations.
 *
 * Idempotency: `isHandlingRef` stores the nodeId currently being processed rather than a plain
 * boolean. This prevents double-execution for the same node while automatically allowing a fresh
 * arrival when the player navigates to a different node.
 *
 * ARRIVAL_REF_RESET_TRIGGER = 'nodeId' — the ref is cleared in a useEffect cleanup keyed on
 * `player.currentNodeId`, so stale guards never block arrivals at subsequent nodes even after
 * an error or a rapid node change.
 */
export const useArrivalLogic = ({
  onShowHQ,
  onShowSupplyStop,
  rng
}: UseArrivalLogicOptions = {}) => {
  const band = useGameSelector(state => state.band)
  const gameMap = useGameSelector(state => state.gameMap)
  const player = useGameSelector(state => state.player)
  const {
    advanceDay,
    saveGame,
    updateBand,
    updatePlayer,
    triggerEvent,
    startGig,
    changeScene,
    addToast,
    setPendingBandHQOpen,
    setPendingSupplyStopInventory
  } = useGameActions()

  // Stores the nodeId being processed; undefined means idle. Using the nodeId rather than a
  // plain boolean handles rapid node changes: two different nodeIds are always distinct guards.
  // undefined (not null) is the idle sentinel — null is a valid currentNodeId value.
  const isHandlingRef = useRef<string | null | undefined>(undefined)

  // ARRIVAL_REF_RESET_TRIGGER = 'nodeId'
  // Reset the guard whenever the player moves to a new node so a stale `true` value from a
  // previous arrival (or a failed one) never blocks the next legitimate arrival.
  useEffect(() => {
    return () => {
      isHandlingRef.current = undefined
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
      const arrivalResult = currentNode
        ? handleNodeArrival({
            node: currentNode,
            band,
            player,
            updateBand,
            updatePlayer,
            triggerEvent,
            startGig,
            addToast,
            onShowHQ:
              onShowHQ ??
              (() => {
                setPendingBandHQOpen(true)
              }),
            onShowSupplyStop:
              onShowSupplyStop ??
              (inventory => {
                setPendingSupplyStopInventory(inventory)
              }),
            eventAlreadyActive: travelEventActive,
            rng
          })
        : { scene: GAME_PHASES.OVERWORLD as GamePhase, gigStarted: false }

      if (!arrivalResult.gigStarted) {
        changeScene(arrivalResult.scene)
      }
    } catch (e) {
      // Reset guard so the user can retry the same node after an error
      isHandlingRef.current = undefined
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
    onShowSupplyStop,
    setPendingBandHQOpen,
    setPendingSupplyStopInventory,
    rng
  ])

  return { handleArrivalSequence }
}
