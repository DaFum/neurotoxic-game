/**
 * Fuel a rescue puts back in the tank, shared by the failure shell's paid tow
 * and the vehicle insurance claim.
 *
 * @remarks
 * Kept in its own module so `failure.ts` and `insurance.ts` do not import each
 * other at runtime.
 */

import { finiteNumberOr } from '../../utils/finiteNumber'
import { getExpeditionCheapestOnwardLegFuel } from './travel'
import type { GameState } from '../../types'

/**
 * Fuel a tow puts back in the tank.
 *
 * @remarks
 * Deliberately a partial refill rather than a full tank: a tow is the pricier,
 * less efficient escape, so it gets the run moving again without also solving
 * the next leg. Refuelling remains the cheaper, better option whenever it is
 * affordable.
 */
export const EXPEDITION_TOW_FUEL_RESTORED = 35 as const

/**
 * Litres a fuel rescue (paid tow or vehicle insurance claim) must leave in
 * the tank.
 *
 * @param state - Current game state.
 * @returns `max(EXPEDITION_TOW_FUEL_RESTORED, ceil(cheapest reachable leg))`.
 *
 * @remarks
 * A rescue sized below the cheapest reachable leg would charge for it and
 * leave the van stranded, so it covers that leg in whole litres. The caller
 * clamps to tank capacity.
 */
export const getExpeditionRescueFuelFloor = (state: GameState): number =>
  Math.max(
    EXPEDITION_TOW_FUEL_RESTORED,
    Math.ceil(finiteNumberOr(getExpeditionCheapestOnwardLegFuel(state), 0))
  )
