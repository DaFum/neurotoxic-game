import { useCallback } from 'react'
import type { MapNode } from '../../../types'
import { handleNodeArrival } from '../../../utils/arrivalUtils'
import type { TravelActionsParams } from '../types'

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
