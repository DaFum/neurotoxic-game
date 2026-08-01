import { useMemo, startTransition, type Dispatch } from 'react'
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
  return useMemo(
    () => ({
      startTravelMinigame: payload =>
        startTransition(() =>
          dispatch(createStartTravelMinigameAction(payload))
        ),
      completeTravelMinigame: (damageTaken, itemsCollected) =>
        dispatch(
          createCompleteTravelMinigameAction(
            damageTaken,
            itemsCollected,
            secureRandom() as number
          )
        ),
      startRoadieMinigame: payload =>
        startTransition(() =>
          dispatch(createStartRoadieMinigameAction(payload))
        ),
      completeRoadieMinigame: (
        equipmentDamage,
        contrabandDelivered,
        deliveredStashItemId
      ) =>
        dispatch(
          createCompleteRoadieMinigameAction(
            equipmentDamage,
            contrabandDelivered,
            deliveredStashItemId
          )
        ),
      startKabelsalatMinigame: payload =>
        startTransition(() =>
          dispatch(createStartKabelsalatMinigameAction(payload))
        ),
      completeKabelsalatMinigame: payload =>
        dispatch(createCompleteKabelsalatMinigameAction(payload)),
      startAmpCalibration: payload =>
        startTransition(() =>
          dispatch(createStartAmpCalibrationAction(payload))
        ),
      completeAmpCalibration: (
        score,
        voidResonance = 0,
        purgesUsed = 0,
        hijacksOverridden = 0
      ) =>
        dispatch(
          createCompleteAmpCalibrationAction(
            score,
            voidResonance,
            purgesUsed,
            hijacksOverridden
          )
        )
    }),
    [dispatch]
  )
}
