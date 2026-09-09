/**
 * Canonical default shapes for the run-scoped Expedition state.
 *
 * @remarks
 * The root `GameState.runSeed` stays the single map/run seed owner, so nothing
 * here carries a seed of its own. Every factory returns a freshly allocated
 * object graph: `initialState` is a module-level singleton, and a shared nested
 * reference would let one run's ledger leak into the next.
 */

import type {
  ExpeditionRouteProfile,
  ExpeditionState
} from '../../types/expedition'

/**
 * Upper bound on committed performance-gear activations.
 *
 * @remarks
 * The build must not be able to bring every solution, so the equipment axis is
 * a hard 0..3 selection over already-owned catalog items.
 */
export const MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS = 3 as const

/**
 * Node count the Standard route profile targets.
 *
 * @remarks
 * The approved design fixes the meaningful-node corridor at 7-9; the baseline
 * profile sits in the middle so Region/Tour profiles can move either way.
 */
const BASE_EXPEDITION_MEANINGFUL_NODES = 8 as const

/** Lower bound of the approved meaningful-node corridor for a standard run. */
export const MIN_EXPEDITION_MEANINGFUL_NODES = 7 as const

/**
 * Shortest route a Tour may explicitly declare.
 *
 * @remarks
 * The 7-9 corridor above describes a *standard* run, and it stays the shape
 * anything that does not ask for something else gets. A Tour whose whole
 * identity is being shorter may declare one step below it - the Blitz Tour is
 * the authored case - so the builder honours a declared depth instead of
 * silently clamping it up and leaving the registry stating a depth the route
 * never has.
 */
export const MIN_EXPEDITION_DECLARED_MEANINGFUL_NODES = 6 as const

/** Upper bound of the approved meaningful-node corridor. */
export const MAX_EXPEDITION_MEANINGFUL_NODES = 9 as const

/**
 * Neutral route weights used until G5 supplies typed Region/Tour profiles.
 */
export const NEUTRAL_EXPEDITION_ROUTE_PROFILE: ExpeditionRouteProfile = {
  meaningfulNodeCount: BASE_EXPEDITION_MEANINGFUL_NODES,
  undergroundWeight: 1,
  rivalWeight: 1,
  festivalWeight: 1,
  restWeight: 1,
  supplyWeight: 1,
  gigWeight: 1,
  extractionWindowRange: [3, 6],
  forcedRival: false
}

/**
 * Tour/Region identity the G1 baseline commits before G5 owns the registries.
 */
export const BASE_EXPEDITION_TOUR_TYPE_ID = 'standard_tour' as const

/**
 * The Region every pre-G5 seed and fixture is pinned to.
 *
 * @remarks
 * No production path commits it any more - Tour Prep opens on
 * {@link FREE_EXPEDITION_REGION_ID}, and this is reachable only by a Career
 * that owns `mechanic_network`. It survives as the pinned route of the runs
 * that were already committed against it and of the fixtures asserting their
 * seeds, which is exactly why it must not be renamed to the free Region:
 * changing it would move every pinned route.
 */
export const BASE_EXPEDITION_REGION_ID = 'industrial_belt' as const

/**
 * The Region a Career with no unlock set may always book.
 *
 * @remarks
 * A fresh Career tours `home_turf` on a `standard_tour`. Separate from
 * {@link BASE_EXPEDITION_REGION_ID} on purpose: changing that constant would
 * move every pinned route, while what actually needed to change is which
 * Region is free.
 */
export const FREE_EXPEDITION_REGION_ID = 'home_turf' as const

/**
 * Builds the idle Expedition slice.
 *
 * @returns A fresh {@link ExpeditionState} with no run identity.
 */
export const createDefaultExpeditionState = (): ExpeditionState => ({
  status: 'idle',
  prep: null,
  runId: null,
  routeStep: 0,
  visitedNodeIds: [],
  // Null-prototype: the map is keyed by untrusted node ids from a save, so a
  // `__proto__` key must land as an own property rather than a prototype write.
  intelByNodeId: Object.create(null) as ExpeditionState['intelByNodeId'],
  intelGrants: [],
  scoutReconUsedRouteSteps: [],
  loadout: null,
  insurancePolicyId: null,
  insuranceClaimConsumed: false,
  claimConsumed: false,
  technicalFailureAccepted: false,
  startingMoney: 0,
  startingFame: 0,
  protectedCareerCash: 0,
  rewardLedger: [],
  extractionWindowsSeen: [],
  consumedLegendaryIds: [],
  arrivedOverlay: null,
  pendingFailure: null,
  unpaidDailyObligation: 0,
  blockedTravelAtRouteStep: null,
  outcome: null,
  crew: {
    stressByCrewId: Object.create(null) as Record<string, number>,
    injuryByCrewId: Object.create(null) as Record<
      string,
      'none' | 'light' | 'serious'
    >
  },
  bandInjuryByMemberId: Object.create(null) as Record<
    string,
    'none' | 'light' | 'serious' | 'critical'
  >,
  resolvedCrewSourceIds: [],
  resolvedEventSourceIds: [],
  resolvedObligationSignalIds: [],
  pressure: {
    heat: 0,
    exposure: 0,
    crowdHype: 0,
    severeReliefUntilRouteStep: null,
    lastSevereEventId: null,
    pendingDirectorEventId: null,
    temporaryRouteOpportunity: null
  },
  preparedSponsorOffers: [],
  activeObligations: [],
  runDraftTraitIds: [],
  pendingRunDraftOffer: null,
  finaleType: null,
  lastSocialResult: null,
  pendingSocialSettlement: null,
  lastGigResolvedAtRouteStep: null,
  gigOutcomeByStep: Object.create(null) as Record<
    number,
    { venueId: string; accuracy: number }
  >
})
