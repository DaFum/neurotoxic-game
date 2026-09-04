import { ActionTypes } from './actionTypes'
import type { GameAction } from '../types'

export const createSettleExpeditionCrewCareerAction = (
  runId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.SETTLE_EXPEDITION_CREW_CAREER }
> => ({ type: ActionTypes.SETTLE_EXPEDITION_CREW_CAREER, payload: { runId } })
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
