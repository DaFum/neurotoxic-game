/**
 * Hybrid extraction settlement.
 *
 * @remarks
 * Extraction is the mode's central push-your-luck decision, so the terms have
 * to be explicit and idempotent: a failed or aborted run keeps a meaningful
 * share of ordinary Cash/Fame, while the upside of greed — unsecured rare
 * rewards and the completion share — is only kept by extracting deliberately or
 * finishing the Finale.
 */

import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'
import type { GameState } from '../../types'
import type {
  ExpeditionRewardLedgerEntry,
  ExpeditionSettlement
} from '../../types/expedition'
import { getEffectiveExpeditionRules } from './effectiveRules'

/**
 * Base Cash/Fame retention per terminal kind, before G5 multipliers.
 */
export const EXPEDITION_BASE_RETENTION = {
  // 0.70 rather than 0.60: a bail-out keeps most of what the run banked, so
  // the choice at an extraction window is between a good outcome now and a
  // better one deeper in, not between a good outcome and a gutted one. The
  // Finale still pays strictly more (1.0 plus the Tour's completion bonus),
  // which is what keeps pushing on attractive.
  extracted: 0.7,
  failed: 0.25,
  completed: 1
} as const satisfies Record<'extracted' | 'failed' | 'completed', number>

/**
 * Rare rewards a voluntary extraction may carry out by default.
 */
export const BASE_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS = 1 as const

/**
 * Hard cap on explicitly carried rare rewards, whatever the effective rules say.
 */
export const MAX_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS = 3 as const

/**
 * Resolves how many unsecured rare rewards a voluntary extraction may carry.
 *
 * @param state - Current game state.
 * @returns Carry slots, always inside `1..3`.
 *
 * @remarks
 * G2 introduces `getEffectiveExpeditionRules(state)` and G5 the Legendary and
 * Region effects that raise
 * `numeric.explicitExtractionRareCarrySlots`. This function is the single place
 * that reads it, so those gates extend it in place rather than adding a second
 * source for the cap.
 */
export const getExplicitExtractionRareCarrySlots = (
  state: GameState
): number => {
  const rules = getEffectiveExpeditionRules(state)
  return Math.max(
    BASE_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS,
    Math.min(
      MAX_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS,
      rules.numeric.explicitExtractionRareCarrySlots
    )
  )
}

/**
 * Kinds of terminal transition a settlement can describe.
 */
export type ExpeditionTerminalKind = 'extracted' | 'completed' | 'failed'

/**
 * Splits the ledger into retained and abandoned entries.
 *
 * @param ledger - The run's reward ledger.
 * @param kind - Terminal transition kind.
 * @param explicitRareRewardIds - Entry ids the player explicitly carries out;
 * only meaningful for a voluntary extraction.
 * @param carrySlots - Resolved carry cap.
 * @returns Retained and abandoned entry ids.
 *
 * @remarks
 * Secured entries are always retained: the obligation or Finale that produced
 * them already resolved, and the design forbids taking a resolved reward back.
 * A completed run retains everything. A failure retains only the secured set —
 * that is precisely the upside greed risks.
 */
export const splitExpeditionRewardLedger = (
  ledger: readonly ExpeditionRewardLedgerEntry[],
  kind: ExpeditionTerminalKind,
  explicitRareRewardIds: readonly string[],
  carrySlots: number
): { retainedRewardEntryIds: string[]; abandonedRewardEntryIds: string[] } => {
  const retained: string[] = []
  const abandoned: string[] = []
  const cap = Math.max(
    0,
    Math.min(
      MAX_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS,
      isFiniteNumber(carrySlots) ? Math.trunc(carrySlots) : 0
    )
  )

  // Deduplicated, order-preserving: a caller repeating one id must not consume
  // two carry slots, and must not be able to carry the same reward twice.
  const requested: string[] = []
  const seenRequested = new Set<string>()
  for (const id of explicitRareRewardIds) {
    if (typeof id !== 'string' || seenRequested.has(id)) continue
    seenRequested.add(id)
    requested.push(id)
  }

  let carried = 0
  for (const entry of ledger) {
    if (kind === 'completed' || entry.secured) {
      retained.push(entry.id)
      continue
    }
    if (kind === 'extracted' && carried < cap && requested.includes(entry.id)) {
      carried += 1
      retained.push(entry.id)
      continue
    }
    abandoned.push(entry.id)
  }

  return {
    retainedRewardEntryIds: retained,
    abandonedRewardEntryIds: abandoned
  }
}

/**
 * Computes the terminal settlement for a run.
 *
 * @param state - Current game state, read for the run's starting baselines.
 * @param kind - Terminal transition kind.
 * @param explicitRareRewardIds - Entry ids the player explicitly carries out.
 * @returns The finalized settlement.
 *
 * @remarks
 * Cash and Fame *earned during the run* are what retention applies to: the
 * player's pre-run balance is never confiscated, and neither is the protected
 * Career slice, because both sit below the run's starting baselines. A run that
 * lost money forfeits nothing — retention is not a second penalty.
 */
export const settleExpedition = (
  state: GameState,
  kind: ExpeditionTerminalKind,
  explicitRareRewardIds: readonly string[] = []
): ExpeditionSettlement => {
  // Voluntary extraction is the only terminal kind the run-draft retention
  // modifier touches: `reckless_encore` trades a richer Finale for a worse
  // bail-out, so a completed or failed run keeps its canonical base rate.
  const retentionRate =
    kind === 'extracted'
      ? Math.max(
          0,
          Math.min(
            1,
            EXPEDITION_BASE_RETENTION[kind] *
              getEffectiveExpeditionRules(state).numeric
                .extractionRetentionMultiplier
          )
        )
      : EXPEDITION_BASE_RETENTION[kind]
  // The Tour's completion bonus, which the spec names as one of the two upsides
  // greed buys (the other being unextracted rares). It applies only to a run
  // that actually reached its Finale: a bail-out or a failure has not earned
  // it, so a survival Tour's x1.2 cannot be collected by extracting early and
  // a blitz Tour's x0.95 is not a penalty on runs that never completed.
  const completionMultiplier =
    kind === 'completed'
      ? Math.max(
          0,
          finiteNumberOr(
            getEffectiveExpeditionRules(state).numeric.completionMultiplier,
            1
          )
        )
      : 1
  const money = isFiniteNumber(state.player.money) ? state.player.money : 0
  const fame = isFiniteNumber(state.player.fame) ? state.player.fame : 0

  const moneyEarned = Math.max(
    0,
    Math.round(money - state.expedition.startingMoney)
  )
  const fameEarned = Math.max(
    0,
    Math.round(fame - state.expedition.startingFame)
  )
  // Tour Pressure pays here and nowhere else: it multiplies the Money and Fame
  // the run terminally *retains*, on a run that extracted or completed. Not
  // rares, not Tour Tokens, not item counts, and nothing on a failed run - the
  // modifiers' costs are priced against what the Career actually walks away
  // with, so paying them per-Gig would pay for danger the run never survived.
  const pressureRewardMultiplier =
    kind === 'failed'
      ? 1
      : Math.max(
          0,
          finiteNumberOr(
            getEffectiveExpeditionRules(state).numeric.pressureRewardMultiplier,
            1
          )
        )
  const moneyRetained = Math.floor(
    moneyEarned *
      retentionRate *
      completionMultiplier *
      pressureRewardMultiplier
  )
  const fameRetained = Math.floor(
    fameEarned * retentionRate * completionMultiplier * pressureRewardMultiplier
  )

  const { retainedRewardEntryIds, abandonedRewardEntryIds } =
    splitExpeditionRewardLedger(
      state.expedition.rewardLedger,
      kind,
      explicitRareRewardIds,
      getExplicitExtractionRareCarrySlots(state)
    )

  return {
    retentionRate,
    moneyEarned,
    moneyRetained,
    // Never negative: a completion bonus above 1.0 pays out more than the run
    // earned, and that is a bonus rather than a negative forfeit.
    moneyForfeited: Math.max(0, moneyEarned - moneyRetained),
    fameEarned,
    fameRetained,
    fameForfeited: Math.max(0, fameEarned - fameRetained),
    retainedRewardEntryIds,
    abandonedRewardEntryIds
  }
}

/**
 * Checks whether the run is standing on a legal extraction window.
 *
 * @param state - Current game state.
 * @param isWindowStep - Whether the current route step offers extraction,
 * resolved from the prepared route by the caller.
 * @returns True when voluntary extraction is legal right now.
 */
export const canExtractExpedition = (
  state: GameState,
  isWindowStep: boolean
): boolean => state.expedition.status === 'active' && isWindowStep
