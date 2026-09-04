/**
 * Reducer handlers for the run-scoped Expedition lifecycle.
 *
 * @remarks
 * These handlers are the sole authority over Expedition run transitions.
 * Public actions carry intent plus genuinely nondeterministic tokens and stale
 * guards only; every derived value (run identity, committed build, settlement)
 * is recomputed or exact-validated here, so a forged or replayed dispatch can
 * never author a state the normal flow would not produce. Scene navigation and
 * persistence stay outside: a terminal handler settles state and the owning
 * continuation callback performs the save and scene change.
 */

import { isFiniteNumber } from '../../utils/finiteNumber'
import { createDefaultExpeditionState } from '../../domain/expedition/defaults'
import type { GameState } from '../../types'
import type { PrepareExpeditionRunPayload } from '../../types/actions'

/**
 * Narrows a payload seed to the unsigned 32-bit integer range the root
 * `runSeed` contract uses.
 *
 * @param value - Candidate seed from an untrusted dispatch.
 * @returns True when the value is already a valid persistable run seed.
 *
 * @remarks
 * This validates rather than coerces: a reducer that silently truncated a
 * malformed seed would commit a run whose map the Tour Prep preview never
 * showed.
 */
const isValidRunSeed = (value: unknown): value is number =>
  isFiniteNumber(value) &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 0xffffffff

/**
 * Prepares a run identity and atomically claims the root run seed.
 *
 * @param state - Current game state.
 * @param payload - Prep id and the next persistable run seed.
 * @returns Next state, or the identical reference when the action is illegal.
 *
 * @remarks
 * Accepted only from `idle`. Reopening Tour Prep while `prepared` is edit-only,
 * so a second PREPARE returns the same state reference and never rerolls the
 * seed — otherwise the previewed map and the started map could diverge.
 */
export const handlePrepareExpeditionRun = (
  state: GameState,
  payload: PrepareExpeditionRunPayload
): GameState => {
  if (state.expedition.status !== 'idle') return state
  if (payload === null || typeof payload !== 'object') return state

  const { prepId, runSeed } = payload
  if (typeof prepId !== 'string' || prepId.length === 0) return state
  if (!isValidRunSeed(runSeed)) return state

  return {
    ...state,
    runSeed,
    expedition: {
      ...createDefaultExpeditionState(),
      status: 'prepared',
      prep: { prepId }
    }
  }
}
