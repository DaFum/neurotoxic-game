import { useMemo, type Dispatch, type MutableRefObject } from 'react'
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
  return useMemo(() => {
    /**
     * Dispatches an asset action, first surfacing its localized failure reason
     * as an error toast when the action is the matching `*_FAILED` variant.
     */
    const dispatchWithFailureToast = <
      T extends GameAction & { payload: { reason: string } }
    >(
      action: GameAction,
      failedType: T['type'],
      toastKeyPrefix: string
    ) => {
      if (action.type === failedType) {
        const reason = (action as T).payload.reason
        addToast(
          tRef.current(`${toastKeyPrefix}.${reason.toLowerCase()}`),
          'error'
        )
      }
      dispatch(action)
    }

    return {
      purchaseChassis: (input: Parameters<typeof purchaseChassisAction>[0]) =>
        dispatchWithFailureToast(
          purchaseChassisAction(input, stateRef.current),
          ActionTypes.PURCHASE_CHASSIS_FAILED,
          'assets:purchaseFailed'
        ),
      upgradeChassisTier: (assetId: string, targetTier: ChassisTier) =>
        dispatchWithFailureToast(
          upgradeChassisTierAction(assetId, targetTier, stateRef.current),
          ActionTypes.UPGRADE_CHASSIS_TIER_FAILED,
          'assets:upgradeFailed'
        ),
      sellChassis: (assetId: string) =>
        dispatch(sellChassisAction(assetId, stateRef.current)),
      repairChassis: (assetId: string) =>
        dispatchWithFailureToast(
          repairChassisAction(assetId, stateRef.current),
          ActionTypes.REPAIR_CHASSIS_FAILED,
          'assets:repairFailed'
        ),
      refinanceLiability: (liabilityId: string, loanProfileId: LoanProfileId) =>
        dispatchWithFailureToast(
          refinanceLiabilityAction(
            liabilityId,
            loanProfileId,
            stateRef.current
          ),
          ActionTypes.REFINANCE_LIABILITY_FAILED,
          'assets:refinanceFailed'
        ),
      installModule: (input: Parameters<typeof installModuleAction>[0]) =>
        dispatchWithFailureToast(
          installModuleAction(input, stateRef.current),
          ActionTypes.INSTALL_MODULE_FAILED,
          'assets:installFailed'
        ),
      removeModule: (assetId: string, slotId: string) =>
        dispatch(removeModuleAction(assetId, slotId)),
      startCrowdfund: (input: Parameters<typeof startCrowdfundAction>[0]) =>
        dispatchWithFailureToast(
          startCrowdfundAction(input, stateRef.current),
          ActionTypes.START_CROWDFUND_FAILED,
          'assets:startCrowdfundFailed'
        )
    }
  }, [dispatch, stateRef, addToast, tRef])
}
