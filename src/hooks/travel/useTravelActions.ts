import type { TravelActionsParams } from './types'
import { useGetLocationName } from './actions/useGetLocationName'
import { useClearPendingTravel } from './actions/useClearPendingTravel'
import { useHandleNodeArrivalCallback } from './actions/useHandleNodeArrivalCallback'
import { useStartTravelSequence } from './actions/useStartTravelSequence'
import { useHandleTravel } from './actions/useHandleTravel'

/**
 * Builds the travel action handlers shared by {@link useTravelLogic}.
 *
 * @remarks
 * Returns three behaviors:
 *
 * - `handleTravel(node)` — validates access, connectivity, and affordability,
 *   then arms a 5s click-to-confirm window; a second call for the same node
 *   starts the trip. Clicking the current node opens HQ, enters a gig, or shows
 *   a location toast instead of traveling.
 * - `startTravelSequence(node)` (internal) — plays the travel SFX and hands off
 *   to `onStartTravelMinigame`. Arrival settlement belongs to the tourbus
 *   completion reducer (`handleCompleteTravelMinigame`) and the continuation in
 *   `useArrivalLogic`, not to this hook.
 * - `clearPendingTravel()` — drops the armed confirmation window and its timer.
 *
 * All returned callbacks are referentially stable: the hook destructures the
 * stable callbacks out of `params` and reads live state from `refs`, so it does
 * not depend on the per-render `params`/`state` objects.
 *
 * @returns `{ handleTravel, clearPendingTravel }`.
 */
export const useTravelActions = ({
  refs,
  setters,
  params
}: Pick<TravelActionsParams, 'refs' | 'setters' | 'params'>) => {
  const getLocationName = useGetLocationName()
  const clearPendingTravel = useClearPendingTravel({ refs, setters })
  const handleNodeArrivalCallback = useHandleNodeArrivalCallback({
    refs,
    params
  })

  const startTravelSequence = useStartTravelSequence({
    refs,
    setters,
    params,
    clearPendingTravel
  })

  const handleTravel = useHandleTravel({
    refs,
    setters,
    params,
    getLocationName,
    handleNodeArrivalCallback,
    clearPendingTravel,
    startTravelSequence
  })

  return {
    handleTravel,
    clearPendingTravel
  }
}
