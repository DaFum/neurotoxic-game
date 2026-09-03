import { useCallback } from 'react'
import type { MapNode } from '../../../types'
import { handleNodeArrival } from '../../../utils/arrivalUtils'
import type { TravelActionsParams } from '../types'

/**
 * Creates a callback to handle synchronous same-node gig re-entry.
 *
 * @remarks
 * This callback is invoked only after confirming that the selected node is the player's current node
 * and is a gig node, serving specifically as the synchronous same-node gig re-entry handler. Normal travel
 * arrivals are owned by `useArrivalLogic`. Re-entering the node the band currently occupies dispatches
 * neither a travel commit nor a day tick, so this hook manages synchronous scene changes for those cases.
 * If a gig is successfully started by the underlying handler, the scene transitions automatically to PRE_GIG,
 * and this function explicitly prevents bouncing the player back out to the OVERWORLD.
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
    addToast,
    onShowHQ,
    onShowSupplyStop,
    changeScene
  } = params

  return useCallback(
    (node: MapNode, travelEventActive = false) => {
      const result = handleNodeArrival({
        node,
        band: refs.bandRef.current,
        player: refs.playerRef.current,
        updateBand,
        updatePlayer,
        triggerEvent,
        startGig,
        addToast,
        onShowHQ,
        onShowSupplyStop,
        eventAlreadyActive: travelEventActive
      })
      // Starting the gig here is synchronous on purpose. `useArrivalLogic`
      // defers its own gig start because arrival has just dispatched
      // `advanceDay()`, so routing must wait for the committed state (bankruptcy
      // could route to GAMEOVER instead, and saveGame must see the final state).
      // Re-entering the node the band already stands on dispatches neither a
      // travel commit nor a day tick, so there is nothing to wait for — and
      // `handleStartGig` reads only `reputationByRegion`.
      //
      // When the gig started, START_GIG already moved the scene to PRE_GIG;
      // routing to `result.scene` (OVERWORLD) would bounce straight back out.
      //
      // Unlike `useArrivalLogic`, this path queues no save: OVERWORLD → PRE_GIG
      // is not an autosave transition, so a re-entry gig start persists only at
      // the GIG → POST_GIG autosave. Harmless — a reload puts the band back on
      // the node with the click still available — but keep it in mind if this
      // path ever gains state worth losing.
      if (!result.gigStarted) {
        changeScene(result.scene)
      }
    },
    [
      refs,
      updateBand,
      updatePlayer,
      triggerEvent,
      startGig,
      addToast,
      onShowHQ,
      onShowSupplyStop,
      changeScene
    ]
  )
}
