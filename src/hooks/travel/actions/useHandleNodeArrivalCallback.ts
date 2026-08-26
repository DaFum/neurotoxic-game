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
        // Gig startup belongs to useArrivalLogic's post-commit route. This
        // legacy fallback must never synchronously change scenes here.
        startGig: () => {},
        addToast,
        onShowHQ,
        onShowSupplyStop,
        eventAlreadyActive: travelEventActive
      })
      // This callback serves re-entering the node the band already stands on
      // (`useHandleTravel`), not arrival after a trip — arriving somewhere new
      // goes through `useArrivalLogic`. It therefore carries no GAMEOVER guard:
      // a synchronous one is impossible here because `advanceDay()` dispatches
      // are batched, so the committed scene is only observable post-render, and
      // re-entering a node never advances the day. Anything that does advance
      // the day must use the effect-based guard in `useArrivalLogic` instead.
      if (!result.gigStarted) {
        changeScene(result.scene)
      }
    },
    [
      refs,
      updateBand,
      updatePlayer,
      triggerEvent,
      addToast,
      onShowHQ,
      onShowSupplyStop,
      changeScene
    ]
  )
}
