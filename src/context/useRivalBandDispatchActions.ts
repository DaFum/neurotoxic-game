import {
  useCallback,
  useMemo,
  type Dispatch,
  type MutableRefObject
} from 'react'
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
  const spawnRivalBand = useCallback(
    () => dispatch(createSpawnRivalBandAction(stateRef.current)),
    [dispatch, stateRef]
  )

  const moveRivalBand = useCallback(() => {
    const currentState = stateRef.current
    if (!currentState.rivalBand || !currentState.gameMap) return
    dispatch(
      createMoveRivalBandAction(currentState.rivalBand, currentState.gameMap)
    )
  }, [dispatch, stateRef])

  const checkRivalEncounter = useCallback(
    () => dispatch(createCheckRivalEncounterAction()),
    [dispatch]
  )

  const updateRivalBand = useCallback(
    (patch: Partial<RivalBandState>) =>
      dispatch(createUpdateRivalBandAction(patch)),
    [dispatch]
  )

  return useMemo(
    () => ({
      spawnRivalBand,
      moveRivalBand,
      checkRivalEncounter,
      updateRivalBand
    }),
    [spawnRivalBand, moveRivalBand, checkRivalEncounter, updateRivalBand]
  )
}
