// Orchestrator
import { useCallback } from 'react'
import { useTravelState } from './useTravelState'
import { useTravelActions } from './useTravelActions'
import { useVanMaintenance } from './useVanMaintenance'
import { useTravelEffects } from './useTravelEffects'
import {
  isConnected as isConnectedUtil,
  getNodeVisibility as getNodeVisibilityUtil
} from '../../utils/mapUtils'
import { getTotalDailyObligations } from '../../utils/assetSelectors'
import type { TravelLogicParams } from './types'

/**
 * Orchestrates overworld travel: node selection, the click-to-confirm flow,
 * handoff to the tourbus minigame, van maintenance, and stranded-player
 * detection.
 *
 * @remarks
 * Composes four focused sub-hooks ({@link useTravelState}, {@link useTravelActions},
 * {@link useVanMaintenance}, {@link useTravelEffects}) and re-exports their
 * combined surface. The returned `handleTravel`, `handleRefuel`, and
 * `handleRepair` callbacks are referentially stable across unrelated
 * player/band state changes, so they are safe to pass to memoized children and
 * effect dependency arrays.
 *
 * This hook does not settle arrival. Confirming a trip only checks
 * affordability and hands off to `onStartTravelMinigame`; costs, fuel, and
 * location are committed by `handleCompleteTravelMinigame`, and the day tick,
 * travel events, and routing by `useArrivalLogic.handleArrivalSequence`.
 *
 * @param params - Live game state slices plus the action creators and scene
 * callbacks the hook dispatches through. Callback members are expected to be
 * referentially stable; state slices may change every render.
 * @returns Travel UI state (`isTraveling`, `pendingTravelNode`),
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

  const dailyObligations = getTotalDailyObligations({
    player: params.player,
    band: params.band,
    assets: params.assets,
    liabilities: params.liabilities,
    social: params.social
  })

  const { handleRefuel, handleRepair, handleRestInVan } = useVanMaintenance({
    isTravelingRef: refs.isTravelingRef,
    player: params.player,
    band: params.band,
    updatePlayer: params.updatePlayer,
    updateBand: params.updateBand,
    advanceDay: params.advanceDay,
    dailyObligations,
    addToast: params.addToast
  })

  const { handleTravel, clearPendingTravel } = useTravelActions({
    refs,
    setters,
    params
  })

  useTravelEffects({ refs, state, params })

  // ⚡ Bolt Optimization: Memoize isConnected to prevent unnecessary invalidation
  // of the expensive connection rendering useMemo in OverworldMap.tsx.
  const isConnected = useCallback(
    (targetNodeId: string) => {
      return isConnectedUtil(
        params.gameMap,
        params.player?.currentNodeId ?? '',
        targetNodeId
      )
    },
    [params.gameMap, params.player?.currentNodeId]
  )

  return {
    isTraveling: state.isTraveling,
    pendingTravelNode: state.pendingTravelNode,
    isConnected,
    getNodeVisibility: getNodeVisibilityUtil,
    handleTravel,
    handleRefuel,
    handleRepair,
    handleRestInVan,
    clearPendingTravel
  }
}
