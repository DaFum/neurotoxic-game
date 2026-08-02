/**
 * Pure day-loop driver.
 *
 * Runner-agnostic on purpose: `node:test` suites, the Vitest logic tier, and
 * future fuzz harnesses all import it, so it must not pull in a test runner —
 * and must never touch React, the DOM, timers, or async. Folding a full day
 * loop through here runs in single-digit milliseconds.
 */
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'

/**
 * Folds an ordered action list through the real root reducer.
 *
 * @param {object} initialState - Starting game state.
 * @param {Array<object>} actions - Real action objects, in dispatch order.
 * @returns {object} State after the last action.
 */
export function applySequence(initialState, actions) {
  let state = initialState
  for (const action of actions) {
    state = gameReducer(state, action)
  }
  return state
}

/**
 * Builds a reproducible initial state.
 *
 * @param {object} [overrides] - Shallow overrides merged over the real initial state.
 * @returns {object} Initial state with the non-deterministic seeds pinned.
 */
export function createDeterministicState(overrides = {}) {
  const base = createInitialState()
  return {
    ...base,
    rngSeed: 123456789,
    runSeed: 987654321,
    ...overrides
  }
}
