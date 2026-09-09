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

/**
 * The Region a fresh Career actually books.
 *
 * @remarks
 * `home_turf` plus `standard_tour` is the canonical fresh-career entry: no
 * unlock set owned, nothing gated. Availability, START, unlock and Tour Prep
 * suites must use this fixture, because a fixture Career stronger than a fresh
 * one would mask exactly the gates those suites exist to prove.
 */
export const FIXTURE_REGION_ID = 'home_turf'

/**
 * The Region the pre-G5 seeds were pinned to.
 *
 * @remarks
 * Sold from G5 on. Only {@link startedIndustrialState} commits it, and only
 * for suites whose subject is a run that is already under way.
 */
export const FIXTURE_COMMITTED_REGION_ID = 'industrial_belt'

export const FIXTURE_SONG_ID = [...SONGS_BY_ID.keys()][0]

/**
 * The route a fixture run walks.
 *
 * @param regionId - Region to build for; defaults to the fresh-career Region.
 */
export const fixtureMap = (regionId = FIXTURE_REGION_ID) =>
  buildExpeditionMap(FIXTURE_RUN_SEED, FIXTURE_TOUR_ID, regionId)

/**
 * The route a given run state is actually on.
 *
 * @remarks
 * Read off the committed loadout rather than the module constant, so the walk
 * helpers work for both fixtures without a second copy of each.
 */
const mapForState = state =>
  buildExpeditionMap(
    state.runSeed,
    state.expedition.loadout.tourTypeId,
    state.expedition.loadout.regionId
  )

/**
 * Grants unlock sets to one state.
 *
 * @param state - State to extend.
 * @param setIds - Sets the Career should own.
 * @returns A copy owning them.
 *
 * @remarks
 * For suites whose *subject* is capability-gated content. Grant the narrowest
 * set the test needs here rather than widening the shared fixture: a global
 * grant hands every suite `advanced_inspection`, the survival Tour and the
 * rest, and silently disarms the gates they are meant to prove.
 */
export const withExpeditionCapabilities = (state, setIds) => ({
  ...state,
  career: {
    ...state.career,
    unlockedSetIds: [
      ...new Set([...(state.career.unlockedSetIds ?? []), ...setIds])
    ]
  }
})

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
  fuel = 100,
  unlockedSetIds = []
} = {}) => {
  const fresh = createInitialState()
  fresh.player.money = money
  fresh.player.fame = fame
  fresh.player.van.fuel = fuel
  // Opt-in only. The default stays a genuinely fresh Career so the gates a
  // suite is not testing keep biting; a suite whose *subject* is gated content
  // names the set it needs.
  fresh.career = { ...fresh.career, unlockedSetIds: [...unlockedSetIds] }
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
 * Starts a run on the pre-G5 `industrial_belt` route.
 *
 * @remarks
 * This fixture deliberately **skips the bookability boundary**: it represents
 * a run that was validly committed before `industrial_belt` became a sold
 * Region, which is what lets the seed-pinned map, cargo and route suites keep
 * their existing expectations without changing what they are testing.
 *
 * The booking right is granted for the START dispatch and then dropped again,
 * so the resulting Career is exactly as weak as a fresh one - no
 * `advanced_inspection`, no survival Tour, no hidden capability the suite did
 * not ask for.
 */
export const startedIndustrialState = (options = {}, loadoutOverrides = {}) => {
  const prepared = preparedState(options)
  const booked = withExpeditionCapabilities(prepared, ['mechanic_network'])
  const started = gameReducer(booked, {
    type: ActionTypes.START_EXPEDITION,
    payload: {
      prepId: 'run_fixture',
      expectedRunSeed: FIXTURE_RUN_SEED,
      loadout: fixtureLoadout({
        regionId: FIXTURE_COMMITTED_REGION_ID,
        ...loadoutOverrides
      })
    }
  })
  assert.equal(
    started.expedition.status,
    'active',
    'the industrial fixture must actually start a run'
  )
  return {
    ...started,
    career: { ...started.career, unlockedSetIds: [] }
  }
}

/**
 * Walks the run forward along the route to the requested depth.
 *
 * @param state - Started run state.
 * @param targetRouteStep - Route step to reach.
 * @returns State standing on the target step.
 */
export const walkTo = (state, targetRouteStep) => {
  const map = mapForState(state)
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
  const map = mapForState(state)
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
export const firstExtractionRouteStep = (regionId = FIXTURE_REGION_ID) => {
  const map = fixtureMap(regionId)
  const steps = Object.values(map.meta)
    .filter(entry => entry.isExtractionWindow)
    .map(entry => entry.routeStep)
    .sort((a, b) => a - b)
  assert.ok(steps.length > 0, 'the fixture route has no extraction window')
  return steps[0]
}
