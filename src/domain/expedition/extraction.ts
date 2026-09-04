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

import { isFiniteNumber } from '../../utils/finiteNumber'
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
  extracted: 0.6,
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
  const retentionRate = EXPEDITION_BASE_RETENTION[kind]
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
  const moneyRetained = Math.floor(moneyEarned * retentionRate)
  const fameRetained = Math.floor(fameEarned * retentionRate)

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
    moneyForfeited: moneyEarned - moneyRetained,
    fameEarned,
    fameRetained,
    fameForfeited: fameEarned - fameRetained,
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
