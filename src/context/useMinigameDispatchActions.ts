import { useCallback, useMemo, startTransition, type Dispatch } from 'react'
import type { GameAction } from '../types'
import { secureRandom } from '../utils/crypto'
import {
  createStartTravelMinigameAction,
  createCompleteTravelMinigameAction,
  createStartRoadieMinigameAction,
  createCompleteRoadieMinigameAction,
  createStartKabelsalatMinigameAction,
  createCompleteKabelsalatMinigameAction,
  createStartAmpCalibrationAction,
  createCompleteAmpCalibrationAction
} from './actionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

/**
 * Minigame start/complete dispatch wrappers, sliced from {@link GameDispatchActions}.
 */
export type MinigameDispatchActions = Pick<
  GameDispatchActions,
  | 'startTravelMinigame'
  | 'completeTravelMinigame'
  | 'startRoadieMinigame'
  | 'completeRoadieMinigame'
  | 'startKabelsalatMinigame'
  | 'completeKabelsalatMinigame'
  | 'startAmpCalibration'
  | 'completeAmpCalibration'
>

/**
 * Builds the memoized minigame dispatch wrappers (travel, roadie, kabelsalat,
 * amp calibration). Each helper only depends on `dispatch`.
 * @param dispatch - Game action dispatcher.
 * @returns Stable minigame dispatch methods.
 */
export function useMinigameDispatchActions(
  dispatch: Dispatch<GameAction>
): MinigameDispatchActions {
  const startTravelMinigame = useCallback(
    (payload: Parameters<typeof createStartTravelMinigameAction>[0]) =>
      startTransition(() => dispatch(createStartTravelMinigameAction(payload))),
    [dispatch]
  )

  const completeTravelMinigame = useCallback(
    (
      damageTaken: Parameters<typeof createCompleteTravelMinigameAction>[0],
      itemsCollected: Parameters<typeof createCompleteTravelMinigameAction>[1]
    ) => {
      const rngValue = secureRandom() as number
      dispatch(
        createCompleteTravelMinigameAction(
          damageTaken,
          itemsCollected,
          rngValue
        )
      )
    },
    [dispatch]
  )

  const startRoadieMinigame = useCallback(
    (payload: Parameters<typeof createStartRoadieMinigameAction>[0]) =>
      startTransition(() => dispatch(createStartRoadieMinigameAction(payload))),
    [dispatch]
  )

  const completeRoadieMinigame = useCallback(
    (
      equipmentDamage: Parameters<typeof createCompleteRoadieMinigameAction>[0],
      contrabandDelivered?: Parameters<
        typeof createCompleteRoadieMinigameAction
      >[1],
      deliveredStashItemId?: Parameters<
        typeof createCompleteRoadieMinigameAction
      >[2]
    ) =>
      dispatch(
        createCompleteRoadieMinigameAction(
          equipmentDamage,
          contrabandDelivered,
          deliveredStashItemId
        )
      ),
    [dispatch]
  )

  const startKabelsalatMinigame = useCallback(
    (payload: Parameters<typeof createStartKabelsalatMinigameAction>[0]) =>
      startTransition(() =>
        dispatch(createStartKabelsalatMinigameAction(payload))
      ),
    [dispatch]
  )

  const completeKabelsalatMinigame = useCallback(
    (payload: Parameters<typeof createCompleteKabelsalatMinigameAction>[0]) =>
      dispatch(createCompleteKabelsalatMinigameAction(payload)),
    [dispatch]
  )

  const startAmpCalibration = useCallback(
    (payload: Parameters<typeof createStartAmpCalibrationAction>[0]) =>
      startTransition(() => dispatch(createStartAmpCalibrationAction(payload))),
    [dispatch]
  )

  const completeAmpCalibration = useCallback(
    (
      score: Parameters<typeof createCompleteAmpCalibrationAction>[0],
      voidResonance: Parameters<
        typeof createCompleteAmpCalibrationAction
      >[1] = 0,
      purgesUsed: Parameters<typeof createCompleteAmpCalibrationAction>[2] = 0,
      hijacksOverridden: Parameters<
        typeof createCompleteAmpCalibrationAction
      >[3] = 0
    ) =>
      dispatch(
        createCompleteAmpCalibrationAction(
          score,
          voidResonance,
          purgesUsed,
          hijacksOverridden
        )
      ),
    [dispatch]
  )

  return useMemo(
    () => ({
      startTravelMinigame,
      completeTravelMinigame,
      startRoadieMinigame,
      completeRoadieMinigame,
      startKabelsalatMinigame,
      completeKabelsalatMinigame,
      startAmpCalibration,
      completeAmpCalibration
    }),
    [
      startTravelMinigame,
      completeTravelMinigame,
      startRoadieMinigame,
      completeRoadieMinigame,
      startKabelsalatMinigame,
      completeKabelsalatMinigame,
      startAmpCalibration,
      completeAmpCalibration
    ]
  )
}
