/**
 * @fileoverview Shared Expedition lifecycle fixture for the node suites.
 *
 * Kept in one place so the lifecycle suites all drive the *real* reducer from
 * the same prepared seed and committed build. A per-suite copy would let one
 * suite's fixture drift into asserting against a build the reducer would
 * actually reject.
 */

import assert from 'node:assert/strict'
import { createInitialState } from '../src/context/initialState.ts'
import { gameReducer } from '../src/context/gameReducer.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { buildExpeditionMap } from '../src/domain/expedition/map.ts'
import { SONGS_BY_ID } from '../src/data/songs.ts'

/** Seed used by every lifecycle fixture, so route assertions stay stable. */
export const FIXTURE_RUN_SEED = 4242

export const FIXTURE_TOUR_ID = 'standard_tour'
export const FIXTURE_REGION_ID = 'industrial_belt'
export const FIXTURE_SONG_ID = [...SONGS_BY_ID.keys()][0]

/**
 * The route every fixture run walks.
 */
export const fixtureMap = () =>
  buildExpeditionMap(FIXTURE_RUN_SEED, FIXTURE_TOUR_ID, FIXTURE_REGION_ID)

/**
 * Builds the minimal legal G1A loadout.
 */
export const fixtureLoadout = (overrides = {}) => ({
  tourTypeId: FIXTURE_TOUR_ID,
  regionId: FIXTURE_REGION_ID,
  activeTourbusAssetId: null,
  crewIds: [],
  cargo: { spareParts: 0, supplies: 0 },
  starterPerkId: null,
  nativeContracts: [],
  insurancePolicyId: null,
  pressureModifierIds: [],
  ...overrides,
  build: {
    setlistSongIds: [FIXTURE_SONG_ID],
    equipment: { selectedGearItemIds: [] },
    selectedTourbusModuleIds: [],
    merch: [],
    contraband: [],
    sponsorOfferId: null,
    startingFuelTarget: 100,
    protectedCareerCash: 0,
    ...(overrides.build ?? {})
  }
})

/**
 * A career sitting at the prepared stage with the fixture seed claimed.
 */
export const preparedState = ({
  money = 5000,
  fame = 100,
  fuel = 100
} = {}) => {
  const fresh = createInitialState()
  fresh.player.money = money
  fresh.player.fame = fame
  fresh.player.van.fuel = fuel
  return gameReducer(fresh, {
    type: ActionTypes.PREPARE_EXPEDITION_RUN,
    payload: { prepId: 'run_fixture', runSeed: FIXTURE_RUN_SEED }
  })
}

/**
 * Starts the fixture run through the real START transaction.
 */
export const startedState = (options = {}, loadoutOverrides = {}) => {
  const prepared = preparedState(options)
  const started = gameReducer(prepared, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: 'run_fixture',
      expectedRunSeed: FIXTURE_RUN_SEED,
      loadout: fixtureLoadout(loadoutOverrides)
    }
  })
  assert.equal(
    started.expedition.status,
    'active',
    'the lifecycle fixture must actually start a run'
  )
  return started
}

/**
 * Walks the run forward along the route to the requested depth.
 *
 * @param state - Started run state.
 * @param targetRouteStep - Route step to reach.
 * @returns State standing on the target step.
 */
export const walkTo = (state, targetRouteStep) => {
  const map = fixtureMap()
  let current = state
  while (current.expedition.routeStep < targetRouteStep) {
    const from =
      current.expedition.visitedNodeIds[
        current.expedition.visitedNodeIds.length - 1
      ]
    const next = map.connections.find(edge => edge.from === from)
    assert.ok(next, `no outgoing edge from ${from}`)
    const advanced = gameReducer(current, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload: {
        nodeId: next.to,
        expectedRouteStep: current.expedition.routeStep
      }
    })
    assert.notEqual(
      advanced,
      current,
      `route advance to ${next.to} was refused`
    )
    current = advanced
  }
  return current
}

/**
 * Walks the run all the way to the Finale node.
 */
export const walkToFinale = state => {
  const map = fixtureMap()
  let current = state
  while (
    current.expedition.visitedNodeIds[
      current.expedition.visitedNodeIds.length - 1
    ] !== map.finaleNodeId
  ) {
    const from =
      current.expedition.visitedNodeIds[
        current.expedition.visitedNodeIds.length - 1
      ]
    const edges = map.connections.filter(edge => edge.from === from)
    assert.ok(edges.length > 0, `dead end at ${from}`)
    const advanced = gameReducer(current, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload: {
        nodeId: edges[0].to,
        expectedRouteStep: current.expedition.routeStep
      }
    })
    assert.notEqual(
      advanced,
      current,
      `route advance to ${edges[0].to} refused`
    )
    current = advanced
  }
  return current
}

/**
 * Finds the first route step that offers voluntary extraction.
 */
export const firstExtractionRouteStep = () => {
  const map = fixtureMap()
  const steps = Object.values(map.meta)
    .filter(entry => entry.isExtractionWindow)
    .map(entry => entry.routeStep)
    .sort((a, b) => a - b)
  assert.ok(steps.length > 0, 'the fixture route has no extraction window')
  return steps[0]
}
