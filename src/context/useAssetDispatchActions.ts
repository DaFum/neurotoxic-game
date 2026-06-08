import {
  useCallback,
  useMemo,
  type Dispatch,
  type MutableRefObject
} from 'react'
import type { TFunction } from 'i18next'
import type { GameAction, GameState } from '../types'
import type { ChassisTier } from '../types/assets'
import type { LoanProfileId } from '../utils/loanProfiles'
import { ActionTypes } from './actionTypes'
import {
  purchaseChassis as purchaseChassisAction,
  upgradeChassisTier as upgradeChassisTierAction,
  sellChassis as sellChassisAction,
  repairChassis as repairChassisAction,
  refinanceLiability as refinanceLiabilityAction,
  installModule as installModuleAction,
  removeModule as removeModuleAction,
  startCrowdfund as startCrowdfundAction
} from './assetActionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

/**
 * Long-term asset dispatch wrappers, sliced from {@link GameDispatchActions}.
 */
export type AssetDispatchActions = Pick<
  GameDispatchActions,
  | 'purchaseChassis'
  | 'upgradeChassisTier'
  | 'sellChassis'
  | 'repairChassis'
  | 'refinanceLiability'
  | 'installModule'
  | 'removeModule'
  | 'startCrowdfund'
>

interface UseAssetDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  stateRef: MutableRefObject<GameState>
  addToast: GameDispatchActions['addToast']
  tRef: MutableRefObject<TFunction>
}

/**
 * Builds the memoized long-term asset dispatch wrappers. Each helper reads the
 * current state via `stateRef` so the snapshot used for validation matches the
 * one the reducer sees, and surfaces typed `*_FAILED` actions as toasts.
 * @param props - Dispatcher, state ref, toast helper, and translator ref.
 * @returns Stable asset dispatch methods.
 */
export function useAssetDispatchActions({
  dispatch,
  stateRef,
  addToast,
  tRef
}: UseAssetDispatchActionsProps): AssetDispatchActions {
  const purchaseChassis = useCallback(
    (input: Parameters<typeof purchaseChassisAction>[0]) => {
      const action = purchaseChassisAction(input, stateRef.current)
      if (action.type === ActionTypes.PURCHASE_CHASSIS_FAILED) {
        addToast(
          tRef.current(
            `assets:purchaseFailed.${action.payload.reason.toLowerCase()}`
          ),
          'error'
        )
      }
      dispatch(action)
    },
    [dispatch, stateRef, addToast, tRef]
  )
  const upgradeChassisTier = useCallback(
    (assetId: string, targetTier: ChassisTier) => {
      const action = upgradeChassisTierAction(
        assetId,
        targetTier,
        stateRef.current
      )
      if (action) dispatch(action)
    },
    [dispatch, stateRef]
  )
  const sellChassis = useCallback(
    (assetId: string) => {
      dispatch(sellChassisAction(assetId, stateRef.current))
    },
    [dispatch, stateRef]
  )
  const repairChassis = useCallback(
    (assetId: string) => {
      const action = repairChassisAction(assetId, stateRef.current)
      if (action) dispatch(action)
    },
    [dispatch, stateRef]
  )
  const refinanceLiability = useCallback(
    (liabilityId: string, loanProfileId: LoanProfileId) => {
      const action = refinanceLiabilityAction(
        liabilityId,
        loanProfileId,
        stateRef.current
      )
      if (action.type === ActionTypes.REFINANCE_LIABILITY_FAILED) {
        addToast(
          tRef.current(
            `assets:refinanceFailed.${action.payload.reason.toLowerCase()}`
          ),
          'error'
        )
      }
      dispatch(action)
    },
    [dispatch, stateRef, addToast, tRef]
  )
  const installModule = useCallback(
    (input: Parameters<typeof installModuleAction>[0]) => {
      const action = installModuleAction(input, stateRef.current)
      if (action.type === ActionTypes.INSTALL_MODULE_FAILED) {
        addToast(
          tRef.current(
            `assets:installFailed.${action.payload.reason.toLowerCase()}`
          ),
          'error'
        )
      }
      dispatch(action)
    },
    [dispatch, stateRef, addToast, tRef]
  )
  const removeModule = useCallback(
    (assetId: string, slotId: string) => {
      dispatch(removeModuleAction(assetId, slotId))
    },
    [dispatch]
  )
  const startCrowdfund = useCallback(
    (input: Parameters<typeof startCrowdfundAction>[0]) => {
      const action = startCrowdfundAction(input, stateRef.current)
      if (action) dispatch(action)
    },
    [dispatch, stateRef]
  )

  return useMemo(
    () => ({
      purchaseChassis,
      upgradeChassisTier,
      sellChassis,
      repairChassis,
      refinanceLiability,
      installModule,
      removeModule,
      startCrowdfund
    }),
    [
      purchaseChassis,
      upgradeChassisTier,
      sellChassis,
      repairChassis,
      refinanceLiability,
      installModule,
      removeModule,
      startCrowdfund
    ]
  )
}
