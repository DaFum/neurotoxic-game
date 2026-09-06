import { useMemo, type Dispatch } from 'react'
import type { GameAction } from '../types'
import {
  createAcquireExpeditionCrewSignatureAction,
  createSettleExpeditionCareerResultAction,
  createSettleExpeditionCrewCareerAction,
  createPurchaseExpeditionHqFacilityAction
} from './careerActionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

export type CareerDispatchActions = Pick<
  GameDispatchActions,
  | 'settleExpeditionCrewCareer'
  | 'settleExpeditionCareerResult'
  | 'acquireExpeditionCrewSignature'
  | 'purchaseExpeditionHqFacility'
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
