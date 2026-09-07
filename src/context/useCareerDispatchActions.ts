import { useMemo, type Dispatch } from 'react'
import type { GameAction } from '../types'
import {
  createAcquireExpeditionCrewSignatureAction,
  createSettleExpeditionCareerResultAction,
  createSettleExpeditionCrewCareerAction,
  createPurchaseExpeditionHqFacilityAction,
  createRecordExpeditionArchiveDiscoveryAction,
  createUnlockExpeditionAscensionAction
} from './careerActionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

export type CareerDispatchActions = Pick<
  GameDispatchActions,
  | 'settleExpeditionCrewCareer'
  | 'settleExpeditionCareerResult'
  | 'acquireExpeditionCrewSignature'
  | 'purchaseExpeditionHqFacility'
  | 'unlockExpeditionAscension'
  | 'recordExpeditionArchiveDiscovery'
>

export const useCareerDispatchActions = (
  dispatch: Dispatch<GameAction>
): CareerDispatchActions =>
  useMemo(
    () => ({
      settleExpeditionCrewCareer: runId =>
        dispatch(createSettleExpeditionCrewCareerAction(runId)),
      settleExpeditionCareerResult: runId =>
        dispatch(createSettleExpeditionCareerResultAction(runId)),
      purchaseExpeditionHqFacility: (facilityId, expectedLevel) =>
        dispatch(
          createPurchaseExpeditionHqFacilityAction(facilityId, expectedLevel)
        ),
      unlockExpeditionAscension: runId =>
        dispatch(createUnlockExpeditionAscensionAction(runId)),
      recordExpeditionArchiveDiscovery: (category, id, sourceId) =>
        dispatch(
          createRecordExpeditionArchiveDiscoveryAction(category, id, sourceId)
        ),
      acquireExpeditionCrewSignature: (crewId, expectedTraitId, sourceId) =>
        dispatch(
          createAcquireExpeditionCrewSignatureAction(
            crewId,
            expectedTraitId,
            sourceId
          )
        )
    }),
    [dispatch]
  )
