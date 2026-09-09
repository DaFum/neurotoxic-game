/**
 * The Between-Tour decision families and the options each one offers.
 *
 * @remarks
 * Priority order is data, not a sort comparator: the design fixes which
 * decision a Tour surfaces first when several are available, and reading that
 * order from an array is what makes it reviewable. Every option a decision can
 * offer is listed here too, so a resolve can be checked against the registry
 * rather than against whatever the stored instance happens to claim.
 */

import type { BetweenTourDecisionType } from '../../types/career'

/** At most this many decisions per finalized Tour. */
export const MAX_BETWEEN_TOUR_DECISIONS = 3

/** The families, in the order they are chosen. */
export const BETWEEN_TOUR_DECISION_PRIORITY = [
  // First, because an insolvent Career has no next Tour to spend the other
  // decisions on. It only generates when the Career actually cannot fund the
  // cheapest legal build, so a solvent Career never sees it.
  'sponsor_advance',
  'injury_rehab',
  'crew_debrief',
  'rival_response',
  'sponsor_follow_up',
  'vehicle_repair',
  'network_contact'
] as const

/**
 * Every option a family can offer.
 *
 * @remarks
 * A generated instance may offer a *subset* - `develop_signature` only appears
 * when the chosen Crew is actually eligible - so this is the outer bound and
 * the instance's own `optionIds` is the authority at resolve time.
 */
export const BETWEEN_TOUR_OPTIONS: Readonly<
  Record<BetweenTourDecisionType, readonly string[]>
> = {
  sponsor_advance: ['take_advance', 'decline_advance'],
  injury_rehab: ['pay_rehab', 'accept_unavailability'],
  crew_debrief: ['rest_band', 'develop_signature'],
  rival_response: ['confront', 'cool_down'],
  sponsor_follow_up: ['keep_relationship', 'walk_away'],
  vehicle_repair: ['pay_repair', 'carry_damage'],
  network_contact: ['follow_lead', 'cash_out']
}

const TYPE_SET: ReadonlySet<string> = new Set(BETWEEN_TOUR_DECISION_PRIORITY)

export const isBetweenTourDecisionType = (
  value: unknown
): value is BetweenTourDecisionType =>
  typeof value === 'string' && TYPE_SET.has(value)

/** Career Cash the rehab option charges. */
export const BETWEEN_TOUR_REHAB_COST = 300

/** Career Cash `cash_out` pays instead of a discovery. */
export const BETWEEN_TOUR_CASH_OUT_PAYOUT = 200

/** Cost per missing condition point when repairing the van. */
export const BETWEEN_TOUR_REPAIR_COST_PER_POINT = 12

/** Van condition at or above which no repair decision is offered. */
export const BETWEEN_TOUR_REPAIR_CONDITION_CEILING = 75

/**
 * Cash a Sponsor advance pays an insolvent Career.
 *
 * @remarks
 * Sized to clear the cheapest legal next build with room for one leg of
 * travel, not to restore a comfortable balance: the advance buys another
 * attempt, not a fresh start.
 */
export const BETWEEN_TOUR_SPONSOR_ADVANCE_AMOUNT = 400

/**
 * What the advance costs when it is repaid.
 *
 * @remarks
 * Taken off the next settlement that actually retains money, so the Tour that
 * recovers pays for the Tour that failed.
 */
export const BETWEEN_TOUR_SPONSOR_ADVANCE_REPAYMENT_RATE = 1.25
