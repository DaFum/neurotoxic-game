import type { TravelActionsParams } from './types'
import { useGetLocationName } from './actions/useGetLocationName'
import { useClearPendingTravel } from './actions/useClearPendingTravel'
import { useHandleNodeArrivalCallback } from './actions/useHandleNodeArrivalCallback'
import { useOnTravelComplete } from './actions/useOnTravelComplete'
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
 * - `startTravelSequence(node)` (internal) — plays the travel SFX and either
 *   delegates to `onStartTravelMinigame` or schedules a failsafe that forces
 *   completion if the travel animation never reports back.
 * - `onTravelComplete(node?)` — the single place arrival costs are applied:
 *   re-checks affordability, deducts money/fuel and regenerates band stats via
 *   `getTravelArrivalUpdates`, advances the day, then runs travel events, rival
 *   movement, and node arrival. Guarded by `travelCompletedRef` so it runs once
 *   per trip.
 *
 * All returned callbacks are referentially stable: the hook destructures the
 * stable callbacks out of `params` and reads live state from `refs`, so it does
 * not depend on the per-render `params`/`state` objects.
 *
 * @returns `{ handleTravel, onTravelComplete, clearPendingTravel, travelCompletedRef }`.
 */
export const useTravelActions = ({
  refs,
  state,
  setters,
  params
}: TravelActionsParams) => {
  const getLocationName = useGetLocationName()
  const clearPendingTravel = useClearPendingTravel({ refs, setters })
  const handleNodeArrivalCallback = useHandleNodeArrivalCallback({
    refs,
    params
  })

  const onTravelComplete = useOnTravelComplete({
    refs,
    state,
    setters,
    params,
    handleNodeArrivalCallback
  })

  const startTravelSequence = useStartTravelSequence({
    refs,
    setters,
    params,
    clearPendingTravel,
    onTravelComplete
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
    onTravelComplete,
    clearPendingTravel,
    travelCompletedRef: refs.travelCompletedRef
  }
}
