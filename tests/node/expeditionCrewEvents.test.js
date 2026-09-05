import assert from 'node:assert/strict'
import test from 'node:test'
import { EXPEDITION_CREW_EVENTS } from '../../src/data/events/crew.ts'
import { validateGameEvent } from '../../src/utils/eventValidator.ts'
import { resolveEvent } from '../../src/domain/eventResolver.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { startedState } from '../expeditionLifecycleFixture.js'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import { addExpeditionReward } from '../../src/context/expeditionActionCreators.ts'

test('crew events validate and resolve canonical G3 actions through the real pipeline', () => {
  for (const event of EXPEDITION_CREW_EVENTS)
    assert.equal(validateGameEvent(event), true)
  const event = EXPEDITION_CREW_EVENTS[0]
  const state = {
    ...createInitialState(),
    activeEvent: event,
    expedition: {
      ...createInitialState().expedition,
      status: 'active',
      runId: 'run',
      routeStep: 1,
      loadout: { crewIds: ['mika', 'tom'] }
    }
  }
  const resolution = resolveEvent(event.options[0], state)
  assert.ok(
    resolution.actions.some(
      action => action.type === 'APPLY_EXPEDITION_EVENT_DELTA'
    )
  )
  const next = resolution.actions.reduce(gameReducer, state)
  assert.equal(next.expedition.crew.stressByCrewId.mika > 0, true)
})

test('breakthrough produces one source-proven Contact Intel grant', () => {
  const event = EXPEDITION_CREW_EVENTS.find(
    candidate => candidate.id === 'expedition_crew_breakthrough'
  )
  assert.ok(event)
  const started = startedState({}, { crewIds: ['noah', 'yara'] })
  const state = { ...started, activeEvent: event }
  const resolution = resolveEvent(event.options[0], state)
  const next = resolution.actions.reduce(gameReducer, state)
  assert.equal(next.expedition.intelGrants.length, 1)
  assert.equal(next.expedition.intelGrants[0].source, 'contact')
  const replayed = resolution.actions.reduce(gameReducer, next)
  assert.equal(replayed.expedition.intelGrants.length, 1)
})

test('forged crew source ids return the identical state reference', () => {
  const state = {
    ...createInitialState(),
    expedition: {
      ...createInitialState().expedition,
      status: 'active',
      routeStep: 1
    }
  }
  const next = gameReducer(state, {
    type: 'RECORD_EXPEDITION_CREW_STRESS_SOURCE',
    payload: {
      crewId: 'mika',
      sourceType: 'crew_event',
      sourceId: 'forged',
      expectedRouteStep: 1
    }
  })
  assert.equal(next, state)
})

test('a canonical Crew event id cannot authorize effects before that event resolves', () => {
  const base = startedState({}, { crewIds: ['mika', 'tom'] })
  const next = gameReducer(base, {
    type: 'RECORD_EXPEDITION_CREW_STRESS_SOURCE',
    payload: {
      crewId: 'mika',
      sourceType: 'crew_event',
      sourceId: 'expedition_crew_conflict_mika_tom:separate',
      expectedRouteStep: base.expedition.routeStep
    }
  })
  assert.equal(next, base)
})

test('malformed persisted Crew source evidence is dropped without throwing', () => {
  const base = startedState()
  const raw = structuredClone(base.expedition)
  raw.resolvedCrewSourceIds = 7
  raw.rewardLedger = [
    {
      id: 'reward_contact_backline_deal::expedition_crew_breakthrough:follow_lead',
      rewardDefinitionId: 'reward_contact_backline_deal',
      sourceType: 'crew_contact',
      sourceId: 'expedition_crew_breakthrough:follow_lead',
      secured: true,
      earnedAtRouteStep: 0,
      materialized: false
    }
  ]
  assert.doesNotThrow(() => sanitizeExpeditionState(raw, base.runSeed))
  assert.deepEqual(sanitizeExpeditionState(raw, base.runSeed).rewardLedger, [])
})

test('prefixed forged Contact evidence cannot preserve a secured reward', () => {
  const base = startedState()
  const raw = structuredClone(base.expedition)
  const sourceId = 'expedition_crew_breakthrough:follow_lead'
  raw.resolvedCrewSourceIds = [`${sourceId}:forged`]
  raw.rewardLedger = [
    {
      id: `reward_contact_backline_deal::${sourceId}`,
      rewardDefinitionId: 'reward_contact_backline_deal',
      sourceType: 'crew_contact',
      sourceId,
      secured: true,
      earnedAtRouteStep: raw.routeStep,
      materialized: false
    }
  ]
  assert.deepEqual(sanitizeExpeditionState(raw, base.runSeed).rewardLedger, [])
})

test('genuine Contact-earned reward evidence survives sanitization', () => {
  const event = EXPEDITION_CREW_EVENTS.find(
    candidate => candidate.id === 'expedition_crew_breakthrough'
  )
  assert.ok(event)
  const started = startedState({}, { crewIds: ['noah', 'yara'] })
  const state = { ...started, activeEvent: event }
  const resolved = resolveEvent(event.options[0], state).actions.reduce(
    gameReducer,
    state
  )
  const sourceId = `${event.id}:${event.options[0].id}`
  const rewarded = gameReducer(
    resolved,
    addExpeditionReward(resolved, {
      expectedRewardId: 'reward_contact_backline_deal',
      sourceType: 'crew_contact',
      sourceId
    })
  )
  assert.equal(rewarded.expedition.rewardLedger.length, 1)
  assert.equal(
    sanitizeExpeditionState(rewarded.expedition, rewarded.runSeed).rewardLedger
      .length,
    1
  )
})
