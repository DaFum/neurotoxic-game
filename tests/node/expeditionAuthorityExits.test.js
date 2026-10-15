import assert from 'node:assert/strict'
import test from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { resolveExpeditionAuthorityExit } from '../../src/context/expeditionActionCreators.ts'
import {
  EXPEDITION_AUTHORITY_EXIT_HEAT_RELIEF,
  getAuthorityCrisisSignal,
  getAvailableAuthoritySafeExits,
  resolveAuthoritySafeExit
} from '../../src/domain/expedition/authority.ts'

/** The audit fixture: Heat 100, no cash, no fuel, no obligations. */
const cornered = (overrides = {}) => {
  const initial = createInitialState()
  return {
    ...initial,
    runSeed: 123,
    player: {
      ...initial.player,
      money: 0,
      van: { ...initial.player.van, fuel: 0 }
    },
    expedition: {
      ...initial.expedition,
      status: 'active',
      runId: 'run-1',
      activeObligations: [],
      pressure: { ...initial.expedition.pressure, heat: 100 },
      ...overrides
    }
  }
}

const exitAction = (state, exitId) => ({
  type: ActionTypes.RESOLVE_EXPEDITION_AUTHORITY_EXIT,
  payload: { exitId, expectedRouteStep: state.expedition.routeStep }
})

/** A run with a committed route, so a Contract can actually materialize. */
const onRoute = state => ({
  ...state,
  expedition: {
    ...state.expedition,
    loadout: {
      tourTypeId: 'standard_tour',
      regionId: 'industrial_belt',
      crewIds: [],
      nativeContracts: []
    }
  }
})

test('the audit fixture has no executable exit, so it is a crisis', () => {
  const state = cornered()
  assert.deepEqual(getAvailableAuthoritySafeExits(state), [])
  assert.deepEqual(getAuthorityCrisisSignal(state), {
    sourceId: 'authority:run-1:0',
    expectedRouteStep: 0
  })
})

test('pay spends the cash and relieves Heat', () => {
  const state = cornered()
  state.player.money = 1000
  assert.deepEqual(resolveAuthoritySafeExit(state, 'pay'), {
    exitId: 'pay',
    cost: 500
  })
  const next = gameReducer(state, exitAction(state, 'pay'))
  assert.equal(next.player.money, 500)
  assert.equal(
    next.expedition.pressure.heat,
    100 - EXPEDITION_AUTHORITY_EXIT_HEAT_RELIEF
  )
  assert.equal(next.expedition.pendingFailure, null)
})

test('route_detour burns fuel and is illegal below the detour cost', () => {
  const state = cornered()
  state.player.van.fuel = 9
  assert.equal(resolveAuthoritySafeExit(state, 'route_detour'), null)
  state.player.van.fuel = 50
  const next = gameReducer(state, exitAction(state, 'route_detour'))
  assert.equal(next.player.van.fuel, 40)
  assert.equal(next.expedition.pressure.heat, 88)
})

test('surrender_cargo empties the contraband manifest', () => {
  const state = cornered({
    cargo: {
      spareParts: 0,
      supplies: 0,
      technicalGearItemIds: [],
      merch: [],
      contraband: [{ id: 'c1', quantity: 1 }]
    }
  })
  assert.ok(getAvailableAuthoritySafeExits(state).includes('surrender_cargo'))
  const next = gameReducer(state, exitAction(state, 'surrender_cargo'))
  assert.deepEqual(next.expedition.cargo.contraband, [])
  assert.equal(next.expedition.pressure.heat, 88)
})

test('crew sends a Manager/Security member and charges Authority stress', () => {
  const state = cornered({
    loadout: { crewIds: ['yara'], nativeContracts: [] },
    crew: { stressByCrewId: { yara: 10 }, injuryByCrewId: {} }
  })
  const next = gameReducer(state, exitAction(state, 'crew'))
  assert.ok(next.expedition.crew.stressByCrewId.yara >= 22)
  assert.equal(next.expedition.pressure.heat, 88)

  // An exit that would collapse the talker is not a safe exit.
  const strained = cornered({
    loadout: { crewIds: ['yara'], nativeContracts: [] },
    crew: { stressByCrewId: { yara: 95 }, injuryByCrewId: {} }
  })
  assert.equal(resolveAuthoritySafeExit(strained, 'crew'), null)
})

test('future_obligation creates a real Contract only when a slot permits', () => {
  const state = onRoute(cornered())
  const plan = resolveAuthoritySafeExit(state, 'future_obligation')
  assert.ok(plan, 'a committed route with free slots can take a Contract')
  const next = gameReducer(state, exitAction(state, 'future_obligation'))
  const created = next.expedition.activeObligations.find(
    o => o.id === `run-1:${plan.commitment.templateId}`
  )
  assert.ok(created)
  assert.equal(created.sourceType, 'native')
  assert.equal(created.status, 'active')
  assert.deepEqual(next.expedition.loadout.nativeContracts, [plan.commitment])
  assert.equal(next.expedition.pressure.heat, 88)
  // A Contract already broken at the relieved Heat is never the obligation.
  assert.notEqual(plan.commitment.templateId, 'contract_keep_it_clean')

  const full = onRoute(
    cornered({
      activeObligations: ['contract_no_rest_finale', 'contract_all_in'].map(
        sourceId => ({
          id: `run-1:${sourceId}`,
          sourceType: 'native',
          sourceId,
          constraints: [],
          progressByConstraintId: {},
          status: 'active',
          settled: false,
          doubleDown: null
        })
      )
    })
  )
  assert.equal(resolveAuthoritySafeExit(full, 'future_obligation'), null)
})

test('the reducer rejects illegal exits with the identical state', () => {
  const state = cornered()
  state.player.money = 1000
  // Not offered: no fuel for a detour.
  assert.strictEqual(
    gameReducer(state, exitAction(state, 'route_detour')),
    state
  )
  // Unknown exit id.
  assert.strictEqual(gameReducer(state, exitAction(state, 'bribe_all')), state)
  // Stale route step.
  assert.strictEqual(
    gameReducer(state, {
      type: ActionTypes.RESOLVE_EXPEDITION_AUTHORITY_EXIT,
      payload: { exitId: 'pay', expectedRouteStep: 3 }
    }),
    state
  )
  // No encounter below the threshold: Heat cannot be laundered for cash.
  const calm = {
    ...state,
    expedition: {
      ...state.expedition,
      pressure: { ...state.expedition.pressure, heat: 80 }
    }
  }
  assert.strictEqual(gameReducer(calm, exitAction(calm, 'pay')), calm)
  assert.equal(resolveExpeditionAuthorityExit(calm, 'pay'), null)
  // Malformed payload.
  assert.strictEqual(
    gameReducer(state, {
      type: ActionTypes.RESOLVE_EXPEDITION_AUTHORITY_EXIT,
      payload: null
    }),
    state
  )
})

test('the creator only builds an offered exit', () => {
  const state = cornered()
  state.player.money = 1000
  assert.deepEqual(resolveExpeditionAuthorityExit(state, 'pay'), {
    type: ActionTypes.RESOLVE_EXPEDITION_AUTHORITY_EXIT,
    payload: { exitId: 'pay', expectedRouteStep: 0 }
  })
  assert.equal(resolveExpeditionAuthorityExit(state, 'route_detour'), null)
})
