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
      // NOTE (Task 9 / legacy path): In production, `onStartTravelMinigame` is always
      // provided (Overworld.tsx line 95), so this callback is only reached via the
      // animation-failsafe `onTravelComplete` path which is unreachable in normal play.
      // A synchronous GAMEOVER guard is architecturally impossible here because
      // `advanceDay()` dispatches are batched — committed scene is only observable
      // post-render. The production arrival path uses `useArrivalLogic` which applies
      // the effect-based GAMEOVER guard (Task 8 + 9). If this legacy path is ever
      // reinstated as a production path, migrate it to the same effect-based pattern.
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
