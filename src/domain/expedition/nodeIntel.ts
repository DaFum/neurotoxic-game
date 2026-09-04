/**
 * Monotonic Hybrid Fog of War for the Expedition route.
 *
 * @remarks
 * Information is a build resource: a player who invests in scouting gives up
 * another form of protection. That only holds if intel cannot be minted — so
 * every reveal must name a source, the source must be entitled by run state or
 * by a consumable grant backed by canonical just-resolved evidence, and each
 * reveal raises a node by exactly one level.
 *
 * The producers of Social/Contact grants belong to G3/G4 and the passive
 * Region/reputation floor to G5. Those gates extend
 * {@link getExpeditionIntelCapability} in place rather than adding a second
 * entitlement path.
 */

import { isFiniteNumber } from '../../utils/finiteNumber'
import { isForbiddenKey } from '../../utils/objectUtils'
import type { GameState } from '../../types'
import type {
  ExpeditionIntelSource,
  ExpeditionMap,
  NodeIntelLevel
} from '../../types/expedition'

/**
 * Highest intel level a node can reach.
 */
export const MAX_NODE_INTEL_LEVEL = 2 as const

/**
 * What the current run is entitled to reveal.
 */
export interface ExpeditionIntelCapability {
  /**
   * Level every mapped node is treated as already having.
   *
   * @remarks Owned by G5 (Region/reputation/run perks). It must never make a
   * committed Scout redundant, so the floor stays below the maximum level.
   */
  passiveLevelFloor: NodeIntelLevel
  /** Whether a committed Scout enables passive per-node reveals. Owned by G3. */
  hasScout: boolean
  /** Scout recon charges for the whole run. Owned by G3. */
  reconCharges: number
}

/**
 * The G1 baseline capability: nothing is entitled yet.
 */
export const BASE_EXPEDITION_INTEL_CAPABILITY: ExpeditionIntelCapability = {
  passiveLevelFloor: 0,
  hasScout: false,
  reconCharges: 0
}

/**
 * Resolves what the current run may reveal.
 *
 * @param _state - Current game state.
 * @returns The run's intel entitlements.
 *
 * @remarks
 * G3 supplies Scout presence and recon charges from the committed Crew, and G5
 * the passive Region/reputation floor, by extending this function. Keeping it
 * the single resolver is what stops a later gate from introducing a parallel
 * entitlement path.
 */
export const getExpeditionIntelCapability = (
  _state: GameState
): ExpeditionIntelCapability => BASE_EXPEDITION_INTEL_CAPABILITY

/**
 * Reads a node's current intel level.
 *
 * @param state - Current game state.
 * @param nodeId - Node to read.
 * @param capability - Resolved run entitlements.
 * @returns The stored level raised to the passive floor.
 */
export const getExpeditionNodeIntelLevel = (
  state: GameState,
  nodeId: string,
  capability: ExpeditionIntelCapability = getExpeditionIntelCapability(state)
): NodeIntelLevel => {
  const stored = Object.hasOwn(state.expedition.intelByNodeId, nodeId)
    ? state.expedition.intelByNodeId[nodeId]
    : 0
  const level = stored === 1 || stored === 2 ? stored : 0
  return Math.max(level, capability.passiveLevelFloor) as NodeIntelLevel
}

/**
 * Reason an intel reveal was refused.
 */
type ExpeditionIntelRejectionReason =
  | 'RUN_NOT_ACTIVE'
  | 'UNKNOWN_NODE'
  | 'STALE_ROUTE_STEP'
  | 'STALE_LEVEL'
  | 'ALREADY_MAXED'
  | 'SOURCE_NOT_ENTITLED'
  | 'GRANT_UNKNOWN'
  | 'GRANT_CONSUMED'
  | 'GRANT_MISMATCH'
  | 'RECON_EXHAUSTED'
  | 'RECON_ALREADY_USED_THIS_STEP'

/**
 * Payload shape a reveal request carries.
 */
export interface ExpeditionIntelRevealRequest {
  nodeId: string
  source: ExpeditionIntelSource
  expectedLevel: 0 | 1
  expectedRouteStep: number
  grantId?: string
}

/**
 * Outcome of evaluating a reveal request.
 */
export type ExpeditionIntelRevealResolution =
  | {
      ok: true
      nodeId: string
      nextLevel: 1 | 2
      /** Grant to mark consumed, when the source was a grant. */
      consumedGrantId: string | null
      /** Route step to record as a spent recon charge, when applicable. */
      reconRouteStep: number | null
    }
  | { ok: false; reason: ExpeditionIntelRejectionReason }

const GRANT_SOURCES: Record<
  'social_grant' | 'contact_grant',
  'social' | 'contact'
> = {
  social_grant: 'social',
  contact_grant: 'contact'
}

/**
 * Evaluates one intel reveal request against run state and the prepared route.
 *
 * @param state - Current game state.
 * @param request - Untrusted reveal request.
 * @param map - The route built from the canonical root run seed.
 * @param capability - Resolved run entitlements; injected so the mechanics can
 * be exercised independently of the gate that supplies each entitlement.
 * @returns Either the exact single-level transition to apply, or the refusal.
 *
 * @remarks
 * `expectedLevel` is a stale guard, not an instruction: it must equal the
 * node's current level, so a replayed dispatch cannot advance a node twice and
 * a caller cannot request a two-level jump.
 */
export const resolveExpeditionIntelReveal = (
  state: GameState,
  request: ExpeditionIntelRevealRequest,
  map: ExpeditionMap,
  capability: ExpeditionIntelCapability = getExpeditionIntelCapability(state)
): ExpeditionIntelRevealResolution => {
  if (state.expedition.status !== 'active') {
    return { ok: false, reason: 'RUN_NOT_ACTIVE' }
  }
  const { nodeId, source, expectedLevel, expectedRouteStep } = request
  if (
    typeof nodeId !== 'string' ||
    isForbiddenKey(nodeId) ||
    !Object.hasOwn(map.meta, nodeId)
  ) {
    return { ok: false, reason: 'UNKNOWN_NODE' }
  }
  if (
    !isFiniteNumber(expectedRouteStep) ||
    expectedRouteStep !== state.expedition.routeStep
  ) {
    return { ok: false, reason: 'STALE_ROUTE_STEP' }
  }
  if (expectedLevel !== 0 && expectedLevel !== 1) {
    return { ok: false, reason: 'STALE_LEVEL' }
  }

  const currentLevel = getExpeditionNodeIntelLevel(state, nodeId, capability)
  if (currentLevel >= MAX_NODE_INTEL_LEVEL) {
    return { ok: false, reason: 'ALREADY_MAXED' }
  }
  if (currentLevel !== expectedLevel) {
    return { ok: false, reason: 'STALE_LEVEL' }
  }
  const nextLevel = (currentLevel + 1) as 1 | 2

  if (source === 'social_grant' || source === 'contact_grant') {
    const { grantId } = request
    if (typeof grantId !== 'string' || grantId.length === 0) {
      return { ok: false, reason: 'GRANT_UNKNOWN' }
    }
    const grant = state.expedition.intelGrants.find(
      entry => entry.id === grantId
    )
    if (!grant) return { ok: false, reason: 'GRANT_UNKNOWN' }
    if (grant.consumed) return { ok: false, reason: 'GRANT_CONSUMED' }
    if (grant.source !== GRANT_SOURCES[source]) {
      return { ok: false, reason: 'GRANT_MISMATCH' }
    }
    if (grant.nodeId !== nodeId || grant.targetLevel !== nextLevel) {
      return { ok: false, reason: 'GRANT_MISMATCH' }
    }
    return {
      ok: true,
      nodeId,
      nextLevel,
      consumedGrantId: grant.id,
      reconRouteStep: null
    }
  }

  if (source === 'perk_floor') {
    // The floor is not a per-node action: it applies to every node at once, so
    // a request that claims it must actually be below the entitled floor.
    if (capability.passiveLevelFloor < nextLevel) {
      return { ok: false, reason: 'SOURCE_NOT_ENTITLED' }
    }
    return {
      ok: true,
      nodeId,
      nextLevel,
      consumedGrantId: null,
      reconRouteStep: null
    }
  }

  if (source === 'scout_passive') {
    // A Scout reads the route continuously, but only up to level 1: exact
    // event/rival identity still needs a deliberate recon or a grant.
    if (!capability.hasScout || nextLevel > 1) {
      return { ok: false, reason: 'SOURCE_NOT_ENTITLED' }
    }
    return {
      ok: true,
      nodeId,
      nextLevel,
      consumedGrantId: null,
      reconRouteStep: null
    }
  }

  if (source === 'scout_recon') {
    if (!capability.hasScout || capability.reconCharges <= 0) {
      return { ok: false, reason: 'SOURCE_NOT_ENTITLED' }
    }
    const used = state.expedition.scoutReconUsedRouteSteps
    if (used.length >= capability.reconCharges) {
      return { ok: false, reason: 'RECON_EXHAUSTED' }
    }
    // One recon per route step. This is what makes a replayed dispatch a
    // rejection rather than a second free reveal.
    if (used.includes(expectedRouteStep)) {
      return { ok: false, reason: 'RECON_ALREADY_USED_THIS_STEP' }
    }
    return {
      ok: true,
      nodeId,
      nextLevel,
      consumedGrantId: null,
      reconRouteStep: expectedRouteStep
    }
  }

  return { ok: false, reason: 'SOURCE_NOT_ENTITLED' }
}
