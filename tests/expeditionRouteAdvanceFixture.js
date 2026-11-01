/**
 * @fileoverview Fixture-only Expedition route advance.
 *
 * @remarks
 * There is no public action that moves the player along the route: the only
 * production commit path is Tourbus settlement in `minigameReducer`, which owns
 * fuel, travel cost and the crisis gates. Fixtures that need to stage a run at
 * a given depth call the pure helper directly through this one wrapper.
 *
 * It must stay free of Node-only imports: the browser-side e2e save builders
 * (`e2e/fixtures/expeditionFixtures.js`) load it through Vite.
 */

import { applyExpeditionRouteAdvance } from '../src/context/reducers/expeditionReducer.ts'
import { syncExpeditionPendingFailure } from '../src/domain/expedition/failure.ts'

/**
 * Advances a started run to a neighbouring route node, or throws.
 *
 * @param {import('../src/types').GameState} state - Started run state.
 * @param {string} nodeId - Target node.
 * @returns {import('../src/types').GameState} State standing on `nodeId`.
 * @throws {Error} When the helper refuses the move, so a fixture never goes on
 * from a state it did not reach.
 *
 * @remarks
 * The root reducer re-derives the Expedition crisis after every action; a
 * direct helper call skips that, so it is applied here to keep the staged
 * state identical to what a reducer pass would have committed.
 */
export const advanceRouteForFixture = (state, nodeId) => {
  const advanced = applyExpeditionRouteAdvance(state, nodeId)
  if (advanced === state) {
    throw new Error(`route advance to ${nodeId} was refused`)
  }
  return syncExpeditionPendingFailure(advanced)
}
