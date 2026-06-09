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

/**
 * Orchestrates overworld travel: node selection, the click-to-confirm flow,
 * arrival processing, van maintenance, and stranded-player detection.
 *
 * @remarks
 * Composes four focused sub-hooks ({@link useTravelState}, {@link useTravelActions},
 * {@link useVanMaintenance}, {@link useTravelEffects}) and re-exports their
 * combined surface. The returned `handleTravel`, `onTravelComplete`,
 * `handleRefuel`, and `handleRepair` callbacks are referentially stable across
 * unrelated player/band state changes, so they are safe to pass to memoized
 * children and effect dependency arrays.
 *
 * Arrival side effects (cost deduction, day advancement, scene change) live in
 * `onTravelComplete`, not at travel start — see {@link useTravelActions}.
 *
 * @param params - Live game state slices plus the action creators and scene
 * callbacks the hook dispatches through. Callback members are expected to be
 * referentially stable; state slices may change every render.
 * @returns Travel UI state (`isTraveling`, `travelTarget`, `pendingTravelNode`),
 * map-visibility helpers, and the travel/maintenance action handlers.
 *
 * @example
 * ```ts
 * const { handleTravel, isTraveling, handleRefuel } = useTravelLogic({
 *   player, band, gameMap, updatePlayer, advanceDay, addToast, changeScene,
 *   // ...remaining TravelLogicParams
 * })
 * // First click arms confirmation; a second click within 5s starts travel.
 * onNodeClick={() => handleTravel(node)}
 * ```
 */
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
