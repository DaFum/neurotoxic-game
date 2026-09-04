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

/** Lower bound of the approved meaningful-node corridor. */
export const MIN_EXPEDITION_MEANINGFUL_NODES = 7 as const

/** Upper bound of the approved meaningful-node corridor. */
export const MAX_EXPEDITION_MEANINGFUL_NODES = 9 as const

/**
 * Neutral route weights used until G5 supplies typed Region/Tour profiles.
 */
export const NEUTRAL_EXPEDITION_ROUTE_PROFILE: ExpeditionRouteProfile = {
  meaningfulNodeCount: BASE_EXPEDITION_MEANINGFUL_NODES,
  specialWeight: 1,
  festivalWeight: 1,
  restWeight: 1,
  supplyWeight: 1,
  undergroundAllowed: true,
  rivalAllowed: true
}

/**
 * Tour/Region identity the G1 baseline commits before G5 owns the registries.
 */
export const BASE_EXPEDITION_TOUR_TYPE_ID = 'standard_tour' as const

/** Home region the G1 baseline commits before G5 owns the Region registry. */
export const BASE_EXPEDITION_REGION_ID = 'industrial_belt' as const

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
  startingMoney: 0,
  startingFame: 0,
  protectedCareerCash: 0,
  rewardLedger: [],
  extractionWindowsSeen: [],
  pendingFailure: null,
  outcome: null
})
