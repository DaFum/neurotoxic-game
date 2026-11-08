import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useGameActions,
  useGameSelector,
  useRivalBandActions
} from '../context/GameState'
import {
  handleNodeArrival,
  isGigArrivalNode,
  processHarmonyRegen,
  processTravelEvents,
  requestArrivalGigStart,
  resolveArrivalNode
} from '../utils/arrivalUtils'
import { handleError } from '../utils/errorHandler'
import { getExpeditionNodeBookingLock } from '../domain/expedition/fame'
import i18n from '../i18n'
import { GAME_PHASES, MINIGAME_TYPES } from '../context/gameConstants'
import type { ArrivalOutcome, MapNode } from '../types'

/**
 * Optional overrides for `useArrivalLogic`.
 *
 * @remarks
 * Test seams: production (`TourbusScene`) calls the hook with no options, so
 * every field is only ever supplied by tests. They stay so arrival can be
 * exercised without the default pending-modal dispatches and with a
 * deterministic rng; do not wire production callers to them.
 */
type UseArrivalLogicOptions = {
  /** Test seam: replaces the default `setPendingBandHQOpen(true)` on HQ arrival. */
  onShowHQ?: () => void
  /** Test seam: replaces the default `setPendingSupplyStopInventory` on a supply stop. */
  onShowSupplyStop?: (
    inventory: import('../types/components').PurchaseItem[]
  ) => void
  /** Test seam: deterministic random source forwarded to `handleNodeArrival`. */
  rng?: () => number
}

/**
 * Arrival work waiting for the post-commit effect; `null` means idle.
 *
 * @remarks
 * `route`: a non-gig arrival already ran its node effects and only routes to
 * the overworld. `evaluate-gig`: a gig-branch node whose cancellation roll and
 * booking must read the committed post-tick band and player.
 */
type PendingArrival =
  { phase: 'route' } | { phase: 'evaluate-gig'; node: MapNode }

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
 * Routing and the single arrival save run in a post-commit `useEffect`:
 * `handleArrivalSequence` stores the work in `pendingArrivalRef` and bumps
 * `routeNonce`, and the effect claims the ref once after the arrival dispatches
 * commit. If `advanceDay()` triggers bankruptcy the reducer sets
 * `currentScene = GAMEOVER`; the effect detects this and short-circuits
 * routing while still saving once — so GAMEOVER is never overwritten by an
 * arrival scene. A gig evaluation requests its save through the provider-owned
 * `saveGameAfterStateCommit`, because `START_GIG` unmounts this hook.
 *
 * Gig-branch arrival (`isGigArrivalNode`) is evaluated in that effect too, so
 * the cancellation roll and its fame penalty read the committed post-tick
 * band and player rather than the pre-dispatch render values.
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
  const expedition = useGameSelector(state => state.expedition)
  const rivalBandId = useGameSelector(state => state.rivalBand?.id ?? null)
  const minigame = useGameSelector(state => state.minigame)
  const {
    advanceDay,
    saveGame,
    saveGameAfterStateCommit,
    updateBand,
    updatePlayer,
    triggerEvent,
    startGig,
    checkStartGig,
    changeScene,
    addToast,
    setPendingBandHQOpen,
    setPendingSupplyStopInventory,
    recordExpeditionCrewStressSource,
    recordExpeditionObligationSignal,
    offerExpeditionDraft
  } = useGameActions()
  const { moveRivalBand, checkRivalEncounter } = useRivalBandActions()

  // Stores the nodeId being processed; undefined means idle. Using the nodeId rather than a
  // plain boolean handles rapid node changes: two different nodeIds are always distinct guards.
  // undefined (not null) is the idle sentinel — null is a valid currentNodeId value.
  const isHandlingRef = useRef<string | null | undefined>(undefined)

  // Pending arrival set by handleArrivalSequence; claimed once by the
  // post-commit effect. The nonce is bumped to trigger the effect after the
  // arrival dispatches commit. The effect guards on the ref (not a boolean state)
  // so it never has to call a setState synchronously inside the effect.
  const pendingArrivalRef = useRef<PendingArrival | null>(null)
  const [routeNonce, setRouteNonce] = useState(0)

  // The leg this scene is driving. The completion reducer clears the minigame
  // on a committed settlement, so the destination is remembered while it is
  // still active; arrival compares it against the committed node.
  const intendedTargetRef = useRef<string | null>(null)
  useEffect(() => {
    if (
      minigame?.active === true &&
      minigame.type === MINIGAME_TYPES.TOURBUS &&
      typeof minigame.targetDestination === 'string'
    ) {
      intendedTargetRef.current = minigame.targetDestination
    }
  }, [minigame])

  // Reset the guard whenever the player moves to a new node so a stale `true` value from a
  // previous arrival (or a failed one) never blocks the next legitimate arrival.
  useEffect(() => {
    return () => {
      isHandlingRef.current = undefined
    }
  }, [player.currentNodeId])

  // Post-commit effect: routing + single save after all dispatches have committed.
  // Triggered by routeNonce (bumped in handleArrivalSequence). It claims the
  // pending arrival before acting on it, so a re-run (via currentScene or any
  // other dependency) finds the ref empty and is a no-op.
  // GAMEOVER short-circuit: if advanceDay() triggered bankruptcy, the reducer sets
  // currentScene=GAMEOVER. We detect this here and skip evaluation and routing
  // to preserve GAMEOVER, while still saving once.
  useEffect(() => {
    const pending = pendingArrivalRef.current
    if (!pending) return
    pendingArrivalRef.current = null

    if (currentScene === GAME_PHASES.GAMEOVER) {
      // GAMEOVER: save the post-bankruptcy state and do NOT overwrite the scene
      saveGame(false)
      return
    }

    if (pending.phase === 'route') {
      // The save snapshot is the latest reduced state, so it already carries the
      // routed currentScene even though changeScene dispatches via
      // startTransition and has not committed yet. The value does not matter:
      // handleLoadGame hard-sets currentScene to OVERWORLD on load
      // (systemReducer handleLoadGame), so the persisted scene value is discarded
      // and never restored. The post-arrival fields that DO matter (day, cash,
      // harmony, events, rivalBand) are captured correctly because this effect
      // runs after advanceDay() and the side-effect dispatches have committed.
      changeScene(GAME_PHASES.OVERWORLD)
      saveGame(false)
      return
    }

    // The gig evaluation dispatches (fame penalty, START_GIG) from inside this
    // effect, and START_GIG unmounts this hook, so the save is requested here.
    // `saveGame(false)` would capture those dispatches as well: it reads the
    // provider's `latestStateRef`, which `dispatch` updates synchronously, also
    // inside `startTransition`. The post-commit request lands the write in
    // START_GIG's own commit.
    const { node } = pending
    let outcome: ArrivalOutcome = { kind: 'overworld' }
    try {
      outcome = handleNodeArrival({
        node,
        band,
        player,
        updateBand,
        updatePlayer,
        triggerEvent,
        addToast,
        rng,
        bookingLock: getExpeditionNodeBookingLock(
          { player, expedition },
          node.type
        )
      })
    } catch (error) {
      // The sequence has already spent its day, so a throw here must not leave
      // the arrival unrouted: report it and fall back to the map.
      handleError(error, {
        addToast,
        fallbackMessage: i18n.t('ui:arrival.failedToStartGig', {
          defaultValue: 'Failed to start Gig.'
        })
      })
    }

    // START_GIG owns the move to PRE_GIG. A failed or refused request falls
    // back to the overworld: PreGig/Gig with no `currentGig` cannot render.
    // `checkStartGig` runs the reducer's own refusal rule on the latest state;
    // the reducer still re-checks at dispatch and stays authoritative.
    if (
      outcome.kind !== 'gig' ||
      !requestArrivalGigStart(outcome.venue, startGig, addToast, checkStartGig)
    ) {
      changeScene(GAME_PHASES.OVERWORLD)
    }
    saveGameAfterStateCommit()
  }, [
    routeNonce,
    currentScene,
    saveGame,
    saveGameAfterStateCommit,
    changeScene,
    startGig,
    checkStartGig,
    addToast,
    band,
    player,
    expedition,
    updateBand,
    updatePlayer,
    triggerEvent,
    rng
  ])

  const handleArrivalSequence = useCallback(() => {
    const nodeId = player.currentNodeId
    if (isHandlingRef.current === nodeId) return

    // A settlement the reducer refused (the protected-cash floor, a route
    // refusal, an invalid target) leaves the tourbus minigame active or the
    // band on the node it left. Arriving then would charge a day and replay
    // the origin's arrival, so the leg is abandoned back to the map instead.
    const intendedTarget = intendedTargetRef.current
    // Crisis/resource refusals retain the active minigame; route and target
    // refusals clear it while leaving the band at its origin.
    const settlementUnpaid =
      minigame?.active === true && minigame.type === MINIGAME_TYPES.TOURBUS
    if (
      settlementUnpaid ||
      (intendedTarget !== null && intendedTarget !== nodeId)
    ) {
      addToast(
        expedition?.pendingFailure
          ? i18n.t('ui:travel.errors.crisisPending', {
              defaultValue:
                'Resolve the expedition crisis before continuing the trip.'
            })
          : settlementUnpaid && minigame.travelFuelRefused === true
            ? i18n.t('ui:travel.errors.notEnoughFuel', {
                defaultValue: 'Not enough fuel in the tank!'
              })
            : expedition?.status === 'active' &&
                expedition.blockedTravelAtRouteStep === expedition.routeStep
              ? i18n.t('ui:travel.errors.notEnoughMoneyForTravel', {
                  defaultValue: 'Not enough money for gas and food!'
                })
              : i18n.t('ui:travel.errors.legNotCompleted', {
                  defaultValue:
                    'The trip could not be completed. Back to the map.'
                }),
        'error'
      )
      changeScene(GAME_PHASES.OVERWORLD)
      return
    }
    isHandlingRef.current = nodeId

    try {
      // 1. Advance Day
      advanceDay()

      // 2. Harmony Regen (if applicable), on the post-tick harmony: a value
      // read from the pre-dispatch `band` would discard the day's drift.
      const isRunActive = expedition?.status === 'active'
      if (processHarmonyRegen(band, isRunActive) !== null) {
        updateBand(prev => {
          const regenerated = processHarmonyRegen(prev, isRunActive)
          return regenerated === null ? {} : { harmony: regenerated }
        })
      }

      // 3. Trigger Events
      // Only trigger travel events for non-GIG destinations.
      // GIG destinations get events in the PreGig scene instead.
      const baseNode = gameMap?.nodes[player.currentNodeId]
      // A Legendary that converted this node is what the run travelled; the
      // shared resolver gives same-node re-entry the same answer.
      const currentNode = baseNode
        ? resolveArrivalNode(baseNode, player.currentNodeId, expedition)
        : baseNode
      if (expedition?.status === 'active') {
        const sourceType = currentNode?.type === 'REST_STOP' ? 'rest' : 'travel'
        const sourceId = `${sourceType}:${player.currentNodeId}:${expedition.routeStep}`
        for (const crewId of expedition.loadout?.crewIds ?? []) {
          recordExpeditionCrewStressSource(crewId, sourceType, sourceId)
        }
        if (player.currentNodeId) {
          recordExpeditionObligationSignal('arrival', player.currentNodeId)
          if (currentNode?.type === 'REST_STOP') {
            recordExpeditionObligationSignal('rest', player.currentNodeId)
          }
          // Arrival is the qualifying moment for the node-shaped Run Draft
          // sources. The reducer still proves each one and refuses a source it
          // has already consumed at this step, so offering here cannot mint a
          // draft the arrival did not actually earn.
          if (offerExpeditionDraft) {
            if (currentNode?.type === 'SUPPLY_STOP')
              offerExpeditionDraft('supply', player.currentNodeId)
            if (rivalBandId) offerExpeditionDraft('rival', rivalBandId)
          }
        }
      }
      // If there is no resolved current node (e.g. incomplete map fixture),
      // processTravelEvents keeps legacy behavior and still attempts travel events.
      // processTravelEvents internally skips GIG nodes (isGigNode guard lives
      // there). If that guard is ever removed, this call must add its own check.
      const travelEventActive = processTravelEvents(currentNode, triggerEvent)

      // 3b. Rival band reacts to the trip (movement + possible encounter).
      moveRivalBand()
      checkRivalEncounter()

      // 4. Handle Node Arrival & Routing
      // Delegates node effects (HQ, Rest Stop, Supply Stop, Special) to the
      // shared utility. A gig-branch node is evaluated in the post-commit
      // effect instead, so its cancellation roll and fame penalty read the
      // post-tick band and player.
      if (currentNode && isGigArrivalNode(currentNode)) {
        pendingArrivalRef.current = { phase: 'evaluate-gig', node: currentNode }
      } else {
        // A non-gig node always decides `overworld`
        // (arrivalNodeTypeExhaustiveness pins this), so only its effects matter.
        if (currentNode) {
          handleNodeArrival({
            node: currentNode,
            band,
            player,
            updateBand,
            updatePlayer,
            triggerEvent,
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
            rng,
            bookingLock: getExpeditionNodeBookingLock(
              { player, expedition },
              currentNode.type
            )
          })
        }
        pendingArrivalRef.current = { phase: 'route' }
      }

      // 5. Defer routing + save to a post-commit effect so:
      //    a) the save stays at the provider lifecycle boundary
      //       (`saveGameAfterStateCommit` for a gig), surviving an unmount of
      //       this hook; `dispatch` already writes `latestStateRef`
      //       synchronously, so this is not about a stale snapshot
      //    b) GAMEOVER from advanceDay bankruptcy is detected before routing (Task 9)
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
    rng,
    expedition,
    recordExpeditionCrewStressSource,
    recordExpeditionObligationSignal,
    offerExpeditionDraft,
    rivalBandId,
    minigame,
    changeScene
  ])

  return { handleArrivalSequence }
}
