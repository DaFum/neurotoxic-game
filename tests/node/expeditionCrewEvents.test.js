import assert from 'node:assert/strict'
import test from 'node:test'
import { EXPEDITION_CREW_EVENTS } from '../../src/data/events/crew.ts'
import { validateGameEvent } from '../../src/utils/eventValidator.ts'
import { resolveEvent } from '../../src/domain/eventResolver.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { startedState } from '../expeditionLifecycleFixture.js'

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
      action => action.type === 'RECORD_EXPEDITION_CREW_STRESS_SOURCE'
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
