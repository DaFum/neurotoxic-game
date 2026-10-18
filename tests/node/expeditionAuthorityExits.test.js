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
import { buildExpeditionMap } from '../../src/domain/expedition/map.ts'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'

const ROUTE = buildExpeditionMap(123, 'standard_tour', 'industrial_belt')

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

/** Manager/Security members are only fieldable once their network is unlocked. */
const withCrewNetwork = state => ({
  ...state,
  career: { ...state.career, unlockedSetIds: ['industry_network'] }
})

const exitAction = (state, exitId) => ({
  type: ActionTypes.RESOLVE_EXPEDITION_AUTHORITY_EXIT,
  payload: { exitId, expectedRouteStep: state.expedition.routeStep }
})

/** A run with a committed route, so a Contract can actually materialize. */
const onRoute = state => ({
  ...state,
  expedition: {
    ...state.expedition,
    visitedNodeIds:
      state.expedition.visitedNodeIds.length > 0
        ? state.expedition.visitedNodeIds
        : [ROUTE.startNodeId],
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
      contraband: [{ stashKey: 'stash_a', instanceId: null, stacks: 1 }]
    }
  })
  assert.ok(getAvailableAuthoritySafeExits(state).includes('surrender_cargo'))
  const next = gameReducer(state, exitAction(state, 'surrender_cargo'))
  assert.deepEqual(next.expedition.cargo.contraband, [])
  assert.equal(next.expedition.pressure.heat, 88)
})

test('crew sends a Manager/Security member and charges Authority stress', () => {
  const state = withCrewNetwork(
    cornered({
      loadout: { crewIds: ['yara'], nativeContracts: [] },
      crew: { stressByCrewId: { yara: 10 }, injuryByCrewId: {} }
    })
  )
  const next = gameReducer(state, exitAction(state, 'crew'))
  assert.ok(next.expedition.crew.stressByCrewId.yara >= 22)
  assert.equal(next.expedition.pressure.heat, 88)

  // An exit that would collapse the talker is not a safe exit.
  const strained = withCrewNetwork(
    cornered({
      loadout: { crewIds: ['yara'], nativeContracts: [] },
      crew: { stressByCrewId: { yara: 95 }, injuryByCrewId: {} }
    })
  )
  assert.equal(resolveAuthoritySafeExit(strained, 'crew'), null)
})

test('a seriously injured Manager/Security member cannot take the crew exit', () => {
  const injured = withCrewNetwork(
    cornered({
      loadout: { crewIds: ['yara'], nativeContracts: [] },
      crew: {
        stressByCrewId: { yara: 10 },
        injuryByCrewId: { yara: 'serious' }
      }
    })
  )
  assert.equal(resolveAuthoritySafeExit(injured, 'crew'), null)

  // Without the network unlock the member is not available at all.
  const locked = cornered({
    loadout: { crewIds: ['yara'], nativeContracts: [] },
    crew: { stressByCrewId: { yara: 10 }, injuryByCrewId: {} }
  })
  assert.equal(resolveAuthoritySafeExit(locked, 'crew'), null)
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

/** A walked path on the fixture route, standing on its last node. */
const walked = (path, overrides = {}) =>
  onRoute(
    cornered({
      routeStep: path.length - 1,
      visitedNodeIds: path,
      ...overrides
    })
  )

/** Native obligations the run already holds, keyed by template id. */
const holding = sourceIds =>
  sourceIds.map(sourceId => ({
    id: `run-1:${sourceId}`,
    sourceType: 'native',
    sourceId,
    constraints: [],
    progressByConstraintId: {},
    status: 'active',
    settled: false,
    doubleDown: null
  }))

// Rested at exp_2_1 (a REST_STOP), standing at step 4.
const RESTED_PATH = ['exp_0_0', 'exp_1_0', 'exp_2_1', 'exp_3_1', 'exp_4_1']
const restedRun = () =>
  walked(RESTED_PATH, { resolvedObligationSignalIds: ['rest:exp_2_1:2'] })

test('future_obligation never picks a Contract the run already broke by resting', () => {
  assert.equal(ROUTE.meta.exp_2_1.nodeClass, 'REST_STOP')
  const plan = resolveAuthoritySafeExit(restedRun(), 'future_obligation')
  assert.notEqual(plan?.commitment.templateId, 'contract_no_rest_finale')
})

test('a created obligation keeps its status across a load round trip', () => {
  for (const state of [onRoute(cornered()), restedRun()]) {
    if (!resolveAuthoritySafeExit(state, 'future_obligation')) continue
    const next = gameReducer(state, exitAction(state, 'future_obligation'))
    const loaded = sanitizeExpeditionState(
      JSON.parse(JSON.stringify(next.expedition)),
      next.runSeed,
      next.lastGigStats
    )
    assert.equal(loaded.status, 'active')
    assert.deepEqual(
      loaded.activeObligations.map(o => [o.id, o.status]),
      next.expedition.activeObligations.map(o => [o.id, o.status])
    )
  }
})

test('future_obligation never stakes the tour on a tour-ending Contract', () => {
  // Heat 88 breaks Keep It Clean and No Rest is held, so the showcase is the
  // only template left once the Fame gate is met.
  const state = onRoute(
    cornered({ activeObligations: holding(['contract_no_rest_finale']) })
  )
  state.player.fame = 5000
  const plan = resolveAuthoritySafeExit(state, 'future_obligation')
  assert.notEqual(plan?.commitment.templateId, 'contract_all_in')
})

test('future_obligation skips a gig count the remaining route cannot play', () => {
  // Standing at exp_6_1: one gig (the Finale) is left on any path.
  const state = walked([
    'exp_0_0',
    'exp_1_0',
    'exp_2_0',
    'exp_3_1',
    'exp_4_1',
    'exp_5_1',
    'exp_6_1'
  ])
  state.career = { ...state.career, unlockedSetIds: ['festival_network'] }
  const plan = resolveAuthoritySafeExit(state, 'future_obligation')
  assert.ok(plan, 'No Rest Till Finale is still on offer')
  assert.equal(plan.commitment.templateId, 'contract_no_rest_finale')

  // The same build at the start of the route has gigs enough for three.
  const fresh = onRoute(cornered())
  fresh.career = { ...fresh.career, unlockedSetIds: ['festival_network'] }
  assert.equal(
    resolveAuthoritySafeExit(fresh, 'future_obligation')?.commitment.templateId,
    'contract_three_good_gigs'
  )
})

/** A DIY chassis with a hidden slot, so the run has hidden capacity. */
const withCompartment = (state, contraband) => ({
  ...state,
  assets: [
    {
      id: 'bus',
      kind: 'tourbus_chassis',
      chassisFlavor: 'diy',
      chassisTier: 1,
      slots: [{ id: 'hidden', slotType: 'tb_hidden', installedModuleId: null }]
    }
  ],
  expedition: {
    ...state.expedition,
    loadout: { ...state.expedition.loadout, activeTourbusAssetId: 'bus' },
    cargo: {
      spareParts: 0,
      supplies: 0,
      technicalGearItemIds: [],
      merch: [],
      contraband
    }
  }
})

const reheat = state => ({
  ...state,
  expedition: {
    ...state.expedition,
    pressure: { ...state.expedition.pressure, heat: 100 }
  }
})

test('hidden_compartment needs contraband aboard', () => {
  const empty = withCompartment(onRoute(cornered()), [])
  assert.equal(resolveAuthoritySafeExit(empty, 'hidden_compartment'), null)
  assert.ok(
    !getAvailableAuthoritySafeExits(empty).includes('hidden_compartment')
  )
})

test('hidden_compartment works once per run, across a save/load', () => {
  const state = withCompartment(onRoute(cornered()), [
    { stashKey: 'stash_a', instanceId: null, stacks: 1 }
  ])
  assert.deepEqual(resolveAuthoritySafeExit(state, 'hidden_compartment'), {
    exitId: 'hidden_compartment'
  })
  const used = gameReducer(state, exitAction(state, 'hidden_compartment'))
  assert.equal(used.expedition.pressure.heat, 88)

  // Cornered again in the same run: the trick is spent.
  const again = reheat(used)
  assert.equal(resolveAuthoritySafeExit(again, 'hidden_compartment'), null)
  assert.strictEqual(
    gameReducer(again, exitAction(again, 'hidden_compartment')),
    again
  )

  const loaded = sanitizeExpeditionState(
    JSON.parse(JSON.stringify(used.expedition)),
    used.runSeed,
    used.lastGigStats
  )
  assert.equal(loaded.authorityHiddenCompartmentUsed, true)
  const reloaded = reheat({
    ...used,
    expedition: { ...loaded, cargo: used.expedition.cargo }
  })
  assert.equal(resolveAuthoritySafeExit(reloaded, 'hidden_compartment'), null)
})
