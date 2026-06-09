// Orchestrator
import { useTravelState } from './useTravelState'
import { useTravelActions } from './useTravelActions'
import { useVanMaintenance } from './useVanMaintenance'
import { useTravelEffects } from './useTravelEffects'
import {
  isConnected as isConnectedUtil,
  getNodeVisibility as getNodeVisibilityUtil
} from '../../utils/mapUtils'
import type { TravelLogicParams } from './types'

export const useTravelLogic = (params: TravelLogicParams) => {
  const { refs, state, setters } = useTravelState(params)

  const { handleRefuel, handleRepair } = useVanMaintenance({
    isTravelingRef: refs.isTravelingRef,
    player: params.player,
    assetsRef: refs.assetsRef,
    updatePlayer: params.updatePlayer,
    addToast: params.addToast
  })

  const {
    handleTravel,
    onTravelComplete,
    clearPendingTravel,
    travelCompletedRef
  } = useTravelActions({
    refs,
    state,
    setters,
    params
  })

  useTravelEffects({ refs, state, params })

  const isConnected = (targetNodeId: string) => {
    return isConnectedUtil(
      params.gameMap,
      params.player.currentNodeId,
      targetNodeId
    )
  }

  const getNodeVisibility = (nodeLayer: number, currentLayer: number) => {
    return getNodeVisibilityUtil(nodeLayer, currentLayer)
  }

  return {
    isTraveling: state.isTraveling,
    travelTarget: state.travelTarget,
    pendingTravelNode: state.pendingTravelNode,
    isConnected,
    getNodeVisibility,
    handleTravel,
    handleRefuel,
    handleRepair,
    onTravelComplete,
    clearPendingTravel,
    travelCompletedRef
  }
}
