import type { GameState } from '../../types'
import type {
  CreateContactIntelGrantPayload,
  ExpeditionInjurySourcePayload
} from '../../types/actions'
import type {
  ExpeditionCargoState,
  ExpeditionCrewStressIntent,
  ExpeditionEventResultId,
  ExpeditionRelationshipOutcomeIntent
} from '../../types/expedition'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'
import {
  applyCrewStressDelta,
  classifyGigCrewStress,
  CREW_STRESS_SOURCE_DELTAS,
  EXPEDITION_SUPPLY_REST_STRESS_BONUS
} from '../../domain/expedition/crewStress'
import { getExpeditionCargoView } from '../../domain/expedition/cargo'
import {
  applyRelationshipTierDelta,
  getExpeditionRelationshipPairKey
} from '../../domain/expedition/relationships'
import { getEffectiveExpeditionRules } from '../../domain/expedition/effectiveRules'
import { aggregateExpeditionModuleProfiles } from '../../domain/expedition/modules'
import { getCrewEventOutcomeBySourceId } from '../../domain/expedition/crewEventOutcomes'
import { getActiveExpeditionMap } from '../../domain/expedition/map'
import { getExpeditionNodeIntelLevel } from '../../domain/expedition/nodeIntel'

const acceptsSource = (
  state: GameState,
  sourceId: string,
  expectedRouteStep: number
): boolean =>
  state.expedition.status === 'active' &&
  sourceId.length > 0 &&
  expectedRouteStep === state.expedition.routeStep
const rememberSource = (state: GameState, sourceId: string): string[] => [
  ...(state.expedition.resolvedCrewSourceIds ?? []),
  sourceId
]

const eventProofId = (state: GameState, sourceId: string): string =>
  `${sourceId}:resolved:${state.expedition.routeStep}`

const hasResolvedEventProof = (state: GameState, sourceId: string): boolean =>
  (state.expedition.resolvedCrewSourceIds ?? []).includes(
    eventProofId(state, sourceId)
  )

const hasCanonicalStressSource = (
  state: GameState,
  payload: ExpeditionCrewStressIntent
): boolean => {
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  if (
    outcome?.stress?.crewId === payload.crewId &&
    outcome.stress.sourceType === payload.sourceType
  ) {
    return hasResolvedEventProof(state, payload.sourceId)
  }
  if (payload.sourceType === 'crew_event') {
    return false
  }
  const currentNodeId = state.expedition.visitedNodeIds.at(-1) ?? ''
  if (payload.sourceType === 'travel') {
    return (
      payload.sourceId ===
      `travel:${currentNodeId}:${state.expedition.routeStep}`
    )
  }
  if (payload.sourceType === 'rest') {
    const map = getActiveExpeditionMap(state)
    if (!map) return false
    return (
      map.meta[currentNodeId]?.nodeClass === 'REST_STOP' &&
      payload.sourceId === `rest:${currentNodeId}:${state.expedition.routeStep}`
    )
  }
  if (
    payload.sourceType === 'poor_gig' ||
    payload.sourceType === 'successful_gig'
  ) {
    const correctOutcome =
      classifyGigCrewStress(state.lastGigStats ?? {}) === payload.sourceType
    return (
      correctOutcome &&
      payload.sourceId ===
        `gig:${state.currentGig?.id ?? 'unknown'}:${state.expedition.routeStep}`
    )
  }
  return false
}

/**
 * Resolves whether a rest-stop visit is deepened by a packed supply.
 *
 * @remarks
 * A visit spends at most one supply, however many crew members rest there:
 * the first rest record of the visit pays for it and leaves a marker in
 * `resolvedCrewSourceIds` (persisted and sanitized on load), and every later
 * record of the same visit reads the marker instead of spending again.
 *
 * @param state - The current game state
 * @param sourceId - The canonical `rest:<nodeId>:<routeStep>` source id
 * @returns `null` when the visit has no supply; otherwise the marker id and,
 * when this record is the one that spends it, the cargo after spending
 */
const spendRestSupply = (
  state: GameState,
  sourceId: string
): { markerId: string; cargo: ExpeditionCargoState | null } | null => {
  const markerId = `${sourceId}:supply`
  if ((state.expedition.resolvedCrewSourceIds ?? []).includes(markerId)) {
    return { markerId, cargo: null }
  }
  const view = getExpeditionCargoView(state)
  const supplies = finiteNumberOr(view.supplies, 0)
  if (supplies < 1) return null
  // Listed field by field: the view also carries derived capacity numbers,
  // which must not be folded into the persisted cargo.
  return {
    markerId,
    cargo: {
      spareParts: view.spareParts,
      supplies: supplies - 1,
      technicalGearItemIds: view.technicalGearItemIds,
      merch: view.merch,
      contraband: view.contraband
    }
  }
}

/**
 * Records a stress source outcome onto an active expedition crew member.
 *
 * @remarks
 * Uses `hasCanonicalStressSource` to strictly validate the payload against
 * registered `CREW_STRESS_SOURCE_DELTAS` and ensures the source ID hasn't been replayed.
 *
 * @param state - The current game state
 * @param payload - The stress intent containing crew ID and source type
 * @returns The updated game state with applied stress delta, or the original state if validation fails
 */
export const handleRecordExpeditionCrewStressSource = (
  state: GameState,
  payload: ExpeditionCrewStressIntent
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  // The sibling handlers guard this too: `acceptsSource` reads its length.
  if (typeof payload.sourceId !== 'string') return state
  const replayId = `${payload.sourceId}:stress:${payload.crewId}`
  if (
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, payload.crewId) ||
    !acceptsSource(state, payload.sourceId, payload.expectedRouteStep) ||
    !Object.hasOwn(CREW_STRESS_SOURCE_DELTAS, payload.sourceType) ||
    !hasCanonicalStressSource(state, payload) ||
    (state.expedition.resolvedCrewSourceIds ?? []).includes(replayId)
  )
    return state
  const crew = state.expedition.crew ?? {
    stressByCrewId: {},
    injuryByCrewId: {}
  }
  // `?? 0` would let a persisted NaN through into the stress arithmetic.
  const current = finiteNumberOr(crew.stressByCrewId[payload.crewId], 0)
  const baseDelta = CREW_STRESS_SOURCE_DELTAS[payload.sourceType]
  const supply =
    payload.sourceType === 'rest'
      ? spendRestSupply(state, payload.sourceId)
      : null
  // Rest is the one recovery source a committed module (sleeping bunks) and a
  // packed supply improve; both deepen the recovery, never turn it into Stress.
  const delta =
    payload.sourceType === 'rest'
      ? baseDelta -
        Math.max(
          0,
          aggregateExpeditionModuleProfiles(
            state.expedition.loadout?.build?.selectedTourbusModuleIds ?? []
          ).restStressRecoveryBonus
        ) -
        (supply ? EXPEDITION_SUPPLY_REST_STRESS_BONUS : 0)
      : baseDelta
  const next = applyCrewStressDelta(
    current,
    delta,
    getEffectiveExpeditionRules(state).numeric.crewStressMultiplier
  )
  const resolvedCrewSourceIds = rememberSource(state, replayId)
  return {
    ...state,
    expedition: {
      ...state.expedition,
      crew: {
        ...crew,
        stressByCrewId: { ...crew.stressByCrewId, [payload.crewId]: next }
      },
      ...(supply?.cargo ? { cargo: supply.cargo } : {}),
      resolvedCrewSourceIds: supply?.cargo
        ? [...resolvedCrewSourceIds, supply.markerId]
        : resolvedCrewSourceIds
    }
  }
}

const validActor = (
  state: GameState,
  actor: ExpeditionRelationshipOutcomeIntent['first']
): boolean =>
  actor.kind === 'crew'
    ? Object.hasOwn(EXPEDITION_CREW_BY_ID, actor.id)
    : state.band.members.some(member => member.id === actor.id)

/**
 * Records a relationship outcome between two expedition actors (crew or band).
 *
 * @remarks
 * Applies a relationship tier delta based on the resolved crew event outcome.
 * Prevents identical actors and duplicate resolutions using replay IDs.
 *
 * @param state - The current game state
 * @param payload - The relationship outcome intent containing actors
 * @returns The updated game state with modified career relationship tiers, or the original state if validation fails
 */
export const handleRecordExpeditionRelationshipOutcome = (
  state: GameState,
  payload: ExpeditionRelationshipOutcomeIntent
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  // `sourceId` is read before `acceptsSource` gets to it, so it is narrowed
  // here: a payload without one would otherwise reach the registry lookup as
  // `undefined` and throw out of the root reducer instead of being rejected.
  if (typeof payload.sourceId !== 'string') return state
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  const replayId = `${payload.sourceId}:relationship`
  if (
    !acceptsSource(state, payload.sourceId, payload.expectedRouteStep) ||
    !validActor(state, payload.first) ||
    !validActor(state, payload.second) ||
    (payload.first.kind === payload.second.kind &&
      payload.first.id === payload.second.id) ||
    !outcome?.relationship ||
    !hasResolvedEventProof(state, payload.sourceId) ||
    payload.sourceType !== 'crew_event' ||
    getExpeditionRelationshipPairKey(payload.first, payload.second) !==
      getExpeditionRelationshipPairKey(
        outcome.relationship.first,
        outcome.relationship.second
      ) ||
    (state.expedition.resolvedCrewSourceIds ?? []).includes(replayId)
  )
    return state
  const key = getExpeditionRelationshipPairKey(payload.first, payload.second)
  const delta = outcome.relationship.tierDelta
  const relationships = state.career.expeditionRelationshipByPair
  const storedTier = Object.hasOwn(relationships, key)
    ? relationships[key]
    : undefined
  const current = isFiniteNumber(storedTier) ? storedTier : 0
  return {
    ...state,
    career: {
      ...state.career,
      expeditionRelationshipByPair: {
        ...state.career.expeditionRelationshipByPair,
        [key]: applyRelationshipTierDelta(current, delta)
      }
    },
    expedition: {
      ...state.expedition,
      resolvedCrewSourceIds: rememberSource(state, replayId)
    }
  }
}

const nextCrewInjury = {
  none: 'light',
  light: 'serious',
  serious: 'serious'
} as const
const nextBandInjury = {
  none: 'light',
  light: 'serious',
  serious: 'critical',
  critical: 'critical'
} as const

/**
 * Advances the injury state of a specific crew member.
 *
 * @remarks
 * Transitions injury levels sequentially (e.g. none -\> light -\> serious).
 * Ensures the target exists in the crew registry and validates event proof.
 *
 * @param state - The current game state
 * @param payload - The injury payload containing the target crew ID
 * @returns The updated game state with advanced crew injury status, or the original state if validation fails
 */
export const handleAdvanceExpeditionCrewInjury = (
  state: GameState,
  payload: ExpeditionInjurySourcePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  // `sourceId` is read before `acceptsSource` gets to it, so it is narrowed
  // here: a payload without one would otherwise reach the registry lookup as
  // `undefined` and throw out of the root reducer instead of being rejected.
  if (typeof payload.sourceId !== 'string') return state
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  const replayId = `${payload.sourceId}:crew-injury:${payload.targetId}`
  if (
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, payload.targetId) ||
    !acceptsSource(state, payload.sourceId, payload.expectedRouteStep) ||
    outcome?.crewInjuryId !== payload.targetId ||
    !hasResolvedEventProof(state, payload.sourceId) ||
    (state.expedition.resolvedCrewSourceIds ?? []).includes(replayId)
  )
    return state
  const crew = state.expedition.crew ?? {
    stressByCrewId: {},
    injuryByCrewId: {}
  }
  const current = crew.injuryByCrewId[payload.targetId] ?? 'none'
  return {
    ...state,
    expedition: {
      ...state.expedition,
      crew: {
        ...crew,
        injuryByCrewId: {
          ...crew.injuryByCrewId,
          [payload.targetId]: nextCrewInjury[current]
        }
      },
      resolvedCrewSourceIds: rememberSource(state, replayId)
    }
  }
}

/**
 * Advances the injury state of a specific band member during an expedition.
 *
 * @remarks
 * Transitions band member injury levels sequentially up to critical.
 * Validates the target exists in the band and verifies the event source proof.
 *
 * @param state - The current game state
 * @param payload - The injury payload containing the target band member ID
 * @returns The updated game state with advanced band injury status, or the original state if validation fails
 */
export const handleAdvanceExpeditionBandInjury = (
  state: GameState,
  payload: ExpeditionInjurySourcePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  // `sourceId` is read before `acceptsSource` gets to it, so it is narrowed
  // here: a payload without one would otherwise reach the registry lookup as
  // `undefined` and throw out of the root reducer instead of being rejected.
  if (typeof payload.sourceId !== 'string') return state
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  const replayId = `${payload.sourceId}:band-injury:${payload.targetId}`
  if (
    !state.band.members.some(member => member.id === payload.targetId) ||
    !acceptsSource(state, payload.sourceId, payload.expectedRouteStep) ||
    outcome?.bandInjuryId !== payload.targetId ||
    !hasResolvedEventProof(state, payload.sourceId) ||
    (state.expedition.resolvedCrewSourceIds ?? []).includes(replayId)
  )
    return state
  const current =
    state.expedition.bandInjuryByMemberId?.[payload.targetId] ?? 'none'
  return {
    ...state,
    expedition: {
      ...state.expedition,
      bandInjuryByMemberId: {
        ...state.expedition.bandInjuryByMemberId,
        [payload.targetId]: nextBandInjury[current]
      },
      resolvedCrewSourceIds: rememberSource(state, replayId)
    }
  }
}

/**
 * Creates an intel grant for a contact at a specific map node.
 *
 * @remarks
 * Intel levels max out at 2. The node must be connected to the current node.
 * Validates the event source, route step, and verifies the node structure.
 *
 * @param state - The current game state
 * @param payload - The intel grant payload containing event and target node IDs
 * @returns The updated game state containing the new intel grant, or the original state if validation fails
 */
export const handleCreateContactIntelGrant = (
  state: GameState,
  payload: CreateContactIntelGrantPayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const sourceId = `${payload.eventId}:${payload.optionId}`
  const outcome = getCrewEventOutcomeBySourceId(sourceId)
  if (
    !outcome?.contactIntel ||
    !hasResolvedEventProof(state, sourceId) ||
    !acceptsSource(state, sourceId, payload.expectedRouteStep)
  )
    return state
  const map = getActiveExpeditionMap(state)
  const meta = map?.meta[payload.nodeId]
  const currentNodeId = state.expedition.visitedNodeIds.at(-1)
  // The effective level - stored intel raised to the familiarity floor - is
  // what the reveal resolver compares a grant against. Targeting one above the
  // stored level instead minted an unusable grant on a familiar node.
  const currentLevel = meta
    ? getExpeditionNodeIntelLevel(state, payload.nodeId)
    : 0
  if (
    !map ||
    !meta ||
    meta.routeStep <= state.expedition.routeStep ||
    currentLevel >= 2 ||
    !map.connections.some(
      connection =>
        connection.from === currentNodeId && connection.to === payload.nodeId
    )
  )
    return state
  const replayId = `${sourceId}:contact:${payload.nodeId}`
  if ((state.expedition.resolvedCrewSourceIds ?? []).includes(replayId))
    return state
  const targetLevel = (currentLevel + 1) as 1 | 2
  return {
    ...state,
    expedition: {
      ...state.expedition,
      intelGrants: [
        ...state.expedition.intelGrants,
        {
          id: replayId,
          source: 'contact',
          sourceProofId: sourceId,
          nodeId: payload.nodeId,
          targetLevel,
          consumed: false
        }
      ],
      resolvedCrewSourceIds: rememberSource(state, replayId)
    }
  }
}

/**
 * Applies the composite outcome of a resolved crew event.
 *
 * @remarks
 * Handles compound event outcomes by chaining stress, relationship, injury, and intel
 * handlers. Returns early if the required crew are missing or results do not match.
 *
 * @param state - The current game state
 * @param sourceEventId - The identifier of the resolved event
 * @param sourceOptionId - The identifier of the chosen event option
 * @param resultIds - The valid outcome result identifiers
 * @returns The updated game state with all consequences applied, or the original state if validation fails
 */
export const applyResolvedCrewEventOutcome = (
  state: GameState,
  sourceEventId: unknown,
  sourceOptionId: unknown,
  resultIds: readonly ExpeditionEventResultId[]
): GameState => {
  if (
    typeof sourceEventId !== 'string' ||
    typeof sourceOptionId !== 'string' ||
    state.activeEvent?.id !== sourceEventId
  ) {
    return state
  }
  const outcome = getCrewEventOutcomeBySourceId(
    `${sourceEventId}:${sourceOptionId}`
  )
  if (!outcome || !resultIds.includes(outcome.resultId)) return state
  const selectedCrewIds = state.expedition.loadout?.crewIds ?? []
  const requiredCrewIds = [
    outcome.stress?.crewId,
    outcome.crewInjuryId,
    ...(outcome.relationship
      ? [outcome.relationship.first, outcome.relationship.second]
          .filter(actor => actor.kind === 'crew')
          .map(actor => actor.id)
      : [])
  ].filter((crewId): crewId is string => typeof crewId === 'string')
  if (requiredCrewIds.some(crewId => !selectedCrewIds.includes(crewId))) {
    return state
  }

  const sourceId = `${sourceEventId}:${sourceOptionId}`
  const proofId = eventProofId(state, sourceId)
  let next: GameState = {
    ...state,
    expedition: {
      ...state.expedition,
      resolvedCrewSourceIds: rememberSource(state, proofId)
    }
  }
  if (outcome.stress) {
    next = handleRecordExpeditionCrewStressSource(next, {
      crewId: outcome.stress.crewId,
      sourceType: outcome.stress.sourceType,
      sourceId,
      expectedRouteStep: state.expedition.routeStep
    })
  }
  if (outcome.relationship) {
    next = handleRecordExpeditionRelationshipOutcome(next, {
      first: outcome.relationship.first,
      second: outcome.relationship.second,
      sourceType: 'crew_event',
      sourceId,
      expectedRouteStep: state.expedition.routeStep
    })
  }
  if (outcome.crewInjuryId) {
    next = handleAdvanceExpeditionCrewInjury(next, {
      targetId: outcome.crewInjuryId,
      sourceId,
      expectedRouteStep: state.expedition.routeStep
    })
  }
  if (outcome.bandInjuryId) {
    next = handleAdvanceExpeditionBandInjury(next, {
      targetId: outcome.bandInjuryId,
      sourceId,
      expectedRouteStep: state.expedition.routeStep
    })
  }
  const contactMap = outcome.contactIntel ? getActiveExpeditionMap(next) : null
  if (contactMap) {
    const currentNodeId = next.expedition.visitedNodeIds.at(-1)
    // One grant (plan 03 Task 10), on the first onward node in route order
    // that can still take it: an onward node already at full intel would
    // refuse the grant while another reachable node is still unread.
    for (const edge of contactMap.connections) {
      if (edge.from !== currentNodeId) continue
      const granted = handleCreateContactIntelGrant(next, {
        eventId: sourceEventId,
        optionId: sourceOptionId,
        nodeId: edge.to,
        expectedRouteStep: state.expedition.routeStep
      })
      if (granted !== next) {
        next = granted
        break
      }
    }
  }
  return {
    ...next,
    expedition: {
      ...next.expedition,
      resolvedCrewSourceIds: (
        next.expedition.resolvedCrewSourceIds ?? []
      ).filter(id => id !== proofId)
    }
  }
}
