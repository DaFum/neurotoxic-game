import { useMemo, type Dispatch, type MutableRefObject } from 'react'
import type { TFunction } from 'i18next'
import type { GameAction, GameState } from '../../types'
import type { ChassisTier } from '../../types/assets'
import type { LoanProfileId } from '../../utils/assets/loanProfiles'
import { ActionTypes } from '../actionTypes'
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
import { isExpeditionChassisCommitmentLocked } from '../../domain/expedition/buildCommitment'
import type { GameDispatchActions } from '../useGameDispatchActions'

/**
 * Long-term asset dispatch wrappers, sliced from {@link GameDispatchActions}.
 */
type AssetDispatchActions = Pick<
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
      // Returns whether the purchase was accepted (same contract as
      // repairChassis), so the acquisition modal stays open on a refusal.
      purchaseChassis: (
        input: Parameters<typeof purchaseChassisAction>[0]
      ): boolean => {
        const action = purchaseChassisAction(input, stateRef.current)
        dispatchWithFailureToast(
          action,
          ActionTypes.PURCHASE_CHASSIS_FAILED,
          'assets:purchaseFailed'
        )
        return action.type !== ActionTypes.PURCHASE_CHASSIS_FAILED
      },
      upgradeChassisTier: (assetId: string, targetTier: ChassisTier) =>
        dispatchWithFailureToast(
          upgradeChassisTierAction(assetId, targetTier, stateRef.current),
          ActionTypes.UPGRADE_CHASSIS_TIER_FAILED,
          'assets:upgradeFailed'
        ),
      sellChassis: (assetId: string) =>
        dispatchWithFailureToast(
          sellChassisAction(assetId, stateRef.current),
          ActionTypes.SELL_CHASSIS_FAILED,
          'assets:sellFailed'
        ),
      // Returns whether the repair was accepted, so a confirm modal can stay
      // open (with the failure toast shown) when the creator refuses it.
      repairChassis: (assetId: string): boolean => {
        const action = repairChassisAction(assetId, stateRef.current)
        dispatchWithFailureToast(
          action,
          ActionTypes.REPAIR_CHASSIS_FAILED,
          'assets:repairFailed'
        )
        return action.type !== ActionTypes.REPAIR_CHASSIS_FAILED
      },
      // Returns whether the refinance was accepted (repairChassis contract).
      refinanceLiability: (
        liabilityId: string,
        loanProfileId: LoanProfileId
      ): boolean => {
        const action = refinanceLiabilityAction(
          liabilityId,
          loanProfileId,
          stateRef.current
        )
        dispatchWithFailureToast(
          action,
          ActionTypes.REFINANCE_LIABILITY_FAILED,
          'assets:refinanceFailed'
        )
        return action.type !== ActionTypes.REFINANCE_LIABILITY_FAILED
      },
      installModule: (input: Parameters<typeof installModuleAction>[0]) =>
        dispatchWithFailureToast(
          installModuleAction(input, stateRef.current),
          ActionTypes.INSTALL_MODULE_FAILED,
          'assets:installFailed'
        ),
      removeModule: (assetId: string, slotId: string) => {
        // The reducer ignores a removal on the committed chassis; say so
        // instead of letting the modal close as if it had worked.
        if (isExpeditionChassisCommitmentLocked(stateRef.current, assetId)) {
          addToast(
            tRef.current('assets:removeFailed.expedition_locked'),
            'error'
          )
          return
        }
        dispatch(removeModuleAction(assetId, slotId))
      },
      startCrowdfund: (input: Parameters<typeof startCrowdfundAction>[0]) =>
        dispatchWithFailureToast(
          startCrowdfundAction(input, stateRef.current),
          ActionTypes.START_CROWDFUND_FAILED,
          'assets:startCrowdfundFailed'
        )
    }
  }, [dispatch, stateRef, addToast, tRef])
}
