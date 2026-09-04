/**
 * Typed action creators for the Expedition lifecycle.
 *
 * @remarks
 * Creators own the genuinely nondeterministic parts of a dispatch — ids and the
 * next persistable run seed — and normalize raw input. They never authorize a
 * transition: the reducer re-validates every field and stays the final
 * authority against malformed or replayed dispatches.
 */

import { getSafeUUID } from '../utils/crypto'
import { nextSeed } from '../utils/seededRng'
import { ActionTypes } from './actionTypes'
import type { GameAction, GameState } from '../types'

/**
 * Builds the PREPARE action that claims a run identity and the next run seed.
 *
 * @param state - Current game state, read for the seed to advance from.
 * @returns Typed `PREPARE_EXPEDITION_RUN` action.
 *
 * @remarks
 * The seed is derived from the current root `GameState.runSeed` through the
 * shared `nextSeed` helper, so the value is deterministic from the save and
 * reproducible in a bug report — unlike a fresh crypto draw. The reducer
 * ignores the action unless the run is `idle`, so calling this while a run is
 * prepared or active cannot reroll the map.
 */
export const prepareExpeditionRun = (
  state: GameState
): Extract<
  GameAction,
  { type: typeof ActionTypes.PREPARE_EXPEDITION_RUN }
> => ({
  type: ActionTypes.PREPARE_EXPEDITION_RUN,
  payload: {
    prepId: getSafeUUID(),
    runSeed: nextSeed(state.runSeed)
  }
})
