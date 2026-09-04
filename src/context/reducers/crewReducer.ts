import type { GameState } from '../../types'
import type {
  CreateContactIntelGrantPayload,
  ExpeditionInjurySourcePayload
} from '../../types/actions'
import type {
  ExpeditionCrewStressIntent,
  ExpeditionRelationshipOutcomeIntent
} from '../../types/expedition'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import {
  applyCrewStressDelta,
  CREW_STRESS_SOURCE_DELTAS
} from '../../domain/expedition/crewStress'
import {
  applyRelationshipTierDelta,
  getExpeditionRelationshipPairKey
} from '../../domain/expedition/relationships'
import { getEffectiveExpeditionRules } from '../../domain/expedition/effectiveRules'
import { getCrewEventOutcomeBySourceId } from '../../domain/expedition/crewEventOutcomes'
import { buildExpeditionMap } from '../../domain/expedition/map'

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

const hasCanonicalStressSource = (
  state: GameState,
  payload: ExpeditionCrewStressIntent
): boolean => {
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  if (
    outcome?.stress?.crewId === payload.crewId &&
    outcome.stress.sourceType === payload.sourceType
  ) {
    return true
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
    if (!state.expedition.loadout) return false
    const map = buildExpeditionMap(
      state.runSeed,
      state.expedition.loadout.tourTypeId,
      state.expedition.loadout.regionId
    )
    return (
      map.meta[currentNodeId]?.nodeClass === 'REST_STOP' &&
      payload.sourceId === `rest:${currentNodeId}:${state.expedition.routeStep}`
    )
  }
  if (
    payload.sourceType === 'poor_gig' ||
    payload.sourceType === 'successful_gig'
  ) {
    const accuracy = state.lastGigStats?.accuracy
    const correctOutcome =
      typeof accuracy === 'number' &&
      Number.isFinite(accuracy) &&
      (payload.sourceType === 'poor_gig' ? accuracy < 60 : accuracy >= 80)
    return (
      correctOutcome &&
      payload.sourceId ===
        `gig:${state.currentGig?.id ?? 'unknown'}:${state.expedition.routeStep}`
    )
  }
  return false
}

export const handleRecordExpeditionCrewStressSource = (
  state: GameState,
  payload: ExpeditionCrewStressIntent
): GameState => {
  if (!payload || typeof payload !== 'object') return state
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
  const current = crew.stressByCrewId[payload.crewId] ?? 0
  const next = applyCrewStressDelta(
    current,
    CREW_STRESS_SOURCE_DELTAS[payload.sourceType],
    getEffectiveExpeditionRules(state).numeric.crewStressMultiplier
  )
  return {
    ...state,
    expedition: {
      ...state.expedition,
      crew: {
        ...crew,
        stressByCrewId: { ...crew.stressByCrewId, [payload.crewId]: next }
      },
      resolvedCrewSourceIds: rememberSource(state, replayId)
    }
  }
}

const validActor = (
  state: GameState,
  actor: ExpeditionRelationshipOutcomeIntent['first']
): boolean =>
  actor.kind === 'crew'
    ? Object.hasOwn(EXPEDITION_CREW_BY_ID, actor.id)
    : state.band.members.some(
        (member: { id: string }) => member.id === actor.id
      )
export const handleRecordExpeditionRelationshipOutcome = (
  state: GameState,
  payload: ExpeditionRelationshipOutcomeIntent
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  const replayId = `${payload.sourceId}:relationship`
  if (
    !acceptsSource(state, payload.sourceId, payload.expectedRouteStep) ||
    !validActor(state, payload.first) ||
    !validActor(state, payload.second) ||
    (payload.first.kind === payload.second.kind &&
      payload.first.id === payload.second.id) ||
    !outcome?.relationship ||
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
  const current = state.career.expeditionRelationshipByPair[key] ?? 0
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
export const handleAdvanceExpeditionCrewInjury = (
  state: GameState,
  payload: ExpeditionInjurySourcePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  const replayId = `${payload.sourceId}:crew-injury:${payload.targetId}`
  if (
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, payload.targetId) ||
    !acceptsSource(state, payload.sourceId, payload.expectedRouteStep) ||
    outcome?.crewInjuryId !== payload.targetId ||
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
export const handleAdvanceExpeditionBandInjury = (
  state: GameState,
  payload: ExpeditionInjurySourcePayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const outcome = getCrewEventOutcomeBySourceId(payload.sourceId)
  const replayId = `${payload.sourceId}:band-injury:${payload.targetId}`
  if (
    !state.band.members.some(
      (member: { id: string }) => member.id === payload.targetId
    ) ||
    !acceptsSource(state, payload.sourceId, payload.expectedRouteStep) ||
    outcome?.bandInjuryId !== payload.targetId ||
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

export const handleCreateContactIntelGrant = (
  state: GameState,
  payload: CreateContactIntelGrantPayload
): GameState => {
  if (!payload || typeof payload !== 'object') return state
  const sourceId = `${payload.eventId}:${payload.optionId}`
  const outcome = getCrewEventOutcomeBySourceId(sourceId)
  if (
    !outcome?.contactIntel ||
    !acceptsSource(state, sourceId, payload.expectedRouteStep)
  )
    return state
  const map = state.expedition.loadout
    ? buildExpeditionMap(
        state.runSeed,
        state.expedition.loadout.tourTypeId,
        state.expedition.loadout.regionId
      )
    : null
  const meta = map?.meta[payload.nodeId]
  const currentNodeId = state.expedition.visitedNodeIds.at(-1)
  if (
    !map ||
    !meta ||
    meta.routeStep <= state.expedition.routeStep ||
    (state.expedition.intelByNodeId[payload.nodeId] ?? 0) >= 2 ||
    !map.connections.some(
      connection =>
        connection.from === currentNodeId && connection.to === payload.nodeId
    )
  )
    return state
  const replayId = `${sourceId}:contact:${payload.nodeId}`
  if ((state.expedition.resolvedCrewSourceIds ?? []).includes(replayId))
    return state
  const targetLevel = ((state.expedition.intelByNodeId[payload.nodeId] ?? 0) +
    1) as 1 | 2
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
