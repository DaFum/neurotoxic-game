/**
 * @fileoverview The transactional START of a prepared Expedition run.
 *
 * START is the moment the build stops being editable and the route stops being
 * a preview, so every precondition has to be re-derived rather than trusted:
 * the seed, the prep identity, the build's ownership, the route the build was
 * assembled against, and affordability against the protected Career slice.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { startExpedition } from '../../src/context/expeditionActionCreators'
import {
  FIXTURE_RUN_SEED,
  fixtureLoadout,
  fixtureMap,
  preparedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const start = (state, payload) =>
  gameReducer(state, { type: ActionTypes.START_EXPEDITION, payload })

const validPayload = (overrides = {}) => ({
  prepId: 'run_fixture',
  expectedRunSeed: FIXTURE_RUN_SEED,
  loadout: fixtureLoadout(),
  ...overrides
})

describe('START_EXPEDITION success path', () => {
  it('commits run identity, build and route in one transaction', () => {
    const prepared = preparedState({ money: 5000, fame: 120, fuel: 100 })
    const started = start(prepared, validPayload())

    assert.equal(started.expedition.status, 'active')
    assert.equal(started.expedition.runId, 'run_fixture')
    assert.equal(started.expedition.routeStep, 0)
    assert.equal(started.expedition.loadout?.tourTypeId, 'standard_tour')
    assert.deepEqual(started.expedition.visitedNodeIds, [
      fixtureMap().startNodeId
    ])
    assert.equal(started.expedition.startingFame, 120)
  })

  it('makes the Expedition route the played map', () => {
    const started = start(preparedState(), validPayload())
    const map = fixtureMap()
    assert.deepEqual(
      Object.keys(started.gameMap?.nodes ?? {}).sort(),
      map.nodeOrder.slice().sort()
    )
    assert.equal(started.player.currentNodeId, map.startNodeId)
  })

  it('applies the fuel top-up exactly once', () => {
    const prepared = preparedState({ money: 5000, fuel: 60 })
    const started = start(prepared, validPayload())
    // 40 litres at the canonical 1.75 €/l price.
    assert.equal(started.player.money, 5000 - 70)
    assert.equal(started.player.van.fuel, 100)
    // Baselines are stamped after the pre-run payment, so the settlement
    // measures only what the run itself earns.
    assert.equal(started.expedition.startingMoney, 4930)
  })

  it('charges nothing when the tank is already at the committed target', () => {
    const prepared = preparedState({ money: 5000, fuel: 100 })
    const started = start(prepared, validPayload())
    assert.equal(started.player.money, 5000)
  })

  it('normalizes the stored loadout rather than storing the candidate', () => {
    const prepared = preparedState()
    const candidate = fixtureLoadout()
    candidate.smuggled = 'nope'
    const started = start(prepared, validPayload({ loadout: candidate }))
    assert.equal(Object.hasOwn(started.expedition.loadout, 'smuggled'), false)
  })

  it('is built by the creator from the prepared state', () => {
    const prepared = preparedState()
    const action = startExpedition(prepared, fixtureLoadout())
    assert.equal(action.type, ActionTypes.START_EXPEDITION)
    assert.equal(action.payload.prepId, 'run_fixture')
    assert.equal(action.payload.expectedRunSeed, FIXTURE_RUN_SEED)
    assert.equal(gameReducer(prepared, action).expedition.status, 'active')
  })
})

describe('START_EXPEDITION preconditions', () => {
  it('is refused from any status other than prepared', () => {
    const prepared = preparedState()
    const started = start(prepared, validPayload())
    for (const status of [
      'idle',
      'active',
      'extracted',
      'completed',
      'failed'
    ]) {
      const source = {
        ...started,
        expedition: { ...started.expedition, status }
      }
      assert.equal(start(source, validPayload()), source, `status ${status}`)
    }
  })

  it('is refused for a mismatched prep id', () => {
    const prepared = preparedState()
    assert.equal(
      start(prepared, validPayload({ prepId: 'other_run' })),
      prepared
    )
    assert.equal(start(prepared, validPayload({ prepId: '' })), prepared)
  })

  it('is refused for a stale or malformed seed guard', () => {
    const prepared = preparedState()
    for (const expectedRunSeed of [
      FIXTURE_RUN_SEED + 1,
      Number.NaN,
      -1,
      1.5,
      '4242'
    ]) {
      assert.equal(
        start(prepared, validPayload({ expectedRunSeed })),
        prepared,
        `seed guard ${String(expectedRunSeed)}`
      )
    }
  })

  it('is refused for a build the validator rejects', () => {
    const prepared = preparedState()
    for (const loadout of [
      null,
      42,
      fixtureLoadout({ build: { setlistSongIds: [] } }),
      fixtureLoadout({ build: { equipment: { selectedGearItemIds: ['x'] } } }),
      fixtureLoadout({ tourTypeId: 'blitz_tour' }),
      fixtureLoadout({ crewIds: ['crew_scout'] })
    ]) {
      assert.equal(start(prepared, validPayload({ loadout })), prepared)
    }
  })

  it('is refused when the fuel top-up would cross the protected slice', () => {
    // 40 litres cost 70; protecting 4950 of 5000 leaves only 50 spendable.
    const prepared = preparedState({ money: 5000, fuel: 60 })
    const refused = start(
      prepared,
      validPayload({
        loadout: fixtureLoadout({ build: { protectedCareerCash: 4950 } })
      })
    )
    assert.equal(refused, prepared)

    // Protecting 4930 leaves exactly enough.
    const accepted = start(
      prepared,
      validPayload({
        loadout: fixtureLoadout({ build: { protectedCareerCash: 4930 } })
      })
    )
    assert.equal(accepted.expedition.status, 'active')
    assert.equal(accepted.player.money, 4930)
    assert.equal(accepted.expedition.protectedCareerCash, 4930)
  })

  it('is refused for a malformed payload', () => {
    const prepared = preparedState()
    for (const payload of [null, 42, {}, { prepId: 'run_fixture' }]) {
      assert.equal(start(prepared, payload), prepared)
    }
  })

  it('leaves the prepared seed untouched when refused', () => {
    const prepared = preparedState()
    const refused = start(prepared, validPayload({ prepId: 'other' }))
    assert.equal(refused.runSeed, FIXTURE_RUN_SEED)
    assert.equal(refused.expedition.status, 'prepared')
  })
})

describe('route progression through the real travel path', () => {
  it('advances the run when the travel minigame completes', () => {
    const started = start(preparedState(), validPayload())
    const map = fixtureMap()
    const target = map.connections.find(
      edge => edge.from === map.startNodeId
    )?.to
    assert.ok(target, 'the fixture route has no first hop')

    const traveling = gameReducer(started, {
      type: ActionTypes.START_TRAVEL_MINIGAME,
      payload: { targetNodeId: target }
    })
    const arrived = gameReducer(traveling, {
      type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
      payload: { damageTaken: 0, itemsCollected: [] }
    })

    assert.equal(arrived.player.currentNodeId, target)
    assert.equal(arrived.expedition.routeStep, 1)
    assert.deepEqual(arrived.expedition.visitedNodeIds, [
      map.startNodeId,
      target
    ])
  })

  it('keeps the player node and the route step in lockstep', () => {
    // The travel commit and the route advance happen in one reducer pass, so
    // there is no window where the player stands a node deeper than the run.
    let state = start(preparedState(), validPayload())
    const map = fixtureMap()
    for (let hop = 0; hop < 3; hop++) {
      const from = state.player.currentNodeId
      const target = map.connections.find(edge => edge.from === from)?.to
      assert.ok(target, `no edge from ${from}`)
      state = gameReducer(state, {
        type: ActionTypes.START_TRAVEL_MINIGAME,
        payload: { targetNodeId: target }
      })
      state = gameReducer(state, {
        type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
        payload: { damageTaken: 0, itemsCollected: [] }
      })
      assert.equal(state.player.currentNodeId, target)
      assert.equal(state.expedition.routeStep, hop + 1)
    }
  })

  it('leaves Career travel untouched outside a run', () => {
    const career = preparedState()
    const careerIdle = {
      ...career,
      expedition: { ...career.expedition, status: 'idle', prep: null }
    }
    // Career play uses the generated overworld map, so the expedition helper
    // must not interfere with a plain travel completion.
    const traveling = gameReducer(careerIdle, {
      type: ActionTypes.START_TRAVEL_MINIGAME,
      payload: { targetNodeId: 'node_1_0' }
    })
    const arrived = gameReducer(traveling, {
      type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
      payload: { damageTaken: 0, itemsCollected: [] }
    })
    assert.equal(arrived.expedition.routeStep, 0)
    assert.deepEqual(arrived.expedition.visitedNodeIds, [])
  })

  it('refuses a forged jump straight to the Finale', () => {
    const started = start(preparedState(), validPayload())
    const map = fixtureMap()
    const forged = gameReducer(started, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload: { nodeId: map.finaleNodeId, expectedRouteStep: 0 }
    })
    assert.equal(forged, started)
  })

  it('refuses a replayed arrival at the same node', () => {
    let state = start(preparedState(), validPayload())
    const map = fixtureMap()
    const target = map.connections.find(
      edge => edge.from === map.startNodeId
    )?.to
    const payload = { nodeId: target, expectedRouteStep: 0 }
    state = gameReducer(state, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload
    })
    const replayed = gameReducer(state, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload
    })
    assert.equal(replayed, state)
    assert.equal(replayed.expedition.routeStep, 1)
  })

  it('records the extraction windows the run passed through', () => {
    let state = start(preparedState(), validPayload())
    const map = fixtureMap()
    for (let hop = 0; hop < 4; hop++) {
      const from =
        state.expedition.visitedNodeIds[
          state.expedition.visitedNodeIds.length - 1
        ]
      const target = map.connections.find(edge => edge.from === from)?.to
      state = gameReducer(state, {
        type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
        payload: {
          nodeId: target,
          expectedRouteStep: state.expedition.routeStep
        }
      })
    }
    assert.ok(state.expedition.extractionWindowsSeen.length > 0)
    for (const step of state.expedition.extractionWindowsSeen) {
      assert.ok(step >= 3, 'an extraction window before step 3 was recorded')
    }
  })
})

describe('committed setlist reaches the live gameplay state', () => {
  it('installs the committed songs into the root setlist at START', () => {
    const prepared = preparedState()
    assert.deepEqual(prepared.setlist, [])

    const started = start(prepared, validPayload())
    // PreGig and the rhythm engine read `state.setlist`, not the loadout.
    assert.deepEqual(
      started.setlist.map(entry => entry.id),
      started.expedition.loadout.build.setlistSongIds
    )
    assert.ok(started.setlist.length > 0)
  })

  it('replaces a mismatched Career setlist rather than deadlocking it', () => {
    const prepared = preparedState()
    const stale = { ...prepared, setlist: [{ id: 'some_other_song' }] }
    const started = start(stale, validPayload())

    assert.deepEqual(
      started.setlist.map(entry => entry.id),
      started.expedition.loadout.build.setlistSongIds
    )
    // Root and commitment now agree, so the freeze accepts the committed value
    // instead of rejecting every attempt to repair the mismatch.
    const reapplied = gameReducer(started, {
      type: ActionTypes.SET_SETLIST,
      payload: started.expedition.loadout.build.setlistSongIds
    })
    assert.deepEqual(
      reapplied.setlist.map(entry => entry.id),
      started.expedition.loadout.build.setlistSongIds
    )
  })
})

describe('route rares are actually earnable', () => {
  it('places at least one rare reward on the route', () => {
    const map = fixtureMap()
    const rares = Object.values(map.meta).filter(
      entry => entry.hidden.rareRewardId !== null
    )
    assert.ok(rares.length > 0, 'no route node carries a rare reward')
    for (const entry of rares) {
      assert.ok(entry.routeStep > 0, 'the start node must carry no rare')
    }
  })

  it('banks the node rare in the same pass as the arrival', () => {
    const map = fixtureMap()
    let state = start(preparedState(), validPayload())
    let banked = 0

    // Walked to the Finale: branches are exclusive, so a rare may sit deeper
    // than any fixed depth, and a run that stops early can legitimately miss
    // every one of them.
    while (state.expedition.visitedNodeIds.at(-1) !== map.finaleNodeId) {
      const from =
        state.expedition.visitedNodeIds[
          state.expedition.visitedNodeIds.length - 1
        ]
      const target = map.connections.find(edge => edge.from === from)?.to
      assert.ok(target)
      const before = state.expedition.rewardLedger.length
      state = gameReducer(state, {
        type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
        payload: {
          nodeId: target,
          expectedRouteStep: state.expedition.routeStep
        }
      })
      const expected = map.meta[target]?.hidden.rareRewardId === null ? 0 : 1
      assert.equal(
        state.expedition.rewardLedger.length - before,
        expected,
        `arrival at ${target} banked the wrong number of rewards`
      )
      banked += expected
    }

    // The route the fixture walks must actually yield something, otherwise the
    // extraction decision has no greed to be about.
    assert.ok(banked > 0, 'walking the route earned no rare reward')
    for (const entry of state.expedition.rewardLedger) {
      assert.equal(entry.sourceType, 'route_rare')
      assert.equal(entry.secured, false)
      assert.equal(entry.materialized, false)
    }
  })

  it('does not bank the same node rare twice on a replayed arrival', () => {
    const map = fixtureMap()
    let state = start(preparedState(), validPayload())
    const rareNode = Object.values(map.meta).find(
      entry => entry.hidden.rareRewardId !== null
    )
    assert.ok(rareNode)

    state = walkTo(state, rareNode.routeStep - 1)
    const payload = {
      nodeId: rareNode.nodeId,
      expectedRouteStep: state.expedition.routeStep
    }
    const isNeighbour = map.connections.some(
      edge =>
        edge.from ===
          state.expedition.visitedNodeIds[
            state.expedition.visitedNodeIds.length - 1
          ] && edge.to === rareNode.nodeId
    )
    if (!isNeighbour) return

    const first = gameReducer(state, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload
    })
    assert.equal(first.expedition.rewardLedger.length, 1)
    const replayed = gameReducer(first, {
      type: ActionTypes.ADVANCE_EXPEDITION_ROUTE,
      payload
    })
    assert.equal(replayed, first)
  })

  it('earns rares through the real travel path too', () => {
    const map = fixtureMap()
    let state = start(preparedState(), validPayload())
    while (state.player.currentNodeId !== map.finaleNodeId) {
      const from = state.player.currentNodeId
      const target = map.connections.find(edge => edge.from === from)?.to
      assert.ok(target, `dead end at ${from}`)
      state = gameReducer(state, {
        type: ActionTypes.START_TRAVEL_MINIGAME,
        payload: { targetNodeId: target }
      })
      state = gameReducer(state, {
        type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
        payload: { damageTaken: 0, itemsCollected: [] }
      })
    }
    assert.ok(
      state.expedition.rewardLedger.length > 0,
      'travelling the route earned no rare reward'
    )
  })
})
