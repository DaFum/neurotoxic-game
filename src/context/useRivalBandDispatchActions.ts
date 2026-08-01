import { useMemo, type Dispatch, type MutableRefObject } from 'react'
import type { GameAction, GameState, RivalBandState } from '../types'
import {
  createSpawnRivalBandAction,
  createMoveRivalBandAction,
  createCheckRivalEncounterAction,
  createUpdateRivalBandAction
} from './actionCreators'

/**
 * Defines the collection of dispatch wrappers for interacting with rival band operations.
 */
export interface RivalBandDispatchActions {
  spawnRivalBand: () => void
  moveRivalBand: () => void
  checkRivalEncounter: () => void
  updateRivalBand: (patch: Partial<RivalBandState>) => void
}

/**
 * Defines the required dependencies to instantiate rival band dispatch actions.
 */
export interface UseRivalBandDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  stateRef: MutableRefObject<GameState>
}

/**
 * Constructs memoized dispatch wrappers for rival band operations.
 *
 * @param props - The configuration object containing the dispatch function and state reference.
 * @returns An object providing stable methods for dispatching rival band actions.
 */
export function useRivalBandDispatchActions({
  dispatch,
  stateRef
}: UseRivalBandDispatchActionsProps): RivalBandDispatchActions {
  return useMemo(
    () => ({
      spawnRivalBand: () =>
        dispatch(createSpawnRivalBandAction(stateRef.current)),
      moveRivalBand: () => {
        const currentState = stateRef.current
        if (!currentState.rivalBand || !currentState.gameMap) return
        dispatch(
          createMoveRivalBandAction(
            currentState.rivalBand,
            currentState.gameMap
          )
        )
      },
      checkRivalEncounter: () => dispatch(createCheckRivalEncounterAction()),
      updateRivalBand: patch => dispatch(createUpdateRivalBandAction(patch))
    }),
    [dispatch, stateRef]
  )
}
