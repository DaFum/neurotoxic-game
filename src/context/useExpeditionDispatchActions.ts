import { useMemo, type Dispatch, type MutableRefObject } from 'react'
import type { GameAction, GameState } from '../types'
import { prepareExpeditionRun as prepareExpeditionRunAction } from './expeditionActionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

/**
 * Expedition dispatch wrappers, sliced from {@link GameDispatchActions}.
 */
export type ExpeditionDispatchActions = Pick<
  GameDispatchActions,
  'prepareExpeditionRun'
>

interface UseExpeditionDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  stateRef: MutableRefObject<GameState>
}

/**
 * Builds the memoized Expedition dispatch wrappers.
 *
 * @param props - Dispatcher and the state ref creators read their snapshot from.
 * @returns Stable Expedition dispatch methods.
 *
 * @remarks
 * Each helper reads `stateRef.current` so the snapshot a creator derives ids
 * and seeds from is the same one the reducer validates against.
 */
export function useExpeditionDispatchActions({
  dispatch,
  stateRef
}: UseExpeditionDispatchActionsProps): ExpeditionDispatchActions {
  return useMemo(
    () => ({
      prepareExpeditionRun: () =>
        dispatch(prepareExpeditionRunAction(stateRef.current))
    }),
    [dispatch, stateRef]
  )
}
