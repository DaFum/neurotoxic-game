import type { GameState } from '../../types'
import type { ApplySocialPostResultPayload } from '../../types/actions'
import { isFiniteNumber } from '../finiteNumber'
import { getExpeditionSpendableCash } from '../../domain/expedition/spendableCash'

/**
 * Why a social post was refused. `CONDITION_FAILED` comes only from the
 * selection-time recheck in `calculatePostGigStateUpdates`; the other codes
 * come from {@link validateSocialPostResult}.
 */
export type SocialPostRefusalCode =
  | 'CONDITION_FAILED'
  | 'INSUFFICIENT_SPENDABLE_CASH'
  | 'INVALID_PAYLOAD'
  | 'STALE_SETTLEMENT'

/** Outcome of committing a social post result through the dispatch layer. */
export type SocialPostCommitResult =
  { ok: true } | { ok: false; reason: SocialPostRefusalCode | null }

/**
 * Validates a composite social post result against a state snapshot. Shared by
 * `createApplySocialPostResultAction` and `handleApplySocialPostResult`, so the
 * creator and the reducer refuse the same payloads.
 *
 * Checks, in order: payload shape and a nonempty `pendingSocialOptionId`
 * (`INVALID_PAYLOAD`), a finite `moneyDelta` when present (`INVALID_PAYLOAD`),
 * that a supplied nonempty `settlementId` names the pending, unreconciled
 * settlement (`STALE_SETTLEMENT`; reapplying would decrement the per-gig deals
 * twice), and that a debit fits the spendable Cash
 * (`INSUFFICIENT_SPENDABLE_CASH`).
 *
 * The post option's own condition is NOT rechecked here: that recheck lives
 * only in `calculatePostGigStateUpdates`, which has the option and the gig
 * context the payload does not carry.
 *
 * @param state - State the payload would be applied to.
 * @param payload - Composite social post result payload.
 * @returns The refusal code, or `null` when the payload may be applied.
 */
export const validateSocialPostResult = (
  state: GameState,
  payload: ApplySocialPostResultPayload
): Exclude<SocialPostRefusalCode, 'CONDITION_FAILED'> | null => {
  if (!payload || typeof payload !== 'object' || !payload.social) {
    return 'INVALID_PAYLOAD'
  }
  if (
    typeof payload.social.pendingSocialOptionId !== 'string' ||
    payload.social.pendingSocialOptionId.length === 0
  ) {
    return 'INVALID_PAYLOAD'
  }
  if (
    payload.moneyDelta !== undefined &&
    payload.moneyDelta !== null &&
    !isFiniteNumber(payload.moneyDelta)
  ) {
    return 'INVALID_PAYLOAD'
  }

  if (
    typeof payload.settlementId === 'string' &&
    payload.settlementId.length > 0
  ) {
    const pending = state.pendingGigSettlement
    if (
      !pending ||
      pending.id !== payload.settlementId ||
      pending.socialReconciled === true
    ) {
      return 'STALE_SETTLEMENT'
    }
  }

  const moneyDelta = payload.moneyDelta ?? 0
  if (moneyDelta < 0 && -moneyDelta > getExpeditionSpendableCash(state)) {
    return 'INSUFFICIENT_SPENDABLE_CASH'
  }

  return null
}
