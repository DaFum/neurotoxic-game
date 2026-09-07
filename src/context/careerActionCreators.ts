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

/**
 * Raises one HQ facility by a single level.
 *
 * @param facilityId - Facility to raise.
 * @param expectedLevel - Level the caller believes it is at now.
 * @returns The typed action.
 *
 * @remarks
 * Carries no cost. The reducer derives it from the registry, refuses a target
 * above that facility's implemented ceiling, and debits the Tokens once - so a
 * caller chooses *what* to build, never what it costs.
 */
export const createPurchaseExpeditionHqFacilityAction = (
  facilityId: string,
  expectedLevel: number
): Extract<
  GameAction,
  { type: typeof ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY }
> => ({
  type: ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY,
  payload: { facilityId, expectedLevel }
})

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

/**
 * Opens the unlock-purchase journal entry and debits the Tokens.
 *
 * @param setId - Set being bought.
 * @returns The typed action.
 *
 * @remarks
 * Step one of three. Carries the set id alone: rank, facility level and cost
 * are all re-derived in the reducer, so a caller chooses *what* to buy and
 * never what it costs or whether it is allowed.
 */
export const createBeginExpeditionUnlockPurchaseAction = (
  setId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE }
> => ({
  type: ActionTypes.BEGIN_EXPEDITION_UNLOCK_PURCHASE,
  payload: { setId }
})

/**
 * Grants the set the open journal entry paid for.
 *
 * @param setId - Set being completed; must match the open entry.
 * @returns The typed action.
 */
export const createCompleteExpeditionUnlockPurchaseAction = (
  setId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMPLETE_EXPEDITION_UNLOCK_PURCHASE }
> => ({
  type: ActionTypes.COMPLETE_EXPEDITION_UNLOCK_PURCHASE,
  payload: { setId }
})

/**
 * Refunds the open journal entry and grants nothing.
 *
 * @param setId - Set being rolled back; must match the open entry.
 * @returns The typed action.
 */
export const createRollbackExpeditionUnlockPurchaseAction = (
  setId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.ROLLBACK_EXPEDITION_UNLOCK_PURCHASE }
> => ({
  type: ActionTypes.ROLLBACK_EXPEDITION_UNLOCK_PURCHASE,
  payload: { setId }
})

/**
 * Opens Ascension, naming the settled run that proves it was earned.
 *
 * @param runId - The settled run standing as evidence.
 * @returns The typed action.
 *
 * @remarks
 * Carries no boolean. The reducer recomputes rank, unlock-set count and the
 * meta-unlock quest from the Career itself, so a caller points at evidence and
 * never at the conclusion.
 */
export const createUnlockExpeditionAscensionAction = (
  runId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.UNLOCK_EXPEDITION_ASCENSION }
> => ({ type: ActionTypes.UNLOCK_EXPEDITION_ASCENSION, payload: { runId } })

/**
 * Claims the Legendary a finalized Finale earned.
 *
 * @param runId - The finalized run standing as evidence.
 * @param expectedCapabilityId - The Legendary the caller believes is owed.
 * @returns The typed action.
 *
 * @remarks
 * The capability id travels as a stale guard: the reducer derives the
 * candidate from the outcome's Finale and refuses a mismatch, so a caller that
 * read a stale summary claims nothing rather than the wrong Legendary.
 */
export const createCommitExpeditionLegendaryRewardAction = (
  runId: string,
  expectedCapabilityId: string
): Extract<
  GameAction,
  { type: typeof ActionTypes.COMMIT_EXPEDITION_LEGENDARY_REWARD }
> => ({
  type: ActionTypes.COMMIT_EXPEDITION_LEGENDARY_REWARD,
  payload: { runId, expectedCapabilityId }
})
