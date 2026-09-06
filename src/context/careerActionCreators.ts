import { ActionTypes } from './actionTypes'
import type { GameAction } from '../types'

export const createSettleExpeditionCrewCareerAction = (
  runId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.SETTLE_EXPEDITION_CREW_CAREER }
> => ({ type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER, payload: { runId } })
/**
 * Settles one finalized run's Career result: Tokens, counters and Regions.
 *
 * @param runId - The finalized run to settle.
 * @returns The typed action.
 *
 * @remarks
 * Carries the run id and nothing else. Every value the settlement applies is
 * derived in the reducer from that run's own outcome, so a caller can choose
 * *which* run is settled but never what it was worth.
 */
export const createSettleExpeditionCareerResultAction = (
  runId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT }
> => ({ type: ActionTypes.SETTLE_EXPEDITION_CAREER_RESULT, payload: { runId } })

export const createAcquireExpeditionCrewSignatureAction = (
  crewId: string,
  expectedTraitId: string,
  sourceId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.ACQUIRE_EXPEDITION_CREW_SIGNATURE }
> => ({
  type: ActionTypes.ACQUIRE_EXPEDITION_CREW_SIGNATURE,
  payload: {
    crewId,
    expectedTraitId,
    sourceType: 'career_development',
    sourceId
  }
})
