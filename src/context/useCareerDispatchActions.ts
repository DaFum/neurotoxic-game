import { useMemo, type Dispatch } from 'react'
import type { GameAction } from '../types'
import {
  createAcquireExpeditionCrewSignatureAction,
  createSettleExpeditionCareerResultAction,
  createSettleExpeditionCrewCareerAction,
  createGenerateExpeditionBetweenTourDecisionsAction,
  createRecordExpeditionArchiveDiscoveryAction,
  createResolveExpeditionBetweenTourDecisionAction,
  createUnlockExpeditionAscensionAction
} from './careerActionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

/**
 * Isolates the subset of global dispatch actions specifically related to expedition
 * career progression, HQ upgrades, and meta-progression management.
 */
type CareerDispatchActions = Pick<
  GameDispatchActions,
  | 'settleExpeditionCrewCareer'
  | 'settleExpeditionCareerResult'
  | 'acquireExpeditionCrewSignature'
  | 'unlockExpeditionAscension'
  | 'recordExpeditionArchiveDiscovery'
  | 'generateExpeditionBetweenTourDecisions'
  | 'resolveExpeditionBetweenTourDecision'
>

/**
 * Constructs a memoized object of bound dispatch functions for career-related state transitions.
 *
 * @param dispatch - The global store dispatch function.
 * @returns A stable record of bound career dispatch actions.
 */
export const useCareerDispatchActions = (
  dispatch: Dispatch<GameAction>
): CareerDispatchActions =>
  useMemo(
    () => ({
      settleExpeditionCrewCareer: runId =>
        dispatch(createSettleExpeditionCrewCareerAction(runId)),
      settleExpeditionCareerResult: runId =>
        dispatch(createSettleExpeditionCareerResultAction(runId)),
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
