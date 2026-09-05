import { useMemo, type Dispatch, type MutableRefObject } from 'react'
import type { GameAction, GameState } from '../types'
import type {
  ExpeditionInspectionIntent,
  ExpeditionInsuranceClaimInput,
  ExpeditionIntelSource,
  ExpeditionLoadout,
  ExpeditionRepairIntent,
  ExpeditionRewardSourceType
} from '../types/expedition'
import {
  acceptExpeditionFailure as acceptExpeditionFailureAction,
  acceptExpeditionTechnicalFailure as acceptExpeditionTechnicalFailureAction,
  addExpeditionReward as addExpeditionRewardAction,
  advanceExpeditionRoute as advanceExpeditionRouteAction,
  claimExpeditionInsurance as claimExpeditionInsuranceAction,
  completeExpedition as completeExpeditionAction,
  executeExpeditionInspection as executeExpeditionInspectionAction,
  executeExpeditionRepair as executeExpeditionRepairAction,
  extractExpedition as extractExpeditionAction,
  prepareExpeditionRun as prepareExpeditionRunAction,
  prepareNextExpedition as prepareNextExpeditionAction,
  resolveExpeditionCrisis as resolveExpeditionCrisisAction,
  revealExpeditionNodeIntel as revealExpeditionNodeIntelAction,
  startExpedition as startExpeditionAction,
  recordExpeditionCrewStressSource as recordExpeditionCrewStressSourceAction,
  recordExpeditionRelationshipOutcome as recordExpeditionRelationshipOutcomeAction,
  advanceExpeditionCrewInjury as advanceExpeditionCrewInjuryAction,
  advanceExpeditionBandInjury as advanceExpeditionBandInjuryAction,
  createContactIntelGrant as createContactIntelGrantAction,
  recordExpeditionObligationSignal as recordExpeditionObligationSignalAction,
  doubleDownExpeditionObligation as doubleDownExpeditionObligationAction,
  offerExpeditionDraft as offerExpeditionDraftAction,
  selectExpeditionDraft as selectExpeditionDraftAction,
  resolveExpeditionSocialResult as resolveExpeditionSocialResultAction,
  createSocialIntelGrant as createSocialIntelGrantAction
} from './expeditionActionCreators'
import { createSettleExpeditionCrewCareerAction } from './careerActionCreators'
import type { GameDispatchActions } from './useGameDispatchActions'

/**
 * Expedition dispatch wrappers, sliced from {@link GameDispatchActions}.
 */
export type ExpeditionDispatchActions = Pick<
  GameDispatchActions,
  | 'prepareExpeditionRun'
  | 'startExpedition'
  | 'advanceExpeditionRoute'
  | 'revealExpeditionNodeIntel'
  | 'addExpeditionReward'
  | 'extractExpedition'
  | 'completeExpedition'
  | 'acceptExpeditionFailure'
  | 'prepareNextExpedition'
  | 'resolveExpeditionCrisis'
  | 'executeExpeditionRepair'
  | 'executeExpeditionInspection'
  | 'claimExpeditionInsurance'
  | 'acceptExpeditionTechnicalFailure'
  | 'recordExpeditionCrewStressSource'
  | 'recordExpeditionRelationshipOutcome'
  | 'advanceExpeditionCrewInjury'
  | 'advanceExpeditionBandInjury'
  | 'createContactIntelGrant'
  | 'recordExpeditionObligationSignal'
  | 'doubleDownExpeditionObligation'
  | 'offerExpeditionDraft'
  | 'selectExpeditionDraft'
  | 'resolveExpeditionSocialResult'
  | 'createSocialIntelGrant'
>

interface UseExpeditionDispatchActionsProps {
  dispatch: Dispatch<GameAction>
  stateRef: MutableRefObject<GameState>
}

/**
 * Builds the memoized Expedition dispatch wrappers.
 *
 * @param props - Dispatcher and the state ref creators read their snapshot from.
 * @returns Stable Expedition dispatch methods.
 *
 * @remarks
 * Each helper reads `stateRef.current` so the snapshot a creator derives ids,
 * seeds and stale guards from is the same one the reducer validates against.
 * The two creators that can legitimately have nothing to dispatch return
 * `null`, which is skipped here rather than turned into a forged payload.
 */
export function useExpeditionDispatchActions({
  dispatch,
  stateRef
}: UseExpeditionDispatchActionsProps): ExpeditionDispatchActions {
  return useMemo(
    () => ({
      prepareExpeditionRun: () =>
        dispatch(prepareExpeditionRunAction(stateRef.current)),
      startExpedition: (loadout: ExpeditionLoadout) =>
        dispatch(startExpeditionAction(stateRef.current, loadout)),
      advanceExpeditionRoute: (nodeId: string) =>
        dispatch(advanceExpeditionRouteAction(stateRef.current, nodeId)),
      revealExpeditionNodeIntel: (input: {
        nodeId: string
        source: ExpeditionIntelSource
        grantId?: string
      }) => dispatch(revealExpeditionNodeIntelAction(stateRef.current, input)),
      addExpeditionReward: (input: {
        expectedRewardId: string
        sourceType: ExpeditionRewardSourceType
        sourceId: string
      }) => dispatch(addExpeditionRewardAction(stateRef.current, input)),
      extractExpedition: (explicitRareRewardIds: string[] = []) => {
        const runId = stateRef.current.expedition.runId
        dispatch(
          extractExpeditionAction(stateRef.current, explicitRareRewardIds)
        )
        if (runId) dispatch(createSettleExpeditionCrewCareerAction(runId))
      },
      completeExpedition: (finaleResultId: string) => {
        const runId = stateRef.current.expedition.runId
        dispatch(completeExpeditionAction(stateRef.current, finaleResultId))
        if (runId) dispatch(createSettleExpeditionCrewCareerAction(runId))
      },
      acceptExpeditionFailure: () => {
        const action = acceptExpeditionFailureAction(stateRef.current)
        if (action) {
          const runId = stateRef.current.expedition.runId
          dispatch(action)
          if (runId) dispatch(createSettleExpeditionCrewCareerAction(runId))
        }
      },
      prepareNextExpedition: () => {
        const action = prepareNextExpeditionAction(stateRef.current)
        if (action) dispatch(action)
      },
      resolveExpeditionCrisis: (
        choice: 'refuel' | 'tow' | 'insurance_claim'
      ) => {
        const action = resolveExpeditionCrisisAction(stateRef.current, choice)
        if (action) dispatch(action)
      },
      executeExpeditionRepair: (intent: ExpeditionRepairIntent) => {
        const action = executeExpeditionRepairAction(stateRef.current, intent)
        if (action) dispatch(action)
      },
      executeExpeditionInspection: (intent: ExpeditionInspectionIntent) => {
        const action = executeExpeditionInspectionAction(
          stateRef.current,
          intent
        )
        if (action) dispatch(action)
      },
      claimExpeditionInsurance: (payload: ExpeditionInsuranceClaimInput) => {
        const action = claimExpeditionInsuranceAction(stateRef.current, payload)
        if (action) dispatch(action)
      },
      acceptExpeditionTechnicalFailure: () => {
        const action = acceptExpeditionTechnicalFailureAction(stateRef.current)
        if (action) dispatch(action)
      },
      recordExpeditionCrewStressSource: (crewId, sourceType, sourceId) =>
        dispatch(
          recordExpeditionCrewStressSourceAction(
            stateRef.current,
            crewId,
            sourceType,
            sourceId
          )
        ),
      recordExpeditionRelationshipOutcome: input =>
        dispatch(
          recordExpeditionRelationshipOutcomeAction(stateRef.current, input)
        ),
      advanceExpeditionCrewInjury: (crewId, sourceId) =>
        dispatch(
          advanceExpeditionCrewInjuryAction(stateRef.current, crewId, sourceId)
        ),
      advanceExpeditionBandInjury: (memberId, sourceId) =>
        dispatch(
          advanceExpeditionBandInjuryAction(
            stateRef.current,
            memberId,
            sourceId
          )
        ),
      createContactIntelGrant: (eventId, optionId, nodeId) =>
        dispatch(
          createContactIntelGrantAction(
            stateRef.current,
            eventId,
            optionId,
            nodeId
          )
        ),
      recordExpeditionObligationSignal: (signalType, sourceId) =>
        dispatch(
          recordExpeditionObligationSignalAction(
            stateRef.current,
            signalType,
            sourceId
          )
        ),
      doubleDownExpeditionObligation: (obligationId, offerId) =>
        dispatch(
          doubleDownExpeditionObligationAction(
            stateRef.current,
            obligationId,
            offerId
          )
        ),
      offerExpeditionDraft: (sourceType, sourceKey) =>
        dispatch(
          offerExpeditionDraftAction(stateRef.current, sourceType, sourceKey)
        ),
      selectExpeditionDraft: traitId =>
        dispatch(selectExpeditionDraftAction(stateRef.current, traitId)),
      resolveExpeditionSocialResult: (resultId, postOptionId) =>
        dispatch(
          resolveExpeditionSocialResultAction(
            stateRef.current,
            resultId,
            postOptionId
          )
        ),
      createSocialIntelGrant: (postOptionId, resultId, nodeId) =>
        dispatch(
          createSocialIntelGrantAction(
            stateRef.current,
            postOptionId,
            resultId,
            nodeId
          )
        )
    }),
    [dispatch, stateRef]
  )
}
