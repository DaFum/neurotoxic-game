import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameActions, useGameSelector } from '../context/GameState'
import {
  handleNodeArrival,
  processHarmonyRegen,
  processTravelEvents
} from '../utils/arrivalUtils'
import { handleError } from '../utils/errorHandler'
import i18n from '../i18n'
import { GAME_PHASES } from '../context/gameConstants'
import type { GamePhase, Venue } from '../types'

type UseArrivalLogicOptions = {
  onShowHQ?: () => void
  onShowSupplyStop?: (
    inventory: import('../types/components').PurchaseItem[]
  ) => void
  rng?: () => number
}

/**
 * Hook to encapsulate reusable arrival sequence logic for both legacy travel and Minigame integration.
 *
 * @remarks
 * `arrivalUtils` owns the travel-event policy. This hook keeps the default
 * policy that skips GIG, FESTIVAL, and FINALE destinations. It also moves the
 * rival band and checks for an encounter after each arrival (the minigame
 * path is the production travel path, so rival reactions must happen here).
 * `isHandlingRef` stores the node id currently being processed, and cleanup
 * keyed on `player.currentNodeId` clears stale guards for subsequent arrivals.
 *
 * Routing and the single arrival save run in a post-commit `useEffect` keyed on
 * `[pendingRoute, currentScene]`. This ensures `saveGame` captures final
 * post-arrival state (not stale pre-commit state). If `advanceDay()` triggers
 * bankruptcy the reducer sets `currentScene = GAMEOVER`; the effect detects this
 * and short-circuits routing while still saving once — so GAMEOVER is never
 * overwritten by an arrival scene.
 */
export const useArrivalLogic = ({
  onShowHQ,
  onShowSupplyStop,
  rng
}: UseArrivalLogicOptions = {}) => {
  const band = useGameSelector(state => state.band)
  const gameMap = useGameSelector(state => state.gameMap)
  const player = useGameSelector(state => state.player)
  const currentScene = useGameSelector(state => state.currentScene)
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
    setPendingSupplyStopInventory,
    moveRivalBand,
    checkRivalEncounter
  } = useGameActions()

  // Stores the nodeId being processed; undefined means idle. Using the nodeId rather than a
  // plain boolean handles rapid node changes: two different nodeIds are always distinct guards.
  // undefined (not null) is the idle sentinel — null is a valid currentNodeId value.
  const isHandlingRef = useRef<string | null | undefined>(undefined)

  // Pending route set by handleArrivalSequence; consumed by the post-commit effect.
  // The ref holds the payload; the nonce is bumped to trigger the effect after the
  // arrival dispatches commit. The effect guards on the ref (not a boolean state)
  // so it never has to call a setState synchronously inside the effect.
  const pendingRouteRef = useRef<{
    scene: GamePhase
    gigVenue: Venue | null
    gigStartQueued: boolean
  } | null>(null)
  const [routeNonce, setRouteNonce] = useState(0)

  // Reset the guard whenever the player moves to a new node so a stale `true` value from a
  // previous arrival (or a failed one) never blocks the next legitimate arrival.
  useEffect(() => {
    return () => {
      isHandlingRef.current = undefined
    }
  }, [player.currentNodeId])

  // Post-commit effect: routing + single save after all dispatches have committed.
  // Triggered by routeNonce (bumped in handleArrivalSequence). It consumes the
  // pending route from the ref exactly once — guarding on the ref means no setState
  // is called inside the effect. When changeScene fires it re-runs via currentScene,
  // but the ref is already null so it is a no-op.
  // GAMEOVER short-circuit: if advanceDay() triggered bankruptcy, the reducer sets
  // currentScene=GAMEOVER. We detect this here and skip routing to preserve GAMEOVER,
  // while still saving once.
  useEffect(() => {
    const route = pendingRouteRef.current
    if (!route) return
    if (currentScene === GAME_PHASES.GAMEOVER) {
      pendingRouteRef.current = null
      // GAMEOVER: save the post-bankruptcy state and do NOT overwrite the scene
      saveGame(false)
      return
    }

    if (route.gigVenue && !route.gigStartQueued) {
      try {
        startGig(route.gigVenue)
        route.gigStartQueued = true
        // Keep the route pending until START_GIG commits and currentScene
        // triggers this effect again, so the save sees the committed gig state.
        //
        // INVARIANT: this handshake requires every non-`currentScene` dep below
        // to be referentially stable. `startGig` dispatches inside
        // `startTransition`, so if one of them changed identity in that window
        // the effect would re-enter with `gigStartQueued` already true, consume
        // the route and save PRE-commit — the exact bug this defers around.
        // Today all are stable (`saveGame` → [addToast, stateRef, tRef]; the
        // rest → [dispatch]). Keep them that way, or key this effect on
        // `routeNonce`/`currentScene` alone.
        return
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:arrival.failedToStartGig', {
            defaultValue: 'Failed to start Gig.'
          })
        })
        route.gigVenue = null
        // `route.scene` is the gig-side scene handleNodeArrival picked. Routing
        // there after START_GIG failed would mount PreGig/Gig with no
        // `currentGig`, so fall back to the overworld instead of a scene that
        // cannot render.
        route.scene = GAME_PHASES.OVERWORLD
      }
    }

    // Consume the pending route exactly once.
    pendingRouteRef.current = null

    // Normal path: route then save.
    // The save snapshot may still carry the pre-route currentScene
    // (TRAVEL_MINIGAME) because changeScene dispatches via startTransition and
    // has not committed yet. This is intentionally NOT snapshot-corrected:
    // handleLoadGame hard-sets currentScene to OVERWORLD on load
    // (systemReducer handleLoadGame), so the persisted scene value is discarded
    // and never restored. The post-arrival fields that DO matter (day, cash,
    // harmony, events, rivalBand) are captured correctly because this effect
    // runs after advanceDay() and the side-effect dispatches have committed.
    if (!route.gigStartQueued) {
      changeScene(route.scene)
    }
    saveGame(false)
  }, [routeNonce, currentScene, saveGame, changeScene, startGig, addToast])

  const handleArrivalSequence = useCallback(() => {
    const nodeId = player.currentNodeId
    if (isHandlingRef.current === nodeId) return
    isHandlingRef.current = nodeId

    try {
      // 1. Advance Day
      advanceDay()

      // 2. Harmony Regen (if applicable)
      const newHarmony = processHarmonyRegen(band)
      if (newHarmony !== null) {
        updateBand({ harmony: newHarmony })
      }

      // 3. Trigger Events
      // Only trigger travel events for non-GIG destinations.
      // GIG destinations get events in the PreGig scene instead.
      const currentNode = gameMap?.nodes[player.currentNodeId]
      // If there is no resolved current node (e.g. incomplete map fixture),
      // processTravelEvents keeps legacy behavior and still attempts travel events.
      // processTravelEvents internally skips GIG nodes (isGigNode guard lives
      // there). If that guard is ever removed, this call must add its own check.
      const travelEventActive = processTravelEvents(currentNode, triggerEvent)

      // 3b. Rival band reacts to the trip (movement + possible encounter),
      // mirroring the legacy onTravelComplete path.
      moveRivalBand()
      checkRivalEncounter()

      // 4. Handle Node Arrival & Routing
      // Delegates routing (HQ, Gig, Rest Stop) to shared utility
      let queuedGigVenue: Venue | null = null
      const arrivalResult = currentNode
        ? handleNodeArrival({
            node: currentNode,
            band,
            player,
            updateBand,
            updatePlayer,
            triggerEvent,
            startGig: venue => {
              queuedGigVenue = venue
            },
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

      // 5. Defer routing + save to a post-commit effect so:
      //    a) saveGame reads final committed state (Task 8)
      //    b) GAMEOVER from advanceDay bankruptcy is detected before routing (Task 9)
      pendingRouteRef.current = {
        scene: arrivalResult.scene,
        gigVenue: arrivalResult.gigStarted ? queuedGigVenue : null,
        gigStartQueued: false
      }
      setRouteNonce(n => n + 1)
    } catch (e) {
      // Reset guard so the user can retry the same node after an error
      isHandlingRef.current = undefined
      throw e
    }
    // Do NOT reset isHandlingRef.current in success path; the useEffect cleanup keyed on
    // player.currentNodeId handles the reset when the node changes.
  }, [
    advanceDay,
    moveRivalBand,
    checkRivalEncounter,
    updateBand,
    updatePlayer,
    triggerEvent,
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
