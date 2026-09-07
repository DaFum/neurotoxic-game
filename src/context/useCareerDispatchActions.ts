import { useMemo, type Dispatch } from 'react'
import type { GameAction } from '../types'
import {
  createAcquireExpeditionCrewSignatureAction,
  createSettleExpeditionCareerResultAction,
  createSettleExpeditionCrewCareerAction,
  createPurchaseExpeditionHqFacilityAction,
  createGenerateExpeditionBetweenTourDecisionsAction,
  createRecordExpeditionArchiveDiscoveryAction,
  createResolveExpeditionBetweenTourDecisionAction,
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
  | 'generateExpeditionBetweenTourDecisions'
  | 'resolveExpeditionBetweenTourDecision'
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
      generateExpeditionBetweenTourDecisions: runId =>
        dispatch(createGenerateExpeditionBetweenTourDecisionsAction(runId)),
      resolveExpeditionBetweenTourDecision: (runId, decisionId, optionId) =>
        dispatch(
          createResolveExpeditionBetweenTourDecisionAction(
            runId,
            decisionId,
            optionId
          )
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
