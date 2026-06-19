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
 * Rival band dispatch actions interface.
 */
export interface RivalBandDispatchActions {
  spawnRivalBand: () => void
  moveRivalBand: () => void
  checkRivalEncounter: () => void
  updateRivalBand: (patch: Partial<RivalBandState>) => void
}

export interface UseRivalBandDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  stateRef: MutableRefObject<GameState>
}

/**
 * Builds the memoized rival band dispatch wrappers.
 * @param props - Dispatch dependency and current state snapshot ref.
 * @returns Stable rival band dispatch methods.
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
