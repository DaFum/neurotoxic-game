import { useCallback, useRef } from 'react'
import type { MapNode } from '../../../types'
import { GAME_PHASES } from '../../../context/gameConstants'
import {
  handleNodeArrival,
  requestArrivalGigStart
} from '../../../utils/arrivalUtils'
import { getExpeditionNodeBookingLock } from '../../../domain/expedition/fame'
import type { TravelActionsParams } from '../types'

/**
 * Creates a callback to handle synchronous same-node gig re-entry.
 *
 * @remarks
 * This callback is invoked only after confirming that the selected node is the player's current node
 * and is a gig node, serving specifically as the synchronous same-node gig re-entry handler. Normal travel
 * arrivals are owned by `useArrivalLogic`. Re-entering the node the band currently occupies dispatches
 * neither a travel commit nor a day tick, so this hook manages synchronous scene changes for those cases.
 * When the arrival outcome is a gig and its start request succeeds, `START_GIG` moves the scene to PRE_GIG,
 * so this function does not bounce the player back out to the OVERWORLD.
 *
 * @param options - Destructured parameters for travel actions.
 * @returns A stable callback function that accepts a `MapNode` and an optional boolean flag to execute arrival operations.
 */
export const useHandleNodeArrivalCallback = ({
  refs,
  params
}: Pick<TravelActionsParams, 'refs' | 'params'>) => {
  const {
    updateBand,
    updatePlayer,
    triggerEvent,
    startGig,
    checkStartGig,
    addToast,
    onShowHQ,
    onShowSupplyStop,
    changeScene,
    expeditionStatus
  } = params
  // Set once a gig start was requested and held for the lifetime of this hook.
  // `startGig` dispatches inside `startTransition` and PreGig is lazy, so the
  // map can stay mounted and clickable well past a microtask; a second call
  // must not dispatch START_GIG again or re-run its side effects (e.g. a
  // finale's starting hype). START_GIG leaves OVERWORLD, which unmounts the map
  // and discards this ref. Refusals are caught before the request, so a refused
  // start leaves this ref unset and the click retryable: `useHandleTravel`
  // drops a node the arrived overlay converted and a node just played,
  // arrival resolves a venue with a non-empty id/name and honours the booking
  // lock, and `checkStartGig` then runs the reducer's own refusal rule on the
  // latest state. The reducer still re-checks at dispatch and stays
  // authoritative.
  const gigStartInFlightRef = useRef(false)

  return useCallback(
    (node: MapNode, travelEventActive = false) => {
      if (gigStartInFlightRef.current) return
      const outcome = handleNodeArrival({
        // Same lock `handleStartGig` re-checks: without it a refused re-entry
        // would decide `gig` and the click would silently do nothing.
        bookingLock: getExpeditionNodeBookingLock(
          {
            player: refs.playerRef.current,
            expedition: expeditionStatus ? { status: expeditionStatus } : null
          },
          node.type
        ),
        node,
        band: refs.bandRef.current,
        player: refs.playerRef.current,
        updateBand,
        updatePlayer,
        triggerEvent,
        addToast,
        onShowHQ,
        onShowSupplyStop,
        eventAlreadyActive: travelEventActive
      })
      // Starting the gig here is synchronous on purpose. `useArrivalLogic`
      // defers its own gig start because arrival has just dispatched
      // `advanceDay()`, so routing must wait for the committed state (bankruptcy
      // could route to GAMEOVER instead). Re-entering the node the band already
      // stands on dispatches neither a travel commit nor a day tick, so there
      // is nothing to wait for.
      //
      // A successful request means the check passed and `startGig` returned,
      // not that the reducer accepted: the reducer re-checks at dispatch. A
      // refused request returns false and routes to OVERWORLD without setting
      // the in-flight ref, so the player can retry.
      //
      // Unlike `useArrivalLogic`, this path queues no save: OVERWORLD → PRE_GIG
      // is not an autosave transition, so a re-entry gig start persists only at
      // the post-gig settlement-record save. Harmless — a reload puts the band back on
      // the node with the click still available — but keep it in mind if this
      // path ever gains state worth losing.
      if (
        outcome.kind === 'gig' &&
        requestArrivalGigStart(outcome.venue, startGig, addToast, checkStartGig)
      ) {
        gigStartInFlightRef.current = true
        return
      }
      changeScene(GAME_PHASES.OVERWORLD)
    },
    [
      refs,
      updateBand,
      updatePlayer,
      triggerEvent,
      startGig,
      checkStartGig,
      addToast,
      onShowHQ,
      onShowSupplyStop,
      changeScene,
      expeditionStatus
    ]
  )
}
